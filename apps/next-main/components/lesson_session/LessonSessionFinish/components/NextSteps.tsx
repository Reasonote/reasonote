import { Stack, Button, Typography, Card, useTheme } from '@mui/material';
import {Air, PlaylistAdd} from "@mui/icons-material";
import { Headphones, School } from 'lucide-react';
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

interface NextStepsProps {
    onStartPractice: () => void;
    onStartNextLesson?: () => void;  // TODO: Make this required
    onListenPodcast: () => void;
    onAddToPodcastQueue: () => void;
}

export function NextSteps({
    onStartPractice,
    onStartNextLesson,
    onListenPodcast,
    onAddToPodcastQueue,
}: NextStepsProps) {
    const isSmallDevice = useIsSmallDevice();
    const theme = useTheme();
    return (
        <Card 
            sx={{ 
                backgroundColor: theme.palette.background.default,
                p: 2,
                borderRadius: 2,
                width: '100%',
                my: 0.5
            }}
        >
            <Stack spacing={2}>
                <Typography 
                    variant="h5"
                    textAlign="center"
                >
                    Next Steps
                </Typography>
                
                <Stack spacing={1}>
                    <Stack direction="row" spacing={1}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Air />}
                            onClick={onStartPractice}
                            sx={{
                                height: '48px',
                                backgroundColor: theme.palette.background.paper,
                                '& .MuiButton-startIcon': {
                                    marginRight: isSmallDevice ? 0.5 : 1
                                },
                                '& .MuiTypography-root': {
                                    fontSize: isSmallDevice ? '0.75rem' : 'inherit',
                                }
                            }}
                        >
                            <Typography>Practice Now</Typography>
                        </Button>
                        {onStartNextLesson && (
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<School />}
                                onClick={onStartNextLesson}
                                sx={{
                                    height: '48px',
                                    backgroundColor: theme.palette.background.paper,
                                    '& .MuiButton-startIcon': {
                                        marginRight: isSmallDevice ? 0.5 : 1
                                    },
                                    '& .MuiTypography-root': {
                                        fontSize: isSmallDevice ? '0.75rem' : 'inherit',
                                    }
                                    }}
                                >
                                <Typography>Next Lesson</Typography>
                            </Button>
                        )}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Headphones />}
                            onClick={onListenPodcast}
                            sx={{
                                height: '48px',
                                backgroundColor: theme.palette.background.paper,
                                '& .MuiButton-startIcon': {
                                    marginRight: isSmallDevice ? 0.5 : 1
                                },
                                '& .MuiTypography-root': {
                                    fontSize: isSmallDevice ? '0.75rem' : 'inherit',
                                }
                            }}
                        >
                            <Typography>Listen as Podcast</Typography>
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<PlaylistAdd />}
                            onClick={onAddToPodcastQueue}
                            sx={{
                                height: '48px',
                                backgroundColor: theme.palette.background.paper,
                                '& .MuiButton-startIcon': {
                                    marginRight: isSmallDevice ? 0.5 : 1
                                },
                                '& .MuiTypography-root': {
                                    fontSize: isSmallDevice ? '0.75rem' : 'inherit',
                                }
                            }}
                        >
                            <Typography>Add to Podcast Queue</Typography>
                        </Button>
                    </Stack>
                </Stack>
            </Stack>
        </Card>
    );
} 