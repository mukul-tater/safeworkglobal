import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

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
  profileLoading: boolean;
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
  refreshRole: () => Promise<void>;
  assignRole: (role: AppRole) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function deriveProfileFromUser(u: User): Profile {
  const meta = (u.user_metadata || {}) as Record<string, unknown>;
  const fullName =
    (meta.full_name as string) ||
    (meta.name as string) ||
    (meta.display_name as string) ||
    (u.email ? u.email.split('@')[0] : null);
  const avatarUrl = (meta.avatar_url as string) || (meta.picture as string) || null;
  const phone = (meta.phone as string) || u.phone || null;

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
        { onConflict: 'id' },
      )
      .select()
      .maybeSingle();

    if (upserted && !upsertError) {
      setProfile(upserted);
    } else {
      setProfile(derived);
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        setTimeout(() => loadUserData(nextSession.user), 0);
      } else {
        setRole(null);
        setProfile(null);
        setHasResolvedRole(false);
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);

      if (existing?.user) {
        setTimeout(() => loadUserData(existing.user), 0);
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
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
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
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (currentUser) await fetchUserRole(currentUser.id);
  };

  const assignRole = async (newRole: AppRole) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (newRole === 'admin') {
      return { success: false, error: 'Admin role cannot be self-assigned' };
    }
    try {
      const { error } = await supabase.rpc('assign_initial_role', { _role: newRole });
      if (error && !/already assigned/i.test(error.message)) {
        return { success: false, error: error.message };
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
