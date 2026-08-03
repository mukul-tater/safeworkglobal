import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { redirectToPublicHome } from '@/lib/signOut';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { displayableEmail } from '@/lib/workerAuthEmail';

export type AppRole = 'admin' | 'employer' | 'worker' | 'partner' | 'interviewer';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  mobile_verified?: boolean | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  /** Worker mobile OTP completed once (signup or post-Google bind). */
  isMobileVerified: boolean;
  loading: boolean;
  /** True while we're still resolving the user's profile/role after auth resolves. */
  profileLoading: boolean;
  /** True when authenticated but no role has been assigned yet (e.g. fresh OAuth sign-in). */
  needsRoleSelection: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    role: AppRole;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  refreshProfile: () => Promise<void>;
  /**
   * Optimistically mark mobile as verified in-session (after signup/bind OTP).
   * Pass userId when React auth context may not have caught up yet after signIn.
   */
  markMobileVerified: (phone?: string, userId?: string) => void;
  /** Reload role from user_roles after admin promotion. */
  refreshRole: () => Promise<void>;
  /** Assign a role to the current user (used after OAuth sign-in when role is missing). */
  assignRole: (role: AppRole) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function deriveProfileFromUser(u: User): Omit<Profile, 'id'> & { id: string } {
  const meta = (u.user_metadata || {}) as Record<string, unknown>;
  const fullName =
    (meta.full_name as string) ||
    (meta.name as string) ||
    (meta.display_name as string) ||
    (u.email ? u.email.split('@')[0] : null);
  const avatarUrl =
    (meta.avatar_url as string) ||
    (meta.picture as string) ||
    null;
  const phone =
    (meta.phone as string) ||
    u.phone ||
    null;

  return {
    id: u.id,
    email: displayableEmail(u.email) || '',
    full_name: fullName,
    phone,
    avatar_url: avatarUrl,
  };
}

function sanitizeProfileEmail<T extends { email?: string | null }>(row: T): T {
  return { ...row, email: displayableEmail(row.email) || '' };
}

const mobileVerifiedStorageKey = (userId: string) => `swg_mobile_verified_${userId}`;

function readMobileVerifiedSession(userId: string | null | undefined): boolean {
  if (!userId || typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(mobileVerifiedStorageKey(userId)) === '1';
  } catch {
    return false;
  }
}

function writeMobileVerifiedSession(userId: string | null | undefined) {
  if (!userId || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(mobileVerifiedStorageKey(userId), '1');
  } catch {
    /* private mode / quota */
  }
}

