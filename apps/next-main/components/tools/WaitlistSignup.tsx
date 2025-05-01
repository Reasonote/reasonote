"use client";
import React, {useState} from "react";

import {useRouter} from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {Email} from "@mui/icons-material";
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  TextField,
} from "@mui/material";

export function WaitlistSignup({ featureName, redirectUrl }: { featureName: string, redirectUrl: string }) {
    const { supabase } = useSupabase();
    const { hasLoggedIn, sbUser } = useRsnUser();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const isSmallDevice = useIsSmallDevice();

    const redirectTo = `${window.location.origin}/${redirectUrl}`;


    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (hasLoggedIn && sbUser) {
                // For logged-in users, update their metadata directly
                const { data: { user } } = await supabase.auth.getUser();
                const currentMetadata = user?.user_metadata || {};

                const { error } = await supabase.auth.updateUser({
                    data: {
                        ...currentMetadata,
                        [featureName + '_waitlist']: true,
                        [featureName + '_waitlist_date']: new Date().toISOString()
                    }
                });
                router.push(redirectTo);

                if (error) throw error;
            } else {
                // For non-logged-in users, send OTP with metadata that will be merged
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        emailRedirectTo: redirectTo,
                        data: {
                            [featureName + '_waitlist']: true,
                            [featureName + '_waitlist_date']: new Date().toISOString()
                        },
                    },
                });

                if (error) throw error;
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'An error occurred during signup');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Stack spacing={2} alignItems="center" maxWidth={400} width="100%">
                <Alert severity="success" sx={{ width: '100%' }}>
                    <Txt>
                        {hasLoggedIn
                            ? "You're on the waitlist! We'll notify you when the feature is ready."
                            : "Thanks for your interest! Please check your email to confirm your spot on the waitlist."
                        }
                    </Txt>
                </Alert>
                {!hasLoggedIn && (
                    <Txt variant="body2" color="text.secondary" align="center">
                        Can't find the email? Check your spam folder or try signing up again.
                    </Txt>
                )}
            </Stack>
        );
    }

    if (hasLoggedIn) {
        return (
            <Button
                variant="contained"
                size="large"
                onClick={handleSignup}
                disabled={loading}
                sx={{ px: 4, py: 2 }}
            >
                {loading ? (
                    <CircularProgress size={24} color="inherit" />
                ) : (
                    'Join the Waitlist'
                )}
            </Button>
        );
    }

    return (
        <Stack
            component="form"
            onSubmit={handleSignup}
            spacing={2}
            alignItems="center"
            width={isSmallDevice ? '100%' : '25rem'}
        >
            <TextField
                fullWidth
                type="email"
                label="Email Address"
                placeholder="johndoe@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                InputProps={{
                    startAdornment: <Email color="action" sx={{ mr: 1 }} />,
                }}
            />

            {error && (
                <Alert severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            )}

            <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ width: '100%', py: 1.5 }}
            >
                {loading ? (
                    <CircularProgress size={24} color="inherit" />
                ) : (
                    'Join the Waitlist'
                )}
            </Button>
        </Stack>
    );
} 