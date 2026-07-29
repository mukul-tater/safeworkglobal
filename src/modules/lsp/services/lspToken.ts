import { supabase } from '@/integrations/supabase/client';
import type { LspLaunchResult, LspSession } from '../types/lsp.types';
import { setLspSession } from './lspSession';

const sb = supabase as any;

function toSession(result: Extract<LspLaunchResult, { ok: true }>): LspSession {
  return {
    lspId: result.lsp_id,
    code: result.code,
    name: result.name,
    state: result.state,
    sessionExp: result.session_exp,
    emitraId: result.emitra_id ?? null,
    mobile: result.mobile ?? null,
  };
}

export async function verifyHmacLaunch(params: {
  lsp: string;
  exp: string;
  nonce: string;
  sig: string;
  emitraId?: string | null;
  mobile?: string | null;
}): Promise<LspLaunchResult> {
  const expNum = Number(params.exp);
  if (!Number.isFinite(expNum)) {
    return { ok: false, reason: 'missing_params' };
  }

  const { data, error } = await sb.rpc('verify_lsp_launch', {
    p_lsp: params.lsp,
    p_exp: expNum,
    p_nonce: params.nonce,
    p_sig: params.sig,
    p_emitra_id: params.emitraId ?? '',
    p_mobile: params.mobile ?? '',
  });

  if (error) {
    console.error('verify_lsp_launch', error);
    return { ok: false, reason: error.message || 'bad_signature' };
  }

  return data as LspLaunchResult;
}

export async function consumeOneTimeToken(token: string): Promise<LspLaunchResult> {
  const { data, error } = await sb.rpc('consume_lsp_launch_token', {
    p_token: token,
  });

  if (error) {
    console.error('consume_lsp_launch_token', error);
    return { ok: false, reason: error.message || 'unknown_token' };
  }

  return data as LspLaunchResult;
}

/** Validate query params, persist session on success. */
export async function processLspEntrySearchParams(
  search: URLSearchParams,
): Promise<LspLaunchResult> {
  const token = search.get('token');
  const lsp = search.get('lsp');

  let result: LspLaunchResult;

  if (token) {
    result = await consumeOneTimeToken(token);
  } else if (lsp && search.get('exp') && search.get('nonce') && search.get('sig')) {
    result = await verifyHmacLaunch({
      lsp,
      exp: search.get('exp')!,
      nonce: search.get('nonce')!,
      sig: search.get('sig')!,
      emitraId: search.get('emitra_id'),
      mobile: search.get('mobile'),
    });
  } else {
    result = { ok: false, reason: 'missing_params' };
  }

  if (result.ok) {
    setLspSession(toSession(result));
  }

  return result;
}

export function buildLaunchUrlFromParams(
  origin: string,
  params: {
    lsp: string;
    exp: number;
    nonce: string;
    sig: string;
    emitra_id?: string | null;
    mobile?: string | null;
    path?: string;
  },
): string {
  const q = new URLSearchParams({
    lsp: params.lsp,
    exp: String(params.exp),
    nonce: params.nonce,
    sig: params.sig,
  });
  if (params.emitra_id) q.set('emitra_id', params.emitra_id);
  if (params.mobile) q.set('mobile', params.mobile);
  return `${origin}${params.path || '/lsp/entry'}?${q.toString()}`;
}

export function buildOneTimeLaunchUrl(
  origin: string,
  params: { lsp: string; token: string; path?: string },
): string {
  const q = new URLSearchParams({ lsp: params.lsp, token: params.token });
  return `${origin}${params.path || '/lsp/entry'}?${q.toString()}`;
}