function clearMobileVerifiedSession(userId: string | null | undefined) {
  if (!userId || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(mobileVerifiedStorageKey(userId));
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [hasResolvedRole, setHasResolvedRole] = useState(false);
  /** Survives brief profile races right after signup OTP (must not bounce to bind-mobile). */
  const [mobileVerifiedOverride, setMobileVerifiedOverride] = useState(false);
  const mobileVerifiedOverrideRef = useRef(false);
  /** Prevents tab-focus / token events from re-fetching and remounting the whole app. */
  const loadedUserIdRef = useRef<string | null>(null);
  const loadGenerationRef = useRef(0);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (data && !error) {
      setRole(data.role as AppRole);
    } else {
      setRole(null);
    }
    setHasResolvedRole(true);
  };

  /**
   * Fetch the profile for a user. If none exists (e.g. legacy OAuth user
   * created before the profile trigger was fixed), upsert one using the
   * metadata returned by the auth provider so the app never sees an
   * authenticated user without a profile.
   */
  const fetchOrCreateProfile = async (
    currentUser: User,
    generation?: number
  ) => {
    const isStale = () =>
      generation !== undefined && generation !== loadGenerationRef.current;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (isStale()) return;

    const preserveVerified =
      mobileVerifiedOverrideRef.current || readMobileVerifiedSession(currentUser.id);
    const metaMv = (currentUser.user_metadata as Record<string, unknown> | undefined)
      ?.mobile_verified;
    const metaVerified = metaMv === true || metaMv === 'true';

    if (data && !error) {
      // Keep synthetic mobile-auth emails in DB (profiles.email is NOT NULL).
      // Only hide them in UI via sanitizeProfileEmail / displayableEmail.
      const verified = !!(data.mobile_verified || preserveVerified || metaVerified);
      if (verified) writeMobileVerifiedSession(currentUser.id);
      setProfile(
        sanitizeProfileEmail({
          ...data,
          mobile_verified: verified,
        }),
      );
      return;
    }

    // No profile row yet — synthesize one from auth metadata and upsert.
    const derived = deriveProfileFromUser(currentUser);
    // Never write null email — column is NOT NULL. Prefer auth email (may be synthetic).
    const profileEmail =
      (currentUser.email || '').trim() ||
      (derived.email || '').trim() ||
      `user-${currentUser.id.replace(/-/g, '').slice(0, 12)}@workers.safeworkglobal.app`;
    const initialVerified = preserveVerified || metaVerified;
    const { data: upserted, error: upsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: derived.id,
          email: profileEmail,
          full_name: derived.full_name,
          phone: derived.phone,
          avatar_url: derived.avatar_url,
          // Do not invent false — OTP signup sets metadata / session flag.
          ...(initialVerified ? { mobile_verified: true } : {}),
        },
        { onConflict: 'id' }
      )
      .select()
      .maybeSingle();

    if (isStale()) return;

    if (upserted && !upsertError) {
      const verified = !!(upserted.mobile_verified || initialVerified);
      if (verified) writeMobileVerifiedSession(currentUser.id);
      setProfile(
        sanitizeProfileEmail({
          ...upserted,
          mobile_verified: verified,
        }),
      );
    } else {
      // Last-resort fallback: surface the derived profile in-memory so the UI
      // still renders a name and never displays "Unknown".
      if (initialVerified) writeMobileVerifiedSession(currentUser.id);
      setProfile({
        id: derived.id,
        email: derived.email,
        full_name: derived.full_name,
        phone: derived.phone,
        avatar_url: derived.avatar_url,
        mobile_verified: initialVerified,
      });
    }
  };

  const loadUserData = async (currentUser: User, opts?: { force?: boolean }) => {
    if (!opts?.force && loadedUserIdRef.current === currentUser.id) {
      return;
    }

    const generation = ++loadGenerationRef.current;
    const isInitialForUser = loadedUserIdRef.current !== currentUser.id;
    if (isInitialForUser) {
      setProfileLoading(true);
      setHasResolvedRole(false);
    }

    try {
      await Promise.all([
        fetchOrCreateProfile(currentUser, generation),
        fetchUserRole(currentUser.id),
      ]);
      if (generation === loadGenerationRef.current) {
        loadedUserIdRef.current = currentUser.id;
      }
    } finally {
      if (generation === loadGenerationRef.current) {
        setProfileLoading(false);
      }
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        // Silent token refresh — update tokens only, keep UI mounted.
        if (event === 'TOKEN_REFRESHED') {
          if (nextSession) setSession(nextSession);
          if (nextSession?.user) setUser(nextSession.user);
          setLoading(false);
          return;
        }

        // Real logout only. Do not treat transient null sessions (tab resume /
        // storage races) as sign-out — that blanks the homepage and remounts
        // protected routes.
        if (event === 'SIGNED_OUT') {
          clearMobileVerifiedSession(loadedUserIdRef.current);
          loadedUserIdRef.current = null;
          mobileVerifiedOverrideRef.current = false;
          setMobileVerifiedOverride(false);
          setSession(null);
          setUser(null);
          setRole(null);
          setProfile(null);
          setHasResolvedRole(false);
          setLoading(false);
          return;
        }

        if (!nextSession?.user) {
          setLoading(false);
          return;
        }

        setSession(nextSession);
        setUser(nextSession.user);

        // Re-hydrate OTP-verified flag after remount / new tab of same session.
        if (readMobileVerifiedSession(nextSession.user.id)) {
          mobileVerifiedOverrideRef.current = true;
          setMobileVerifiedOverride(true);
        }

        const sameUser = loadedUserIdRef.current === nextSession.user.id;
        // Same user after tab focus / INITIAL_SESSION / SIGNED_IN recovery.
        if (sameUser && event !== 'USER_UPDATED') {
          setLoading(false);
          return;
        }

        setTimeout(() => {
          void loadUserData(nextSession.user, { force: event === 'USER_UPDATED' });
        }, 0);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);

      if (existing?.user) {
        if (readMobileVerifiedSession(existing.user.id)) {
          mobileVerifiedOverrideRef.current = true;
          setMobileVerifiedOverride(true);
        }
        setTimeout(() => {
          void loadUserData(existing.user);
        }, 0);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  const signup = async (data: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    role: AppRole;
  }) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.full_name,
            phone: data.phone,
            role: data.role,
          },
        },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signup failed',
      };
    }
  };

  const logout = async () => {
    const uid = user?.id || loadedUserIdRef.current;
    await supabase.auth.signOut();
    clearMobileVerifiedSession(uid);
    loadedUserIdRef.current = null;
    mobileVerifiedOverrideRef.current = false;
    setMobileVerifiedOverride(false);
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setHasResolvedRole(false);
    redirectToPublicHome();
  };

  const hasRole = (checkRole: AppRole) => role === checkRole;

  const refreshProfile = async () => {
    // Prefer getUser() so callers that just signed in still refresh even if
    // React context `user` has not caught up yet. Bump generation so an
    // in-flight post-signIn profile fetch cannot overwrite with stale data
    // (e.g. mobile_verified still false).
    const generation = ++loadGenerationRef.current;
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) await fetchOrCreateProfile(currentUser, generation);
  };

  const markMobileVerified = (phone?: string, userId?: string) => {
    // Invalidate in-flight profile loads so they cannot clobber this.
    ++loadGenerationRef.current;
    mobileVerifiedOverrideRef.current = true;
    setMobileVerifiedOverride(true);

    const applyVerifiedProfile = (uid: string) => {
      writeMobileVerifiedSession(uid);
      setProfile((prev) => {
        if (prev && prev.id !== uid) {
          return {
            ...prev,
            id: uid,
            mobile_verified: true,
            phone: phone ?? prev.phone,
          };
        }
        if (!prev) {
          return {
            id: uid,
            email: displayableEmail(user?.email) || '',
            full_name: (user?.user_metadata?.full_name as string) ?? null,
            phone: phone ?? (user?.user_metadata?.phone as string) ?? null,
            avatar_url: null,
            mobile_verified: true,
          };
        }
        return {
          ...prev,
          mobile_verified: true,
          phone: phone ?? prev.phone,
        };
      });
    };

    const uid = userId || profile?.id || user?.id;
    if (uid) {
      applyVerifiedProfile(uid);
      return;
    }

    // Auth React state may lag behind signInWithPassword — resolve id, then apply.
    void supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id;
      if (!id) return;
      applyVerifiedProfile(id);
    });
  };

  const refreshRole = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) await fetchUserRole(currentUser.id);
  };

  const assignRole = async (newRole: AppRole) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (newRole === 'admin') {
      return { success: false, error: 'Admin role cannot be self-assigned' };
    }
    try {
      // Use the SECURITY DEFINER RPC so the user can claim their first role
      // without needing INSERT permission on user_roles directly.
      const { error } = await supabase.rpc('assign_initial_role', { _role: newRole });
      if (error) {
        // If the role is already assigned (e.g. race), just refresh.
        if (!/already assigned/i.test(error.message)) {
          return { success: false, error: error.message };
        }
      }

      setRole(newRole);
      setHasResolvedRole(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign role',
      };
    }
  };

  const isEmailVerified = !!user?.email_confirmed_at;
  const sessionVerified =
    readMobileVerifiedSession(user?.id || profile?.id) || mobileVerifiedOverrideRef.current;
  const isMobileVerified =
    !!profile?.mobile_verified || mobileVerifiedOverride || sessionVerified;
  const needsRoleSelection = !!user && hasResolvedRole && !role;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isAuthenticated: !!session,
        isEmailVerified,
        isMobileVerified,
        loading,
        profileLoading,
        needsRoleSelection,
        login,
        signup,
        logout,
        hasRole,
        refreshProfile,
        markMobileVerified,
        refreshRole,
        assignRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Safe fallback used only when the context is momentarily unavailable
// (e.g. during Vite HMR after AuthContext.tsx was just edited). Throwing
// here would blank-screen the whole app on every hot update.
const noopAuth: AuthContextType = {
  user: null,
  session: null,
  profile: null,
  role: null,
  isAuthenticated: false,
  isEmailVerified: false,
  isMobileVerified: false,
  loading: true,
  profileLoading: false,
  needsRoleSelection: false,
  login: async () => ({ success: false, error: 'Auth not ready' }),
  signup: async () => ({ success: false, error: 'Auth not ready' }),
  logout: async () => {},
  hasRole: () => false,
  refreshProfile: async () => {},
  markMobileVerified: () => {},
  refreshRole: async () => {},
  assignRole: async () => ({ success: false, error: 'Auth not ready' }),
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    if (import.meta.env.DEV) {
      console.warn('useAuth called outside AuthProvider — returning safe defaults (likely HMR).');
      return noopAuth;
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
