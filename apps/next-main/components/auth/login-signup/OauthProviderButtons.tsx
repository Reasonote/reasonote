import posthog from "posthog-js";

import {useOauthAvailable} from "@/clientOnly/hooks/useOauthAvailable";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Google} from "@mui/icons-material";
import {
  Button,
  Stack,
  Typography,
} from "@mui/material";

interface OauthProviderButtonsProps {
    redirectTo?: string;
}

export function OauthProviderButtons({redirectTo}: {redirectTo?: string}) {
    const {supabase} = useSupabase()
    const {oauthIsAvailable} = useOauthAvailable();

    return oauthIsAvailable ?
        <Stack>
            <Button 
                startIcon={<Google />}
                variant="contained" onClick={async () => {
                    posthog.capture("signin", {
                        method: "google"
                    }, {
                        send_instantly: true,
                    })

                    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: {
                        redirectTo,
                    }})
                }}
            >
                Sign in with Google
            </Button>
        </Stack>
        :
        <>
            <Typography variant="caption">Oauth options unavailable.</Typography>
        </>
}