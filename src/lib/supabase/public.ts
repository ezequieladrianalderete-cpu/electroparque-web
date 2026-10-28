import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Cliente sin sesión (solo datos públicos de la tienda). A diferencia del de server.ts no lee cookies,
// así que se puede usar adentro de unstable_cache para guardar las consultas por un rato.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
