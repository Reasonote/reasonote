import { supabase } from '@/contexts/supabase';

/**
 * Initiates the Google Sign-In process for Chrome extensions
 *
 * This function launches the Google OAuth flow, retrieves the ID token,
 * and uses it to sign in to Supabase. If successful, it updates the authState.
 *
 * @async
 * @function
 * @throws {Error} If there's an error during the authentication process
 */
export const signInWithGoogle = async () => {
    const manifest = chrome.runtime.getManifest();

    const url = new URL("https://accounts.google.com/o/oauth2/auth");

    url.searchParams.set("client_id", manifest.oauth2!.client_id!);
    url.searchParams.set("response_type", "id_token");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("redirect_uri", `https://${chrome.runtime.id}.chromiumapp.org`);
    url.searchParams.set("scope", manifest.oauth2!.scopes!.join(" "));

    chrome.identity.launchWebAuthFlow(
        {
            url: url.href,
            interactive: true,
        },
        async (redirectedTo: any) => {
            if (chrome.runtime.lastError) {
                console.error("Authentication error:", chrome.runtime.lastError);
                // Handle authentication error
            } else {

                if (!supabase) throw new Error('Supabase client not initialized');
                // Extract the ID token from the redirectedTo URL
                const url = new URL(redirectedTo!);
                const params = new URLSearchParams(url.hash);

                const token = params.get("#id_token");

                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: "google",
                    token: token ?? "",
                });

                if (error) {
                    console.error("Supabase sign-in error:", error);
                    // Handle Supabase sign-in error
                } else {
                    // Update authState with the signed-in user
                    // authState.user.set({
                    //     id: data.user.id,
                    //     email: data.user.email ?? "",
                    // });

                    // navigateTo("/auth/success");
                    console.log("Signed in with Google:", data);
                }
            }
        }
    );
};