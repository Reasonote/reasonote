import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {z} from "zod";

import {aib} from "@/clientOnly/ai/aib";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {
  AddToUserActivityLibraryButton,
} from "@/components/activity/components/AddToUserActivityLibraryButton";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  ChevronLeft,
  ChevronRight,
  ContentCopy,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  FlashcardActivityConfig,
  FlashcardActivityConfigSchema,
} from "@reasonote/activity-definitions";
import {UserActivityResult} from "@reasonote/lib-sdk-apollo-client";

interface TakeawayFlashcardsProps {
    lessonId: string;
    activityResults: UserActivityResult[];
    lessonContent: string;
}

// Define the type for our flashcards that includes the required fields
type FlashcardWithId = FlashcardActivityConfig & {
    id: string;
    type: 'flashcard';
    version: '0.0.0';
};

export function TakeawayFlashcards({ 
    lessonId,
    activityResults,
    lessonContent
}: TakeawayFlashcardsProps) {
    const theme = useTheme();
    const { sb } = useSupabase();
    const rsnUserId = useRsnUserId();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [copySuccess, setCopySuccess] = useState(false);
    const [flashcards, setFlashcards] = useState<FlashcardWithId[]>([]);
    const [loading, setLoading] = useState(true);
    const hasGeneratedRef = useRef(false);
    const [rootSkillId, setRootSkillId] = useState<string | null>(null);

    useEffect(() => {
        const fetchLesson = async () => {
            const {data: lesson} = await sb.from('lesson').select('root_skill').eq('id', lessonId).single();
            setRootSkillId(lesson?.root_skill ?? null);
        };
        fetchLesson();
    }, [lessonId]);
    
    // Run once on mount
    useEffect(() => {
        if (hasGeneratedRef.current) return;
        hasGeneratedRef.current = true;

        aib.genObject({
            model: 'openai:gpt-4o-mini-2024-07-18',
            functionName: "generate_takeway_flashcards",
            functionDescription: "Generate personalized takeaway flashcards based on lesson content and student performance",
            schema: z.object({
                flashcards: z.array(FlashcardActivityConfigSchema)
            }),
            system: "You are an expert tutor who creates personalized flashcards based on lesson content and student performance.",
            prompt: `
                Please create 3 flashcards based on this lesson context:
                
                # Lesson Content
                ${lessonContent}

                # User Activity Results
                ${JSON.stringify(activityResults, null, 2)}

                Create flashcards that:
                1. Focus on areas where the user showed weakness
                2. Reinforce key concepts from the lesson
                3. Challenge the user's understanding
                4. Use clear, concise language

                Generate exactly 3 flashcards.
            `,
        }).then(async (result) => {
            if (result?.object?.flashcards) {
                const processedFlashcards = await Promise.all(
                    result.object.flashcards.map(async (card) => {
                        const newActivity = await sb.from('activity').insert({
                            _name: `New Takeaway Flashcard`,
                            _type: 'flashcard',
                            type_config: card,
                            source: 'ai-generated',
                            generated_for_user: rsnUserId,
                            generated_for_skill_paths: rootSkillId ? [[rootSkillId]] : null,
                        }).select('*').single();

                        if (!newActivity.data?.id) {
                            throw new Error('Failed to create activity');
                        }

                        return {
                            ...card,
                            type: 'flashcard' as const,
                            version: '0.0.0' as const,
                            id: newActivity.data.id
                        } satisfies FlashcardWithId;
                    })
                );

                setFlashcards(processedFlashcards);
            }
        }).catch((error) => {
            console.error('Error generating flashcards:', error);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    const [[page, direction], setPage] = useState([0, 0]);

    const handleNext = () => {
        setPage([page + 1, 1]);
        setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    };

    const handlePrev = () => {
        setPage([page - 1, -1]);
        setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    };

    const handleCopyMarkdown = async () => {
        try {
            const markdown = flashcards.map(card => 
                `### ${card.flashcardFront}\n${card.flashcardBack}`
            ).join('\n\n');
            
            await navigator.clipboard.writeText(markdown);
            setCopySuccess(true);
            
            // Reset success state after 2 seconds
            setTimeout(() => {
                setCopySuccess(false);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

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
            <Stack spacing={2} width="100%" py={1}>
                <Typography 
                    variant="h5" 
                    color={theme.palette.text.primary}
                    textAlign="center"
                >
                    Key Takeaways
                </Typography>
                
                {/* Fixed height container */}
                <Box 
                    sx={{ 
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {loading ? (
                        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                            <Skeleton 
                                variant="rectangular" 
                                width="100%" 
                                height="100%" 
                                animation="wave" 
                                sx={{ backgroundColor: theme.palette.background.paper }}
                            />
                            <Card sx={{ 
                                position: 'absolute', 
                                top: '50%', 
                                left: '50%', 
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: theme.palette.background.paper,
                                p: 2,
                                borderRadius: 1,
                                boxShadow: 3,
                                zIndex: 1
                            }}>
                                <Typography variant="body2" textAlign="center">
                                    Generating personalized flashcards...
                                </Typography>
                            </Card>
                        </Box>
                    ) : (
                        <>
                            <IconButton 
                                onClick={handlePrev}
                                disabled={flashcards.length <= 1}
                                sx={{ 
                                    position: 'absolute',
                                    left: 8,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 2,
                                    color: theme.palette.text.secondary
                                }}
                                size="small"
                            >
                                <ChevronLeft />
                            </IconButton>
                            
                            <IconButton 
                                onClick={handleNext}
                                disabled={flashcards.length <= 1}
                                sx={{ 
                                    position: 'absolute',
                                    right: 8,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 2,
                                    color: theme.palette.text.secondary
                                }}
                                size="small"
                            >
                                <ChevronRight />
                            </IconButton>

                            <AnimatePresence initial={false} custom={direction}>
                                <motion.div
                                    key={page}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "spring", stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.2 }
                                    }}
                                    style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                    }}
                                >
                                    <Card 
                                        sx={{ 
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'relative',
                                            backgroundColor: theme.palette.background.paper
                                        }}
                                    >
                                        {/* Action buttons */}
                                        <Stack 
                                            direction="row" 
                                            spacing={0.5} 
                                            sx={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8
                                            }}
                                        >
                                            {flashcards[currentIndex] && (
                                                <AddToUserActivityLibraryButton 
                                                    activityId={flashcards[currentIndex].id}
                                                />
                                            )}
                                        </Stack>

                                        {/* Card content */}
                                        <Stack 
                                            spacing={1.5} 
                                            alignItems="center" 
                                            justifyContent="flex-start"
                                            height="100%"
                                            px={4}
                                            py={3}
                                            sx={{
                                                overflowY: 'auto',
                                                mb: 2
                                            }}
                                        >
                                            <motion.div
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                style={{
                                                    width: '100%',
                                                    maxWidth: '100%',
                                                }}
                                            >
                                                <Typography 
                                                    variant="h6" 
                                                    textAlign="center"
                                                    fontWeight="bold"
                                                    sx={{
                                                        wordBreak: 'break-word',
                                                        overflowWrap: 'break-word',
                                                        mb: 2,
                                                        pt: 1
                                                    }}
                                                >
                                                    {flashcards[currentIndex]?.flashcardFront || ''}
                                                </Typography>
                                            </motion.div>
                                            <motion.div
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                                style={{
                                                    width: '100%',
                                                    maxWidth: '100%',
                                                    padding: '0 16px'
                                                }}
                                            >
                                                <Typography 
                                                    textAlign="center"
                                                    variant="body1"
                                                    sx={{
                                                        wordBreak: 'break-word',
                                                        overflowWrap: 'break-word'
                                                    }}
                                                >
                                                    {flashcards[currentIndex]?.flashcardBack || ''}
                                                </Typography>
                                            </motion.div>
                                        </Stack>
                                    </Card>
                                </motion.div>
                            </AnimatePresence>

                            {/* Pagination dots */}
                            <Stack 
                                direction="row" 
                                spacing={1} 
                                sx={{
                                    position: 'absolute',
                                    bottom: 8,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    zIndex: 2
                                }}
                            >
                                {flashcards.map((_, index) => (
                                    <motion.div
                                        key={index}
                                        initial={false}
                                        animate={{
                                            scale: index === currentIndex ? 1.2 : 1,
                                            backgroundColor: index === currentIndex ? '#90caf9' : '#666'
                                        }}
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            display: 'block'
                                        }}
                                    />
                                ))}
                            </Stack>
                        </>
                    )}
                </Box>
                
                {/* Copy button */}
                <Stack 
                    direction="row" 
                    spacing={1} 
                    justifyContent="center"
                >
                    <Button
                        variant="outlined"
                        startIcon={<ContentCopy />}
                        size="small"
                        onClick={handleCopyMarkdown}
                        sx={{ 
                            color: copySuccess ? theme.palette.success.main : theme.palette.primary.main, 
                            borderColor: copySuccess ? theme.palette.success.main : theme.palette.primary.main,
                            height: 36,
                            fontSize: '0.8125rem',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        {copySuccess ? 'Copied!' : 'Copy as Markdown'}
                    </Button>
                </Stack>
            </Stack>
        </Card>
    );
} 