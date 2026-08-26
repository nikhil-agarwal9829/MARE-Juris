import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Privileged Administrative Supabase Client.
 * Uses SUPABASE_SERVICE_ROLE_KEY (Bypasses Row Level Security).
 *
 * CRITICAL SECURITY GUARD:
 * Service Role Key MUST NEVER be exposed to browser clients.
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error(
      'SECURITY ERROR: Privileged Supabase Admin Client cannot be initialized on the client side!'
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
