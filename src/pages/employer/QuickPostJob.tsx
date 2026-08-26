import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Briefcase, ArrowRight, Loader2, Sparkles, CalendarIcon } from "lucide-react";
import { DESTINATION_COUNTRIES, JOB_CATEGORIES } from "@/lib/constants";
import EmployerFlowStepper from "@/components/employer/EmployerFlowStepper";
import { JOB_TEMPLATES, resolveTemplate } from "@/lib/jobTemplates";
import { Badge } from "@/components/ui/badge";

export default function QuickPostJob() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [role, setRole] = useState("");
  const [openings, setOpenings] = useState("5");
  const [country, setCountry] = useState("");
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [experience, setExperience] = useState("INTERMEDIATE");
  const [description, setDescription] = useState("");
  const [joiningDate, setJoiningDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  // Quick-pick popular roles for one-tap auto-fill
  const QUICK_ROLES = ["Electrician", "Welder", "Plumber", "Helper", "Driver"];
  const template = resolveTemplate(role);

  const applyTemplate = (selectedRole: string) => {
    setRole(selectedRole);
    const tpl = resolveTemplate(selectedRole);
    if (tpl) {
      setSalaryMin(String(tpl.salaryMin));
      setSalaryMax(String(tpl.salaryMax));
      setExperience(tpl.experienceLevel);
      setDescription(tpl.description);
      toast.success(`Auto-filled ${tpl.role} template`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please log in"); return; }
    if (!role || !country || !location) { toast.error("Fill role, country and location"); return; }

    setLoading(true);
    try {
      const tpl = template;
      const finalDescription =
        description ||
        tpl?.description ||
        `Hiring ${openings} ${role}(s) for ${location}, ${country}.`;
      const requirements = tpl?.requirements?.join('\n• ') ? '• ' + tpl.requirements.join('\n• ') : null;
      const responsibilities = tpl?.responsibilities?.length
        ? '• ' + tpl.responsibilities.join('\n• ')
        : null;

      const { data: job, error } = await supabase
        .from("jobs")
        .insert({
          employer_id: user.id,
          title: role,
          description: finalDescription,
          requirements,
          responsibilities,
          location,
          country,
          job_type: "FULL_TIME",
          experience_level: experience,
          openings: parseInt(openings) || 1,
          salary_min: salaryMin ? Number(salaryMin) : null,
          salary_max: salaryMax ? Number(salaryMax) : null,
          currency: "INR",
          status: "PENDING",
          posted_at: null,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;

      // Seed required skills from template so matching works immediately
      if (tpl?.skills?.length) {
        await supabase.from("job_skills").insert(
          tpl.skills.map((skill_name) => ({ job_id: job.id, skill_name }))
        );
      }

      toast.success("Job submitted for admin approval");
      navigate(`/employer/manage-jobs`);
    } catch (err: any) {
      toast.error(err.message || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-info/5 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <EmployerFlowStepper current="post" />
      </div>
      <Card className="w-full max-w-2xl mx-auto shadow-elegant">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-3">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-heading">Post a Job in 30 seconds</h1>
            <p className="text-sm text-muted-foreground mt-1">Step 1 of 1 · Pick a role and we auto-fill the rest.</p>
          </div>

          {/* Quick role chips */}
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground">Quick pick — auto-fills description, salary & experience</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {QUICK_ROLES.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => applyTemplate(r)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                    role === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card hover:bg-accent border-border"
                  }`}
                >
                  <Sparkles className="inline h-3 w-3 mr-1" />
                  {r}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Job role *</Label>
              <Select value={role} onValueChange={applyTemplate}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {JOB_CATEGORIES.filter(c => c !== "All Categories").map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {template && (
                <p className="text-xs text-success mt-1.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Smart template applied — edit anything below
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Number of workers *</Label>
                <Input type="number" min={1} value={openings} onChange={(e) => setOpenings(e.target.value)} />
              </div>
              <div>
                <Label>Experience required</Label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRY">Entry</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="SENIOR">Senior</SelectItem>
                    <SelectItem value="EXPERT">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Country *</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {DESTINATION_COUNTRIES.filter(c => c !== "All Countries").map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location/City *</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Dubai" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min salary (INR/mo)</Label>
                <Input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="25000" />
              </div>
              <div>
                <Label>Max salary (INR/mo)</Label>
                <Input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="40000" />
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" /> Expected joining date *
              </Label>
              <Input
                type="date"
                value={joiningDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setJoiningDate(e.target.value)}
              />
            </div>

            {template && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">Auto-filled from template</span>
                  <Badge variant="secondary" className="text-xs">{template.skills.length} skills</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {template.skills.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Job description {template ? '(auto-filled, editable)' : ''}</Label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the role..." />
            </div>

            <Button type="submit" size="lg" className="w-full h-12 gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Post Job in 30 seconds <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
