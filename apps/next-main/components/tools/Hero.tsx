"use client";
import React from "react";

import {motion} from "framer-motion";
import Image from "next/image";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {Txt} from "@/components/typography/Txt";
import {
  Box,
  Stack,
  Typography,
} from "@mui/material";

import {WaitlistSignup} from "../tools/WaitlistSignup";

export interface HeroProps {
    title: string;
    subtitle: string;
    featureName: string;
    redirectUrl: string;
    leftImageUrl?: string;
    rightImageUrl?: string;
    flipLeftImage?: boolean;
    flipRightImage?: boolean;
}

export function Hero({
    title,
    subtitle,
    featureName,
    redirectUrl,
    leftImageUrl,
    rightImageUrl,
    flipLeftImage,
    flipRightImage
}: HeroProps) {
    const isSmallDevice = useIsSmallDevice();

    return (
        <Stack spacing={4} alignItems="center" textAlign="center">
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    overflow: 'visible',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                }}
            >
                {/* Mobile left illustration */}
                {leftImageUrl && isSmallDevice && (
                    <Box
                        sx={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            transform: flipLeftImage ? 'scaleX(-1)' : 'scaleX(1)',
                            opacity: 0.3,
                            mb: 2,
                        }}
                    >
                        <Image
                            src={leftImageUrl}
                            alt="Left illustration"
                            width={200}
                            height={150}
                        />
                    </Box>
                )}

                {/* Desktop left floating illustration */}
                {leftImageUrl && !isSmallDevice && (
                    <Box
                        sx={{
                            position: 'absolute',
                            left: '0',
                            top: '80%',
                            transform: flipLeftImage ? 'translateY(-50%) scaleX(-1)' : 'translateY(-50%) scaleX(1)',
                            opacity: 0.3,
                            pointerEvents: 'none',
                            display: { xs: 'none', sm: 'block' }
                        }}
                    >
                        <Image
                            src={leftImageUrl}
                            alt="Left illustration"
                            width={400}
                            height={300}
                        />
                    </Box>
                )}
                
                {/* Right floating illustration */}
                {rightImageUrl && !isSmallDevice && (
                    <Box
                        sx={{
                            position: 'absolute',
                            right: '0',
                            top: '80%',
                            transform: flipRightImage ? 'translateY(-50%) scaleX(-1)' : 'translateY(-50%) scaleX(1)',
                            opacity: 0.3,
                            pointerEvents: 'none',
                            display: { xs: 'none', md: 'block' },
                        }}
                    >
                        <Image
                            src={rightImageUrl}
                            alt="Right illustration"
                            width={400}
                            height={300}
                        />
                    </Box>
                )}

                {/* Title and subtitle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Stack spacing={1}>
                        <Txt
                            variant={isSmallDevice ? "h4" : "h3"}
                            fontWeight="bold"
                        >
                            {title}
                        </Txt>
                    </Stack>
                    <Typography
                        variant="h6"
                        sx={{
                            maxWidth: '48rem',
                            mx: 'auto',
                            mt: 3,
                            lineHeight: 1.6
                        }}
                    >
                        {subtitle}
                    </Typography>
                </motion.div>

                {/* Waitlist signup */}
                <Box sx={{ mt: 2 }}>
                    <WaitlistSignup featureName={featureName} redirectUrl={redirectUrl} />
                </Box>
            </Box>
        </Stack>
    );
} 