import { Celebration } from '@mui/icons-material';
import { Stack, Typography, Box } from '@mui/material';
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

interface CongratulationsHeaderProps {
    lessonName: string;
}

export function CongratulationsHeader({ lessonName }: CongratulationsHeaderProps) {
    const isSmallDevice = useIsSmallDevice();
    return (
        <Stack 
            alignItems="center" 
            position="relative" 
            py={2} 
            spacing={1}
        >
            <Stack 
                direction="row" 
                spacing={2} 
                alignItems="center"
                justifyContent="center"
            >
                <Celebration sx={{ fontSize: isSmallDevice ? 30 : 40, color: 'primary.main' }} />

                <Typography 
                    variant={isSmallDevice ? 'h4' : 'h3'} 
                    color="primary"
                    textAlign="center"
                >
                    Congratulations!
                </Typography>
            </Stack>
            
            <Box maxWidth="600px">
                <Typography 
                    variant={isSmallDevice ? 'h5' : 'h4'} 
                    textAlign="center"
                >
                    You have completed the lesson on {lessonName}
                </Typography>
            </Box>
        </Stack>
    );
} 