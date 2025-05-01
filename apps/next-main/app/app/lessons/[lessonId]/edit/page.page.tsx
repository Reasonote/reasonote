'use client'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {formatDistanceToNow} from "date-fns";
import _ from "lodash";
import {z} from "zod";

import {ActivityGenerateRoute} from "@/app/api/activity/generate/routeSchema";
import {
  LessonGetOverviewStreamRoute,
} from "@/app/api/lesson/get_overview/stream/routeSchema";
import {
  GetSubskillsDirectRoute,
} from "@/app/api/skills/get_subskills_direct/routeSchema";
import {aib} from "@/clientOnly/ai/aib";
import {useRouteParams} from "@/clientOnly/hooks/useRouteParams";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useToken} from "@/clientOnly/hooks/useToken";
import {
  ActivityLoadingComponent,
} from "@/components/activity/components/ActivityLoadingComponent";
import {SimpleHeader} from "@/components/headers/SimpleHeader";
import {ActivityIcon} from "@/components/icons/ActivityIcon";
import {SkillIcon} from "@/components/icons/SkillIcon";
import {ShareModal} from "@/components/modals/ShareModal/ShareEntityModal";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {CustomTabPanel} from "@/components/tabs/CustomTab";
import {Txt} from "@/components/typography/Txt";
import {
  ApolloClient,
  useApolloClient,
  useQuery,
} from "@apollo/client";
import {
  notEmpty,
  typedUuidV4,
} from "@lukebechtel/lab-ts-utils";
import {
  Article,
  ChevronLeft,
  ChevronRight,
  KeyboardArrowDown,
  Preview,
  SettingsApplications,
  Share,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Box,
  Card,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  Tab,
  Tabs,
  useTheme,
} from "@mui/material";
import {
  ActivityType,
  ActivityTypesPublic,
  LessonLearningObjective,
  LessonSkillTreeActivityGenerateSkill,
} from "@reasonote/core";
import {
  getActivityFlatQueryDoc,
  GetLessonsDeepDocument,
  GetLessonsDeepQuery,
} from "@reasonote/lib-sdk-apollo-client";
import {Database} from "@reasonote/lib-sdk/src/services/supabase/supabase-rest";
import {JSONSafeParse} from "@reasonote/lib-utils";
import {SupabaseClient} from "@supabase/supabase-js";

import {
  EditLessonDocumentAccordionDetails,
} from "./accordionSections/LessonBasicsSection";
import {
  EditLessonSkillsAccordionDetails,
} from "./accordionSections/LessonSkillSection";
import {SaveLessonButton} from "./components/SaveLessonButton";
import {
  ActivityGenerateResult,
  LessonEditActivitiesTab,
} from "./tabs/LessonEditActivitiesTab";
import {LessonEditPreviewTab} from "./tabs/LessonEditPreviewTab";
import {
  LessonEditSlidesTab,
  Slide,
} from "./tabs/LessonEditSlidesTab";

export default function LessonEditPage({ params }: { params: any }) {
    const lessonId = useRouteParams(params, 'lessonId');

    const { data: lessonResult, loading, error, refetch } = useQuery(GetLessonsDeepDocument, {
        variables: {
            filter: {
                id: {
                    eq: lessonId
                }
            }
        }
    })

    const lesson = lessonResult?.lessonCollection?.edges?.[0]?.node;

    if (loading) {
        return <ActivityLoadingComponent />
    }

    if (!lesson) {
        return <Stack>
            <Txt variant={'h4'}>Lesson not found</Txt>
        </Stack>
    }

    return <LessonEditPageLoaded lesson={lesson} refreshLesson={refetch} />
}


interface SaveLessonChangesArgs {
    ac: ApolloClient<any>;
    sb: SupabaseClient<Database>;
    lessonId: string;
    lessonName: string;
    lessonSummary: string;
    learningObjectives: LessonLearningObjective[];
    activities: ActivityGenerateResult[];
    slides: Slide[];
}

