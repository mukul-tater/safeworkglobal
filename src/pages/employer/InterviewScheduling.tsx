import DashboardLayout from "@/components/layout/DashboardLayout";
import { employerNavGroups, employerProfileMenu } from "@/config/employerNav";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Video, Phone, MapPin, Clock, Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from 'date-fns';

interface Interview {
  id: string;
  application_id: string;
  job_id: string;
  worker_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  interview_mode: string;
  meeting_link: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  feedback: string | null;
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

export default function InterviewScheduling() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [formData, setFormData] = useState({
    application_id: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 30,
    interview_mode: 'VIDEO',
    meeting_link: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchInterviews();
      fetchApplications();
    }
  }, [user]);

  const fetchInterviews = async () => {
    try {
      const { data, error } = await supabase
        .from('interviews' as any)
        .select('*')
        .eq('employer_id', user?.id)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      // Fetch worker names and job titles
      const interviewsWithDetails = await Promise.all(
        ((data as any[]) || []).map(async (interview: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', interview.worker_id)
            .maybeSingle();
          
          const { data: job } = await supabase
            .from('jobs')
            .select('title')
            .eq('id', interview.job_id)
            .maybeSingle();

          return {
            ...interview,
            worker_name: profile?.full_name || 'Unknown',
            job_title: job?.title || 'Unknown Position'
          } as Interview;
        })
      );

      setInterviews(interviewsWithDetails);
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
        .in('status', ['PENDING', 'REVIEWING', 'SHORTLISTED']);

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

  const handleSubmit = async () => {
    if (!formData.application_id || !formData.scheduled_date || !formData.scheduled_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedApp = applications.find(a => a.id === formData.application_id);
    if (!selectedApp) {
      toast.error('Invalid application selected');
      return;
    }

    try {
      if (editingInterview) {
        const { error } = await supabase
          .from('interviews' as any)
          .update({
            scheduled_date: formData.scheduled_date,
            scheduled_time: formData.scheduled_time,
            duration_minutes: formData.duration_minutes,
            interview_mode: formData.interview_mode,
            meeting_link: formData.meeting_link || null,
            location: formData.location || null,
            notes: formData.notes || null
          })
          .eq('id', editingInterview.id);

        if (error) throw error;
        toast.success('Interview updated successfully');
      } else {
        const { error } = await supabase
          .from('interviews' as any)
          .insert({
            application_id: formData.application_id,
            job_id: selectedApp.job_id,
            employer_id: user?.id,
            worker_id: selectedApp.worker_id,
            scheduled_date: formData.scheduled_date,
            scheduled_time: formData.scheduled_time,
            duration_minutes: formData.duration_minutes,
            interview_mode: formData.interview_mode,
            meeting_link: formData.meeting_link || null,
            location: formData.location || null,
            notes: formData.notes || null
          });

        if (error) throw error;
        toast.success('Interview scheduled successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchInterviews();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('interviews' as any)
        .update({ status: 'CANCELLED' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Interview cancelled');
      fetchInterviews();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('interviews' as any)
        .update({ status: 'COMPLETED' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Interview marked as completed');
      fetchInterviews();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      application_id: '',
      scheduled_date: '',
      scheduled_time: '',
      duration_minutes: 30,
      interview_mode: 'VIDEO',
      meeting_link: '',
      location: '',
      notes: ''
    });
    setEditingInterview(null);
  };

  const openEditDialog = (interview: Interview) => {
    setEditingInterview(interview);
    setFormData({
      application_id: interview.application_id,
      scheduled_date: interview.scheduled_date,
      scheduled_time: interview.scheduled_time,
      duration_minutes: interview.duration_minutes,
      interview_mode: interview.interview_mode,
      meeting_link: interview.meeting_link || '',
      location: interview.location || '',
      notes: interview.notes || ''
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Badge className="bg-primary">Scheduled</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      case "RESCHEDULED":
        return <Badge className="bg-yellow-500">Rescheduled</Badge>;
      case "NO_SHOW":
        return <Badge className="bg-orange-500">No Show</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "PHONE":
        return <Phone className="h-4 w-4" />;
      case "IN_PERSON":
        return <MapPin className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const renderInterviewCard = (interview: Interview, showActions = true) => (
    <Card key={interview.id} className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">{interview.worker_name}</h3>
                <p className="text-sm text-muted-foreground">{interview.job_title}</p>
              </div>
              {getStatusBadge(interview.status)}
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(interview.scheduled_date), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{interview.scheduled_time} • {interview.duration_minutes} min</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {getModeIcon(interview.interview_mode)}
                <span>{interview.interview_mode.replace('_', ' ')}</span>
              </div>
            </div>

            {interview.meeting_link && interview.status === 'SCHEDULED' && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(interview.meeting_link!, '_blank')}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Meeting
                </Button>
              </div>
            )}
          </div>
        </div>
        {showActions && interview.status === 'SCHEDULED' && (
          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleComplete(interview.id)}
            >
              Complete
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEditDialog(interview)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCancel(interview.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
            <p>Loading interviews...</p>
          </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Interview Scheduling</h1>
              <p className="text-muted-foreground">Schedule and manage candidate interviews</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Interview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingInterview ? 'Edit Interview' : 'Schedule New Interview'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {!editingInterview && (
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
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={formData.scheduled_date}
                        onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={formData.scheduled_time}
                        onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Select
                        value={String(formData.duration_minutes)}
                        onValueChange={(value) => setFormData({ ...formData, duration_minutes: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="45">45 min</SelectItem>
                          <SelectItem value="60">60 min</SelectItem>
                          <SelectItem value="90">90 min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Interview Mode</Label>
                      <Select
                        value={formData.interview_mode}
                        onValueChange={(value) => setFormData({ ...formData, interview_mode: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VIDEO">Video Call</SelectItem>
                          <SelectItem value="PHONE">Phone Call</SelectItem>
                          <SelectItem value="IN_PERSON">In Person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.interview_mode === 'VIDEO' && (
                    <div className="space-y-2">
                      <Label>Meeting Link</Label>
                      <Input
                        placeholder="https://zoom.us/j/..."
                        value={formData.meeting_link}
                        onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                      />
                    </div>
                  )}

                  {formData.interview_mode === 'IN_PERSON' && (
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        placeholder="Office address"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Add any notes for the interview"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  <Button className="w-full" onClick={handleSubmit}>
                    {editingInterview ? 'Update Interview' : 'Schedule Interview'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All Interviews</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {interviews.filter(i => i.status === 'SCHEDULED').length === 0 ? (
                <Card className="p-12 text-center">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Upcoming Interviews</h3>
                  <p className="text-muted-foreground mb-4">
                    Schedule interviews with shortlisted candidates
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                </Card>
              ) : (
                interviews
                  .filter(i => i.status === 'SCHEDULED')
                  .map(interview => renderInterviewCard(interview))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {interviews.filter(i => i.status === 'COMPLETED').length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No completed interviews yet</p>
                </Card>
              ) : (
                interviews
                  .filter(i => i.status === 'COMPLETED')
                  .map(interview => renderInterviewCard(interview, false))
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {interviews.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No interviews scheduled yet</p>
                </Card>
              ) : (
                interviews.map(interview => renderInterviewCard(interview, interview.status === 'SCHEDULED'))
              )}
            </TabsContent>
          </Tabs>
        </DashboardLayout>
  );
}