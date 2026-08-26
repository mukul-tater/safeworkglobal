import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { adminJobPostSchema, type AdminJobPostFormData } from "@/lib/validations/job";
import { X, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { DESTINATION_COUNTRIES, CURRENCIES } from "@/lib/constants";
import JobBenefitsField from "@/components/employer/JobBenefitsField";
import JobTitleAutocomplete from "@/components/employer/JobTitleAutocomplete";
import { adminCreateJob } from "@/services/AdminService";
import SearchSelect from "@/components/SearchSelect";

interface EmployerOption {
  userId: string;
  label: string;
}

export default function AdminPostJob() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [employers, setEmployers] = useState<EmployerOption[]>([]);
  const [loadingEmployers, setLoadingEmployers] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AdminJobPostFormData>({
    resolver: zodResolver(adminJobPostSchema),
    defaultValues: {
      currency: "INR",
      openings: 1,
      visa_sponsorship: false,
      remote_allowed: false,
      status: "ACTIVE",
      skills: [],
      employer_id: "",
    },
  });

  const jobType = watch("job_type");
  const experienceLevel = watch("experience_level");
  const currency = watch("currency");
  const visaSponsorship = watch("visa_sponsorship");
  const remoteAllowed = watch("remote_allowed");
  const employerId = watch("employer_id");

  useEffect(() => {
    const loadEmployers = async () => {
      try {
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "employer");
        if (rolesError) throw rolesError;

        const employerIds = (roles || []).map((r) => r.user_id);
        if (employerIds.length === 0) {
          setEmployers([]);
          return;
        }

        const [{ data: profiles }, { data: employerProfiles }] = await Promise.all([
          supabase.from("profiles").select("id, email, full_name").in("id", employerIds),
          supabase.from("employer_profiles").select("user_id, company_name, trade_name").in("user_id", employerIds),
        ]);

        const options: EmployerOption[] = (employerProfiles || [])
          .map((ep) => {
            const profile = profiles?.find((p) => p.id === ep.user_id);
            const company = ep.company_name || ep.trade_name || profile?.full_name || profile?.email || `Employer ${ep.user_id.slice(0, 8)}`;
            const extra = profile?.email && company !== profile.email ? ` (${profile.email})` : "";
            return { userId: ep.user_id, label: `${company}${extra}` };
          })
          .sort((a, b) => a.label.localeCompare(b.label));

        setEmployers(options);
      } catch (error) {
        console.error("Error loading employers:", error);
        toast.error("Failed to load employers");
      } finally {
        setLoadingEmployers(false);
      }
    };

    void loadEmployers();
  }, []);

  const employerLabels = useMemo(() => employers.map((e) => e.label), [employers]);
  const selectedEmployerLabel = employers.find((e) => e.userId === employerId)?.label || "";

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
    const updatedSkills = skills.filter((s) => s !== skillToRemove);
    setSkills(updatedSkills);
    setValue("skills", updatedSkills);
  };

  const onSubmit = async (data: AdminJobPostFormData) => {
    setIsSubmitting(true);

    try {
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
        salary_min: Number.isFinite(data.salary_min) ? data.salary_min : null,
        salary_max: Number.isFinite(data.salary_max) ? data.salary_max : null,
        currency: data.currency,
        openings: Number.isFinite(data.openings) ? data.openings : 1,
        visa_sponsorship: data.visa_sponsorship,
        remote_allowed: data.remote_allowed,
        status: data.status,
        expires_at: data.expires_at || null,
        posted_at: data.status === "ACTIVE" ? new Date().toISOString() : null,
      };

      const { data: jobId, error } = await adminCreateJob(data.employer_id, jobData, skills);
      if (error) throw new Error(error);
      if (!jobId) throw new Error("Failed to create job");

      toast.success(data.status === "ACTIVE" ? "Job posted and published" : "Job created");
      navigate("/admin/jobs");
    } catch (error: unknown) {
      console.error("Error creating job:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create job");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/jobs")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Post a Job</h1>
          <p className="text-muted-foreground">Create a listing on behalf of an employer. It will be marked as posted by admin.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields"))}>
        <div className="space-y-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Employer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label>List under company *</Label>
              {loadingEmployers ? (
                <p className="text-sm text-muted-foreground">Loading employers…</p>
              ) : employers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No employers found.{" "}
                  <button type="button" className="underline" onClick={() => navigate("/admin/employers")}>
                    Add an employer
                  </button>{" "}
                  first.
                </p>
              ) : (
                <SearchSelect
                  value={selectedEmployerLabel}
                  onChange={(label) => {
                    const match = employers.find((e) => e.label === label);
                    setValue("employer_id", match?.userId || "", { shouldValidate: true });
                  }}
                  options={employerLabels}
                  placeholder="Search employer / company"
                  searchPlaceholder="Search by company or email"
                  emptyText="No matching employer"
                />
              )}
              {errors.employer_id && (
                <p className="text-sm text-destructive mt-1">{errors.employer_id.message}</p>
              )}
            </CardContent>
          </Card>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input id="location" {...register("location")} />
                  {errors.location && (
                    <p className="text-sm text-destructive mt-1">{errors.location.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={watch("country")} onValueChange={(value) => setValue("country", value, { shouldValidate: true })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {DESTINATION_COUNTRIES.filter((c) => c !== "All Countries").map((country) => (
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
                  <Select value={jobType} onValueChange={(value) => setValue("job_type", value as AdminJobPostFormData["job_type"], { shouldValidate: true })}>
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
                  <Select value={experienceLevel} onValueChange={(value) => setValue("experience_level", value as AdminJobPostFormData["experience_level"], { shouldValidate: true })}>
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
                  <Select value={currency} onValueChange={(value) => setValue("currency", value as AdminJobPostFormData["currency"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {CURRENCIES.map((curr) => (
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Select value={watch("status")} onValueChange={(value) => setValue("status", value as AdminJobPostFormData["status"])}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ACTIVE">Active (publish now)</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
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
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
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
            <Button type="submit" disabled={isSubmitting || loadingEmployers}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post job"
              )}
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