async function saveLessonChanges(args: SaveLessonChangesArgs) {
    const { ac, sb } = args;

    // Perform deep fetch
    const { data: lessonResult } = await ac.query({
        query: GetLessonsDeepDocument,
        variables: {
            filter: {
                id: {
                    eq: args.lessonId
                }
            }
        }
    })

    const lessonActivitiesFromResult = lessonResult?.lessonCollection?.edges?.[0]?.node?.lessonActivityCollection?.edges?.map(e => e.node).sort((a, b) => a.position - b.position) ?? [];
    const slideLessonActivitiesFromResult = lessonActivitiesFromResult.filter(la => la.activity?.type === 'slide');
    const nonSlideLessonActivitiesFromResult = lessonActivitiesFromResult.filter(la => la.activity?.type !== 'slide');


    //////////////////////////////////////
    // SLIDES
    //////////////////////////////////////
    // Slide Deletion: Any slide which exists in the server, but not in our locally cached copy, should be deleted.
    const slidesToRemove = slideLessonActivitiesFromResult.filter(la => !args.slides.find(s => s.id === la.activity?.id));
    console.log('slidesToRemove', slidesToRemove.map(la => la.activity?.id));
    await sb.from('activity').delete().in('id', slidesToRemove.map(la => la.activity?.id));


    //////////////////////////////////////
    // Slide Insertion
    //////////////////////////////////////
    // Any slide which exists in our locally cached copy, but not in the server, should be added.
    const slidesToAdd = args.slides.filter(s => !slideLessonActivitiesFromResult.find(la => la.activity?.id === s.id));
    console.log('slidesToAdd', slidesToAdd.map(s => s.id));
    await sb.from('activity').insert(slidesToAdd.map(s => ({
        id: s.id,
        _name: s.title,
        _type: 'slide',
        type_config: {
            type: 'slide',
            title: s.title,
            titleEmoji: s.emoji,
            markdownContent: s.content,
        },
        generated_for_skill_paths: lessonResult?.lessonCollection?.edges?.[0]?.node?.rootSkill ? [[lessonResult?.lessonCollection?.edges?.[0]?.node?.rootSkill]] : null,
    })));

    for (const slide of slidesToAdd) {
        await sb.rpc('lesson_activity_add', {
            p_lesson_id: args.lessonId,
            p_activity_id: slide.id,
        })
    }

    //////////////////////////////////////
    // Slide Update
    //////////////////////////////////////
    // Determine if any slides have had their configs changed.
    const slidesToUpdate: { id: string; type_config: any; }[] = args.slides.map(s => {
        const slideFromResult = slideLessonActivitiesFromResult.find(la => la.activity?.id === s.id);

        if (!slideFromResult) {
            return null;
        }

        const parsedTypeConfig = JSONSafeParse(slideFromResult.activity?.typeConfig);

        const markdownContentChanged = parsedTypeConfig.data?.markdownContent !== s.content;
        const titleChanged = parsedTypeConfig.data?.title !== s.title;
        const emojiChanged = parsedTypeConfig.data?.titleEmoji !== s.emoji;

        if(parsedTypeConfig.success && (markdownContentChanged || titleChanged || emojiChanged)){
            return {
                id: s.id,
                type_config: {
                    markdownContent: s.content,
                    title: s.title,
                    titleEmoji: s.emoji,
                }
            }
        }

        return null;
    }).filter(notEmpty);

    for (const slide of slidesToUpdate) {
        await sb.from('activity').update({
            id: slide.id,
            type_config: slide.type_config,
        })
        .eq('id', slide.id)
        .single();
    }


    //////////////////////////////////////
    // Slide Reordering
    //////////////////////////////////////
    // Now, we need to go through the current ordering of the slides and update the position of the slides in the server to match.
    const slideLessonActivitiesMap = new Map(slideLessonActivitiesFromResult.map(la => [la.activity?.id, la]));
    
    for (let i = 0; i < args.slides.length; i++) {
        const slide = args.slides[i];
        const lessonActivity = slideLessonActivitiesMap.get(slide.id);
        
        if (lessonActivity) {
            // Calculate the desired position
            // We multiply by 1000 to leave room between positions for future insertions
            const desiredPosition = i;
            
            // If the position is different from what we want, update it
            if (lessonActivity.position !== desiredPosition) {
                await sb.rpc('lesson_activity_reorder', {
                    p_lesson_activity_id: lessonActivity.id,
                    p_new_position: desiredPosition
                });
            }
        }
    }

    //////////////////////////////////////
    // ACTIVITIES
    //////////////////////////////////////
    // Activity Deletion: Remove activities that exist in server but not in local state
    const activitiesToRemove = nonSlideLessonActivitiesFromResult.filter(la => 
        !args.activities.find(a => a.metadata?.activityId === la.activity?.id)
    );
    console.log('activitiesToRemove', activitiesToRemove.map(la => la.activity?.id));
    await sb.from('activity').delete().in('id', activitiesToRemove.map(la => la.activity?.id));

    //////////////////////////////////////
    // Activity Insertion
    //////////////////////////////////////
    // Add activities that exist in local state but not in server
    const activitiesToAdd = args.activities
        .filter(a => a.metadata?.activityId) // Only handle activities with activityId
        .filter(a => !nonSlideLessonActivitiesFromResult.find(la => 
            la.activity?.id === a.metadata?.activityId
        ));

    console.log('activitiesToAdd', activitiesToAdd.map(a => a.metadata?.activityId));
    
    // Add each activity to the lesson
    for (const activity of activitiesToAdd) {
        if (activity.metadata?.activityId) {
            await sb.rpc('lesson_activity_add', {
                p_lesson_id: args.lessonId,
                p_activity_id: activity.metadata.activityId,
            });
        }
    }

    //////////////////////////////////////
    // Activity Reordering
    //////////////////////////////////////
    // Update positions of activities to match local state order
    const activityLessonActivitiesMap = new Map(
        nonSlideLessonActivitiesFromResult.map(la => [la.activity?.id, la])
    );
    
    // Filter to only activities with activityId and calculate their positions
    const activitiesWithIds = args.activities.filter(a => a.metadata?.activityId);
    
    // Calculate the starting position for activities (after all slides)
    const activityStartPosition = args.slides.length;
    
    for (let i = 0; i < activitiesWithIds.length; i++) {
        const activity = activitiesWithIds[i];
        const lessonActivity = activityLessonActivitiesMap.get(activity.metadata?.activityId);
        
        if (lessonActivity) {
            // Position will be after all slides
            const desiredPosition = activityStartPosition + i;
            
            if (lessonActivity.position !== desiredPosition) {
                await sb.rpc('lesson_activity_reorder', {
                    p_lesson_activity_id: lessonActivity.id,
                    p_new_position: desiredPosition
                });
            }
        }
    }
}

