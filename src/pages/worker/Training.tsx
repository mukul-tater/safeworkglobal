import DashboardLayout from "@/components/layout/DashboardLayout";
import { workerNavGroups, workerProfileMenu } from "@/config/workerNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, CheckCircle, Clock, Download, Play, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";

interface TrainingCourse {
  id: string;
  name: string;
  description: string;
  category: string;
  duration_hours: number | null;
  is_mandatory: boolean;
}

interface WorkerEnrollment {
  id: string;
  course_id: string;
  status: string;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  certificate_url: string | null;
}

interface TrainingWithEnrollment extends TrainingCourse {
  enrollment: WorkerEnrollment | null;
}

export default function Training() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all active training courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['training-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_courses')
        .select('*')
        .eq('is_active', true)
        .order('is_mandatory', { ascending: false });
      
      if (error) throw error;
      return data as TrainingCourse[];
    },
  });

  // Fetch worker's enrollments
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['worker-enrollments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('worker_training_enrollments')
        .select('*')
        .eq('worker_id', user.id);
      
      if (error) throw error;
      return data as WorkerEnrollment[];
    },
    enabled: !!user?.id,
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('worker_training_enrollments')
        .insert({
          worker_id: user.id,
          course_id: courseId,
          status: 'IN_PROGRESS',
          progress: 0,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-enrollments'] });
      toast.success('Successfully enrolled in training');
    },
    onError: (error) => {
      toast.error('Failed to enroll: ' + error.message);
    },
  });

  // Update progress mutation (for demo purposes)
  const updateProgressMutation = useMutation({
    mutationFn: async ({ enrollmentId, progress }: { enrollmentId: string; progress: number }) => {
      const updates: Record<string, unknown> = { progress };
      
      if (progress >= 100) {
        updates.status = 'COMPLETED';
        updates.completed_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('worker_training_enrollments')
        .update(updates as never)
        .eq('id', enrollmentId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['worker-enrollments'] });
      if (data.status === 'COMPLETED') {
        toast.success('Training completed! Certificate available.');
      } else {
        toast.success('Progress updated');
      }
    },
    onError: (error) => {
      toast.error('Failed to update progress: ' + error.message);
    },
  });

  // Combine courses with enrollments
  const trainingsWithEnrollment: TrainingWithEnrollment[] = courses?.map(course => ({
    ...course,
    enrollment: enrollments?.find(e => e.course_id === course.id) || null,
  })) || [];

  const getStatusBadge = (enrollment: WorkerEnrollment | null, isMandatory: boolean) => {
    if (!enrollment) {
      return isMandatory 
        ? <Badge variant="destructive">Required</Badge>
        : <Badge variant="secondary">Not Started</Badge>;
    }
    
    switch (enrollment.status) {
      case "COMPLETED":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-primary">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  const handleEnroll = (courseId: string) => {
    enrollMutation.mutate(courseId);
  };

  const handleContinueTraining = (enrollmentId: string, currentProgress: number) => {
    // Simulate progress increment (in real app, this would be based on actual course completion)
    const newProgress = Math.min(currentProgress + 25, 100);
    updateProgressMutation.mutate({ enrollmentId, progress: newProgress });
  };

  const isLoading = coursesLoading || enrollmentsLoading;

  const completedCount = enrollments?.filter(e => e.status === 'COMPLETED').length || 0;
  const inProgressCount = enrollments?.filter(e => e.status === 'IN_PROGRESS').length || 0;
  const mandatoryCount = courses?.filter(c => c.is_mandatory).length || 0;
  const mandatoryCompletedCount = trainingsWithEnrollment.filter(
    t => t.is_mandatory && t.enrollment?.status === 'COMPLETED'
  ).length;

  return (
    <DashboardLayout navGroups={workerNavGroups} portalLabel="Worker Portal" portalName="Worker Portal" profileMenuItems={workerProfileMenu}>
          <PortalBreadcrumb />
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Training & Pre-Departure Orientation</h1>
            <p className="text-muted-foreground">Complete required training programs before departure</p>
          </div>

          {/* Progress Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                  <p className="text-2xl font-bold">{courses?.length || 0}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500/10 p-2 rounded-lg">
                  <Play className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{inProgressCount}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/10 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completedCount}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/10 p-2 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mandatory</p>
                  <p className="text-2xl font-bold">{mandatoryCompletedCount}/{mandatoryCount}</p>
                </div>
              </div>
            </Card>
          </div>

          {isLoading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-6">
              {trainingsWithEnrollment.map((training) => (
                <Card key={training.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{training.name}</h3>
                          <p className="text-sm text-muted-foreground">{training.description}</p>
                        </div>
                        <div className="flex gap-2">
                          {training.is_mandatory && (
                            <Badge variant="outline" className="border-red-500 text-red-500">
                              Mandatory
                            </Badge>
                          )}
                          {getStatusBadge(training.enrollment, training.is_mandatory)}
                        </div>
                      </div>

                      {training.enrollment && training.enrollment.status !== 'NOT_STARTED' && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{training.enrollment.progress}%</span>
                          </div>
                          <Progress value={training.enrollment.progress} className="h-2" />
                        </div>
                      )}

                      <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                        {training.duration_hours && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{training.duration_hours} hours</span>
                          </div>
                        )}
                        {training.enrollment?.started_at && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Started: {new Date(training.enrollment.started_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        {training.enrollment?.completed_at && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Completed: {new Date(training.enrollment.completed_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 mt-4">
                        {!training.enrollment && (
                          <Button 
                            onClick={() => handleEnroll(training.id)}
                            disabled={enrollMutation.isPending}
                          >
                            Enroll Now
                          </Button>
                        )}
                        {training.enrollment && training.enrollment.status === 'IN_PROGRESS' && (
                          <Button 
                            onClick={() => handleContinueTraining(training.enrollment!.id, training.enrollment!.progress)}
                            disabled={updateProgressMutation.isPending}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Continue Training
                          </Button>
                        )}
                        {training.enrollment?.status === 'COMPLETED' && (
                          <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download Certificate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {trainingsWithEnrollment.length === 0 && (
                <Card className="p-8 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Training Courses Available</h3>
                  <p className="text-muted-foreground">Check back later for new training opportunities.</p>
                </Card>
              )}
            </div>
          )}
        </DashboardLayout>
  );
}
