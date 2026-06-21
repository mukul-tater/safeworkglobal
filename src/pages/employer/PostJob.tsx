import DashboardLayout from "@/components/layout/DashboardLayout";
import { employerNavGroups, employerProfileMenu } from "@/config/employerNav";
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
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobPostingSchema, type JobPostingFormData } from "@/lib/validations/job";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { X, Plus } from "lucide-react";
import { DESTINATION_COUNTRIES, CURRENCIES } from "@/lib/constants";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import JobTitleAutocomplete from "@/components/employer/JobTitleAutocomplete";
import JobBenefitsField from "@/components/employer/JobBenefitsField";
import AutoSaveStatus from "@/components/profile/AutoSaveStatus";
import { useAutoSave } from "@/hooks/useAutoSave";
import { saveJobDraftPartial, loadJobDraftById, loadLatestJobDraft, hasJobContent, type JobPostAutoSaveData } from "@/lib/autoSaveJobs";
import {
  readPostJobDraftCache,
  writePostJobDraftCache,
  clearPostJobDraftCache,
} from "@/lib/postJobDraftStorage";

const EMPTY_JOB_DRAFT: JobPostAutoSaveData = {
  title: "",
  description: "",
  requirements: "",
  benefits: "",
  responsibilities: "",
  location: "",
  country: "",
  job_type: "",
  experience_level: "",
  currency: "INR",
  openings: 1,
  visa_sponsorship: false,
  remote_allowed: false,
  expires_at: "",
  skills: [],
};

