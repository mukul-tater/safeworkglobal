import { supabase } from '@/integrations/supabase/client';

export interface EmployerVisibleField {
  field_key: string;
  label: string;
  field_group: string;
  visible: boolean;
}

export type FieldVisibilityMap = Record<string, boolean>;

export interface EmployerWorkerRow {
  worker_user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  mobile: string | null;
  email: string | null;
  trade: string | null;
  skill_level: string | null;
  years_of_experience: number | null;
  skills: string[] | null;
  availability: string | null;
  current_location: string | null;
  current_city: string | null;
  nationality: string | null;
  languages: string[] | null;
  open_to_relocation: boolean | null;
  expected_salary_min: number | null;
  expected_salary_max: number | null;
  currency: string | null;
  has_passport: boolean | null;
  passport_number: string | null;
  passport_expiry: string | null;
  aadhaar_last4: string | null;
  pan_number: string | null;
  kyc_status: string | null;
  ecr_status: string | null;
  medical_status: string | null;
  total_count?: number | null;
  bio?: string | null;
}

/** Fields the admin has allowed for the signed-in employer's organisation. */
export async function fetchEmployerVisibleFields(): Promise<EmployerVisibleField[]> {
  const { data, error } = await supabase.rpc('employer_visible_fields' as never);
  if (error) throw error;
  return (data as unknown as EmployerVisibleField[]) ?? [];
}

export function toVisibilityMap(fields: EmployerVisibleField[]): FieldVisibilityMap {
  return fields.reduce<FieldVisibilityMap>((acc, f) => {
    acc[f.field_key] = f.visible;
    return acc;
  }, {});
}

export interface EmployerWorkerQuery {
  search?: string;
  trade?: string;
  availability?: string;
  limit?: number;
  offset?: number;
}

/** Workers the admin has assigned to the signed-in employer, with restricted fields removed server-side. */
export async function fetchEmployerWorkers(q: EmployerWorkerQuery = {}): Promise<EmployerWorkerRow[]> {
  const { data, error } = await supabase.rpc('employer_list_workers' as never, {
    p_search: q.search ?? null,
    p_trade: q.trade && q.trade !== 'All' ? q.trade : null,
    p_availability: q.availability && q.availability !== 'All' ? q.availability : null,
    p_limit: q.limit ?? 100,
    p_offset: q.offset ?? 0,
  } as never);
  if (error) throw error;
  return (data as unknown as EmployerWorkerRow[]) ?? [];
}

export async function fetchEmployerWorker(workerUserId: string): Promise<EmployerWorkerRow | null> {
  const { data, error } = await supabase.rpc('employer_get_worker' as never, {
    p_worker_user_id: workerUserId,
  } as never);
  if (error) throw error;
  const rows = (data as unknown as EmployerWorkerRow[]) ?? [];
  return rows[0] ?? null;
}
