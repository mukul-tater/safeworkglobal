import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, MapPin, Calendar, FileCheck, AlertCircle, Loader2 } from "lucide-react";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface TravelData {
  id: string;
  visa_status: string;
  visa_type: string | null;
  visa_application_date: string | null;
  visa_approval_date: string | null;
  visa_expiry_date: string | null;
  flight_booking_status: string;
  departure_date: string | null;
  arrival_date: string | null;
  travel_details: any;
  job_title: string;
  job_country: string;
}

export default function TravelStatus() {
  const { profile } = useAuth();
  const [travelData, setTravelData] = useState<TravelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) fetchTravelData();
  }, [profile?.id]);

  const fetchTravelData = async () => {
    try {
      const { data, error } = await supabase
        .from('job_formalities')
        .select(`*, jobs:job_id (title, country, location)`)
        .eq('worker_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTravelData((data || []).map((f: any) => ({
        id: f.id,
        visa_status: f.visa_status || 'NOT_STARTED',
        visa_type: f.visa_type,
        visa_application_date: f.visa_application_date,
        visa_approval_date: f.visa_approval_date,
        visa_expiry_date: f.visa_expiry_date,
        flight_booking_status: f.flight_booking_status || 'NOT_STARTED',
        departure_date: f.departure_date,
        arrival_date: f.arrival_date,
        travel_details: f.travel_details,
        job_title: f.jobs?.title || 'Job',
        job_country: f.jobs?.country || '',
      })));
    } catch (err) {
      console.error('Error fetching travel data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVisaStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      APPROVED: { label: 'Approved', className: 'bg-success/10 text-success border-success/20' },
      IN_PROGRESS: { label: 'In Progress', className: 'bg-warning/10 text-warning border-warning/20' },
      NOT_STARTED: { label: 'Not Started', className: 'bg-muted text-muted-foreground' },
      COMPLETED: { label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
    };
    const s = map[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  const getFlightStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      BOOKED: { label: 'Booked', className: 'bg-primary/10 text-primary border-primary/20' },
      COMPLETED: { label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
      NOT_STARTED: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
      IN_PROGRESS: { label: 'In Progress', className: 'bg-warning/10 text-warning border-warning/20' },
    };
    const s = map[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  const formatDate = (d: string | null) => d ? format(new Date(d), 'MMM dd, yyyy') : '—';

  return (
    <WorkerPortalLayout>
      <PortalBreadcrumb />
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Travel & Visa Status</h1>
        <p className="text-muted-foreground text-sm">Track your visa application and travel details</p>
      </div>

      {loading ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground text-sm">Loading travel data...</p>
        </Card>
      ) : travelData.length === 0 ? (
        <Card className="p-12 text-center">
          <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No travel records yet</h2>
          <p className="text-muted-foreground text-sm">
            Travel and visa details will appear here once your job application is approved and formalities begin.
          </p>
        </Card>
      ) : (
        <div className="space-y-6 max-w-4xl">
          {travelData.map((travel) => (
            <div key={travel.id} className="space-y-4">
              <h2 className="text-lg font-bold">{travel.job_title} — {travel.job_country}</h2>

              {/* Visa Status */}
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-lg">
                    <FileCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold">Visa Status</h3>
                      {getVisaStatusBadge(travel.visa_status)}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      {travel.visa_type && (
                        <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{travel.visa_type}</span></div>
                      )}
                      <div><span className="text-muted-foreground">Applied:</span> <span className="font-medium">{formatDate(travel.visa_application_date)}</span></div>
                      <div><span className="text-muted-foreground">Approved:</span> <span className="font-medium">{formatDate(travel.visa_approval_date)}</span></div>
                      <div><span className="text-muted-foreground">Expires:</span> <span className="font-medium">{formatDate(travel.visa_expiry_date)}</span></div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Flight/Travel */}
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-lg">
                    <Plane className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold">Travel Details</h3>
                      {getFlightStatusBadge(travel.flight_booking_status)}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Departure:</span>
                        <span className="font-medium">{formatDate(travel.departure_date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Arrival:</span>
                        <span className="font-medium">{formatDate(travel.arrival_date)}</span>
                      </div>
                    </div>
                    {travel.travel_details && typeof travel.travel_details === 'object' && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
                        {Object.entries(travel.travel_details).map(([key, val]) => (
                          <div key={key}><span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span> <span className="font-medium">{String(val)}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </WorkerPortalLayout>
  );
}