export default function PostJob() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const draftJobIdRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    reset,
  } = useForm<JobPostingFormData>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      currency: "INR",
      openings: 1,
      visa_sponsorship: false,
      remote_allowed: false,
      status: "DRAFT",
      skills: [],
    },
  });

  const jobType = watch("job_type");
  const experienceLevel = watch("experience_level");
  const currency = watch("currency");
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
    }),
    [formValues, skills],
  );

  const handleAutoSave = useCallback(
    async (data: JobPostAutoSaveData) => {
      if (!user) return;
      const id = await saveJobDraftPartial(user.id, draftJobIdRef.current, data);
      if (id) {
        draftJobIdRef.current = id;
        writePostJobDraftCache(user.id, {
          jobId: id,
          data,
          updatedAt: Date.now(),
        });
      }
    },
    [user],
  );

  const { status: autoSaveStatus, markReady } = useAutoSave({
    data: autoSaveData,
    onSave: handleAutoSave,
    enabled: !!user && draftLoaded,
  });

  const applyDraft = useCallback(
    (data: JobPostAutoSaveData, jobId: string | null) => {
      draftJobIdRef.current = jobId;
      setSkills(data.skills);
      reset({
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        benefits: data.benefits,
        responsibilities: data.responsibilities,
        location: data.location,
        country: data.country,
        job_type: data.job_type as JobPostingFormData["job_type"],
        experience_level: data.experience_level as JobPostingFormData["experience_level"],
        salary_min: data.salary_min,
        salary_max: data.salary_max,
        currency: data.currency as JobPostingFormData["currency"],
        openings: data.openings,
        visa_sponsorship: data.visa_sponsorship,
        remote_allowed: data.remote_allowed,
        expires_at: data.expires_at,
        status: "DRAFT",
        skills: data.skills,
      });
      markReady(data);
    },
    [markReady, reset],
  );

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const loadDraft = async () => {
      const cache = readPostJobDraftCache(user.id);
      let restored: JobPostAutoSaveData | null = cache?.data ?? null;
      let jobId = cache?.jobId ?? null;

      if (cache?.data && hasJobContent(cache.data)) {
        applyDraft(cache.data, jobId);
      }

      try {
        if (jobId) {
          const fromDb = await loadJobDraftById(user.id, jobId);
          if (!cancelled && fromDb) {
            restored = fromDb.data;
            jobId = fromDb.jobId;
          }
        } else if (!restored || !hasJobContent(restored)) {
          const latest = await loadLatestJobDraft(user.id);
          if (!cancelled && latest && hasJobContent(latest.data)) {
            restored = latest.data;
            jobId = latest.jobId;
          }
        }
      } catch (error) {
        console.error("Failed to load job draft:", error);
      }

      if (!cancelled) {
        if (restored && hasJobContent(restored)) {
          applyDraft(restored, jobId);
          writePostJobDraftCache(user.id, {
            jobId,
            data: restored,
            updatedAt: Date.now(),
          });
        } else if (!cache?.data || !hasJobContent(cache.data)) {
          markReady(EMPTY_JOB_DRAFT);
        }
        setDraftLoaded(true);
      }
    };

    void loadDraft();
    return () => {
      cancelled = true;
    };
  }, [user?.id, applyDraft, markReady]);

  useEffect(() => {
    if (!user?.id || !draftLoaded) return;

    const timer = setTimeout(() => {
      writePostJobDraftCache(user.id, {
        jobId: draftJobIdRef.current,
        data: autoSaveData,
        updatedAt: Date.now(),
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [autoSaveData, draftLoaded, user?.id]);

  const addSkill = () => {
    const trimmedSkill = skillInput.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      const updatedSkills = [...skills, trimmedSkill];
      setSkills(updatedSkills);
      setValue("skills", updatedSkills);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const updatedSkills = skills.filter(s => s !== skillToRemove);
    setSkills(updatedSkills);
    setValue("skills", updatedSkills);
  };

  const onSubmit = async (data: JobPostingFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to post a job",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the job
      const jobData = {
        employer_id: user.id,
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
        posted_at: data.status === "ACTIVE" ? new Date().toISOString() : null,
      };

      let jobId = draftJobIdRef.current;

      if (jobId) {
        const { error: jobError } = await supabase
          .from("jobs")
          .update(jobData)
          .eq("id", jobId)
          .eq("employer_id", user.id);

        if (jobError) throw jobError;
      } else {
        const { data: job, error: jobError } = await supabase
          .from("jobs")
          .insert(jobData)
          .select()
          .single();

        if (jobError) throw jobError;
        jobId = job.id;
      }

      // Sync skills
      if (jobId) {
        await supabase.from("job_skills").delete().eq("job_id", jobId);
        if (skills.length > 0) {
          const skillsData = skills.map(skill => ({
            job_id: jobId,
            skill_name: skill,
          }));

          const { error: skillsError } = await supabase
            .from("job_skills")
            .insert(skillsData);

          if (skillsError) throw skillsError;
        }
      }

      markReady({ ...autoSaveData, status: data.status });
      clearPostJobDraftCache(user.id);

      toast({
        title: "Success",
        description: data.status === "ACTIVE" 
          ? "Job posted successfully" 
          : "Job saved as draft",
      });

      navigate("/employer/manage-jobs");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
        <PortalBreadcrumb />
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Post a New Job</h1>
          <AutoSaveStatus status={autoSaveStatus} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <JobTitleAutocomplete
                    id="title"
                    value={watch("title") || ""}
                    onChange={(v) => setValue("title", v, { shouldValidate: true })}
                    placeholder="Start typing — e.g. Electrician, Welder, Carpenter…"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Pick from suggestions or enter your own custom title.
                  </p>
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe the role in detail..."
                    rows={6}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="responsibilities">Key Responsibilities</Label>
                  <Textarea
                    id="responsibilities"
                    {...register("responsibilities")}
                    placeholder="List main responsibilities..."
                    rows={4}
                  />
                  {errors.responsibilities && (
                    <p className="text-sm text-destructive mt-1">{errors.responsibilities.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    {...register("requirements")}
                    placeholder="List qualifications, experience, certifications..."
                    rows={4}
                  />
                  {errors.requirements && (
                    <p className="text-sm text-destructive mt-1">{errors.requirements.message}</p>
                  )}
                </div>

                <JobBenefitsField
                  value={watch("benefits") || ""}
                  onChange={(v) => setValue("benefits", v, { shouldValidate: true })}
                  error={errors.benefits?.message}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      {...register("location")}
                      placeholder="e.g. Mumbai, Maharashtra"
                    />
                    {errors.location && (
                      <p className="text-sm text-destructive mt-1">{errors.location.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select
                      value={watch("country")}
                      onValueChange={(value) => setValue("country", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {DESTINATION_COUNTRIES.filter(c => c !== 'All Countries').map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.country && (
                      <p className="text-sm text-destructive mt-1">{errors.country.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="job_type">Job Type *</Label>
                    <Select
                      value={jobType}
                      onValueChange={(value) => setValue("job_type", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Full Time</SelectItem>
                        <SelectItem value="PART_TIME">Part Time</SelectItem>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                        <SelectItem value="TEMPORARY">Temporary</SelectItem>
                        <SelectItem value="INTERNSHIP">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.job_type && (
                      <p className="text-sm text-destructive mt-1">{errors.job_type.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="experience_level">Experience Level *</Label>
                    <Select
                      value={experienceLevel}
                      onValueChange={(value) => setValue("experience_level", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENTRY">Entry Level</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="SENIOR">Senior</SelectItem>
                        <SelectItem value="EXPERT">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.experience_level && (
                      <p className="text-sm text-destructive mt-1">{errors.experience_level.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency *</Label>
                    <Select
                      value={currency}
                      onValueChange={(value) => setValue("currency", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {CURRENCIES.map(curr => (
                          <SelectItem key={curr.code} value={curr.code}>
                            {curr.code} ({curr.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="salary_min">Min Salary</Label>
                    <Input
                      id="salary_min"
                      type="number"
                      {...register("salary_min", { valueAsNumber: true })}
                      placeholder="e.g. 25000"
                    />
                    {errors.salary_min && (
                      <p className="text-sm text-destructive mt-1">{errors.salary_min.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="salary_max">Max Salary</Label>
                    <Input
                      id="salary_max"
                      type="number"
                      {...register("salary_max", { valueAsNumber: true })}
                      placeholder="e.g. 35000"
                    />
                    {errors.salary_max && (
                      <p className="text-sm text-destructive mt-1">{errors.salary_max.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="openings">Number of Openings *</Label>
                    <Input
                      id="openings"
                      type="number"
                      {...register("openings", { valueAsNumber: true })}
                      placeholder="e.g. 5"
                    />
                    {errors.openings && (
                      <p className="text-sm text-destructive mt-1">{errors.openings.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="expires_at">Expiry Date *</Label>
                    <Input
                      id="expires_at"
                      type="date"
                      {...register("expires_at")}
                    />
                    {errors.expires_at && (
                      <p className="text-sm text-destructive mt-1">{errors.expires_at.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="visa_sponsorship"
                      onCheckedChange={(checked) => setValue("visa_sponsorship", checked as boolean)}
                    />
                    <Label htmlFor="visa_sponsorship" className="cursor-pointer">
                      Visa Sponsorship Available
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remote_allowed"
                      onCheckedChange={(checked) => setValue("remote_allowed", checked as boolean)}
                    />
                    <Label htmlFor="remote_allowed" className="cursor-pointer">
                      Remote Work Allowed
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill (e.g., Welding, TIG, MIG)"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    />
                    <Button type="button" onClick={addSkill} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="gap-1">
                          {skill}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeSkill(skill)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setValue("status", "DRAFT");
                  handleSubmit(onSubmit)();
                }}
                disabled={isSubmitting}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setValue("status", "ACTIVE");
                  handleSubmit(onSubmit)();
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Posting..." : "Post Job"}
              </Button>
            </div>
          </div>
        </form>
      </DashboardLayout>
  );
}
