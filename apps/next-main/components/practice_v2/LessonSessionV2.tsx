'use client';

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {motion} from "framer-motion";
import {useRouter} from "next/navigation";
import {posthog} from "posthog-js";

import {
  GenerateLessonRoute,
} from "@/app/api/lesson/generate_lesson/routeSchema";
import {
  GenerateLessonOutlineRoute,
} from "@/app/api/lesson/generate_lesson_outline/routeSchema";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {Activity} from "@/components/activity/Activity";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {ArrowBack} from "@mui/icons-material";
import {
  Box,
  Button,
  Skeleton,
  Stack,
} from "@mui/material";

import {
  ActivityLoadingComponent,
} from "../activity/components/ActivityLoadingComponent";
import {SkillChip} from "../chips/SkillChip/SkillChip";

export function LoadingLessonSkeleton() {
    return (
        <Stack maxWidth="64rem" width="100%" mx="auto">
            {/* Header with Progress and Back Button */}
            <Box
                sx={{
                    position: 'sticky',
                    top: -8,
                    bgcolor: 'background.paper',
                    py: 2,
                    zIndex: 10,
                }}
            >
                {/* Progress Indicator */}
                <Stack
                    direction="row"
                    spacing={0}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                        position: 'relative',
                        px: 2,
                        mb: 2,
                    }}
                >
                    {[...Array(5)].map((_, index) => (
                        <Skeleton
                            key={index}
                            variant="circular"
                            width={16}
                            height={16}
                        />
                    ))}
                </Stack>

                <Skeleton width={120} height={36} sx={{ borderRadius: 1 }} />
            </Box>
            <Stack spacing={2} maxWidth="48rem" width="100%" mx="auto">

                {/* Content Skeleton */}
                <Stack spacing={4} px={4}>
                    <Stack spacing={2}>
                        <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
                        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
                    </Stack>

                    {/* Action Button Skeleton */}
                    <Box
                        sx={{
                            mt: 4,
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                    >
                        <Skeleton width={200} height={36} sx={{ borderRadius: 1 }} />
                    </Box>
                </Stack>
            </Stack>
        </Stack>
    );
}


function ProgressIndicator(props: {
    currentIndex: number;
    completedIndex: number;
    activities: { id: string; type: string }[];
    onBack: () => void;
    totalExpected: number | null;
}) {
    const totalActivities = props.totalExpected ?? props.activities.length;
    const progressWidth = props.activities.length <= 1
        ? 0
        : `calc((100% - 32px) * ${Math.min(Math.max(props.currentIndex, props.completedIndex) / (totalActivities - 1), 1)})`;

    return (
        <Box
            sx={{
                position: 'sticky',
                top: -8,
                bgcolor: 'background.paper',
                py: 2,
                zIndex: 1000,
            }}
            data-header
        >
            <Button
                startIcon={<ArrowBack />}
                onClick={props.onBack}
                sx={{ alignSelf: 'flex-start', mb: 2 }}
            >
                Back to Topics
            </Button>

            {/* Progress Indicator */}
            <Stack
                direction="row"
                spacing={0}
                alignItems="center"
                justifyContent="space-between"
                sx={{
                    position: 'relative',
                    px: 2,
                    width: '100%',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: '16px',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: '2px',
                        bgcolor: 'divider',
                        zIndex: 0
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: progressWidth,
                        height: '2px',
                        bgcolor: 'primary.main',
                        zIndex: 0,
                        transition: 'width 0.3s ease'
                    }
                }}
            >
                {/* Show dots for current activities plus loading dots for expected activities */}
                {[...Array(totalActivities)].map((_, index) => (
                    <ActivityIcon
                        key={index}
                        isCompleted={index <= props.completedIndex}
                        isCurrent={index === props.currentIndex}
                        isLoading={index >= props.activities.length}
                    />
                ))}
            </Stack>
        </Box>
    );
}

