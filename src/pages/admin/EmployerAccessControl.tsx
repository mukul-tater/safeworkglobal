import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Building2, Search, ShieldCheck, Trash2, Users } from 'lucide-react';
import {
  addOrgRule, assignWorkers, deleteOrgRule, fetchFieldCatalog, fetchOrgFieldOverrides,
  fetchOrgRules, listEmployerOrgs, listOrgWorkers, revokeWorker, searchAllWorkers,
  setFieldVisibility,
  type AccessRuleRow, type EmployerOrgSummary, type FieldCatalogRow, type OrgWorkerRow,
} from '@/services/adminEmployerAccessService';

const RULE_TYPES = [
  { value: 'trade', label: 'Trade / Work type' },
  { value: 'state', label: 'State / Location' },
  { value: 'skill_level', label: 'Skill level' },
  { value: 'availability', label: 'Availability' },
  { value: 'all', label: 'All workers' },
];

const GROUP_LABELS: Record<string, string> = {
  basic: 'Basic profile',
  trade: 'Trade & experience',
  contact: 'Contact details',
  salary: 'Salary',
  documents: 'Documents & IDs',
  medical: 'Medical',
  family: 'Family',
};

export default function EmployerAccessControl() {
  const [orgs, setOrgs] = useState<EmployerOrgSummary[]>([]);
  const [orgId, setOrgId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [orgWorkers, setOrgWorkers] = useState<OrgWorkerRow[]>([]);
  const [rules, setRules] = useState<AccessRuleRow[]>([]);
  const [catalog, setCatalog] = useState<FieldCatalogRow[]>([]);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const [directory, setDirectory] = useState<OrgWorkerRow[]>([]);
  const [dirSearch, setDirSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const [ruleType, setRuleType] = useState('trade');
  const [ruleValue, setRuleValue] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [o, c] = await Promise.all([listEmployerOrgs(), fetchFieldCatalog()]);
        setOrgs(o);
        setCatalog(c);
        if (o.length > 0) setOrgId(o[0].org_id);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load employers');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const reloadOrg = async (id: string) => {
    if (!id) return;
    try {
      const [w, r, ov] = await Promise.all([listOrgWorkers(id), fetchOrgRules(id), fetchOrgFieldOverrides(id)]);
      setOrgWorkers(w);
      setRules(r);
      setOverrides(ov);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load employer access settings');
    }
  };

  useEffect(() => { reloadOrg(orgId); }, [orgId]);

  useEffect(() => {
    (async () => {
      try { setDirectory(await searchAllWorkers(dirSearch)); } catch (e) { console.error(e); }
    })();
  }, [dirSearch]);

  const currentOrg = orgs.find(o => o.org_id === orgId);

  const groupedCatalog = useMemo(() => {
    const groups: Record<string, FieldCatalogRow[]> = {};
    catalog.forEach(f => { (groups[f.field_group] ||= []).push(f); });
    return groups;
  }, [catalog]);

  const isVisible = (f: FieldCatalogRow) => overrides[f.field_key] ?? f.default_visible;

  const toggleField = async (f: FieldCatalogRow, next: boolean) => {
    setOverrides(prev => ({ ...prev, [f.field_key]: next }));
    try {
      await setFieldVisibility(orgId, f.field_key, next);
    } catch (e) {
      console.error(e);
      setOverrides(prev => ({ ...prev, [f.field_key]: !next }));
      toast.error('Failed to update visibility');
    }
  };

  const handleAssign = async () => {
    if (selected.length === 0) { toast.error('Select at least one worker'); return; }
    try {
      await assignWorkers(orgId, selected);
      toast.success(`${selected.length} worker(s) assigned`);
      setSelected([]);
      reloadOrg(orgId);
    } catch (e) {
      console.error(e);
      toast.error('Failed to assign workers');
    }
  };

  const handleRevoke = async (workerId: string) => {
    try {
      await revokeWorker(orgId, workerId);
      toast.success('Access revoked');
      reloadOrg(orgId);
    } catch (e) {
      console.error(e);
      toast.error('Failed to revoke access');
    }
  };

  const handleAddRule = async () => {
    if (ruleType !== 'all' && !ruleValue.trim()) { toast.error('Enter a value for the rule'); return; }
    try {
      await addOrgRule(orgId, ruleType, ruleType === 'all' ? '' : ruleValue.trim());
      setRuleValue('');
      toast.success('Rule added');
      reloadOrg(orgId);
    } catch (e) {
      console.error(e);
      toast.error('Failed to add rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteOrgRule(id);
      toast.success('Rule removed');
      reloadOrg(orgId);
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove rule');
    }
  };

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Portal" portalName="SafeWork Global" profileMenuItems={adminProfileMenu}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6" /> Employer Access Control</h1>
        <p className="text-sm text-muted-foreground">Choose which workers each employer can see, and which worker information is shared.</p>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Employer</label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger><SelectValue placeholder={loading ? 'Loading…' : 'Select employer'} /></SelectTrigger>
              <SelectContent>
                {orgs.map(o => (
                  <SelectItem key={o.org_id} value={o.org_id}>
                    {o.name}{o.owner_email ? ` · ${o.owner_email}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {currentOrg && (
            <div className="flex gap-2">
              <Badge variant="secondary"><Users className="h-3 w-3 mr-1" />{orgWorkers.length} visible workers</Badge>
              <Badge variant="outline">{rules.length} rules</Badge>
            </div>
          )}
        </div>
        {orgs.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2"><Building2 className="h-4 w-4" /> No employer organisations yet.</p>
        )}
      </Card>

      {orgId && (
        <Tabs defaultValue="workers">
          <TabsList>
            <TabsTrigger value="workers">Worker assignment</TabsTrigger>
            <TabsTrigger value="rules">Category rules</TabsTrigger>
            <TabsTrigger value="fields">Information visibility</TabsTrigger>
          </TabsList>

          <TabsContent value="workers" className="space-y-4 mt-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-3">Currently visible to this employer</h2>
              {orgWorkers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No workers visible yet — assign workers below or add a category rule.</p>
              ) : (
                <div className="space-y-2">
                  {orgWorkers.map(w => (
                    <div key={w.worker_user_id} className="flex items-center justify-between border rounded-md p-2">
                      <div>
                        <p className="font-medium text-sm">{w.full_name ?? 'Worker'}</p>
                        <p className="text-xs text-muted-foreground">{w.trade ?? '—'} · {w.state ?? '—'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={w.source === 'assigned' ? 'default' : 'secondary'}>{w.source === 'assigned' ? 'Assigned' : 'Rule match'}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => handleRevoke(w.worker_user_id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-3">Assign individual workers</h2>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search workers by name, trade or location…" value={dirSearch} onChange={e => setDirSearch(e.target.value)} />
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {directory.map(w => (
                  <label key={w.worker_user_id} className="flex items-center gap-3 border rounded-md p-2 cursor-pointer">
                    <Checkbox
                      checked={selected.includes(w.worker_user_id)}
                      onCheckedChange={(c) => setSelected(prev => c ? [...prev, w.worker_user_id] : prev.filter(x => x !== w.worker_user_id))}
                    />
                    <div>
                      <p className="text-sm font-medium">{w.full_name ?? 'Worker'}</p>
                      <p className="text-xs text-muted-foreground">{w.trade ?? '—'} · {w.state ?? '—'}</p>
                    </div>
                  </label>
                ))}
                {directory.length === 0 && <p className="text-sm text-muted-foreground">No workers found.</p>}
              </div>
              <Button className="mt-3" onClick={handleAssign} disabled={selected.length === 0}>
                Assign {selected.length > 0 ? `${selected.length} worker(s)` : 'workers'}
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4 mt-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-3">Category rules</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Rules make every matching worker visible automatically — e.g. trade = Welder makes all welders (including future ones) visible.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <Select value={ruleType} onValueChange={setRuleType}>
                  <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RULE_TYPES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {ruleType !== 'all' && (
                  <Input placeholder="Value (e.g. Welder)" value={ruleValue} onChange={e => setRuleValue(e.target.value)} />
                )}
                <Button onClick={handleAddRule}>Add rule</Button>
              </div>
              <div className="space-y-2">
                {rules.map(r => (
                  <div key={r.id} className="flex items-center justify-between border rounded-md p-2">
                    <p className="text-sm">
                      {RULE_TYPES.find(t => t.value === r.rule_type)?.label ?? r.rule_type}
                      {r.rule_value ? `: ${r.rule_value}` : ''}
                    </p>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteRule(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                {rules.length === 0 && <p className="text-sm text-muted-foreground">No rules configured.</p>}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="fields" className="space-y-4 mt-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-1">Information visibility</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Hidden information is never sent to this employer. Sensitive fields are off unless enabled here.
              </p>
              <div className="space-y-5">
                {Object.entries(groupedCatalog).map(([group, fields]) => (
                  <div key={group}>
                    <h3 className="text-sm font-semibold mb-2">{GROUP_LABELS[group] ?? group}</h3>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {fields.map(f => (
                        <div key={f.field_key} className="flex items-center justify-between border rounded-md p-2">
                          <div>
                            <p className="text-sm">{f.label}</p>
                            {f.sensitive && <p className="text-xs text-muted-foreground">Sensitive</p>}
                          </div>
                          <Switch checked={isVisible(f)} onCheckedChange={(c) => toggleField(f, c)} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
}