type LessonEditLesson = NonNullable<GetLessonsDeepQuery['lessonCollection']>['edges'][number]['node'];



function slidesFromLessonActivities(lessonActivities: NonNullable<LessonEditLesson['lessonActivityCollection']>['edges']) {
   // Filter to only slide types
   const slides = lessonActivities
    .filter(la => la.node?.activity?.type === 'slide')
    .map(la => la.node)
    // Position must be used to sort here, in case the query did not correctly return in order.
    .sort((a, b) => a.position - b.position);

   return slides.map(SlideFromLessonActivity).filter(notEmpty);
}

function SlideFromLessonActivity(lessonActivity: NonNullable<LessonEditLesson['lessonActivityCollection']>['edges'][number]['node']) {
    const parsedActivity = JSONSafeParse(lessonActivity.activity?.typeConfig);
    if (!parsedActivity.success) {
        return null;
    }

    const actConfig = parsedActivity.data;
    
    return lessonActivity.activity?.type === 'slide' ? {
        lessonActivityId: lessonActivity.id,
        id: lessonActivity.activity.id,
        emoji: actConfig?.titleEmoji ?? '📝',
        title: actConfig?.title ?? 'New Slide',
        content: actConfig?.markdownContent?? '',
        // TODO: not sure about this.
        skillId: lessonActivity.activity.generatedForSkillPaths?.[0] ?? null,
    } : null;
}

function activityGenerateResultsFromLessonActivities(lessonActivities: NonNullable<LessonEditLesson['lessonActivityCollection']>['edges']): ActivityGenerateResult[] {
    const activities = lessonActivities.filter(la => la.node?.activity?.type !== 'slide').map(la => la.node);


    console.log('activityGenerateResultsFromLessonActivities', activities.map(a => a.id));

    return activities.map(ActivityGenerateResultFromLessonActivity).filter(notEmpty);
}

function ActivityGenerateResultFromLessonActivity(lessonActivity: NonNullable<LessonEditLesson['lessonActivityCollection']>['edges'][number]['node']): ActivityGenerateResult | null {

    if (!lessonActivity.activity) {
        return null;
    }

    const lastSkillInPath = lessonActivity.activity.generatedForSkillPaths?.[lessonActivity.activity.generatedForSkillPaths.length - 1] ?? null

    return {
        tmpId: lessonActivity.id,
        resultType: 'success',
        id: lessonActivity.activity.id,
        type: lessonActivity.activity.type as any,
        name: lessonActivity.activity.name,
        forSkills: lastSkillInPath ? [{
            id: lastSkillInPath,
            pathTo: lessonActivity.activity.generatedForSkillPaths,
        }] : [],
        metadata: {
            activityId: lessonActivity.activity.id,
        },
        subject: lessonActivity.activity.genInstructions ?? ''
    }
}

