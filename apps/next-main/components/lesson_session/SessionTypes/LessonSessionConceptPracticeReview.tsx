"use client"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {useSearchParams} from "next/navigation";
import posthog from "posthog-js";
import {z} from "zod";

import {ActivityGenerateRoute} from "@/app/api/activity/generate/routeSchema";
import {
  LessonGetOverviewStreamRoute,
} from "@/app/api/lesson/get_overview/stream/routeSchema";
import {useIsDebugMode} from "@/clientOnly/hooks/useIsDebugMode";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useUserXP} from "@/clientOnly/hooks/useUserXP";
import {Activity} from "@/components/activity/Activity";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {
  SkeletonWithOverlay,
} from "@/components/smart-skeleton/SkeletonWithOverlay";
import {SmartSkeleton} from "@/components/smart-skeleton/SmartSkeleton";
import {
  useApolloClient,
  useQuery,
} from "@apollo/client";
import {
  notEmpty,
  tryUntilAsync,
  typedUuidV4,
} from "@lukebechtel/lab-ts-utils";
import {Refresh} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Skeleton,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import {
  createUserActivityResultFlatMutDoc,
  GetLessonSessionDeepDocument,
} from "@reasonote/lib-sdk-apollo-client";
import {JSONSafeParse} from "@reasonote/lib-utils";
import {
  useAsyncEffect,
  useStateWithRef,
} from "@reasonote/lib-utils-frontend";

import {GoHomeButton} from "../../navigation/GoHomeButton";
import CenterPaperStack from "../../positioning/FullCenterPaperStack";
import {Txt} from "../../typography/Txt";
import {LessonFinishSection} from "../LessonSessionFinish/LessonSessionFinish";
import {LessonSessionHeader} from "../LessonSessionHeader";
import {LessonSessionStageIcon} from "../LessonSessionStageIcon";
import {ConceptCard} from "./ConceptCard";
import {
  Item,
  ItemPractice,
  LessonSessionConceptPracticeReviewProps,
} from "./types";

