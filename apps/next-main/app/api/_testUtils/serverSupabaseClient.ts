import {Database} from "@reasonote/lib-sdk";
import {
  createClient,
  SupportedStorage,
} from "@supabase/supabase-js";

export function sessionStorageProvider(): SupportedStorage {
    const s = new Map();
    return {
        getItem: (key: string) => {
            // console.log('Get item', s)
            return s.get(key);
        },
        setItem: (key: string, value: string) => {
            s.set(key, value);
            // console.log('Set item', s)
        },
        removeItem: (key: string) => {
            s.delete(key);
        },
    };
}

export function createServerClient() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: false,
                detectSessionInUrl: false,
                storage: sessionStorageProvider(),
            },
        });
}

export async function createTestClient(args: {
    user?: {
        email: string,
        password: string,
    }
} = {}) {
    const supabase = createServerClient();
    
    if (args.user) {
        await supabase.auth.signInWithPassword({
            email: args.user.email,
            password: args.user.password
        });

        return supabase;
    }
    else {
        return supabase;
    }
}