import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import ApprovedPartnerGate, { useApprovedPartner } from '../components/ApprovedPartnerGate';
import { emitraNavGroups, emitraProfileMenu } from '../config/emitraNav';
import { indianStates } from '@/lib/validations/partner';
import { WORKER_SKILLS, EXPERIENCE_LEVELS, GCC_COUNTRIES } from '../config/constants';

function Inner() {
  const { partnerId } = useApprovedPartner();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    full_name: '', mobile: '', email: '', current_city: '', state: '',
    primary_work_type: '', years_of_experience: '', skill_level: 'intermediate',
    has_passport: false, preferred_country: '', bio: '',
  });
  const set = (k: string, v: any) => setF(d => ({ ...d, [k]: v }));

  const onSubmit = async () => {
    if (!partnerId) return;
    if (!f.full_name || !f.mobile || !f.primary_work_type || !f.state) {
      toast.error('Fill required fields');
      return;
    }
    setSaving(true);
    try {
      // Generate placeholder email + temp password for the worker auth account
      const email = f.email?.trim() || `worker.${f.mobile}@emitra.safeworkglobal.app`;
      const password = crypto.randomUUID();
      const { data: signUp, error: suErr } = await supabase.auth.signUp({
        email, password,
        options: {
          data: { full_name: f.full_name, phone: f.mobile, role: 'worker' },
          emailRedirectTo: `${window.location.origin}/worker/dashboard`,
        },
      });
      if (suErr) throw suErr;
      const newUserId = signUp.user?.id;
      if (!newUserId) throw new Error('Could not create worker account');

      // Update worker_profiles with source metadata (trigger will set review_status='pending')
      const { error: upErr } = await (supabase as any).from('worker_profiles').upsert({
        user_id: newUserId,
        bio: f.bio || null,
        nationality: 'Indian',
        current_city: f.current_city || null,
        current_location: [f.current_city, f.state].filter(Boolean).join(', '),
        country: 'India',
        primary_work_type: f.primary_work_type,
        years_of_experience: Number(f.years_of_experience) || 0,
        skill_level: f.skill_level,
        has_passport: !!f.has_passport,
        visa_countries: f.preferred_country ? [f.preferred_country] : [],
        languages: ['Hindi'],
        source_type: 'emitra',
        source_partner_id: partnerId,
        onboarded_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (upErr) throw upErr;

      await (supabase as any).from('worker_skills').insert({
        worker_id: newUserId,
        skill_name: f.primary_work_type,
        proficiency_level: f.skill_level,
        years_of_experience: Number(f.years_of_experience) || 0,
      });

      toast.success(`${f.full_name} onboarded — awaiting admin review`);
      navigate('/emitra/my-workers');
    } catch (e: any) {
      toast.error(e?.message || 'Onboarding failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout navGroups={emitraNavGroups} portalLabel="E-Mitra Portal" portalName="SafeWork Global" profileMenuItems={emitraProfileMenu}>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><UserPlus className="h-6 w-6" /> Onboard Worker</h1>
      <p className="text-sm text-muted-foreground mb-4">Workers you onboard go to admin review before becoming active.</p>
      <Card className="p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Full Name *"><Input value={f.full_name} onChange={e => set('full_name', e.target.value)} /></Field>
          <Field label="Mobile *"><Input maxLength={10} value={f.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g, ''))} /></Field>
          <Field label="Email (optional)"><Input type="email" value={f.email} onChange={e => set('email', e.target.value)} /></Field>
          <Field label="Current City"><Input value={f.current_city} onChange={e => set('current_city', e.target.value)} /></Field>
          <Field label="State *">
            <Select value={f.state} onValueChange={v => set('state', v)}>
              <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent className="max-h-72">{indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Primary Skill *">
            <Select value={f.primary_work_type} onValueChange={v => set('primary_work_type', v)}>
              <SelectTrigger><SelectValue placeholder="Select skill" /></SelectTrigger>
              <SelectContent>{WORKER_SKILLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Experience (years)"><Input type="number" value={f.years_of_experience} onChange={e => set('years_of_experience', e.target.value)} /></Field>
          <Field label="Skill Level">
            <Select value={f.skill_level} onValueChange={v => set('skill_level', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['beginner','intermediate','advanced'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Passport">
            <Select value={f.has_passport ? 'yes' : 'no'} onValueChange={v => set('has_passport', v === 'yes')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Preferred Country">
            <Select value={f.preferred_country} onValueChange={v => set('preferred_country', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{GCC_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Notes / Bio"><Textarea rows={3} value={f.bio} onChange={e => set('bio', e.target.value)} /></Field>
        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Submit for Review
          </Button>
        </div>
      </Card>
    </DashboardLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

export default function EmitraOnboardWorkerPage() {
  return <ApprovedPartnerGate><Inner /></ApprovedPartnerGate>;
}