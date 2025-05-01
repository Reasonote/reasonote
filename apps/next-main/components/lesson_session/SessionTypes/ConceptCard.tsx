"use client"
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {z} from "zod";

import {aib} from "@/clientOnly/ai/aib";
import {useFeatureFlag} from "@/clientOnly/hooks/useFeatureFlag";
import {ChatDrawerState} from "@/clientOnly/state/chatDrawer";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {useApolloClient} from "@apollo/client";
import {
  AutoAwesome,
  Info,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  Popover,
  Slider,
  Stack,
} from "@mui/material";

import {Txt} from "../../typography/Txt";
import {complexityLevels} from "./types";

export const ConceptCard = ({ item, lessonSessionId, lessonId, onNextClick, onPreviousClick, isFirstItem, isLastItem, firstPracticeIndex, currentItemIndex }) => {
    const [complexity, setComplexity] = useState(0);
    const [complexitySpecificContent, setComplexitySpecificContent] = useState<{ [key: string]: { content: string, completed: boolean } }>({
        'Beginner': { content: item.content, completed: true },
    });

    const sliderEnabled = useFeatureFlag('slide_complexity_slider');

    const [isLoading, setIsLoading] = useState(false);
    const [isSliding, setIsSliding] = useState(false);
    const ac = useApolloClient();
    const slidingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [showComplexityInfo, setShowComplexityInfo] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const handleInfoClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
        setShowComplexityInfo(true);
    };

    const handleInfoClose = () => {
        setAnchorEl(null);
        setShowComplexityInfo(false);
    };

    const handleComplexityChange = async (event: any, newValue: number | number[]) => {
        const value = Array.isArray(newValue) ? newValue[0] : newValue;
        const complexityLevel = complexityLevels[value];

        setComplexity(value);

        if (!complexityLevel) {
            console.error('no complexity level found');
            return;
        }

        if (complexitySpecificContent[complexityLevel]?.completed) {
            return;
        }

        setIsLoading(true);

        try {
            await aib.streamGenObject({
                schema: z.object({
                    levelAppropriateContent: z.string()
                }),
                prompt: `
                You are an expert at translating educational content into one of the following complexity levels: ${complexityLevels.join(', ')}.

                You are given a lesson slide at the "${complexityLevels[0]}" complexity level.
                
                You are asked to generate content for a lesson slide at the "${complexityLevels[value]}" complexity level.

                Here are the existing complexity level contents:

                <EXISTING_CONTENT_TRANSLATIONS>
                ${Object.entries(complexitySpecificContent).map(([level, { content }]) => `
                <${level}>
                    ${content}
                </${level}>
                `).join('\n')}
                </EXISTING_CONTENT_TRANSLATIONS>

                The title of the slide is: "${item.title}"

                The content of the slide is: "${item.content}"
                `,
                onPartialObject: (partial) => {
                    if (!partial.levelAppropriateContent) {
                        return;
                    }

                    const newContent = partial.levelAppropriateContent ?? '';

                    setComplexitySpecificContent(prev => ({
                        ...prev,
                        [complexityLevel]: { content: newContent, completed: false }
                    }));
                }
            });

            setComplexitySpecificContent(prev => ({
                ...prev,
                [complexityLevel]: { ...prev[complexityLevel], completed: true }
            }));
        } catch (error) {
            console.error('Error generating content:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const content = complexitySpecificContent[complexityLevels[complexity]]?.content ?? '';

    useEffect(() => {
        // Cleanup function to clear the timeout if the component unmounts
        return () => {
            if (slidingTimeoutRef.current) {
                clearTimeout(slidingTimeoutRef.current);
            }
        };
    }, []);

    const marks = complexityLevels.map((level, index) => ({
        value: index,
        label: isSliding || complexity === index ? level : '',
    }));

    const getComplexityColor = (value) => {
        const hue = 120 - (value * 30); // This will give a range from green (120) to red (0)
        return `hsl(${hue}, 100%, 35%)`; // Adjust lightness as needed
    };

    return (
        <Card 
            elevation={5} 
            sx={{ minHeight: 0, display: 'flex', flexDirection: 'column', maxHeight: '100%', width: '100%' }}
            data-testid="concept-card"
        >
            <Stack sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
                <CardHeader
                    title={
                        <Txt 
                            startIcon={item.emoji} 
                            variant="h5"
                            data-testid="concept-card-title"
                        >
                            {item.title}
                        </Txt>
                    }
                    sx={{ wordBreak: 'break-word' }}
                />
                <CardContent 
                    sx={{ flex: 1, overflowY: 'auto', minHeight: 0, maxHeight: '100%', paddingBottom: 0 }}
                    data-testid="concept-card-content"
                >
                    <Stack maxHeight={'100%'}>
                        {/* {isLoading ? (
                            <Skeleton variant="rectangular" height={200} />
                        ) : ( */}
                        <MuiMarkdownDefault
                            animateTyping
                            animateTypingSpeed={1000}
                        >
                            {content}
                        </MuiMarkdownDefault>
                        {/* )} */}
                    </Stack>
                </CardContent>
                <CardActions sx={{ flexDirection: 'column', alignItems: 'stretch', paddingBottom: 2 }}>
                    <Stack gap={1} width={'100%'}>
                        {sliderEnabled && (
                            <Stack spacing={2} direction="column" alignItems="stretch">
                                <Stack direction={'row'} justifyContent={'space-between'} alignItems={'start'}>
                                    <IconButton onClick={handleInfoClick} sx={{ padding: 1 }}>
                                        <Info />
                                    </IconButton>
                                    <div style={{ marginLeft: '20px', marginRight: '20px', width: '100%' }}
                                        onMouseEnter={() => setIsSliding(true)}
                                        onMouseLeave={() => setIsSliding(false)}
                                        onTouchStart={() => setIsSliding(true)}
                                        onTouchEnd={() => setIsSliding(false)}
                                    >
                                        <Slider
                                            aria-labelledby="complexity-slider"
                                            value={complexity}
                                            onChange={(ev: any, newValue: any) => {
                                                const value = Array.isArray(newValue) ? newValue[0] : newValue;
                                                const complexityLevel = complexityLevels[value];

                                                setComplexity(value);
                                            }}
                                            onChangeCommitted={handleComplexityChange}
                                            step={null}
                                            marks={marks}
                                            min={0}
                                            max={4}
                                            sx={{
                                                '& .MuiSlider-markLabel': {
                                                    fontSize: '0.75rem',
                                                },
                                                '& .MuiSlider-thumb': {
                                                    backgroundColor: getComplexityColor(complexity),
                                                },
                                                '& .MuiSlider-track': {
                                                    backgroundColor: getComplexityColor(complexity),
                                                },
                                                '& .MuiSlider-rail': {
                                                    opacity: 0.5,
                                                    backgroundColor: '#bfbfbf',
                                                },
                                            }}
                                        />
                                    </div>
                                </Stack>
                            </Stack>
                        )}
                        <Button
                            startIcon={<AutoAwesome />}
                            variant={'outlined'}
                            onClick={() => {
                                ChatDrawerState.openChatDrawerWithContext(ac, {
                                    contextType: 'ViewingLesson',
                                    contextId: lessonSessionId,
                                    contextData: {
                                        lessonSessionId,
                                        lessonId: lessonId ?? '',
                                        extraInfo: JSON.stringify({
                                            item,
                                            complexitySpecificContent,
                                        }, null, 2)
                                    }
                                })
                            }}
                        >
                            Help Me Understand
                        </Button>

                        <Stack direction={'row'} gap={1} justifyContent={'space-between'} width={'100%'}>
                            <Button variant="contained" disabled={isFirstItem} fullWidth={false} onClick={onPreviousClick}>Previous</Button>
                            <Button 
                                variant="contained" 
                                disabled={isLastItem} 
                                fullWidth={false} 
                                onClick={onNextClick}
                                data-testid="slide-next-button"
                            >
                                {(firstPracticeIndex !== -1 && currentItemIndex === firstPracticeIndex - 1) ? 'Start Practice' : 'Next'}
                            </Button>
                        </Stack>
                    </Stack>
                </CardActions>
            </Stack>
            <Popover
                open={showComplexityInfo}
                anchorEl={anchorEl}
                onClose={handleInfoClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <Box sx={{ p: 2, maxWidth: 300 }}>
                    <Txt startIcon={<Info />} variant="h6" gutterBottom>Complexity Slider</Txt>
                    <Txt variant="body2">
                        This slider allows you to adjust the complexity of the content.
                        Move it to the right for more advanced explanations, or to the left for simpler ones.
                        The content will dynamically update to match your preferred complexity level.
                    </Txt>
                </Box>
            </Popover>
        </Card>
    );
};