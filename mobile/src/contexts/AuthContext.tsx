import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { assertEnvConfigured } from '../config/env';
import { supabase } from '../integrations/supabase/client';
import { completeGoogleAuthFromUrl, signInWithGoogleMobile } from '../services/googleAuthService';
import { displayableEmail, workerAuthEmailFromIdentifier } from '../lib/workerAuthEmail';
import { passwordSignupIssue } from '../lib/password';

export type AppRole = 'admin' | 'employer' | 'worker' | 'partner';

export interface Profile {
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
  isMobileVerified: boolean;
  loading: boolean;
  profileLoading: boolean;
  needsRoleSelection: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; cancelled?: boolean }>;
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
  markMobileVerified: (phone?: string, userId?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mobileVerifiedStorageKey = (userId: string) => `swg_mobile_verified_${userId}`;

async function readMobileVerifiedSession(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  try {
    return (await AsyncStorage.getItem(mobileVerifiedStorageKey(userId))) === '1';
  } catch {
    return false;
  }
}

async function writeMobileVerifiedSession(userId: string) {
  try {
    await AsyncStorage.setItem(mobileVerifiedStorageKey(userId), '1');
  } catch {
    // ignore
  }
}

function deriveProfileFromUser(u: User): Profile {
  const meta = (u.user_metadata || {}) as Record<string, unknown>;
  const fullName =
    (meta.full_name as string) ||
    (meta.name as string) ||
    (meta.display_name as string) ||
    (u.email ? u.email.split('@')[0] : null);
  const avatarUrl = (meta.avatar_url as string) || (meta.picture as string) || null;
  const phone = (meta.phone as string) || u.phone || null;
  const mobileVerified = Boolean(meta.mobile_verified);

  return {
    id: u.id,
    email: displayableEmail(u.email) || u.email || '',
    full_name: fullName,
    phone,
    avatar_url: avatarUrl,
    mobile_verified: mobileVerified,
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
  const [mobileVerifiedOverride, setMobileVerifiedOverride] = useState(false);
  const [sessionMobileVerified, setSessionMobileVerified] = useState(false);
  const mobileVerifiedOverrideRef = useRef(false);
  const loadGenerationRef = useRef(0);

  useEffect(() => {
    try {
      assertEnvConfigured();
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      void completeGoogleAuthFromUrl(url);
    };
    const sub = Linking.addEventListener('url', handleUrl);
    void Linking.getInitialURL().then((url) => {
      if (url) void completeGoogleAuthFromUrl(url);
    });
    return () => sub.remove();
  }, []);

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

  const fetchOrCreateProfile = async (currentUser: User, generation: number) => {
    const sessionFlag = await readMobileVerifiedSession(currentUser.id);
    if (generation === loadGenerationRef.current) {
      setSessionMobileVerified(sessionFlag);
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (generation !== loadGenerationRef.current) return;

    if (data && !error) {
      const metaVerified = Boolean(
        (currentUser.user_metadata as Record<string, unknown> | undefined)?.mobile_verified,
      );
      const verified = !!(data.mobile_verified || sessionFlag || mobileVerifiedOverrideRef.current || metaVerified);
      setProfile({
        ...data,
        email: displayableEmail(data.email) || data.email || '',
        mobile_verified: verified,
      });
      return;
    }

    const derived = deriveProfileFromUser(currentUser);
    const initialVerified = !!(derived.mobile_verified || sessionFlag || mobileVerifiedOverrideRef.current);
    const { data: upserted, error: upsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: derived.id,
          email: currentUser.email || derived.email,
          full_name: derived.full_name,
          phone: derived.phone,
          avatar_url: derived.avatar_url,
          ...(initialVerified ? { mobile_verified: true } : {}),
        },
        { onConflict: 'id' },
      )
      .select()
      .maybeSingle();

    if (generation !== loadGenerationRef.current) return;

    if (upserted && !upsertError) {
      setProfile({
        ...upserted,
        email: displayableEmail(upserted.email) || upserted.email || '',
        mobile_verified: !!(upserted.mobile_verified || initialVerified),
      });
    } else {
      setProfile({ ...derived, mobile_verified: initialVerified });
    }
  };

  const loadUserData = async (currentUser: User) => {
    const generation = ++loadGenerationRef.current;
    setProfileLoading(true);
    setHasResolvedRole(false);
    try {
      await Promise.all([
        fetchOrCreateProfile(currentUser, generation),
        fetchUserRole(currentUser.id),
      ]);
    } finally {
      if (generation === loadGenerationRef.current) {
        setProfileLoading(false);
      }
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
        setMobileVerifiedOverride(false);
        mobileVerifiedOverrideRef.current = false;
        setSessionMobileVerified(false);
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

  const login = async (identifier: string, password: string) => {
    try {
      const email = workerAuthEmailFromIdentifier(identifier);
      if (!email) {
        return { success: false, error: 'Enter a valid email or 10-digit mobile number.' };
      }
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
      const passwordIssue = passwordSignupIssue(data.password);
      if (passwordIssue) return { success: false, error: passwordIssue };

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

  const loginWithGoogle = async () => {
    try {
      const res = await signInWithGoogleMobile();
      if (!res.success) {
        if (res.cancelled) return { success: false, cancelled: true };
        return { success: false, error: res.error || 'Google sign-in failed' };
      }
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (currentSession?.user) {
        setUser(currentSession.user);
        setSession(currentSession);
        await fetchOrCreateProfile(currentSession.user, ++loadGenerationRef.current);
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Google sign-in failed',
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
    setMobileVerifiedOverride(false);
    mobileVerifiedOverrideRef.current = false;
    setSessionMobileVerified(false);
  };

  const hasRole = (checkRole: AppRole) => role === checkRole;

  const refreshProfile = async () => {
    const generation = ++loadGenerationRef.current;
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (currentUser) await fetchOrCreateProfile(currentUser, generation);
  };

  const refreshRole = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (currentUser) await fetchUserRole(currentUser.id);
  };

  const markMobileVerified = (phone?: string, userId?: string) => {
    ++loadGenerationRef.current;
    mobileVerifiedOverrideRef.current = true;
    setMobileVerifiedOverride(true);

    const applyVerifiedProfile = (uid: string) => {
      void writeMobileVerifiedSession(uid);
      setSessionMobileVerified(true);
      setProfile((prev) => {
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
          id: uid,
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

    void supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id;
      if (!id) return;
      applyVerifiedProfile(id);
    });
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
  const isMobileVerified =
    !!profile?.mobile_verified || mobileVerifiedOverride || sessionMobileVerified;
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
        loginWithGoogle,
        signup,
        logout,
        hasRole,
        refreshProfile,
        refreshRole,
        assignRole,
        markMobileVerified,
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