export function LessonSessionConceptPracticeReview({ lessonSessionId, onBack, onBackAfterLessonComplete, onStartNewLesson }: LessonSessionConceptPracticeReviewProps) {
    const isDebugMode = useIsDebugMode();
    const ac = useApolloClient();
    const {refetch: refetchUserXP} = useUserXP();

    const lessonSessionDeepRes = useQuery(GetLessonSessionDeepDocument, {
        variables: {
            filter: {
                id: {
                    eq: lessonSessionId
                }
            }
        }
    });
    const lessonSession = lessonSessionDeepRes.data?.lessonSessionCollection?.edges?.map(e => e.node)[0];
    const lesson = lessonSession?.lesson;
    const lessonId = lesson?.id;

    const params = useSearchParams();
    const skipToReviewVal = params?.get('skipToReview');
    const skipToReview = skipToReviewVal === '1'

    // Get all slides from the lessonActivities
    const lessonActivities = lessonSession?.lesson?.lessonActivityCollection?.edges?.map(e => e.node) ?? [];
    const lessonActivitiesConcept = lessonActivities.filter(e => e.activity?.type === 'slide').sort((a, b) => a.position - b.position) ?? [];
    const lessonActivitiesPractice = lessonActivities.filter(e => e.activity?.type !== 'slide').sort((a, b) => a.position - b.position) ?? [];

    const isLoadingOverview = useRef<boolean>(false);

    const [overviewGeneratingState, setOverviewGeneratingState, overviewGeneratingStateRef] = useStateWithRef<{ 
        type: "waiting-for-slides" | "generating" | "done" | "error" | "timeout", 
        error?: string 
    }>({ type: "waiting-for-slides" });
    const [retryGeneratingPracticeCount, setRetryGeneratingPracticeCount] = useState<number>(0);
    const [activityResultsLoaded, setActivityResultsLoaded] = useState<number>(0);

    const generateOverview = useCallback(async (modes?: ('slides' | 'practice')[], forceGenerate?: boolean) => {
        if (!lessonId || isLoadingOverview.current || lessonActivitiesConcept?.length > 0) return;
        isLoadingOverview.current = true;
        try {
            setOverviewGeneratingState({ type: "generating" });
            // Set up timeout for the stream call
            let timeoutId: NodeJS.Timeout;
            timeoutId = setTimeout(() => {
                setOverviewGeneratingState({ type: "timeout" });
            }, 30_000); // 30 seconds timeout for first practice

            // Race between the stream and timeout
            try {
                for await (const res of LessonGetOverviewStreamRoute.callArrayStream({
                    lessonId,
                    fieldsToGet: modes ?? ['slides', 'practice'],
                    forceGenerate
                })) {
                    // Clear timeout as soon as we get first practice
                    if (res.type === 'practice') {
                        clearTimeout(timeoutId);
                    }
                    await lessonSessionDeepRes.refetch();
                }
                setOverviewGeneratingState({ type: "done" });
            } catch (error: any) {
                if (error.message === 'timeout') {
                    setOverviewGeneratingState({ type: "timeout" });
                    return;
                }
                throw error;
            }
        }
        catch (e: any) {
            posthog.capture('error_lesson_concept_practice_get_overview_slides', {
                error: e.message
            });
            console.error('error getting slides', e);
            setOverviewGeneratingState({ type: "error", error: e.message });
        }
        finally {
            isLoadingOverview.current = false;
        }
    }, [lessonId, lessonActivitiesConcept, setOverviewGeneratingState, lessonSessionDeepRes]);

    useAsyncEffect(async () => {
        await generateOverview();
    }, [lessonSessionDeepRes.data])

    const isSmallDevice = useIsSmallDevice();

    const items: Item[] = useMemo(() => {
        return [
            ...(lessonActivitiesConcept?.map(slide => {
                const slideTypeConfig = JSONSafeParse(slide.activity?.typeConfig).data ?? undefined;
                return slideTypeConfig ? {
                    stage: 'Concepts' as const,
                    stubId: slide.id,
                    title: slideTypeConfig?.title,
                    content: slideTypeConfig?.markdownContent,
                    emoji: slideTypeConfig?.titleEmoji
                } : undefined;
            }) ?? []).filter(notEmpty),
            ...(lessonActivitiesPractice && lessonActivitiesPractice.length > 0 ?
                lessonActivitiesPractice.map(lessonActivity => {
                    const activityType = lessonActivity.activity?.type;

                    return activityType ? {
                        stage: 'Practice' as const,
                        type: activityType,
                        activityId: lessonActivity.activity?.id,
                        generationState: lessonActivity.activity?.typeConfig ? 'done' as const : 'idle' as const,
                    } : undefined;
                })
                :
                [{
                    stage: 'Practice' as const,
                    isLoading: true,
                    stubId: typedUuidV4('stubid'),
                    subject: '',
                    type: '',
                    bloomTaxonomyLevel: 'unknown',
                    activityId: undefined,
                    generationState: 'idle' as const
                }]
            ),
            (lessonActivitiesPractice?.length > 0 ? {
                stage: 'Review' as const,
                stubId: typedUuidV4('stubid'),
                description: '',
            } : null)
        ].filter(notEmpty);
    }, [lessonActivitiesConcept, lessonActivitiesPractice]);


    const practiceItemsGenerating = useRef<string[]>([]);

    const onPreviousPage = useCallback(() => {
        onBack?.();
    }, [lesson]);

    useEffect(() => {
        // Whenever we get new 'Practice' type items in our stubid,
        // generate an activity per stubid.
        const practiceItems: ItemPractice[] = items.filter(item => item.stage === 'Practice') as any;

        practiceItems.forEach(async (stub) => {
            if (!lessonSession || !lesson) return;
            const activityId = stub.activityId;

            if (!activityId) return;

            if (practiceItemsGenerating.current.includes(activityId)) return;

            practiceItemsGenerating.current.push(activityId);

            // Check if the activity already has a typeConfig
            if (stub.generationState === 'done') {
                return;
            }

            try {
                const ids = await tryUntilAsync({
                    func: async () => {
                        const res = await ActivityGenerateRoute.call({
                            fillActivityId: activityId,
                            lessonSessionId: lessonSessionId,
                        });

                        if (!res.data) {
                            throw new Error('No data in response');
                        }

                        return res.data?.activityIds ?? [];
                    },
                    tryLimits: {
                        maxAttempts: 3
                    }
                })

                // TODO this is a bit inefficient, bc all we really want is to get the lessonActivities, but it'll work for now...
                lessonSessionDeepRes.refetch();
            }
            catch (e) {
                console.error('error generating activity', e);
            }

            // Now refresh the other query...
            // lessonSessionDeepRes.refetch();
        });
    }, [items]);

    useEffect(() => {
        if (skipToReview) {
            setCurrentItemIndex(items.length - 1);
        }
    }, [skipToReview, items])


    const [currentItemIndex, setCurrentItemIndex] = useState(0);

    const rsnUserId = useRsnUserId();

    const steps = [
        'Concepts',
        'Practice',
        'Review',
    ]

    if (lessonSessionDeepRes.loading) {
        return <Card>
            <CardContent>
                <Typography>Loading...</Typography>
            </CardContent>
        </Card>
    }

    if (!lesson) {
        return <CenterPaperStack stackProps={{ alignItems: 'center', gap: 2 }}>
            <Typography variant="h4">Lesson not found</Typography>

            <div>
                <GoHomeButton variant="contained" />
            </div>
        </CenterPaperStack>
    }

    if (!lessonId) {
        return <CenterPaperStack stackProps={{ alignItems: 'center', gap: 2 }}>
            <Typography variant="h4">Lesson ID not found</Typography>

            <div>
                <GoHomeButton variant="contained" />
            </div>
        </CenterPaperStack>
    }

    const firstPracticeIndex = items.findIndex((i) => (i.stage === 'Practice' && i.generationState === 'done'));

    const isStillLoading = items.filter((i) => {
        return i.stage === 'Concepts'
    }).length < 1;

    const currentItemStage = items?.[currentItemIndex]?.stage;

    const stage = isStillLoading ?
        steps[0] :
        (
            !currentItemStage ?
                'Practice'
                :
                currentItemStage
        );

    // TODO: then we organize into small lessons.
    return <Stack gap={isSmallDevice ? 0 : .5} sx={{ width: '100%', maxHeight: '100%' }} flex={1} className="flex-1">
        <Box sx={{ flexShrink: 0, p: isSmallDevice ? 0 : 2, borderRadius: isSmallDevice ? 0 : undefined }}>
            <Stack gap={isSmallDevice ? 0 : 2}>
                <LessonSessionHeader lessonId={lessonId} onPreviousPage={onPreviousPage} />


                {
                    isSmallDevice ?
                        <LinearProgress
                            variant="determinate"
                            value={currentItemIndex / items.length * 100}
                        />
                        :
                        <Stepper
                            activeStep={
                                stage === 'Review' ? steps.length : steps.indexOf(stage)
                            }
                        >
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel icon={(
                                        <LessonSessionStageIcon
                                            stageName={label}
                                            status={
                                                label === stage ?
                                                    'in-progress'
                                                    :
                                                    steps.indexOf(label) < steps.indexOf(stage) ?
                                                        'completed'
                                                        :
                                                        'not-started'
                                            }
                                        />
                                    )}>
                                        {
                                            steps.indexOf(label) === steps.indexOf(stage) ?
                                                <b>{label}</b>
                                                :
                                                label
                                        }
                                    </StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                }

            </Stack>
        </Box>
        {
            isStillLoading ?
                <SmartSkeleton
                    height={'500px'}
                    width={'100%'}
                    skeletonProps={{ variant: "rounded" }}
                    oneShotAIArgs={{
                        systemMessage: `
                        You should generate a fun (real!) fact for the user to entertain them while they wait for the rest of their lesson to be generated.

                        This should be relevant to the lesson in some way.

                        Don't make it "preachy" -- it really should just be a fun fact.

                        You should use markdown formatting, to make the text more engaging.

                        Always begin your fun fact with "Did you know?".

                        It should be SPECIFIC, not general. Cite numbers, dates, names, data, etc.

                        <LESSON name="${lesson.name}">
                            <SUMMARY>
                                ${lesson.summary}
                            </SUMMARY>
                        </LESSON>
                        `,
                        functionName: 'output_fun_fact',
                        functionDescription: 'Output a fun fact to entertain the user while they wait for their lesson to be generated.',
                        functionParameters: z.object({
                            funFact: z.string().describe('The fun fact to display to the user, in markdown'),
                        }),
                        driverConfig: {
                            type: 'openai',
                            config: {
                                model: 'gpt-4o-mini'
                            }
                        }
                    }}

                    formatResponse={(response) => {
                        if (!response.data) return null;

                        return <Stack alignItems={'center'} alignContent={'center'} justifyContent={'center'} height={'100%'} width={'100%'} maxWidth={'300px'}>
                            <Card>
                                <Txt variant="caption" fontStyle={'italic'}>Generating your lesson, this should only take a few more seconds...</Txt>
                                <br />
                                <Txt startIcon={'🤔'} variant="h6">Fun Fact</Txt>
                                <MuiMarkdownDefault>
                                    {response.data.funFact}
                                </MuiMarkdownDefault>
                            </Card>
                        </Stack>
                    }}
                />
                :
                <Stack gap={1} maxHeight={"100%"} className="flex-1" minHeight={0} display={'flex'}>
                    {
                        items.map((item, i) => {
                            if (i !== currentItemIndex) return null;

                            const activityId = item.stage === 'Practice' ? item.activityId : undefined;
                            const isLoading = (item.stage === 'Practice' && item.generationState !== 'done');

                            switch (item.stage) {
                                case 'Concepts':
                                    return (
                                        <ConceptCard
                                            key={i}
                                            item={item}
                                            lessonSessionId={lessonSessionId}
                                            lessonId={lessonId}
                                            onNextClick={() => setCurrentItemIndex(currentItemIndex === items.length - 1 ? items.length - 1 : currentItemIndex + 1)}
                                            onPreviousClick={() => setCurrentItemIndex(currentItemIndex === 0 ? 0 : currentItemIndex - 1)}
                                            isFirstItem={currentItemIndex === 0}
                                            isLastItem={currentItemIndex === items.length - 1}
                                            firstPracticeIndex={firstPracticeIndex}
                                            currentItemIndex={currentItemIndex}
                                        />
                                    );
                                case 'Practice':
                                    return !isLoading ?
                                        <Card elevation={isSmallDevice ? undefined : 5} sx={{ padding: isSmallDevice ? 0 : undefined, maxHeight: '100%' }}>
                                            <Stack minHeight={0} maxHeight={'100%'} height={'100%'}>
                                                {
                                                    activityId ?
                                                        <Activity
                                                            activityId={activityId}
                                                            lessonSessionId={lessonSessionId}
                                                            onActivityComplete={() => { }}
                                                            onActivityCompleteAfterResultPosted={async () => {
                                                                setActivityResultsLoaded((old) => old + 1);
                                                                refetchUserXP();
                                                            }}
                                                            onNextActivity={() => {
                                                                setCurrentItemIndex(currentItemIndex === items.length - 1 ? items.length - 1 : currentItemIndex + 1);
                                                            }}
                                                            disableEdit
                                                            data-testid="activity-container"
                                                        />
                                                        :
                                                        <Stack gap={1}>
                                                            <Typography textAlign={'center'}>Generating activity...</Typography>
                                                            <Skeleton variant="rounded" height={500} />
                                                            <div style={{ display: 'flex', alignContent: 'end', justifyContent: 'end' }}>
                                                                <Button variant="outlined" onClick={async () => {
                                                                    setCurrentItemIndex(currentItemIndex === items.length - 1 ? items.length - 1 : currentItemIndex + 1);
                                                                    setActivityResultsLoaded((old) => old + 1);

                                                                    ac.mutate({
                                                                        mutation: createUserActivityResultFlatMutDoc,
                                                                        variables: {
                                                                            objects: [
                                                                                {
                                                                                    activity: item.activityId,
                                                                                    user: rsnUserId,
                                                                                    lessonSessionId,
                                                                                    resultData: JSON.stringify({}),
                                                                                    skipped: true
                                                                                }
                                                                            ]
                                                                        }
                                                                    })
                                                                }}>
                                                                    Skip
                                                                </Button>
                                                            </div>
                                                        </Stack>
                                                }
                                            </Stack>
                                        </Card>
                                        :
                                        overviewGeneratingState.type === 'error' || overviewGeneratingState.type === 'timeout' ?
                                            <Card elevation={isSmallDevice ? undefined : 5} sx={{ padding: isSmallDevice ? 0 : undefined, maxHeight: '100%' }}>
                                                <Box padding={2} display={'flex'} flexDirection={'column'} gap={2} alignItems={'center'} justifyContent={'center'}>
                                                    <Typography textAlign={'center'}>
                                                        {overviewGeneratingState.type === 'error' ? 
                                                            'Error generating practice activities' : 
                                                            'Practice generation is taking longer than usual...'}
                                                    </Typography>
                                                    <Button
                                                        startIcon={<Refresh />}
                                                        variant="contained"
                                                        onClick={() => {
                                                            // Generate specifically for practice, with forceGenerate set to true
                                                            generateOverview(['practice'], true);
                                                        }}>
                                                        Try Again
                                                    </Button>
                                                </Box>
                                            </Card>
                                            :
                                            overviewGeneratingState.type === 'waiting-for-slides' ?
                                                <SkeletonWithOverlay
                                                    height={'500px'}
                                                    width={'100%'}
                                                    variant="rounded"
                                                >
                                                    <Stack padding={2} gap={2} alignItems={'center'} justifyContent={'center'}>
                                                        <Typography textAlign={'center'}>Generating slides...</Typography>
                                                    </Stack>
                                                </SkeletonWithOverlay>
                                                :
                                                <SkeletonWithOverlay
                                                    height={'500px'}
                                                    width={'100%'}
                                                    variant="rounded"
                                                >
                                                    <Stack padding={2} gap={2} alignItems={'center'} justifyContent={'center'}>
                                                        <Typography textAlign={'center'}>Generating practice activities...</Typography>
                                                    </Stack>
                                                </SkeletonWithOverlay>

                                case 'Review':
                                    return <Box sx={{ overflowY: 'auto' }}>
                                        {
                                            activityResultsLoaded === lessonActivitiesPractice.length ?
                                                <LessonFinishSection
                                                    lessonSessionId={lessonSessionId}
                                                    lessonId={lesson.id}
                                                    finishText={item.description}
                                                    onBackToSkill={() => {
                                                        onBackAfterLessonComplete?.();
                                                    }}
                                                    onStartNewLesson={(newLessonId) => {
                                                        onStartNewLesson?.(newLessonId);
                                                    }}
                                                />
                                                :
                                                <Skeleton variant="rounded" height={500} />
                                        }
                                    </Box>
                            }
                        })
                    }

                </Stack>
        }

    </Stack>
}