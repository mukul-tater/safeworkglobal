import DashboardLayout from "@/components/layout/DashboardLayout";
import { employerNavGroups, employerProfileMenu } from "@/config/employerNav";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobPostingSchema, type JobPostingFormData } from "@/lib/validations/job";
import { X, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { DESTINATION_COUNTRIES, CURRENCIES } from "@/lib/constants";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import JobBenefitsField from "@/components/employer/JobBenefitsField";
import { todayDateInputValue } from "@/lib/validations/common";
import AutoSaveStatus from "@/components/profile/AutoSaveStatus";
import { useAutoSave } from "@/hooks/useAutoSave";
import { saveJobPartial, type JobPostAutoSaveData } from "@/lib/autoSaveJobs";

export default function EmployerEditJob() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
  } = useForm<JobPostingFormData>({
    resolver: zodResolver(jobPostingSchema),
  });

  const jobType = watch("job_type");
  const experienceLevel = watch("experience_level");
  const currency = watch("currency");
  const visaSponsorship = watch("visa_sponsorship");
  const remoteAllowed = watch("remote_allowed");
  const formValues = useWatch({ control });

  const autoSaveData = useMemo<JobPostAutoSaveData>(
    () => ({
      title: formValues.title ?? "",
      description: formValues.description ?? "",
      requirements: formValues.requirements ?? "",
      benefits: formValues.benefits ?? "",
      responsibilities: formValues.responsibilities ?? "",
      location: formValues.location ?? "",
      country: formValues.country ?? "",
      job_type: formValues.job_type ?? "",
      experience_level: formValues.experience_level ?? "",
      salary_min: formValues.salary_min,
      salary_max: formValues.salary_max,
      currency: formValues.currency ?? "INR",
      openings: formValues.openings ?? 1,
      visa_sponsorship: formValues.visa_sponsorship ?? false,
      remote_allowed: formValues.remote_allowed ?? false,
      expires_at: formValues.expires_at ?? "",
      skills,
      status: formValues.status,
    }),
    [formValues, skills],
  );

  const handleAutoSave = useCallback(
    async (data: JobPostAutoSaveData) => {
      if (!user || !jobId) return;
      await saveJobPartial(user.id, jobId, data);
    },
    [user, jobId],
  );

  const { status: autoSaveStatus, markReady } = useAutoSave({
    data: autoSaveData,
    onSave: handleAutoSave,
    enabled: !loading && !!user && !!jobId,
  });

  useEffect(() => {
    if (jobId && user?.id) fetchJob();
  }, [jobId, user?.id]);

  const fetchJob = async () => {
    try {
      const { data: job, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .eq("employer_id", user!.id)
        .single();

      if (error) throw error;

      const { data: jobSkills } = await supabase
        .from("job_skills")
        .select("skill_name")
        .eq("job_id", jobId!);

      const skillNames = jobSkills?.map(s => s.skill_name) || [];
      setSkills(skillNames);

      reset({
        title: job.title,
        description: job.description,
        requirements: job.requirements || "",
        benefits: job.benefits || "",
        responsibilities: job.responsibilities || "",
        location: job.location,
        country: job.country,
        job_type: job.job_type as any,
        experience_level: job.experience_level as any,
        salary_min: job.salary_min || undefined,
        salary_max: job.salary_max || undefined,
        currency: job.currency as any,
        openings: job.openings,
        visa_sponsorship: job.visa_sponsorship || false,
        remote_allowed: job.remote_allowed || false,
        expires_at: job.expires_at ? job.expires_at.split("T")[0] : "",
        status: job.status as any,
        skills: skillNames,
      });
      markReady({
        title: job.title,
        description: job.description,
        requirements: job.requirements || "",
        benefits: job.benefits || "",
        responsibilities: job.responsibilities || "",
        location: job.location,
        country: job.country,
        job_type: job.job_type,
        experience_level: job.experience_level,
        salary_min: job.salary_min || undefined,
        salary_max: job.salary_max || undefined,
        currency: job.currency,
        openings: job.openings,
        visa_sponsorship: job.visa_sponsorship || false,
        remote_allowed: job.remote_allowed || false,
        expires_at: job.expires_at ? job.expires_at.split("T")[0] : "",
        skills: skillNames,
        status: job.status,
      });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load job details. You may not have permission.", variant: "destructive" });
      navigate("/employer/manage-jobs");
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      const updated = [...skills, trimmed];
      setSkills(updated);
      setValue("skills", updated);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    const updated = skills.filter(s => s !== skill);
    setSkills(updated);
    setValue("skills", updated);
  };

  const onSubmit = async (data: JobPostingFormData) => {
    if (!jobId || !user) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          title: data.title,
          description: data.description,
          requirements: data.requirements || null,
          benefits: data.benefits || null,
          responsibilities: data.responsibilities || null,
          location: data.location,
          country: data.country,
          job_type: data.job_type,
          experience_level: data.experience_level,
          salary_min: data.salary_min || null,
          salary_max: data.salary_max || null,
          currency: data.currency,
          openings: data.openings,
          visa_sponsorship: data.visa_sponsorship,
          remote_allowed: data.remote_allowed,
          status: data.status,
          expires_at: data.expires_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId)
        .eq("employer_id", user.id);

      if (error) throw error;

      // Update skills
      await supabase.from("job_skills").delete().eq("job_id", jobId);
      if (skills.length > 0) {
        const { error: skillsError } = await supabase
          .from("job_skills")
          .insert(skills.map(skill => ({ job_id: jobId, skill_name: skill })));
        if (skillsError) throw skillsError;
      }

      markReady({ ...autoSaveData, status: data.status });

      toast({ title: "Success", description: "Job updated successfully" });
      navigate("/employer/manage-jobs");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update job", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
      <PortalBreadcrumb />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 md:mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/employer/manage-jobs")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Edit Job</h1>
        </div>
        <AutoSaveStatus status={autoSaveStatus} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6 max-w-4xl">
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input id="title" {...register("title")} />
                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="description">Job Description *</Label>
                <Textarea id="description" {...register("description")} rows={6} />
                {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
              </div>
              <div>
                <Label htmlFor="responsibilities">Key Responsibilities</Label>
                <Textarea id="responsibilities" {...register("responsibilities")} rows={4} />
              </div>
              <div>
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea id="requirements" {...register("requirements")} rows={4} />
              </div>
              <JobBenefitsField
                value={watch("benefits") || ""}
                onChange={(v) => setValue("benefits", v, { shouldValidate: true })}
                error={errors.benefits?.message}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input id="location" {...register("location")} />
                  {errors.location && <p className="text-sm text-destructive mt-1">{errors.location.message}</p>}
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={watch("country")} onValueChange={(value) => setValue("country", value)}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      {DESTINATION_COUNTRIES.filter(c => c !== 'All Countries').map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.country && <p className="text-sm text-destructive mt-1">{errors.country.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Job Type *</Label>
                  <Select value={jobType} onValueChange={(value) => setValue("job_type", value as any)}>
                    <SelectTrigger><SelectValue placeholder="Select job type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full Time</SelectItem>
                      <SelectItem value="PART_TIME">Part Time</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="TEMPORARY">Temporary</SelectItem>
                      <SelectItem value="INTERNSHIP">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Experience Level *</Label>
                  <Select value={experienceLevel} onValueChange={(value) => setValue("experience_level", value as any)}>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENTRY">Entry Level</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="SENIOR">Senior</SelectItem>
                      <SelectItem value="EXPERT">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Currency *</Label>
                  <Select value={currency} onValueChange={(value) => setValue("currency", value as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      {CURRENCIES.map(curr => (
                        <SelectItem key={curr.code} value={curr.code}>{curr.code} ({curr.symbol})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="salary_min">Min Salary</Label>
                  <Input id="salary_min" type="number" {...register("salary_min", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="salary_max">Max Salary</Label>
                  <Input id="salary_max" type="number" {...register("salary_max", { valueAsNumber: true })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openings">Number of Openings *</Label>
                  <Input id="openings" type="number" {...register("openings", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="expires_at">Expiry Date *</Label>
                  <Input id="expires_at" type="date" min={todayDateInputValue()} {...register("expires_at")} />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={watch("status")} onValueChange={(value) => setValue("status", value as any)}>
                  <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="visa_sponsorship" checked={visaSponsorship} onCheckedChange={(c) => setValue("visa_sponsorship", c as boolean)} />
                  <Label htmlFor="visa_sponsorship" className="cursor-pointer">Visa Sponsorship Available</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="remote_allowed" checked={remoteAllowed} onCheckedChange={(c) => setValue("remote_allowed", c as boolean)} />
                  <Label htmlFor="remote_allowed" className="cursor-pointer">Remote Work Allowed</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Required Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill (e.g., Welding, TIG)"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />Add
                  </Button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="gap-1">
                        {skill}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/employer/manage-jobs")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
