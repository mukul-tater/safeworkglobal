import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { useState, useEffect, useRef } from "react";
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
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminJobEditSchema, type AdminJobEditFormData } from "@/lib/validations/job";
import { firstFormErrorMessage, invalidFieldClass, revealInvalidField } from "@/lib/formErrors";
import { X, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { DESTINATION_COUNTRIES } from "@/lib/constants";
import { DEFAULT_SERVICE_CHARGE_INR } from "@/lib/jobServiceCharge";
import JobBenefitsField from "@/components/employer/JobBenefitsField";
import JobYoutubeLinksField from "@/components/admin/JobYoutubeLinksField";
import { adminUpdateJob } from "@/services/AdminService";
import AdminSalaryRanges from "@/components/admin/AdminSalaryRanges";
import { adminSalarySaveFields, currencyForDestination } from "@/lib/jobSalaryUtils";
import PostedByBadge from "@/components/jobs/PostedByBadge";

export default function EditJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState<string>("");
  const [postedByRole, setPostedByRole] = useState<string>("employer");
  const hadLocalRange = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<AdminJobEditFormData>({
    resolver: zodResolver(adminJobEditSchema),
    defaultValues: {
      service_charge: DEFAULT_SERVICE_CHARGE_INR,
    },
  });

  const jobType = watch("job_type");
  const experienceLevel = watch("experience_level");
  const currency = watch("currency");
  const localCurrency = watch("local_salary_currency");
  const localMin = watch("local_salary_min");
  const localMax = watch("local_salary_max");
  const countryMin = watch("salary_min");
  const countryMax = watch("salary_max");
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
      setPostedByRole(job.posted_by_role || "employer");

      // Fetch job skills
      const { data: jobSkills } = await supabase
        .from("job_skills")
        .select("skill_name")
        .eq("job_id", jobId);

      const skillNames = jobSkills?.map(s => s.skill_name) || [];
      setSkills(skillNames);
      setYoutubeUrls(Array.isArray(job.youtube_urls) ? job.youtube_urls : []);
      hadLocalRange.current = job.local_salary_min != null || job.local_salary_max != null;

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
        currency: job.currency as AdminJobEditFormData["currency"],
        local_salary_min: job.local_salary_min || undefined,
        local_salary_max: job.local_salary_max || undefined,
        local_salary_currency: (job.local_salary_currency || "INR") as AdminJobEditFormData["local_salary_currency"],
        openings: job.openings,
        visa_sponsorship: job.visa_sponsorship || false,
        remote_allowed: job.remote_allowed || false,
        expires_at: job.expires_at ? job.expires_at.split("T")[0] : "",
        status: job.status as any,
        skills: skillNames,
        service_charge: Number(job.service_charge) || DEFAULT_SERVICE_CHARGE_INR,
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

  const onInvalid = (formErrors: FieldErrors<AdminJobEditFormData>) => {
    const firstField = Object.keys(formErrors)[0];
    toast.error(firstFormErrorMessage(formErrors) ?? "Please fix the highlighted fields");
    if (firstField) revealInvalidField(firstField);
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
        ...adminSalarySaveFields(data, hadLocalRange.current),
        openings: Number.isFinite(data.openings) ? data.openings : 1,
        visa_sponsorship: data.visa_sponsorship,
        remote_allowed: data.remote_allowed,
        status: data.status,
        expires_at: data.expires_at || null,
        service_charge: data.service_charge,
        youtube_urls: youtubeUrls,
      };

      const { error: jobError } = await adminUpdateJob(jobId, jobData, skills);
      if (jobError) throw new Error(jobError);

      toast.success("Job updated successfully");
      navigate("/admin/jobs");
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/jobs")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Job</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-muted-foreground">Company: {companyName}</p>
              <PostedByBadge role={postedByRole} />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <div className="space-y-6 max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div data-field="title">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    aria-invalid={!!errors.title}
                    className={errors.title ? invalidFieldClass : undefined}
                    {...register("title")}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div data-field="description">
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    aria-invalid={!!errors.description}
                    className={errors.description ? invalidFieldClass : undefined}
                    {...register("description")}
                    rows={6}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div data-field="responsibilities">
                  <Label htmlFor="responsibilities">Key Responsibilities</Label>
                  <Textarea
                    id="responsibilities"
                    aria-invalid={!!errors.responsibilities}
                    className={errors.responsibilities ? invalidFieldClass : undefined}
                    {...register("responsibilities")}
                    rows={4}
                  />
                  {errors.responsibilities && (
                    <p className="text-sm text-destructive mt-1">{errors.responsibilities.message}</p>
                  )}
                </div>

                <div data-field="requirements">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    aria-invalid={!!errors.requirements}
                    className={errors.requirements ? invalidFieldClass : undefined}
                    {...register("requirements")}
                    rows={4}
                  />
                  {errors.requirements && (
                    <p className="text-sm text-destructive mt-1">{errors.requirements.message}</p>
                  )}
                </div>

                <div data-field="benefits">
                  <JobBenefitsField
                    value={watch("benefits") || ""}
                    onChange={(v) => setValue("benefits", v, { shouldValidate: true })}
                    error={errors.benefits?.message}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div data-field="location">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      aria-invalid={!!errors.location}
                      className={errors.location ? invalidFieldClass : undefined}
                      {...register("location")}
                    />
                    {errors.location && (
                      <p className="text-sm text-destructive mt-1">{errors.location.message}</p>
                    )}
                  </div>
                  <div data-field="country">
                    <Label htmlFor="country">Country *</Label>
                    <Select value={watch("country")} onValueChange={(value) => {
                      setValue("country", value, { shouldValidate: true });
                      setValue("currency", currencyForDestination(value) as AdminJobEditFormData["currency"], { shouldValidate: true });
                    }}>
                      <SelectTrigger
                        id="country"
                        aria-invalid={!!errors.country}
                        className={errors.country ? invalidFieldClass : undefined}
                      >
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
                  <div data-field="job_type">
                    <Label htmlFor="job_type">Job Type *</Label>
                    <Select value={jobType} onValueChange={(value) => setValue("job_type", value as AdminJobEditFormData["job_type"], { shouldValidate: true })}>
                      <SelectTrigger
                        id="job_type"
                        aria-invalid={!!errors.job_type}
                        className={errors.job_type ? invalidFieldClass : undefined}
                      >
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
                  <div data-field="experience_level">
                    <Label htmlFor="experience_level">Experience Level *</Label>
                    <Select value={experienceLevel} onValueChange={(value) => setValue("experience_level", value as AdminJobEditFormData["experience_level"], { shouldValidate: true })}>
                      <SelectTrigger
                        id="experience_level"
                        aria-invalid={!!errors.experience_level}
                        className={errors.experience_level ? invalidFieldClass : undefined}
                      >
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

                <AdminSalaryRanges
                  localCurrency={localCurrency}
                  countryCurrency={currency}
                  localMin={localMin}
                  localMax={localMax}
                  countryMin={countryMin}
                  countryMax={countryMax}
                  onLocalCurrencyChange={(value) => setValue("local_salary_currency", value as AdminJobEditFormData["local_salary_currency"], { shouldValidate: true })}
                  onCountryCurrencyChange={(value) => setValue("currency", value as AdminJobEditFormData["currency"], { shouldValidate: true })}
                  localMinRegister={register("local_salary_min", { valueAsNumber: true })}
                  localMaxRegister={register("local_salary_max", { valueAsNumber: true })}
                  countryMinRegister={register("salary_min", { valueAsNumber: true })}
                  countryMaxRegister={register("salary_max", { valueAsNumber: true })}
                  localMinError={errors.local_salary_min}
                  localMaxError={errors.local_salary_max}
                  localCurrencyError={errors.local_salary_currency}
                  countryMinError={errors.salary_min}
                  countryMaxError={errors.salary_max}
                  countryCurrencyError={errors.currency}
                />

                <div data-field="service_charge">
                  <Label htmlFor="service_charge">SafeWork Global service charge (₹) *</Label>
                  <Input
                    id="service_charge"
                    type="number"
                    min={1}
                    step={1}
                    aria-invalid={!!errors.service_charge}
                    className={errors.service_charge ? invalidFieldClass : undefined}
                    {...register("service_charge", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Workers see this as the amount plus GST. Enter the total they pay, including GST. Default is ₹{DEFAULT_SERVICE_CHARGE_INR.toLocaleString("en-IN")}.
                  </p>
                  {errors.service_charge && (
                    <p className="text-sm text-destructive mt-1">{errors.service_charge.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div data-field="openings">
                    <Label htmlFor="openings">Number of Openings *</Label>
                    <Input
                      id="openings"
                      type="number"
                      aria-invalid={!!errors.openings}
                      className={errors.openings ? invalidFieldClass : undefined}
                      {...register("openings", { valueAsNumber: true })}
                    />
                    {errors.openings && (
                      <p className="text-sm text-destructive mt-1">{errors.openings.message}</p>
                    )}
                  </div>
                  <div data-field="expires_at">
                    <Label htmlFor="expires_at">Expiry Date</Label>
                    <Input
                      id="expires_at"
                      type="date"
                      aria-invalid={!!errors.expires_at}
                      className={errors.expires_at ? invalidFieldClass : undefined}
                      {...register("expires_at")}
                    />
                    {errors.expires_at && (
                      <p className="text-sm text-destructive mt-1">{errors.expires_at.message}</p>
                    )}
                  </div>
                </div>

                <div data-field="status">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={watch("status")} onValueChange={(value) => setValue("status", value as AdminJobEditFormData["status"], { shouldValidate: true })}>
                    <SelectTrigger
                      id="status"
                      aria-invalid={!!errors.status}
                      className={errors.status ? `w-48 ${invalidFieldClass}` : "w-48"}
                    >
                      <SelectValue placeholder="Select status" />
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
                  {errors.status && (
                    <p className="text-sm text-destructive mt-1">{errors.status.message}</p>
                  )}
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

            <JobYoutubeLinksField urls={youtubeUrls} onChange={setYoutubeUrls} />

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
              <Button type="button" variant="outline" onClick={() => navigate("/admin/jobs")}>
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
