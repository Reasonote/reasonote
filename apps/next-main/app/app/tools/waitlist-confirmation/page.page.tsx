"use client";
import React, {useEffect} from "react";

import {motion} from "framer-motion";
import {useSearchParams} from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {BackToToolsButton} from "@/components/navigation/BackToToolsButton";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Celebration} from "@mui/icons-material";
import {
  Box,
  Stack,
  Typography,
} from "@mui/material";

const VALID_FEATURE_NAMES = ['DocuMentor'];

export default function WaitlistConfirmationPage() {
    const searchParams = useSearchParams();
    const featureName = searchParams?.get('featureName');
    const { hasLoggedIn } = useRsnUser();
    const { supabase } = useSupabase();
    const isSmallDevice = useIsSmallDevice();

    const hasFeatureName = VALID_FEATURE_NAMES.includes(featureName ?? '');

    useEffect(() => {
        const updateUserMetadata = async () => {
            if (!hasLoggedIn || !hasFeatureName) return;

            const { data: { user } } = await supabase.auth.getUser();

            const customField = featureName + '_waitlist';

            if (user) {
                const currentMeta = user.user_metadata || {};

                // Check if the desired field exists in user metadata
                console.log('currentMeta', currentMeta);
                console.log('updating metadata');
                console.log('customField', customField);
                if (!currentMeta[customField]) {
                    const { error } = await supabase.auth.updateUser({
                        data: {
                            ...currentMeta,
                            [customField]: true,
                            [featureName + '_waitlist_date']: new Date().toISOString()
                        }
                    });
                    if (error) {
                        console.error('Failed to update metadata:', error);
                    }
                }
            }
        };
        updateUserMetadata();
    }, [supabase, hasLoggedIn, hasFeatureName]);

    return (
        <Box
            sx={{
                position: 'relative',
                minHeight: '100vh',
                width: '100%'
            }}
        >
            <BackToToolsButton />
            <Stack
                spacing={isSmallDevice ? 2 : 4}
                alignItems="center"
                justifyContent="center"
                minHeight="80vh"
                textAlign="center"
                px={isSmallDevice ? 2 : 0}
            >
                {hasFeatureName ? (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", duration: 0.5 }}
                        >
                            <Celebration sx={{ fontSize: 80, color: 'primary.main' }} />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Typography variant={isSmallDevice ? "h4" : "h3"} gutterBottom fontWeight="bold">
                                You're on the List!
                            </Typography>
                            <Typography variant={isSmallDevice ? "h6" : "h5"} color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                                Thanks for joining the waitlist. We'll notify you as soon as {featureName ?? 'the feature'} is ready.
                            </Typography>
                        </motion.div>
                    </>
                ) : (
                    <Typography variant={"body1"}>
                        We do not have any features by that name.
                    </Typography>
                )}
            </Stack>
        </Box>
    );
}