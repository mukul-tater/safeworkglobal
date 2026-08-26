import DashboardLayout from "@/components/layout/DashboardLayout";
import { employerNavGroups, employerProfileMenu } from "@/config/employerNav";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileSignature, Download, Eye, Send, Clock, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from 'date-fns';

interface Offer {
  id: string;
  application_id: string;
  job_id: string;
  worker_id: string;
  salary_amount: number;
  salary_currency: string;
  benefits: string[] | null;
  start_date: string;
  status: string;
  sent_at: string | null;
  responded_at: string | null;
  expiry_date: string | null;
  notes: string | null;
  worker_name?: string;
  job_title?: string;
}

interface Application {
  id: string;
  worker_id: string;
  job_id: string;
  worker_name: string;
  job_title: string;
}

export default function OfferManagement() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    application_id: '',
    salary_amount: '',
    salary_currency: 'INR',
    benefits: '',
    start_date: '',
    expiry_date: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchOffers();
      fetchApplications();
    }
  }, [user]);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers' as any)
        .select('*')
        .eq('employer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch worker names and job titles
      const offersWithDetails = await Promise.all(
        ((data as any[]) || []).map(async (offer: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', offer.worker_id)
            .maybeSingle();
          
          const { data: job } = await supabase
            .from('jobs')
            .select('title')
            .eq('id', offer.job_id)
            .maybeSingle();

          return {
            ...offer,
            worker_name: profile?.full_name || 'Unknown',
            job_title: job?.title || 'Unknown Position'
          } as Offer;
        })
      );

      setOffers(offersWithDetails);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      // Fetch applications for this employer
      const { data: apps, error } = await supabase
        .from('job_applications')
        .select('id, worker_id, job_id')
        .eq('employer_id', user?.id)
        .in('status', ['SHORTLISTED', 'APPROVED', 'INTERVIEWING']);

      if (error) throw error;
      if (!apps || apps.length === 0) {
        setApplications([]);
        return;
      }

      // Fetch worker names
      const workerIds = [...new Set(apps.map(a => a.worker_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', workerIds);

      // Fetch job titles
      const jobIds = [...new Set(apps.map(a => a.job_id))];
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title')
        .in('id', jobIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));
      const jobMap = new Map((jobs || []).map(j => [j.id, j.title]));

      const formattedApps = apps.map(app => ({
        id: app.id,
        worker_id: app.worker_id,
        job_id: app.job_id,
        worker_name: profileMap.get(app.worker_id) || 'Unknown',
        job_title: jobMap.get(app.job_id) || 'Unknown'
      }));

      setApplications(formattedApps);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleCreateOffer = async () => {
    if (!formData.application_id || !formData.salary_amount || !formData.start_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedApp = applications.find(a => a.id === formData.application_id);
    if (!selectedApp) {
      toast.error('Invalid application selected');
      return;
    }

    try {
      const benefitsArray = formData.benefits
        .split(',')
        .map(b => b.trim())
        .filter(b => b.length > 0);

      const { error } = await supabase
        .from('offers' as any)
        .insert({
          application_id: formData.application_id,
          job_id: selectedApp.job_id,
          employer_id: user?.id,
          worker_id: selectedApp.worker_id,
          salary_amount: parseFloat(formData.salary_amount),
          salary_currency: formData.salary_currency,
          benefits: benefitsArray.length > 0 ? benefitsArray : null,
          start_date: formData.start_date,
          expiry_date: formData.expiry_date || null,
          notes: formData.notes || null,
          status: 'DRAFT'
        });

      if (error) throw error;

      toast.success('Offer created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSendOffer = async (offerId: string, workerName: string) => {
    try {
      const { error } = await supabase
        .from('offers' as any)
        .update({ 
          status: 'SENT',
          sent_at: new Date().toISOString()
        })
        .eq('id', offerId);

      if (error) throw error;

      toast.success(`Offer sent to ${workerName}`);
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleWithdrawOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('offers' as any)
        .update({ status: 'WITHDRAWN' })
        .eq('id', offerId);

      if (error) throw error;

      toast.success('Offer withdrawn');
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      application_id: '',
      salary_amount: '',
      salary_currency: 'INR',
      benefits: '',
      start_date: '',
      expiry_date: '',
      notes: ''
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SENT":
        return <Badge className="bg-primary">Sent - Awaiting Response</Badge>;
      case "ACCEPTED":
        return <Badge className="bg-green-500">Accepted</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500">Rejected</Badge>;
      case "EXPIRED":
        return <Badge variant="secondary">Expired</Badge>;
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>;
      case "WITHDRAWN":
        return <Badge variant="secondary">Withdrawn</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'INR') {
      return `₹${amount.toLocaleString('en-IN')}/month`;
    }
    return `${currency} ${amount.toLocaleString()}/month`;
  };

  if (loading) {
    return (
      <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
            <p>Loading offers...</p>
          </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Offer Letter Management</h1>
              <p className="text-muted-foreground">Create and manage employment offers</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Offer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Offer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Select Candidate</Label>
                    <Select
                      value={formData.application_id}
                      onValueChange={(value) => setFormData({ ...formData, application_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a candidate" />
                      </SelectTrigger>
                      <SelectContent>
                        {applications.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.worker_name} - {app.job_title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Salary Amount</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 50000"
                        value={formData.salary_amount}
                        onChange={(e) => setFormData({ ...formData, salary_amount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select
                        value={formData.salary_currency}
                        onValueChange={(value) => setFormData({ ...formData, salary_currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="AED">AED</SelectItem>
                          <SelectItem value="SAR">SAR</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Benefits (comma-separated)</Label>
                    <Input
                      placeholder="Housing, Medical Insurance, Annual Leave"
                      value={formData.benefits}
                      onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Offer Expiry Date</Label>
                      <Input
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Additional notes or terms"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  <Button className="w-full" onClick={handleCreateOffer}>
                    Create Offer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-6">
            {offers.length === 0 ? (
              <Card className="p-12 text-center">
                <FileSignature className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Offers Created</h3>
                <p className="text-muted-foreground mb-4">
                  Create offers for shortlisted candidates
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Offer
                </Button>
              </Card>
            ) : (
              offers.map((offer) => (
                <Card key={offer.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <FileSignature className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{offer.worker_name}</h3>
                          <p className="text-sm text-muted-foreground">{offer.job_title}</p>
                        </div>
                        {getStatusBadge(offer.status)}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Salary</p>
                          <p className="font-medium">{formatCurrency(offer.salary_amount, offer.salary_currency)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Start Date</p>
                          <p className="font-medium">{format(new Date(offer.start_date), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>

                      {offer.benefits && offer.benefits.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground mb-2">Benefits</p>
                          <div className="flex flex-wrap gap-2">
                            {offer.benefits.map((benefit, index) => (
                              <Badge key={index} variant="secondary">
                                {benefit}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {offer.sent_at && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Sent on {format(new Date(offer.sent_at), 'MMM dd, yyyy')}</span>
                          {offer.responded_at && (
                            <>
                              <span>•</span>
                              <span>Responded on {format(new Date(offer.responded_at), 'MMM dd, yyyy')}</span>
                            </>
                          )}
                        </div>
                      )}

                      <div className="flex gap-3 mt-4">
                        {offer.status === "DRAFT" && (
                          <>
                            <Button onClick={() => handleSendOffer(offer.id, offer.worker_name || 'candidate')}>
                              <Send className="h-4 w-4 mr-2" />
                              Send Offer
                            </Button>
                            <Button variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          </>
                        )}
                        {offer.status === "SENT" && (
                          <Button variant="outline" onClick={() => handleWithdrawOffer(offer.id)}>
                            Withdraw Offer
                          </Button>
                        )}
                        {offer.status !== "DRAFT" && (
                          <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DashboardLayout>
  );
}