import { Database } from "@reasonote/lib-sdk";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";

export const createClient = () => createBrowserSupabaseClient<Database>();