function ActivityIcon({
    isCompleted,
    isCurrent,
    isLoading
}: {
    isCompleted: boolean;
    isCurrent: boolean;
    isLoading: boolean;
}) {
    return (
        <Box
            sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: isLoading
                    ? 'background.paper'
                    : isCompleted
                        ? 'primary.main'
                        : isCurrent
                            ? 'primary.main'
                            : 'background.paper',
                border: '2px solid',
                borderColor: isLoading
                    ? 'divider'
                    : isCompleted || isCurrent
                        ? 'primary.main'
                        : 'divider',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                position: 'relative',
                opacity: isLoading ? 0.5 : 1,
                '&::after': isCurrent && !isCompleted ? {
                    content: '""',
                    position: 'absolute',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'background.paper'
                } : undefined
            }}
        />
    );
}

export default function LessonSessionV2({ rootSkillId, lessonSkillId, numActivitiesPerPart = 5 }: { rootSkillId: string, lessonSkillId: string, numActivitiesPerPart?: number }) {
    const router = useRouter();
    const userId = useRsnUserId();
    const { supabase } = useSupabase();
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [completedIndex, setCompletedIndex] = useState(-1);
    const [startTime] = useState(() => new Date());
    const [isCompleted, setIsCompleted] = useState(false);
    const [timeSpent, setTimeSpent] = useState<string>('');
    const [totalExpectedActivities, setTotalExpectedActivities] = useState<number | null>(null);
    const [activities, setActivities] = useState<{ id: string; type: string; }[]>([]);
    const [lessonLoading, setLessonLoading] = useState(false);
    const [generationFailed, setGenerationFailed] = useState(false);
    const [lessonId, setLessonId] = useState<string | null>(null);
    useEffect(() => {
        const fetchLesson = async () => {
            try {
                setLessonLoading(true);
                setError(null);
                setGenerationFailed(false);

                // Check if a lesson already exists
                const { data: lessonData, error: lessonError } = await supabase
                    .from('lesson')
                    .select('*')
                    .eq('root_skill', lessonSkillId)
                    .order('created_date', { ascending: false });

                if (lessonError) {
                    console.error('Error fetching lesson:', lessonError);
                    throw lessonError;
                }

                if (lessonData && lessonData.length > 0) {
                    if (lessonData.length > 1) {
                        console.warn('Multiple lessons found for skill:', lessonSkillId, '. Using the latest one.');
                    }

                    setLessonId(lessonData[0].id);

                    // Check if the lesson is complete
                    // TODO: This can be even more efficient if we do not regenerate the entire lesson, but only the missing activities
                    let expectedActivities = 0;
                    if (lessonData[0]?.metadata) {
                        try {
                            const metadata = typeof lessonData[0].metadata === 'string'
                                ? JSON.parse(lessonData[0].metadata)
                                : lessonData[0].metadata;

                            const partsCount = metadata?.numParts;
                            const activitiesPerPart = metadata?.numActivitiesPerPart;

                            if (typeof partsCount === 'number' && typeof activitiesPerPart === 'number') {
                                expectedActivities = partsCount * (activitiesPerPart); // +1 for slide per part
                            }
                        } catch (parseError) {
                            console.error('Error parsing lesson metadata:', parseError);
                        }
                    }

                    // Fetch the lesson activities
                    const { data: activitiesData, error: activitiesError } = await supabase
                        .from('lesson_activity')
                        .select('activity(*)')
                        .eq('lesson', lessonData[0].id)
                        .order('position', { ascending: true });

                    if (activitiesError) {
                        console.error('Error fetching lesson activities:', activitiesError);
                        throw activitiesError;
                    }

                    // If we don't have the expected number of activities, create a new lesson
                    if (expectedActivities > 0 && (!activitiesData || activitiesData.length < expectedActivities)) {
                        console.log('Existing lesson is incomplete. Creating new lesson...');
                    } else {
                        const validActivities = activitiesData.map(activity => {
                            if (!activity?.activity || !activity.activity._type) {
                                throw new Error('Activity not found or invalid type');
                            }

                            return {
                                id: activity.activity.id,
                                type: activity.activity._type
                            };
                        });

                        setActivities(validActivities);
                        setTotalExpectedActivities(validActivities.length);
                        setLessonLoading(false);
                        return;
                    }
                }

                // Create the lesson outline (either no existing lesson or incomplete activities)
                const { data, error } = await GenerateLessonOutlineRoute.call({
                    lessonSkillId: lessonSkillId,
                    numActivitiesPerPart: numActivitiesPerPart,
                });

                if (error || !data) {
                    console.error('Error creating lesson:', error);
                    throw error || new Error('Failed to create lesson outline');
                }

                setTotalExpectedActivities(data.lessonParts.length * numActivitiesPerPart);
                setLessonLoading(false);
                setLessonId(data.lessonId);
                // Start generating the lesson activities with streaming
                try {
                    for await (const { activities: newActivities } of GenerateLessonRoute.callArrayStream({
                        lessonId: data?.lessonId,
                        lessonParts: data?.lessonParts,
                        lessonSkillId: lessonSkillId,
                        numActivitiesPerPart: numActivitiesPerPart,
                    })) {
                        if (newActivities && newActivities.length > 0) {
                            setActivities(current => {
                                // Only add activities we don't already have
                                const existingIds = new Set(current.map(a => a.id));
                                const newValidActivities = newActivities
                                    .filter(a => !existingIds.has(a.id))
                                    .map(a => ({
                                        id: a.id,
                                        type: a.type
                                    }));
                                return [...current, ...newValidActivities];
                            });
                        }
                    }
                } catch (streamError) {
                    console.error('Error in activity generation stream:', streamError);
                    setGenerationFailed(true);
                }
            } catch (err) {
                console.error('Error in lesson fetch/generation:', err);
                if (activities.length === 0) {
                    setError(err instanceof Error ? err.message : 'An unexpected error occurred');
                } else {
                    setGenerationFailed(true);
                }
                setLessonLoading(false);
            }
        };

        fetchLesson();
    }, [lessonSkillId, supabase, numActivitiesPerPart]);

    const handleBack = useCallback(() => {
        router.push(`/app/skills/${rootSkillId}?tab=lessons`);
    }, [router, rootSkillId]);

    // Scroll to current activity when it changes
    useEffect(() => {
        setTimeout(() => {
            const currentActivity = document.querySelector(`[data-activity-index="${currentIndex}"]`);
            if (currentActivity) {
                currentActivity.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }, [currentIndex]);

    // Scroll to completion content when lesson is completed
    useEffect(() => {
        const insertUserLessonResult = async () => {
            await supabase
                .from('user_lesson_result')
                .insert({
                    _user: userId,
                    lesson: lessonId,
                    metadata: {
                        lesson_completed_at: new Date().toISOString(),
                        time_spent: timeSpent
                    }
                });
        };

        if (isCompleted && lessonId) {
            // Mark lesson completed in the database
            insertUserLessonResult();
            setTimeout(() => {
                const completionContent = document.querySelector('[data-completion]');
                if (completionContent) {
                    completionContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [isCompleted, lessonId, userId, supabase]);

    // Record a posthog event when there was an error in generating an activity
    useEffect(() => {
        if (generationFailed) {
            posthog.capture('ERROR:lesson_generation_failed', {
                lessonId: lessonSkillId,
                numActivitiesGenerated: activities.length,
                expectedActivities: totalExpectedActivities,
                error: error
            });
        }
    }, [generationFailed, lessonSkillId, activities.length, totalExpectedActivities, error]);

    if (!lessonSkillId) {
        return (
            <Stack spacing={2} px={4} py={2} maxWidth="48rem" width="100%" mx="auto">
                <Txt color="error">No topic selected</Txt>
                <Button onClick={handleBack}>Go Back</Button>
            </Stack>
        );
    }

    // Only show loading skeleton if we have no activities at all
    if (lessonLoading && !activities.length) {
        return <LoadingLessonSkeleton />;
    }

    // Show error only if we have no activities to show
    if (error && activities.length === 0) {
        return (
            <Stack spacing={2} px={4} py={2} maxWidth="48rem" width="100%" mx="auto">
                <Button
                    startIcon={<ArrowBack />}
                    onClick={handleBack}
                    sx={{ alignSelf: 'flex-start' }}
                >
                    Back to Topics
                </Button>
                <Stack spacing={2} alignItems="center" textAlign="center" py={8}>
                    <Txt variant="h5" color="error">
                        {error}
                    </Txt>
                    <Txt color="text.secondary">
                        There was an error loading the lesson. Please try again later.
                    </Txt>
                </Stack>
            </Stack>
        );
    }

    const renderActivity = (activity: { id: string; type: string }, index: number) => {
        const isVisible = index <= currentIndex;

        if (!isVisible) return null;

        return (
            <motion.div
                key={activity.id}
                data-activity-index={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.4,
                    ease: "easeOut"
                }}
            >
                {(index === currentIndex) ? (
                    <Activity
                        activityId={activity.id}
                        onActivityComplete={async (completed) => {
                            setCompletedIndex(index);
                            // Scroll the activity into view after completion
                            setTimeout(() => {
                                const activityElement = document.querySelector(`[data-activity-index="${index}"]`);
                                if (activityElement) {
                                    activityElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }, 100);
                        }}
                        onNextActivity={() => {
                            setCompletedIndex(index);
                            // Only show completion if we've reached the end of all expected activities
                            const isLastActivity = totalExpectedActivities !== null &&
                                index === totalExpectedActivities - 1;

                            if (isLastActivity) {
                                // Last activity, complete the lesson
                                const endTime = new Date();
                                const diff = endTime.getTime() - startTime.getTime();
                                const minutes = Math.floor(diff / 60000);
                                const seconds = Math.floor((diff % 60000) / 1000);
                                setTimeSpent(`${minutes} minutes and ${seconds} seconds`);
                                setIsCompleted(true);
                            }
                            setCurrentIndex(prev => prev + 1);
                        }}
                        disableEdit
                        disableHeader={activity.type === 'slide'}
                        restrictHeight={activity.type !== 'slide'}
                    />
                ) : (
                    <Activity
                        activityId={activity.id}
                        disableEdit
                        disableSkip
                        disableHeader={activity.type === 'slide'}
                        restrictHeight={activity.type !== 'slide'}
                    />
                )}
            </motion.div>
        );
    };

    return (
        <Stack maxWidth="64rem" width="100%" mx="auto">
            {/* Header with Progress and Back Button */}
            <ProgressIndicator
                currentIndex={currentIndex}
                completedIndex={completedIndex}
                activities={activities}
                onBack={handleBack}
                totalExpected={totalExpectedActivities}
            />
            <Stack spacing={2} maxWidth="48rem" width="100%" mx="auto">
                {/* Main Content */}
                <Stack spacing={4}>
                    {activities.slice(0, currentIndex + 1).map((activity, index) =>
                        renderActivity(activity, index)
                    )}

                    {/* Show loading state only when trying to view an activity that hasn't loaded yet */}
                    {currentIndex >= activities.length &&
                        totalExpectedActivities !== null &&
                        currentIndex < totalExpectedActivities && (
                            <Stack spacing={2} alignItems="center" py={4}>
                                {generationFailed ? (
                                    <Stack spacing={2} alignItems="center">
                                        <Txt color="warning.main">
                                            There was an error generating the activities. Please try refreshing the page.
                                        </Txt>
                                        <Button
                                            onClick={() => window.location.reload()}
                                            variant="outlined"
                                            color="warning"
                                            size="small"
                                        >
                                            Refresh Page
                                        </Button>
                                    </Stack>
                                ) : (
                                    <ActivityLoadingComponent />
                                )}
                            </Stack>
                        )}
                </Stack>

                {/* Completion Content */}
                {isCompleted && (
                    <Stack
                        spacing={2}
                        py={8}
                        mb={8}
                        alignItems="center"
                        textAlign="center"
                        data-completion
                    >
                        <Box sx={{ fontSize: '4rem' }}>🎉</Box>
                        <Txt variant="h4" color="primary">Congratulations!</Txt>
                        <Txt variant="h6">
                            You've completed the lesson on <SkillChip topicOrId={lessonSkillId} disableAddDelete disableLevelIndicator disableModal />
                        </Txt>
                        <Txt color="text.secondary">
                            You spent {timeSpent} learning this material.
                        </Txt>
                        <Stack direction="row" spacing={2}>
                            <Button
                                startIcon={<ArrowBack />}
                                onClick={handleBack}
                                variant="outlined"
                            >
                                Back to Topics
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => router.push(`/app/skills/${rootSkillId}/practice_v2/practice?subtopicIds=${lessonSkillId}`)}
                            >
                                Practice Now
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </Stack>
        </Stack>
    );
} 