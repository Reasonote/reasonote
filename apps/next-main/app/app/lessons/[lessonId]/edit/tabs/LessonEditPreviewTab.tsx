import {useState} from "react";

import {Activity} from "@/components/activity/Activity";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {Txt} from "@/components/typography/Txt";
import {
  Article,
  Extension,
  NavigateBefore,
  NavigateNext,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
interface LessonEditPreviewTabProps {
    currentActivities: any[];
    slides: Array<{
        id: string;
        emoji: string;
        title: string;
        content: string;
    }>;
}

export function LessonEditPreviewTab({ currentActivities, slides }: LessonEditPreviewTabProps) {
    const theme = useTheme();
    const [currentIndex, setCurrentIndex] = useState(0);
    const totalItems = slides.length + currentActivities.length;

    const handleNext = () => {
        if (currentIndex < totalItems - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const renderCurrentItem = () => {
        if (currentIndex < slides.length) {
            // Render slide
            const slide = slides[currentIndex];

            if (!slide) {
                return null;
            }

            return (
                <Card elevation={4} sx={{ width: '100%', minHeight: '400px', bgcolor: theme.palette.background.default }}>
                    <CardHeader
                        title={
                            <Stack direction="row" alignItems="center" gap={1}>
                                <Txt startIcon={slide.emoji} variant="h5">
                                    {slide.title}
                                </Txt>
                            </Stack>
                        }
                    />
                    <CardContent>
                        <MuiMarkdownDefault>
                            {slide.content}
                        </MuiMarkdownDefault>
                    </CardContent>
                </Card>
            );
        } else {
            // Render activity
            const activity = currentActivities[currentIndex - slides.length];

            if (!activity) {
                return null;
            }

            return (
                <Card elevation={4} sx={{ width: '100%', minHeight: '400px', bgcolor: theme.palette.background.default }}>
                    <CardContent>
                        <Stack gap={1} width="100%">
                            <Txt>{activity.skillName}</Txt>
                            <Activity activityId={activity.metadata?.activityId} onActivityComplete={() => {}} />
                        </Stack>
                    </CardContent>
                </Card>
            );
        }
    };

    return (
        <Stack 
            width="100%" 
            alignItems="center" 
            spacing={2}
            sx={{ position: 'relative' }}
        >
            {/* Content type indicator */}
            <Stack direction="row" spacing={2} alignItems="center">
                <Txt color={theme.palette.text.secondary}>
                    {currentIndex < slides.length ? (
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Article fontSize="small" />
                            Slide {currentIndex + 1} of {slides.length}
                        </Stack>
                    ) : (
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Extension fontSize="small" />
                            Activity {currentIndex - slides.length + 1} of {currentActivities.length}
                        </Stack>
                    )}
                </Txt>
            </Stack>

            {/* Navigation indicators */}
            <Stack 
                direction="row" 
                spacing={1} 
                sx={{ mt: 2 }}
            >
                {/* Slide indicators - circles */}
                {slides.map((_, index) => (
                    <Box
                        key={`slide-${index}`}
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: index === currentIndex ? theme.palette.primary.main : theme.palette.gray.main,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                                transform: 'scale(1.2)',
                                bgcolor: index === currentIndex ? theme.palette.primary.main : theme.palette.gray.main
                            }
                        }}
                        onClick={() => setCurrentIndex(index)}
                    />
                ))}

                {/* Divider if both slides and activities exist */}
                {slides.length > 0 && currentActivities.length > 0 && (
                    <Box sx={{ width: 16, height: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{ width: '100%', height: 2, bgcolor: theme.palette.gray.main }} />
                    </Box>
                )}

                {/* Activity indicators - squares */}
                {currentActivities.map((_, index) => (
                    <Box
                        key={`activity-${index}`}
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: 0, // Changed to 0 to make it a perfect square
                            bgcolor: (index + slides.length) === currentIndex ? theme.palette.primary.main : theme.palette.gray.main,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                                transform: 'scale(1.2)',
                                bgcolor: (index + slides.length) === currentIndex ? theme.palette.primary.main : theme.palette.gray.main
                            }
                        }}
                        onClick={() => setCurrentIndex(index + slides.length)}
                    />
                ))}
            </Stack>

            {/* Content */}
            <Box sx={{ width: '100%', position: 'relative' }}>
                {renderCurrentItem()}
                
                {/* Navigation buttons */}
                <IconButton
                    sx={{
                        position: 'absolute',
                        left: -20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': {
                            bgcolor: theme.palette.gray.light
                        },
                        visibility: currentIndex > 0 ? 'visible' : 'hidden'
                    }}
                    onClick={handlePrev}
                >
                    <NavigateBefore />
                </IconButton>
                <IconButton
                    sx={{
                        position: 'absolute',
                        right: -20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': {
                            bgcolor: theme.palette.gray.light
                        },
                        visibility: currentIndex < totalItems - 1 ? 'visible' : 'hidden'
                    }}
                    onClick={handleNext}
                >
                    <NavigateNext />
                </IconButton>
            </Box>
        </Stack>
    );
}