export function LessonEditPageLoaded({ lesson, refreshLesson }: { lesson: LessonEditLesson, refreshLesson: () => void }) {
    const theme = useTheme();
    const [lessonSkills, setLessonSkills] = useState<LessonSkillTreeActivityGenerateSkill[]>([]);
    const [learningObjectives, setLearningObjectives] = useState<LessonLearningObjective[]>([]);
    const [forCurrentUser, setForCurrentUser] = useState<boolean>(false);
    const [currentActivities, setCurrentActivities] = useState<ActivityGenerateResult[]>(activityGenerateResultsFromLessonActivities(lesson.lessonActivityCollection?.edges ?? []));
    const ac = useApolloClient();
    const { sb } = useSupabase();
    const [allowedActivityTypes, setAllowedActivityTypes] = useState<string[]>([...ActivityTypesPublic]);
    const [accordionExpanded, setAccordionExpanded] = useState<'skills' | 'description' | 'learning-objectives' | null>('skills');
    const [lessonName, setLessonName] = useState<string>(lesson.name ?? '');
    const [lessonSummary, setLessonSummary] = useState<string>(lesson.summary ?? '');
    const userId = useRsnUserId();
    const { token } = useToken();

    const [slides, setSlides] = useState<Slide[]>(slidesFromLessonActivities(lesson.lessonActivityCollection?.edges ?? []));

    const [activeTab, setActiveTab] = useState<'slides' | 'activities' | 'preview'>('slides');
    const [isSlidesLoading, setIsSlidesLoading] = useState(false);
    const [slidesError, setSlidesError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(500);
    const MIN_WIDTH = 50;
    const MAX_WIDTH = 800;
    const [hasNewSlides, setHasNewSlides] = useState(false);
    const [hasNewActivities, setHasNewActivities] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isGeneratingSlide, setIsGeneratingSlide] = useState(false);
    const [isGeneratingActivity, setIsGeneratingActivity] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date>();

    const createActivitiesForSkill = useCallback(async ({ skill, activityType, fromActivity, additionalInstructions }: { skill: LessonSkillTreeActivityGenerateSkill, activityType?: ActivityType, fromActivity?: string, additionalInstructions?: string }) => {
        setIsGeneratingActivity(true);
        try {
            const tmpId = Math.random().toString();

            // Add the loading activity to the list
            setCurrentActivities((existing) => [
                ...existing,
                {
                    tmpId,
                    resultType: 'loading',
                    type: activityType ?? 'loading' as any,
                    forSkills: [skill],
                }
            ]);

            const { data: skillContext, error: skillContextError } = await GetSubskillsDirectRoute.call({
                skill: {
                    id: skill.id,
                    parentSkillIds: skill.pathTo.slice(0, -1),
                },
            });

            const subject = skillContext?.[0]?.skill_name;
            if (!subject || skillContextError) {
                console.error('Failed to get skill context');
                setCurrentActivities((existing) => existing.map((ex) => ex.tmpId === tmpId ? {
                    ...ex,
                    resultType: 'error',
                    error: skillContextError?.message ?? 'Failed to get skill context',
                } : ex));
                return;
            }

            const res = await ActivityGenerateRoute.call({
                from: {
                    skill: {
                        id: skill.id,
                        parentIds: _.uniq([lesson.rootSkill, skill.id, ...skill.pathTo].filter(notEmpty)),
                    },
                    activityIds: fromActivity ? [fromActivity] : undefined, 
                },
                lesson: {
                    id: lesson.id,
                    name: lessonName,
                    description: lessonSummary,
                    learningObjectives: learningObjectives,
                },
                additionalInstructions,
                activityTypes: activityType ? [activityType] : undefined,
            });

            if (res?.error) {
                setCurrentActivities((existing) => existing.map((ex) => ex.tmpId === tmpId ? {
                    ...ex,
                    resultType: 'error',
                    error: JSON.stringify(res.error),
                } : ex));
                return;
            }

            const createdActivityId = res?.data?.activityIds?.[0];

            const createdActivity = createdActivityId ? (await ac.query({
                query: getActivityFlatQueryDoc,
                variables: {
                    filter: {
                        id: {
                            eq: createdActivityId,
                        }
                    }
                }
            })).data?.activityCollection?.edges?.[0]?.node : undefined;

            if (createdActivity && createdActivity.type) {
                setCurrentActivities((existing) => {
                    return existing.map((ex) => {
                        if (ex.tmpId === tmpId) {
                            return {
                                tmpId,
                                resultType: 'success',
                                id: typedUuidV4('activity_stub'),
                                type: createdActivity.type as any,
                                name: createdActivity.name,
                                subject: subject,
                                forSkills: [skill],
                                metadata: {
                                    activityId: createdActivity.id,
                                }
                            }
                        }
                        return ex;
                    })
                })
            }

            if (activeTab !== 'activities') {
                setHasNewActivities(true);
            }
        } finally {
            setIsGeneratingActivity(false);
        }
    }, [ac, setCurrentActivities]);

    const createActivitySystemChooseSkill = useCallback(async (activityType?: ActivityType, args?: { additionalInstructions?: string }) => {
        if (!lesson.rootSkill) {
            console.error('No root skill found');
            return;
        }

        // Get list of all skills
        const { data: subskills } = await GetSubskillsDirectRoute.call({
            skill: {
                id: lesson.rootSkill,
            },
        })

        if (!subskills) {
            console.error('Failed to get subskills');
            return;
        }

        // Randomly choose the skill that has the least number of activities
        const leastUsedSkill = _.minBy(subskills, (subskill) => {
            return currentActivities.filter((act) => !!act.forSkills?.find((sk) => sk.id === subskill.skill_id)).filter(notEmpty).length;
        });

        if (leastUsedSkill) {
            createActivitiesForSkill({
                skill: {
                    id: leastUsedSkill.skill_id,
                    pathTo: leastUsedSkill.path_to,
                },
                additionalInstructions: args?.additionalInstructions,
                activityType,
            })
        }
    }, [currentActivities, createActivitiesForSkill]);

    const generateSlidesForLesson = useCallback(async () => {
        try {
            setSlidesError(null);
            setIsSlidesLoading(true);
            // await saveLessonChanges({
            //     ac,
            //     sb,
            //     lessonId: lesson.id,
            //     lessonName,
            //     lessonSummary,
            //     learningObjectives,
            //     activities: currentActivities,
            //     slides: slides
            // });

            for await (const item of LessonGetOverviewStreamRoute.callArrayStream({
                lessonId: lesson.id,
                fieldsToGet: ['slides']
            })) {
                console.log('refreshing');
                refreshLesson();
            }

            // if (!res.data?.lessonOverview?.slides) {
            //     setSlidesError('Failed to generate slides');
            //     return;
            // }

            // const { data: newSlides } = await sb.from('lesson').select('slides').eq('id', lesson.id).select().single();
            // setSlides(JSONSafeParse(newSlides?.slides)?.data ?? []);
        } catch (error: any) {
            setSlidesError(error.message ?? 'An unexpected error occurred');
        } finally {
            setIsSlidesLoading(false);
        }
    }, [slides]);

    // TODO: This is a temporary function to create a slide for a skill. Needs significant improvement.
    const createSlideForSkill = useCallback(async (props: { skill: LessonSkillTreeActivityGenerateSkill }) => {
        const { skill } = props;

        const blankSlide: Slide = {
            id: typedUuidV4('actvty'),
            emoji: '📝',
            title: 'Generating slide...',
            content: '',
            skillId: skill.id,
            isLoading: true,
        };

        setSlides(prev => [...prev, blankSlide]);
        setIsGeneratingSlide(true);

        try {
            const { data: skillData } = await sb.from('skill').select('*').eq('id', skill.id).select().single();

            const prompt = `
                <INSTRUCTIONS>
                    Create a slide about the skill ${skillData?._name} for a lesson titled ${lessonName}, making sure the slide is in the context of the lesson.
                    The name of the skill is more like a learning objective and the slide should aim
                    to help the user achieve the given learning objective
                </INSTRUCTIONS>

                <REQUIREMENTS>
                    <CONTENT_REQUIREMENTS>
                        - The slide should be about the skill's specific learning objective
                        - The title should be clear and concise
                        - Include clear examples for each concept where appropriate
                        - Use analogies where appropriate
                        - Define all technical terms
                    </CONTENT_REQUIREMENTS>

                    <ENGAGEMENT_RULES>
                        - Keep text concise (50-100 words)
                        - Use active voice 
                    </ENGAGEMENT_RULES>

                    <MARKDOWN_FORMATTING>
                        - Use \`<br/>\` for major section breaks
                        - Use single line breaks for minor separation
                        - Use \`-\` for bullet points
                        - Use \`*\` for emphasis on key terms
                    </MARKDOWN_FORMATTING>
                </REQUIREMENTS>

                <OUTPUT_FORMAT>
                    <TITLE>
                        The title of the slide
                    </TITLE>

                    <CONTENT>
                        The content of the slide
                    </CONTENT>

                    <EMOJI>
                        The emoji to use for the slide
                    </EMOJI>
                </OUTPUT_FORMAT>
            `
            // Generate slide content using AI
            const slideContent = await aib.streamGenObject({
                schema: z.object({
                    title: z.string(),
                    content: z.string(),
                    emoji: z.string(),
                }),
                prompt,
                model: 'openai:gpt-4o-mini',
                mode: 'json',
                providerArgs: {
                    structuredOutputs: true,
                },
            });

            // Replace loading slide
            setSlides(prev => prev.map(slide =>
                slide.id === blankSlide.id ? {
                    id: blankSlide.id,
                    emoji: slideContent.object.emoji,
                    title: slideContent.object.title,
                    content: slideContent.object.content,
                    skillId: skill.id,
                    isLoading: false,
                } : slide
            ));

            // Only set hasNewSlides after successful generation
            if (activeTab !== 'slides') {
                setHasNewSlides(true);
            }

        } catch (error: any) {
            // Remove the loading slide on error
            setSlides(prev => prev.filter(slide => slide.id !== blankSlide.id));
            console.error('Error generating slide:', error);
            setSlidesError(error.message ?? 'Failed to generate slide');
        } finally {
            setIsGeneratingSlide(false);
        }
    }, [setSlides, setSlidesError, activeTab, setHasNewSlides, sb, lessonName]);

    const handleSave = useCallback(async () => {
        try {
            await saveLessonChanges({
                ac,
                sb,
                lessonId: lesson.id,
                lessonName,
                lessonSummary,
                learningObjectives,
                activities: currentActivities,
                slides,
            });
            setLastSavedAt(new Date());
        } catch (error) {
            console.error('Error saving lesson:', error);
        }
    }, [ac, sb, lesson.id, lessonName, lessonSummary, learningObjectives, currentActivities, slides]);

    useEffect(() => {
        const saveInterval = 10 * 60 * 1000; // 10 minutes

        // Initial save after 30 seconds
        const initialSaveTimeout = setTimeout(() => {
            console.log('Running initial save...');
            handleSave();
        }, 30000);

        // Recurring save every 10 minutes
        const interval = setInterval(() => {
            console.log('Running periodic save...');
            handleSave();
        }, saveInterval);

        return () => {
            clearInterval(interval);
            clearTimeout(initialSaveTimeout);
        };
    }, []);

    const generateOverview = async () => {
        if (!lesson) return;

        try {
            //@ts-ignore
            for await (const item of LessonGetOverviewStreamRoute.callArrayStream({
                lessonId: lesson.id,
                fieldsToGet: ['slides', 'practice'],
            })) {
                console.log(item);
            }

            // console.log(response);
            // setOverview({
            //     overview: response.overview,
            //     keyPoints: response.keyPoints,
            //     suggestedActivities: response.suggestedActivities,
            // });
        } catch (error) {
            console.error('Error generating overview:', error);
            // Handle error appropriately
        } finally {
        }
    };

    return <>
        <Grid container width={'100vw'} height={'100dvh'} overflow={'hidden'}>
            {/* Left Sidebar */}
            <Grid
                item
                sx={{
                    width: sidebarOpen ? `${sidebarWidth}px` : `auto`,
                    transition: 'all 0.2s',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    height: '100%',
                    overflow: 'hidden'
                }}
            >
                {/* TODO actually integrate this.. */}
                {/* <Button onClick={generateOverview}>Generate Overview</Button> */}

                {/* Resize Handle */}
                {sidebarOpen && (
                    <div
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '5px',
                            cursor: 'ew-resize',
                            backgroundColor: 'transparent',
                            zIndex: 2
                        }}
                        onMouseDown={(e) => {
                            const startX = e.pageX;
                            const startWidth = sidebarWidth;

                            const onMouseMove = (e: MouseEvent) => {
                                const newWidth = startWidth + (e.pageX - startX);
                                setSidebarWidth(Math.min(Math.max(200, newWidth), MAX_WIDTH));
                            };

                            const onMouseUp = () => {
                                document.removeEventListener('mousemove', onMouseMove);
                                document.removeEventListener('mouseup', onMouseUp);
                            };

                            document.addEventListener('mousemove', onMouseMove);
                            document.addEventListener('mouseup', onMouseUp);
                        }}
                    />
                )}

                <Stack gap={2} sx={{
                    p: 2,
                    width: sidebarOpen ? '100%' : 'auto',
                    height: '100%',
                    overflow: 'auto',
                    alignItems: sidebarOpen ? 'stretch' : 'center'
                }}>
                    <Stack direction={'row'} justifyContent={'space-between'}>
                        {/* Title space - maintain consistent height */}
                        <div style={{ height: '40px' }}>  {/* MUI h6 typical height */}
                            {sidebarOpen && (
                                <Txt variant="h6">Configure Lesson</Txt>
                            )}
                        </div>

                        {/* Toggle Button */}
                        <IconButton
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'action.hover'
                                },
                            }}
                        >
                            {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
                        </IconButton>
                    </Stack>

                    {/* Accordions */}
                    <Accordion
                        elevation={5}
                        expanded={sidebarOpen && accordionExpanded === 'description'}
                        onChange={(e, expanded) => {
                            if (!sidebarOpen) {
                                setSidebarOpen(true);
                            }
                            setAccordionExpanded(expanded ? 'description' : null);
                        }}
                        onClick={() => {
                            if (!sidebarOpen) {
                                setSidebarOpen(true);
                            }
                        }}
                        sx={{
                            minWidth: sidebarOpen ? 'auto' : MIN_WIDTH,
                            '& .MuiAccordionSummary-content': {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                            }
                        }}
                    >
                        <AccordionSummary
                            expandIcon={sidebarOpen ? <KeyboardArrowDown /> : null}
                            sx={{
                                borderRadius: '5px 5px 0px 0px',
                                minHeight: sidebarOpen ? undefined : '40px',
                                '& .MuiAccordionSummary-content': {
                                    margin: sidebarOpen ? undefined : '0'
                                }
                            }}
                        >
                            {sidebarOpen ? (
                                <Txt startIcon={<SettingsApplications />} variant={'h6'}>Basics</Txt>
                            ) : (
                                <SettingsApplications />
                            )}
                        </AccordionSummary>
                        {sidebarOpen && (
                            <AccordionDetails sx={{ padding: '10px' }}>
                                <EditLessonDocumentAccordionDetails
                                    name={lessonName}
                                    onNameChange={setLessonName}
                                    summary={lessonSummary}
                                    onSummaryChange={setLessonSummary}
                                />
                            </AccordionDetails>
                        )}
                    </Accordion>

                    {/* Skills Accordion - similar pattern */}
                    <Accordion
                        elevation={5}
                        expanded={sidebarOpen && accordionExpanded === 'skills'}
                        onChange={(e, expanded) => {
                            if (!sidebarOpen) {
                                setSidebarOpen(true);
                            }
                            setAccordionExpanded(expanded ? 'skills' : null);
                        }}
                        onClick={() => {
                            if (!sidebarOpen) {
                                setSidebarOpen(true);
                            }
                        }}
                        sx={{
                            minWidth: sidebarOpen ? 'auto' : MIN_WIDTH,
                            '& .MuiAccordionSummary-content': {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                            }
                        }}
                    >
                        <AccordionSummary
                            expandIcon={sidebarOpen ? <KeyboardArrowDown /> : null}
                            sx={{
                                borderRadius: '5px 5px 0px 0px',
                                minHeight: sidebarOpen ? undefined : '40px',
                                '& .MuiAccordionSummary-content': {
                                    margin: sidebarOpen ? undefined : '0'
                                }
                            }}
                        >
                            {sidebarOpen ? (
                                <Txt startIcon={<SkillIcon />} variant={'h6'}>Skills</Txt>
                            ) : (
                                <SkillIcon />
                            )}
                        </AccordionSummary>
                        {sidebarOpen && (
                            <AccordionDetails sx={{ padding: '10px', alignItems: 'center', justifyItems: 'center' }}>
                                <EditLessonSkillsAccordionDetails
                                    createActivitiesForSkill={createActivitiesForSkill}
                                    createSlidesForSkill={createSlideForSkill}
                                    lessonConfig={{
                                        basic: {
                                            name: lessonName,
                                            summary: lessonSummary,
                                        },
                                        rootSkillId: lesson.rootSkill ?? '',
                                        activities: currentActivities.map((genAct) => ({
                                            id: genAct.tmpId ?? '',
                                            type: genAct.type,
                                            forSkills: genAct.forSkills,
                                        })),
                                        learningObjectives
                                    }}
                                />
                            </AccordionDetails>
                        )}
                    </Accordion>
                </Stack>
            </Grid>

            {/* Main Content */}
            <Grid
                item
                sx={{
                    flex: 1,
                    transition: 'margin-left 0.2s',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                <Stack gap={2}>
                    {/* Header */}
                    <Card elevation={4}>
                        <SimpleHeader
                            leftContent={
                                <Txt variant={'h5'} fontStyle={'italic'}>
                                    {lessonName ? lessonName : 'New Lesson'}
                                </Txt>
                            }
                            rightContent={
                                <Stack direction="row" spacing={2} alignItems="center">
                                    {lastSavedAt && (
                                        <Txt
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ fontSize: '0.8rem' }}
                                        >
                                            Last saved {formatDistanceToNow(lastSavedAt, { addSuffix: true })}
                                        </Txt>
                                    )}
                                    <SaveLessonButton
                                        onSave={handleSave}
                                    />
                                    <IconButton
                                        data-testid="lesson-share-button"
                                        onClick={() => setShareModalOpen(true)}
                                        size="small"
                                    >
                                        <Share />
                                    </IconButton>
                                </Stack>
                            }
                        />
                    </Card>

                    {/* Tabs */}
                    <Card elevation={3}>
                        <Tabs
                            value={activeTab}
                            onChange={(e, newValue) => {
                                setActiveTab(newValue);
                                // Clear notification when switching to tab
                                if (newValue === 'slides') {
                                    if (hasNewSlides) {
                                        // Wait for render then scroll
                                        setTimeout(() => {
                                            contentRef.current?.scrollTo({
                                                top: contentRef.current.scrollHeight,
                                                behavior: 'smooth'
                                            });
                                        }, 100);
                                    }
                                    setHasNewSlides(false);
                                } else if (newValue === 'activities') {
                                    if (hasNewActivities) {
                                        setTimeout(() => {
                                            contentRef.current?.scrollTo({
                                                top: contentRef.current.scrollHeight,
                                                behavior: 'smooth'
                                            });
                                        }, 100);
                                    }
                                    setHasNewActivities(false);
                                }
                            }}
                            aria-label="Tabs"
                            sx={{ height: '50px', minHeight: '50px', overflow: 'visible' }}
                            centered
                        >
                            <Tab
                                icon={
                                    <Stack direction="row" alignItems="center" sx={{ position: 'relative' }}>
                                        {isGeneratingSlide ? (
                                            <CircularProgress
                                                size={15}
                                                sx={{
                                                    color: 'primary.main',
                                                }}
                                            />
                                        ) : (
                                            <Article fontSize="small" />
                                        )}
                                        {hasNewSlides && (
                                            <Badge color="success" badgeContent="New" sx={{ fontSize: '10px' }} />
                                        )}
                                    </Stack>
                                }
                                label="Slides"
                                value={'slides'}
                                sx={{ height: '40px', minHeight: '40px', position: 'relative' }}
                            />
                            <Tab
                                icon={
                                    <Stack direction="row" alignItems="center" sx={{ position: 'relative' }}>
                                        {isGeneratingActivity ? (
                                            <CircularProgress
                                                size={15}
                                                sx={{
                                                    color: 'primary.main',
                                                }}
                                            />
                                        ) : (
                                            <ActivityIcon fontSize="small" />
                                        )}
                                        {hasNewActivities && (
                                            <Badge color="success" badgeContent="New" sx={{ fontSize: '10px' }} />
                                        )}
                                    </Stack>
                                }
                                label="Activities"
                                value={'activities'}
                                sx={{ height: '40px', minHeight: '40px', position: 'relative' }}
                            />
                            <Tab icon={<Preview fontSize="small" />} label="Preview" value={'preview'} sx={{ height: '40px', minHeight: '40px' }} />
                        </Tabs>
                    </Card>

                </Stack>
                {/* Scrollable content area */}
                <Box
                    ref={contentRef}
                    sx={{
                        flex: 1,
                        overflow: 'auto',
                        p: 2
                    }}
                >
                    <Stack gap={2} sx={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                        <CustomTabPanel currentValue={activeTab} value={'slides'}>
                            <LessonEditSlidesTab
                                slides={slides}
                                setSlides={setSlides}
                                isSlidesLoading={isSlidesLoading}
                                generateSlidesForLesson={generateSlidesForLesson}
                                generateSlideForSkill={createSlideForSkill}
                                slidesError={slidesError}
                                rootSkillId={lesson.rootSkill ?? ''}
                            />
                        </CustomTabPanel>

                        <CustomTabPanel currentValue={activeTab} value={'activities'} boxProps={{ width: '100%', sx: { width: '100%' } }}>
                            <LessonEditActivitiesTab
                                currentActivities={currentActivities}
                                setCurrentActivities={setCurrentActivities}
                                createActivitySystemChooseSkill={createActivitySystemChooseSkill}
                                createActivitiesForSkill={createActivitiesForSkill}
                                lessonId={lesson.id}
                            />
                        </CustomTabPanel>
                        <CustomTabPanel currentValue={activeTab} value={'preview'}>
                            <LessonEditPreviewTab
                                currentActivities={currentActivities}
                                slides={slides}
                            />
                        </CustomTabPanel>
                    </Stack>
                </Box>
            </Grid>
        </Grid>

        <ShareModal
            open={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            entityId={lesson.id}
            entityName={lessonName}
            entityType="lesson"
            entityDirectLink={`${window.location.origin}/lessons/${lesson.id}`}
        />
    </>
}