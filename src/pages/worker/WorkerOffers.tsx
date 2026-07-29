import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { notifyOfferResponse } from '@/services/NotificationService';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileSignature, CheckCircle2, XCircle, Clock, Building2, MapPin, Calendar, DollarSign, Gift } from "lucide-react";
import { toast } from "sonner";
import { format, isPast } from 'date-fns';
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";

interface Offer {
  id: string;
  application_id: string;
  job_id: string;
  employer_id: string;
  salary_amount: number;
  salary_currency: string;
  benefits: string[] | null;
  start_date: string;
  status: string;
  sent_at: string | null;
  responded_at: string | null;
  expiry_date: string | null;
  notes: string | null;
  employer_name?: string;
  job_title?: string;
  job_location?: string;
  job_country?: string;
}

export default function WorkerOffers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOffers();
    }
  }, [user]);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('worker_id', user?.id)
        .in('status', ['SENT', 'ACCEPTED', 'REJECTED'])
        .order('sent_at', { ascending: false });

      if (error) throw error;

      // Fetch employer names and job details
      const offersWithDetails = await Promise.all(
        ((data as any[]) || []).map(async (offer: any) => {
          const { data: employerProfile } = await supabase
            .from('employer_profiles')
            .select('company_name')
            .eq('user_id', offer.employer_id)
            .maybeSingle();
          
          const { data: job } = await supabase
            .from('jobs')
            .select('title, location, country')
            .eq('id', offer.job_id)
            .maybeSingle();

          return {
            ...offer,
            employer_name: employerProfile?.company_name || 'Unknown Company',
            job_title: job?.title || 'Unknown Position',
            job_location: job?.location || '',
            job_country: job?.country || ''
          } as Offer;
        })
      );

      setOffers(offersWithDetails);
    } catch (error: any) {
      toast.error('Failed to load offers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!selectedOffer) return;
    
    setProcessing(true);
    try {
      // Update offer status
      const { error: offerError } = await supabase
        .from('offers')
        .update({ 
          status: 'ACCEPTED',
          responded_at: new Date().toISOString()
        })
        .eq('id', selectedOffer.id);

      if (offerError) throw offerError;

      // Update application status to OFFER_ACCEPTED
      const { error: appError } = await supabase
        .from('job_applications')
        .update({ 
          status: 'OFFER_ACCEPTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOffer.application_id);

      if (appError) throw appError;

      // Create job formalities record for next steps
      const { error: formalitiesError } = await supabase
        .from('job_formalities')
        .insert({
          application_id: selectedOffer.application_id,
          job_id: selectedOffer.job_id,
          worker_id: user?.id,
          overall_status: 'IN_PROGRESS',
          expected_joining_date: selectedOffer.start_date
        });

      if (formalitiesError) {
        console.error('Failed to create formalities record:', formalitiesError);
      }

      // Create in-app notification for employer
      try {
        const { data: workerProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user?.id)
          .maybeSingle();

        const { data: employerProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', selectedOffer.employer_id)
          .maybeSingle();

        // Insert in-app notification
        const notificationData = {
          user_id: selectedOffer.employer_id,
          type: 'offer_accepted',
          title: 'Offer Accepted!',
          message: `${workerProfile?.full_name || 'A candidate'} has accepted your offer for ${selectedOffer.job_title}`,
          data: {
            offer_id: selectedOffer.id,
            job_id: selectedOffer.job_id,
            worker_name: workerProfile?.full_name
          }
        };
        const { data: notification } = await supabase.from('notifications').insert(notificationData).select().single();

        // Trigger push notification
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: selectedOffer.employer_id,
              title: notificationData.title,
              message: notificationData.message,
              url: '/employer/offers',
              notificationId: notification?.id
            }
          });
        } catch (pushError) {
          console.log('Push notification skipped:', pushError);
        }

        // Also send email notification
        if (employerProfile?.email) {
          const salary = formatCurrency(selectedOffer.salary_amount, selectedOffer.salary_currency);
          const startDate = format(new Date(selectedOffer.start_date), 'MMM dd, yyyy');
          
          await notifyOfferResponse(
            employerProfile.email,
            employerProfile.full_name || 'Employer',
            workerProfile?.full_name || 'Candidate',
            selectedOffer.job_title || 'Position',
            salary,
            startDate,
            true
          );
        }
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
      }

      toast.success('Congratulations! You have accepted the offer');
      setIsAcceptDialogOpen(false);
      setSelectedOffer(null);
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept offer');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOffer = async () => {
    if (!selectedOffer) return;
    
    setProcessing(true);
    try {
      // Update offer status
      const { error: offerError } = await supabase
        .from('offers')
        .update({ 
          status: 'REJECTED',
          responded_at: new Date().toISOString(),
          notes: rejectReason ? `Worker declined: ${rejectReason}` : selectedOffer.notes
        })
        .eq('id', selectedOffer.id);

      if (offerError) throw offerError;

      // Update application status
      const { error: appError } = await supabase
        .from('job_applications')
        .update({ 
          status: 'OFFER_REJECTED',
          updated_at: new Date().toISOString(),
          notes: rejectReason ? `Offer declined: ${rejectReason}` : null
        })
        .eq('id', selectedOffer.application_id);

      if (appError) throw appError;

      // Create in-app notification for employer
      try {
        const { data: workerProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user?.id)
          .maybeSingle();

        const { data: employerProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', selectedOffer.employer_id)
          .maybeSingle();

        // Insert in-app notification
        const notificationData = {
          user_id: selectedOffer.employer_id,
          type: 'offer_rejected',
          title: 'Offer Declined',
          message: `${workerProfile?.full_name || 'A candidate'} has declined your offer for ${selectedOffer.job_title}${rejectReason ? `. Reason: ${rejectReason}` : ''}`,
          data: {
            offer_id: selectedOffer.id,
            job_id: selectedOffer.job_id,
            worker_name: workerProfile?.full_name,
            reason: rejectReason || null
          }
        };
        const { data: notification } = await supabase.from('notifications').insert(notificationData).select().single();

        // Trigger push notification
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: selectedOffer.employer_id,
              title: notificationData.title,
              message: notificationData.message,
              url: '/employer/offers',
              notificationId: notification?.id
            }
          });
        } catch (pushError) {
          console.log('Push notification skipped:', pushError);
        }

        // Also send email notification
        if (employerProfile?.email) {
          const salary = formatCurrency(selectedOffer.salary_amount, selectedOffer.salary_currency);
          const startDate = format(new Date(selectedOffer.start_date), 'MMM dd, yyyy');
          
          await notifyOfferResponse(
            employerProfile.email,
            employerProfile.full_name || 'Employer',
            workerProfile?.full_name || 'Candidate',
            selectedOffer.job_title || 'Position',
            salary,
            startDate,
            false,
            rejectReason || undefined
          );
        }
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
      }

      toast.success('Offer declined');
      setIsRejectDialogOpen(false);
      setSelectedOffer(null);
      setRejectReason('');
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to decline offer');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (offer: Offer) => {
    if (offer.expiry_date && isPast(new Date(offer.expiry_date)) && offer.status === 'SENT') {
      return <Badge variant="secondary">Expired</Badge>;
    }
    
    switch (offer.status) {
      case "SENT":
        return <Badge className="bg-primary">Pending Response</Badge>;
      case "ACCEPTED":
        return <Badge className="bg-green-500 text-white">Accepted</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500 text-white">Declined</Badge>;
      default:
        return <Badge>{offer.status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'INR') {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
    const symbols: Record<string, string> = { USD: '$', AED: 'د.إ', SAR: '﷼', EUR: '€', GBP: '£' };
    return `${symbols[currency] || currency} ${amount.toLocaleString()}`;
  };

  const isOfferExpired = (offer: Offer) => {
    return offer.expiry_date && isPast(new Date(offer.expiry_date)) && offer.status === 'SENT';
  };

  const canRespond = (offer: Offer) => {
    return offer.status === 'SENT' && !isOfferExpired(offer);
  };

  const pendingOffers = offers.filter(o => o.status === 'SENT' && !isOfferExpired(o));
  const respondedOffers = offers.filter(o => o.status !== 'SENT' || isOfferExpired(o));

  if (loading) {
    return (
      <WorkerPortalLayout>
            <DashboardSkeleton />
          </WorkerPortalLayout>
    );
  }

  return (
    <WorkerPortalLayout>
          <PortalBreadcrumb />
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Job Offers</h1>
            <p className="text-muted-foreground">Review and respond to job offers from employers</p>
          </div>

          {/* Pending Offers */}
          {pendingOffers.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Pending Offers ({pendingOffers.length})
              </h2>
              <div className="space-y-4">
                {pendingOffers.map((offer) => (
                  <Card key={offer.id} className="p-6 border-2 border-primary/20 bg-primary/5">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg shrink-0">
                        <FileSignature className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{offer.job_title}</h3>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                              <Building2 className="h-4 w-4" />
                              <span>{offer.employer_name}</span>
                            </div>
                            {offer.job_location && (
                              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <MapPin className="h-4 w-4" />
                                <span>{offer.job_location}, {offer.job_country}</span>
                              </div>
                            )}
                          </div>
                          {getStatusBadge(offer)}
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mt-4 p-4 bg-background rounded-lg">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">Monthly Salary</p>
                              <p className="font-semibold">{formatCurrency(offer.salary_amount, offer.salary_currency)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">Start Date</p>
                              <p className="font-semibold">{format(new Date(offer.start_date), 'MMM dd, yyyy')}</p>
                            </div>
                          </div>
                          {offer.expiry_date && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-5 w-5 text-orange-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">Respond By</p>
                                <p className="font-semibold">{format(new Date(offer.expiry_date), 'MMM dd, yyyy')}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {offer.benefits && offer.benefits.length > 0 && (
                          <div className="mt-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Gift className="h-4 w-4" />
                              <span>Benefits Included</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {offer.benefits.map((benefit, index) => (
                                <Badge key={index} variant="secondary">
                                  {benefit}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {offer.notes && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              <strong>Notes:</strong> {offer.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-3 mt-6">
                          <Button 
                            className="flex-1 md:flex-none"
                            onClick={() => {
                              setSelectedOffer(offer);
                              setIsAcceptDialogOpen(true);
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Accept Offer
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 md:flex-none"
                            onClick={() => {
                              setSelectedOffer(offer);
                              setIsRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Previous Offers */}
          {respondedOffers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Previous Offers</h2>
              <div className="space-y-4">
                {respondedOffers.map((offer) => (
                  <Card key={offer.id} className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="bg-muted p-3 rounded-lg shrink-0">
                        <FileSignature className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{offer.job_title}</h3>
                            <p className="text-muted-foreground text-sm">{offer.employer_name}</p>
                          </div>
                          {getStatusBadge(offer)}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Salary</p>
                            <p className="font-medium">{formatCurrency(offer.salary_amount, offer.salary_currency)}/month</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {offer.status === 'ACCEPTED' ? 'Start Date' : 'Offered Start Date'}
                            </p>
                            <p className="font-medium">{format(new Date(offer.start_date), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>

                        {offer.responded_at && (
                          <p className="mt-4 text-sm text-muted-foreground">
                            Responded on {format(new Date(offer.responded_at), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {offers.length === 0 && (
            <Card className="p-12 text-center">
              <FileSignature className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Offers Yet</h3>
              <p className="text-muted-foreground">
                When employers send you job offers, they will appear here for your review.
              </p>
            </Card>
          )}

      {/* Accept Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Accept Job Offer
            </DialogTitle>
            <DialogDescription>
              You are about to accept the offer for <strong>{selectedOffer?.job_title}</strong> at <strong>{selectedOffer?.employer_name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-3">
            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Salary</p>
                  <p className="font-semibold">
                    {selectedOffer && formatCurrency(selectedOffer.salary_amount, selectedOffer.salary_currency)}/month
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-semibold">
                    {selectedOffer && format(new Date(selectedOffer.start_date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              By accepting, you agree to the terms of employment. The employer will be notified and will proceed with the next steps including documentation and travel arrangements.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcceptDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleAcceptOffer} disabled={processing}>
              {processing ? 'Processing...' : 'Confirm & Accept'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Decline Job Offer
            </DialogTitle>
            <DialogDescription>
              You are about to decline the offer for <strong>{selectedOffer?.job_title}</strong> at <strong>{selectedOffer?.employer_name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="reason">Reason for declining (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Let the employer know why you're declining..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-2"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This will notify the employer that you have declined their offer.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectOffer} disabled={processing}>
              {processing ? 'Processing...' : 'Decline Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkerPortalLayout>
  );
}
