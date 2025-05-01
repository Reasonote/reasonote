"use client";
import { Backdrop, CircularProgress, Stack, Fade } from "@mui/material";
import { Txt } from "@/components/typography/Txt";

interface FullscreenLoadingProps {
    open: boolean;
    title?: string;
    description?: string;
}

export function FullscreenLoading({ 
    open, 
    title = "Loading your content",
    description = "This will only take a moment..."
}: FullscreenLoadingProps) {
    return (
        <Backdrop
            sx={{ 
                color: (theme) => theme.palette.text.primary,
                zIndex: (theme) => theme.zIndex.drawer + 1,
                bgcolor: (theme) => theme.palette.background.paper,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                opacity: 0.98
            }}
            open={open}
        >
            <CircularProgress 
                size={60} 
                thickness={4} 
                color="primary"
            />
            <Fade in={open} timeout={1000}>
                <Stack spacing={1} alignItems="center">
                    <Txt 
                        variant="h6" 
                        sx={{ textAlign: 'center' }}
                    >
                        {title}
                    </Txt>
                    <Txt 
                        variant="body1"
                        sx={{ 
                            textAlign: 'center',
                            opacity: 0.7
                        }}
                    >
                        {description}
                    </Txt>
                </Stack>
            </Fade>
        </Backdrop>
    );
} 