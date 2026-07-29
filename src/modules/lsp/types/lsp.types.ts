export type LspStatus = 'pending' | 'active' | 'suspended';

export interface LspPartnerPublic {
  id: string;
  code: string;
  name: string;
  state: string;
  status: LspStatus;
  created_at?: string;
  contact_name?: string | null;
  contact_mobile?: string | null;
  contact_email?: string | null;
}

export interface LspSession {
  lspId: string;
  code: string;
  name: string;
  state: string;
  /** Unix seconds when this browser session attribution expires */
  sessionExp: number;
  emitraId?: string | null;
  mobile?: string | null;
}

export interface LspLaunchOk {
  ok: true;
  lsp_id: string;
  code: string;
  name: string;
  state: string;
  emitra_id?: string | null;
  mobile?: string | null;
  session_exp: number;
}

export interface LspLaunchFail {
  ok: false;
  reason: string;
}

export type LspLaunchResult = LspLaunchOk | LspLaunchFail;

export const LSP_DENY_REASONS: Record<string, string> = {
  missing_params: 'Launch link is incomplete.',
  expired: 'This launch link has expired. Open SafeWork again from your LSP portal.',
  exp_too_far: 'Launch link expiry is invalid.',
  unknown_lsp: 'Unknown LSP. Contact SafeWork support.',
  lsp_not_active: 'This LSP is not active. Contact SafeWork support.',
  bad_signature: 'Launch link signature is invalid.',
  missing_token: 'Launch token is missing.',
  unknown_token: 'Launch token is invalid.',
  token_used: 'This launch token was already used. Request a new one.',
  lsp_missing: 'LSP record not found.',
  no_session: 'No valid LSP session. Open SafeWork from your LSP portal again.',
  session_expired: 'LSP session expired. Open SafeWork from your LSP portal again.',
};
