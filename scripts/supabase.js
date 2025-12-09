// Lightweight Supabase initializer with graceful fallback
export async function getSupabaseClient() {
  // Read keys from Vite env (import.meta.env)
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  // Dynamically import to keep bundle small when not used
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });

  return supabase;
}
