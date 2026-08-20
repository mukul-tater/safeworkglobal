import { Linking } from 'react-native';
import { supabase } from '../integrations/supabase/client';

export interface MobileGoogleAuthResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
}

const REDIRECT = 'safeworkglobal://auth/callback';

export function isGoogleAuthCallback(url?: string | null): boolean {
  if (!url) return false;
  return url.startsWith('safeworkglobal://') && (url.includes('code=') || url.includes('access_token='));
}

export async function completeGoogleAuthFromUrl(url: string): Promise<boolean> {
  if (!isGoogleAuthCallback(url)) return false;
  try {
    const query = url.includes('?') ? url.split('?')[1]?.split('#')[0] ?? '' : '';
    const hash = url.includes('#') ? url.split('#')[1] ?? '' : '';
    const params = new URLSearchParams(query || hash);
    const code = params.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      return !error;
    }
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      return !error;
    }
  } catch {
    // ignore
  }
  return false;
}

/** Google sign-in via Supabase OAuth (same provider as the web app). */
export async function signInWithGoogleMobile(): Promise<MobileGoogleAuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: REDIRECT,
        queryParams: { prompt: 'select_account' },
        skipBrowserRedirect: true,
      },
    });
    if (error) return { success: false, error: error.message };
    if (data?.url) {
      await Linking.openURL(data.url);
      return { success: true };
    }
    return { success: false, error: 'Could not open Google authentication page.' };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Google OAuth failed',
    };
  }
}
