// Lovable / Vite client. Public anon key is safe in the browser.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/** Public project defaults (anon key). Override with VITE_* when present. */
const DEFAULT_SUPABASE_URL = 'https://etpiadoqryvtlpmiuxia.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0cGlhZG9xcnl2dGxwbWl1eGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjIxOTksImV4cCI6MjA3Njg5ODE5OX0.t4PsQoHcByhgOiqM2VxDHjFAZsP5yhe8U3rcnP_sP1E';

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
const SUPABASE_PUBLISHABLE_KEY = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY,
).trim();

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
