"use client";

import {jwtBearerify} from "@lukebechtel/lab-ts-utils";
import {
  AIBrowser,
  AIBrowserContext,
} from "@reasonote/lib-ai-browser";

export const aib = new AIBrowser(
    new AIBrowserContext({
        hostUrl: '/api/ai/serve',
        hostUrlTextStream: '/api/ai/serve-text-stream',
        fetch: (url: any, init: Parameters<typeof fetch>[1]) => {
            // Get the Supabase token from cookies without using nookies
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {} as { [key: string]: string });
 
            const supabaseToken = cookies['sb-access-token'] || cookies['supabase-auth-token'] || cookies['supabase-auth-token'] || '';

            const match = supabaseToken.match(/eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/);
            var cleanedSupabaseToken: string | undefined = undefined;
            if (match) {
                cleanedSupabaseToken = match[0]; // JWT extracted
            }

            return fetch(url, {
                ...init,
                headers: {
                    ...init?.headers,
                    //@ts-ignore
                    Authorization: cleanedSupabaseToken ? jwtBearerify(cleanedSupabaseToken) : undefined
                }
            });
        }
    })
);
