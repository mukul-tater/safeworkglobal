import { useCallback, useEffect, useRef, useState } from 'react';

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  enabled?: boolean;
  delay?: number;
}

export function useAutoSave<T>({
  data,
  onSave,
  enabled = true,
  delay = 900,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const readyRef = useRef(false);
  const dataRef = useRef(data);
  const onSaveRef = useRef(onSave);
  const lastSavedRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  dataRef.current = data;
  onSaveRef.current = onSave;

  const serialized = JSON.stringify(data);

  const markReady = useCallback((baseline?: T) => {
    readyRef.current = true;
    lastSavedRef.current = JSON.stringify(baseline ?? dataRef.current);
    setStatus('idle');
  }, []);

  const persist = useCallback(async (options?: { silent?: boolean }) => {
    if (!enabled || !readyRef.current) return false;

    const payload = dataRef.current;
    const snapshot = JSON.stringify(payload);
    if (snapshot === lastSavedRef.current) return false;

    setStatus('saving');
    try {
      await onSaveRef.current(payload);
      lastSavedRef.current = snapshot;
      setStatus('saved');
      return true;
    } catch (error) {
      console.error('Auto-save failed:', error);
      setStatus('error');
      if (!options?.silent) throw error;
      return false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !readyRef.current) return;
    if (serialized === lastSavedRef.current) return;

    setStatus('pending');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void persist({ silent: true });
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [serialized, enabled, delay, persist]);

  useEffect(() => {
    const flushOnHide = () => {
      if (document.visibilityState === 'hidden') {
        void persist({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', flushOnHide);
    return () => document.removeEventListener('visibilitychange', flushOnHide);
  }, [persist]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!enabled || !readyRef.current) return;
      const snapshot = JSON.stringify(dataRef.current);
      if (snapshot !== lastSavedRef.current) {
        void onSaveRef.current(dataRef.current).catch(() => {});
      }
    };
  }, [enabled]);

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    return persist({ silent: false });
  }, [persist]);

  return { status, markReady, saveNow };
}
