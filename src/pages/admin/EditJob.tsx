import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminJobEditSchema, type AdminJobEditFormData } from "@/lib/validations/job";
import { X, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { DESTINATION_COUNTRIES, CURRENCIES } from "@/lib/constants";
import JobBenefitsField from "@/components/employer/JobBenefitsField";

export default function EditJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<AdminJobEditFormData>({
    resolver: zodResolver(adminJobEditSchema),
  });

  const jobType = watch("job_type");
  const experienceLevel = watch("experience_level");
  const currency = watch("currency");
  const visaSponsorship = watch("visa_sponsorship");
  const remoteAllowed = watch("remote_allowed");

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const fetchJob = async () => {
    try {
      // Fetch job details
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;

      // Fetch employer company name
      const { data: employer } = await supabase
        .from("employer_profiles")
        .select("company_name")
        .eq("user_id", job.employer_id)
        .maybeSingle();

      setCompanyName(employer?.company_name || "Unknown Company");

      // Fetch job skills
      const { data: jobSkills } = await supabase
        .from("job_skills")
        .select("skill_name")
        .eq("job_id", jobId);

      const skillNames = jobSkills?.map(s => s.skill_name) || [];
      setSkills(skillNames);

      // Set form values
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
    } catch (error: any) {
      console.error("Error fetching job:", error);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

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

  const onSubmit = async (data: AdminJobEditFormData) => {
    if (!jobId) return;

    setIsSubmitting(true);

    try {
      // Update job
      const jobData = {
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
        expires_at: data.expires_at || null,
        updated_at: new Date().toISOString(),
      };

      const { error: jobError } = await supabase
        .from("jobs")
        .update(jobData)
        .eq("id", jobId);

      if (jobError) throw jobError;

      // Update skills - delete old and insert new
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

      toast.success("Job updated successfully");
      navigate("/admin/job-verification");
    } catch (error: any) {
      console.error("Error updating job:", error);
      toast.error(error.message || "Failed to update job");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/job-verification")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Job</h1>
            <p className="text-muted-foreground">Posted by: {companyName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input id="title" {...register("title")} />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea id="description" {...register("description")} rows={6} />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                  )}
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
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input id="location" {...register("location")} />
                    {errors.location && (
                      <p className="text-sm text-destructive mt-1">{errors.location.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select value={watch("country")} onValueChange={(value) => setValue("country", value)}>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="job_type">Job Type *</Label>
                    <Select value={jobType} onValueChange={(value) => setValue("job_type", value as any)}>
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
                  </div>
                  <div>
                    <Label htmlFor="experience_level">Experience Level *</Label>
                    <Select value={experienceLevel} onValueChange={(value) => setValue("experience_level", value as any)}>
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
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency *</Label>
                    <Select value={currency} onValueChange={(value) => setValue("currency", value as any)}>
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
                    <Input id="salary_min" type="number" {...register("salary_min", { valueAsNumber: true })} />
                  </div>
                  <div>
                    <Label htmlFor="salary_max">Max Salary</Label>
                    <Input id="salary_max" type="number" {...register("salary_max", { valueAsNumber: true })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="openings">Number of Openings *</Label>
                    <Input id="openings" type="number" {...register("openings", { valueAsNumber: true })} />
                  </div>
                  <div>
                    <Label htmlFor="expires_at">Expiry Date</Label>
                    <Input id="expires_at" type="date" {...register("expires_at")} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value={watch("status")} onValueChange={(value) => setValue("status", value as any)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PAUSED">Paused</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="visa_sponsorship"
                      checked={visaSponsorship}
                      onCheckedChange={(checked) => setValue("visa_sponsorship", checked as boolean)}
                    />
                    <Label htmlFor="visa_sponsorship" className="cursor-pointer">
                      Visa Sponsorship Available
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remote_allowed"
                      checked={remoteAllowed}
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
                      placeholder="Add a skill"
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
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate("/admin/job-verification")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </form>
    </DashboardLayout>
  );
}
