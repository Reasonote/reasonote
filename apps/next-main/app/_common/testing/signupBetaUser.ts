"use server";
import {Database} from "@reasonote/lib-sdk";
import {
  createClient,
  SupabaseClient,
} from "@supabase/supabase-js";

import {getApiEnv} from "../../api/helpers/apiEnv";

/**
 * Creates a test user for server-side testing purposes.
 * 
 * @remarks
 * This utility should only be used in server-side test files.
 * It creates a temporary user with full permissions for testing purposes.
 * 
 * @example
 * ```typescript
 * // In a server-side test file:
 * const testUser = await createTestUser('test@example.com', 'password123');
 * ```
 */
export async function createTestUser(email: string, password: string): Promise<{
  sb: SupabaseClient<Database>;
  rsnUserId: string;
  authToken: string;
}> {
  const apiEnv = getApiEnv();

  // Create initial client with anon key
  const supabase = createClient<Database>(
    apiEnv.NEXT_PUBLIC_SUPABASE_URL,
    apiEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {persistSession: false},
    }
  );

  // Try to create user first
  const {error: signUpError} = await supabase.auth.signUp({
    email,
    password,
  });

  // Attempt to sign in (whether signup succeeded or failed)
  const {
    data: {session},
    error: signInError,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !session) {
    throw new Error(`Failed to sign in as ${email}: ${signInError?.message}`);
  }

  // Create authenticated client
  const authedClient = createClient<Database>(
    apiEnv.NEXT_PUBLIC_SUPABASE_URL,
    apiEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    }
  );

  // Get the RSN user ID
  const {data: rsnUserId, error: getUserError} = await authedClient.rpc(
    "current_rsn_user_id"
  );

  if (!rsnUserId) {
    throw new Error(`Failed to get user ${email}: ${getUserError?.message}`);
  }

  return {
    sb: authedClient,
    rsnUserId: rsnUserId as string,
    authToken: `${session.access_token}`,
  };
} 
