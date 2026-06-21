import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { redirectToPublicHome } from '@/lib/signOut';
import type { WorkerAuthResponse, WorkerProfile } from '../types/worker.types';
import { workerApi } from '../services/workerApi';

const SESSION_KEY = 'safework_worker_session';

interface WorkerSession {
  token: string;
  worker: WorkerProfile;
}

interface WorkerAuthContextValue {
  worker: WorkerProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: { mobileNumber?: string; email?: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (auth: WorkerAuthResponse) => Promise<{ success: boolean; error?: string }>;
  register: (payload: Parameters<typeof workerApi.register>[0]) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearWorkerSession: () => void;
  refreshProfile: () => Promise<void>;
  updateWorker: (worker: WorkerProfile) => void;
}

const WorkerAuthContext = createContext<WorkerAuthContextValue | undefined>(undefined);

function loadSession(): WorkerSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorkerSession;
  } catch {
    return null;
  }
}

function saveSession(session: WorkerSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

function formatError(err: unknown): string {
  if (err instanceof Error) {
    const withErrors = err as Error & { errors?: Record<string, string[]> };
    if (withErrors.errors) {
      const first = Object.values(withErrors.errors)[0]?.[0];
      if (first) return first;
    }
    return err.message;
  }
  return 'Something went wrong';
}

export function WorkerAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<WorkerSession | null>(() => loadSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = useCallback(async (payload: { mobileNumber?: string; email?: string; password: string }) => {
    try {
      const data = await workerApi.login(payload);
      const next: WorkerSession = { token: data.token, worker: data.worker };
      saveSession(next);
      setSession(next);
      return { success: true };
    } catch (err) {
      return { success: false, error: formatError(err) };
    }
  }, []);

  const loginWithGoogle = useCallback(async (auth: WorkerAuthResponse) => {
    try {
      const next: WorkerSession = { token: auth.token, worker: auth.worker };
      saveSession(next);
      setSession(next);
      return { success: true };
    } catch (err) {
      return { success: false, error: formatError(err) };
    }
  }, []);

  const register = useCallback(async (payload: Parameters<typeof workerApi.register>[0]) => {
    try {
      const data = await workerApi.register(payload);
      const next: WorkerSession = { token: data.token, worker: data.worker };
      saveSession(next);
      setSession(next);
      return { success: true };
    } catch (err) {
      return { success: false, error: formatError(err) };
    }
  }, []);

  const clearWorkerSession = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const logout = useCallback(() => {
    clearWorkerSession();
    redirectToPublicHome();
  }, [clearWorkerSession]);

  const refreshProfile = useCallback(async () => {
    if (!session) return;
    try {
      const worker = await workerApi.getProfile(session.worker.id, session.token);
      const next = { ...session, worker };
      saveSession(next);
      setSession(next);
    } catch {
      clearSession();
      setSession(null);
    }
  }, [session]);

  const updateWorker = useCallback((worker: WorkerProfile) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, worker };
      saveSession(next);
      return next;
    });
  }, []);

  const value = useMemo<WorkerAuthContextValue>(
    () => ({
      worker: session?.worker ?? null,
      token: session?.token ?? null,
      isAuthenticated: !!session,
      loading,
      login,
      loginWithGoogle,
      register,
      logout,
      clearWorkerSession,
      refreshProfile,
      updateWorker,
    }),
    [session, loading, login, loginWithGoogle, register, logout, clearWorkerSession, refreshProfile, updateWorker]
  );

  return <WorkerAuthContext.Provider value={value}>{children}</WorkerAuthContext.Provider>;
}

export function useWorkerAuth(): WorkerAuthContextValue {
  const ctx = useContext(WorkerAuthContext);
  if (!ctx) {
    throw new Error('useWorkerAuth must be used within WorkerAuthProvider');
  }
  return ctx;
}
