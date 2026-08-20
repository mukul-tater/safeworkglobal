import { supabase } from '@/integrations/supabase/client';

export interface EmployerOrgSummary {
  org_id: string;
  name: string;
  owner_user_id: string | null;
  owner_email: string | null;
  assigned_workers: number;
  rules: number;
}

export interface OrgWorkerRow {
  worker_user_id: string;
  full_name: string | null;
  mobile: string | null;
  trade: string | null;
  state: string | null;
  source: 'assigned' | 'rule';
}

export interface FieldCatalogRow {
  field_key: string;
  label: string;
  field_group: string;
  sensitive: boolean;
  default_visible: boolean;
  sort_order: number;
}

export interface AccessRuleRow {
  id: string;
  org_id: string;
  rule_type: string;
  rule_value: string;
}

export async function listEmployerOrgs(): Promise<EmployerOrgSummary[]> {
  const { data, error } = await supabase.rpc('admin_list_employer_orgs' as never);
  if (error) throw error;
  return (data as unknown as EmployerOrgSummary[]) ?? [];
}

export async function listOrgWorkers(orgId: string): Promise<OrgWorkerRow[]> {
  const { data, error } = await supabase.rpc('admin_employer_org_workers' as never, { p_org: orgId } as never);
  if (error) throw error;
  return (data as unknown as OrgWorkerRow[]) ?? [];
}

export async function assignWorkers(orgId: string, workerIds: string[], note?: string) {
  const { error } = await supabase.rpc('admin_assign_workers' as never, {
    p_org: orgId, p_worker_ids: workerIds, p_note: note ?? null,
  } as never);
  if (error) throw error;
}

export async function revokeWorker(orgId: string, workerUserId: string) {
  const { error } = await supabase.rpc('admin_revoke_worker_assignment' as never, {
    p_org: orgId, p_worker_user_id: workerUserId,
  } as never);
  if (error) throw error;
}

export async function setFieldVisibility(orgId: string, fieldKey: string, visible: boolean) {
  const { error } = await supabase.rpc('admin_set_field_visibility' as never, {
    p_org: orgId, p_field_key: fieldKey, p_visible: visible,
  } as never);
  if (error) throw error;
}

export async function fetchFieldCatalog(): Promise<FieldCatalogRow[]> {
  const { data, error } = await (supabase as never as typeof supabase)
    .from('employer_visible_field_catalog' as never)
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return (data as unknown as FieldCatalogRow[]) ?? [];
}

export async function fetchOrgFieldOverrides(orgId: string): Promise<Record<string, boolean>> {
  const { data, error } = await (supabase as never as typeof supabase)
    .from('employer_field_visibility' as never)
    .select('field_key, visible')
    .eq('org_id', orgId);
  if (error) throw error;
  const rows = (data as unknown as { field_key: string; visible: boolean }[]) ?? [];
  return rows.reduce<Record<string, boolean>>((acc, r) => { acc[r.field_key] = r.visible; return acc; }, {});
}

export async function fetchOrgRules(orgId: string): Promise<AccessRuleRow[]> {
  const { data, error } = await (supabase as never as typeof supabase)
    .from('employer_worker_access_rules' as never)
    .select('id, org_id, rule_type, rule_value')
    .eq('org_id', orgId);
  if (error) throw error;
  return (data as unknown as AccessRuleRow[]) ?? [];
}

export async function addOrgRule(orgId: string, ruleType: string, ruleValue: string) {
  const { error } = await (supabase as never as typeof supabase)
    .from('employer_worker_access_rules' as never)
    .insert({ org_id: orgId, rule_type: ruleType, rule_value: ruleValue } as never);
  if (error) throw error;
}

export async function deleteOrgRule(ruleId: string) {
  const { error } = await (supabase as never as typeof supabase)
    .from('employer_worker_access_rules' as never)
    .delete()
    .eq('id', ruleId);
  if (error) throw error;
}

/** Full worker directory for the admin assignment picker. */
export async function searchAllWorkers(search: string): Promise<OrgWorkerRow[]> {
  let query = (supabase as never as typeof supabase)
    .from('worker_profiles' as never)
    .select('user_id, primary_work_type, primary_skill, current_location')
    .limit(200);
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data as unknown as Record<string, string>[]) ?? [];
  const ids = rows.map(r => r.user_id);
  if (ids.length === 0) return [];
  const { data: profs } = await supabase.from('profiles').select('id, full_name, phone').in('id', ids);
  const byId = new Map((profs ?? []).map(p => [p.id, p]));
  const term = search.trim().toLowerCase();
  return rows
    .map(r => ({
      worker_user_id: r.user_id,
      full_name: byId.get(r.user_id)?.full_name ?? null,
      mobile: byId.get(r.user_id)?.phone ?? null,
      trade: r.primary_work_type || r.primary_skill || null,
      state: r.current_location || null,
      source: 'assigned' as const,
    }))
    .filter(w => !term
      || (w.full_name ?? '').toLowerCase().includes(term)
      || (w.trade ?? '').toLowerCase().includes(term)
      || (w.state ?? '').toLowerCase().includes(term));
}
