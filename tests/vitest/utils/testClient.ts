import { Database } from '@reasonote/lib-sdk';
import {
  createClient,
  SupabaseClient,
} from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL is not set');
}

const ANON_KEY = process.env.SUPABASE_ANON_KEY;
if (!ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY is not set');
}

function createAuthenticatedClient(session: { access_token: string }): SupabaseClient<Database> {
  // @ts-ignore
  return createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    }
  });
}

export async function createTestClient(email: string, password: string): Promise<SupabaseClient<Database>> {
  // Create initial client with anon key
  // @ts-ignore
  const supabase = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false }
  });

  // Try to create user first
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  // Attempt to sign in (whether signup succeeded or failed)
  const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !session) {
    throw new Error(`Failed to sign in as ${email}: ${signInError?.message}`);
  }

  return createAuthenticatedClient(session);
} 

export async function createTestUser(email: string, password: string): Promise<{ sb: SupabaseClient<Database>, rsnUserId: string }> {
  const client = await createTestClient(email, password);
  const { data: rsnUserId, error: getUserError } = await client.rpc('current_rsn_user_id');
  
  if (!rsnUserId) {
    throw new Error(`Failed to get user ${email}: ${getUserError?.message}`);
  }

  return {
    sb: client,
    rsnUserId: rsnUserId as string
  }
}

export async function createAnonymousUser(): Promise<{ sb: SupabaseClient<Database>, rsnUserId: string }> {
  // Create initial client with anon key
  const supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    auth: { 
      persistSession: false,
    }
  });

  // Sign in anonymously
  const { data: { session }, error: signInError } = await supabase.auth.signInAnonymously();

  if (signInError || !session) {
    throw new Error(`Failed to sign in anonymously: ${signInError?.message}`);
  }

  // Verify the session works
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error(`Failed to verify anonymous user session: ${userError?.message}`);
  }

  // Get RSN user ID
  const { data: rsnUserId, error: getUserError } = await supabase.rpc('current_rsn_user_id');
  
  if (!rsnUserId) {
    throw new Error(`Failed to get anonymous user ID: ${getUserError?.message}`);
  }

  // First verify the anonymous user session is valid
  const { data: { user: user2 }, error: user2Error } = await supabase.auth.getUser();
  if (user2Error || !user2) {
    throw new Error(`Anonymous user session invalid: ${user2Error?.message}`);
  }

  return {
    sb: supabase,
    rsnUserId: rsnUserId as string
  };
}