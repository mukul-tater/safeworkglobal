import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, Plus, RefreshCw, Link2, KeyRound, BookOpen } from 'lucide-react';
import type { LspPartnerPublic, LspStatus } from '@/modules/lsp/types/lsp.types';
import { buildLaunchUrlFromParams, buildOneTimeLaunchUrl } from '@/modules/lsp/services/lspToken';

const sb = supabase as any;

type LspRow = LspPartnerPublic & {
  contact_name?: string | null;
  contact_mobile?: string | null;
  contact_email?: string | null;
};

export default function AdminLsps() {
  const [rows, setRows] = useState<LspRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [secretOnce, setSecretOnce] = useState<string | null>(null);
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    state: 'Rajasthan',
    contact_name: '',
    contact_mobile: '',
    contact_email: '',
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await sb
      .from('lsp_partners')
      .select('id, code, name, state, status, contact_name, contact_mobile, contact_email, created_at')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const createLsp = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Code and name required');
      return;
    }
    const { data, error } = await sb.rpc('admin_create_lsp', {
      p_code: form.code.trim(),
      p_name: form.name.trim(),
      p_state: form.state.trim() || 'Rajasthan',
      p_contact_name: form.contact_name || null,
      p_contact_mobile: form.contact_mobile || null,
      p_contact_email: form.contact_email || null,
      p_status: 'active',
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setSecretOnce(data.token_secret);
    toast.success(`Created ${data.code} — copy the secret now`);
    setForm({ code: '', name: '', state: 'Rajasthan', contact_name: '', contact_mobile: '', contact_email: '' });
    load();
  };

  const setStatus = async (id: string, status: LspStatus) => {
    const { error } = await sb.rpc('admin_set_lsp_status', { p_lsp_id: id, p_status: status });
    if (error) return toast.error(error.message);
    toast.success(`Status → ${status}`);
    load();
  };

  const rotateSecret = async (id: string) => {
    const { data, error } = await sb.rpc('admin_rotate_lsp_secret', { p_lsp_id: id });
    if (error) return toast.error(error.message);
    setSecretOnce(data.token_secret);
    toast.success('Secret rotated — copy it now');
  };

  const issueHmacUrl = async (id: string) => {
    const { data, error } = await sb.rpc('issue_lsp_launch_params', {
      p_lsp_id: id,
      p_ttl_seconds: 900,
    });
    if (error) return toast.error(error.message);
    const url = buildLaunchUrlFromParams(window.location.origin, data);
    setLaunchUrl(url);
    await copy(url, 'Launch URL');
  };

  const issueOneTimeUrl = async (id: string, code: string) => {
    const { data, error } = await sb.rpc('issue_lsp_one_time_token', {
      p_lsp_id: id,
      p_ttl_seconds: 900,
    });
    if (error) return toast.error(error.message);
    const url = buildOneTimeLaunchUrl(window.location.origin, {
      lsp: code,
      token: data.token,
      path: data.path,
    });
    setLaunchUrl(url);
    await copy(url, 'One-time launch URL');
  };

  const statusBadge = (s: string) => {
    const variant = s === 'active' ? 'default' : s === 'suspended' ? 'destructive' : 'secondary';
    return <Badge variant={variant as any}>{s}</Badge>;
  };

  return (
    <DashboardLayout
      navGroups={adminNavGroups}
      portalLabel="Admin Panel"
      portalName="Admin Panel"
      profileMenuItems={adminProfileMenu}
    >
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rajasthan LSPs</h1>
          <p className="text-sm text-muted-foreground">
            Manage LSP companies that deep-link into SafeWork. Secrets stay in the database — copy them only when shown once.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/lsp-docs">
            <BookOpen className="h-4 w-4 mr-1" /> Developer guide
          </Link>
        </Button>
      </div>

      {(secretOnce || launchUrl) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 space-y-3">
            {secretOnce && (
              <div className="space-y-1">
                <Label>Token secret (shown once)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={secretOnce} className="font-mono text-xs" />
                  <Button type="button" variant="outline" onClick={() => copy(secretOnce, 'Secret')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {launchUrl && (
              <div className="space-y-1">
                <Label>Launch URL</Label>
                <div className="flex gap-2">
                  <Input readOnly value={launchUrl} className="font-mono text-xs" />
                  <Button type="button" variant="outline" onClick={() => copy(launchUrl, 'URL')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={() => { setSecretOnce(null); setLaunchUrl(null); }}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create LSP
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Code</Label>
            <Input placeholder="RJ-CSC-02" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input placeholder="Company name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>State</Label>
            <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Contact name</Label>
            <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Contact mobile</Label>
            <Input value={form.contact_mobile} onChange={(e) => setForm({ ...form, contact_mobile: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Contact email</Label>
            <Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={createLsp}>Create active LSP</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">LSPs</CardTitle>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No LSPs yet. Run migration <code className="text-xs">20260729100000_lsp_partners.sql</code> then refresh.
            </p>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="border rounded-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{r.name}</span>
                    {statusBadge(r.status)}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">{r.code} · {r.state}</div>
                  {(r.contact_name || r.contact_email) && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {[r.contact_name, r.contact_mobile, r.contact_email].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => issueHmacUrl(r.id)}>
                    <Link2 className="h-3.5 w-3.5 mr-1" /> HMAC URL
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => issueOneTimeUrl(r.id, r.code)}>
                    <KeyRound className="h-3.5 w-3.5 mr-1" /> One-time URL
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => rotateSecret(r.id)}>
                    Rotate secret
                  </Button>
                  {r.status === 'active' ? (
                    <Button size="sm" variant="destructive" onClick={() => setStatus(r.id, 'suspended')}>
                      Suspend
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setStatus(r.id, 'active')}>
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
