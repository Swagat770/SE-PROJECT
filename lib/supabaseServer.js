import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabaseAdmin';

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 * Uses cookies via @supabase/ssr.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored when called from Server Components where cookies are read-only
          }
        },
      },
    }
  );
}

/**
 * Helper to fetch the authenticated user and their profile (role, department, manager_id)
 * using the server-side admin client for the profile query.
 * @returns {Promise<{ user: any, profile: any }>}
 */
export async function getAuthUserAndProfile() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { user: null, profile: null };
    }

    // Fetch role and details from profiles using supabaseAdmin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return { user, profile: null };
    }

    return { user, profile };
  } catch (err) {
    return { user: null, profile: null };
  }
}
