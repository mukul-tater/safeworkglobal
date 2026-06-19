import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'employer' | 'worker' | 'partner';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
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
    email: u.email || '',
    full_name: fullName,
    phone,
    avatar_url: avatarUrl,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [hasResolvedRole, setHasResolvedRole] = useState(false);

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
  const fetchOrCreateProfile = async (currentUser: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (data && !error) {
      setProfile(data);
      return;
    }

    // No profile row yet — synthesize one from auth metadata and upsert.
    const derived = deriveProfileFromUser(currentUser);
    const { data: upserted, error: upsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: derived.id,
          email: derived.email,
          full_name: derived.full_name,
          phone: derived.phone,
          avatar_url: derived.avatar_url,
        },
        { onConflict: 'id' }
      )
      .select()
      .maybeSingle();

    if (upserted && !upsertError) {
      setProfile(upserted);
    } else {
      // Last-resort fallback: surface the derived profile in-memory so the UI
      // still renders a name and never displays "Unknown".
      setProfile({
        id: derived.id,
        email: derived.email,
        full_name: derived.full_name,
        phone: derived.phone,
        avatar_url: derived.avatar_url,
      });
    }
  };

  const loadUserData = async (currentUser: User) => {
    setProfileLoading(true);
    setHasResolvedRole(false);
    try {
      await Promise.all([
        fetchOrCreateProfile(currentUser),
        fetchUserRole(currentUser.id),
      ]);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer DB calls to avoid deadlock with the auth state callback.
          setTimeout(() => loadUserData(session.user), 0);
        } else {
          setRole(null);
          setProfile(null);
          setHasResolvedRole(false);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => loadUserData(session.user), 0);
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setHasResolvedRole(false);
  };

  const hasRole = (checkRole: AppRole) => role === checkRole;

  const refreshProfile = async () => {
    if (user) await fetchOrCreateProfile(user);
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
        loading,
        profileLoading,
        needsRoleSelection,
        login,
        signup,
        logout,
        hasRole,
        refreshProfile,
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
  loading: true,
  profileLoading: false,
  needsRoleSelection: false,
  login: async () => ({ success: false, error: 'Auth not ready' }),
  signup: async () => ({ success: false, error: 'Auth not ready' }),
  logout: async () => {},
  hasRole: () => false,
  refreshProfile: async () => {},
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
