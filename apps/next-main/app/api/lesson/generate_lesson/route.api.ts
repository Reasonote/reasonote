import {z} from "zod";

import {
  makeArrayStreamApiRoute,
} from "@/app/api/helpers/apiHandlers/makeArrayStreamApiHandler";
import {
  getActivityTypeServer,
} from "@/components/activity/activity-type-servers/getActivityTypeServer";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {ActivityTypesPublic} from "@reasonote/core/src/interfaces/ActivityType";
import {ActivityGeneratorV2} from "@reasonote/lib-ai/src/ActivityGeneratorV2";
import {generateLessonActivities} from "@reasonote/lib-ai/src/lessons";

import {GenerateLessonRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 300 seconds.
export const maxDuration = 300;

type StreamItem = z.infer<typeof GenerateLessonRoute.responseSchema>;

export const { POST } = makeArrayStreamApiRoute({
    route: GenerateLessonRoute,
    handler: async function* ({ parsedReq, supabase, rsn, logger, user, ai }): AsyncGenerator<StreamItem> {
        if (!user || !user.rsnUserId) {
            throw new Error('User not authenticated');
        }

        const { lessonId, lessonParts, lessonSkillId, numActivitiesPerPart } = parsedReq;

        // Fetch the lesson skill
        const { data: lessonSkillData, error: lessonSkillError } = await supabase
            .from('skill')
            .select('*')
            .eq('id', lessonSkillId)
            .single();

        if (lessonSkillError) {
            throw new Error('Error fetching lesson skill: ' + lessonSkillError.message);
        }

        // Fetch the lessons learning objective ids
        const { data: lessonSkillLearningObjectives, error: lessonSkillLearningObjectivesError } = await supabase
            .from('skill_link')
            .select('*')
            .eq('downstream_skill', lessonSkillId)
            .eq('_type', 'lesson_objective');

        if (lessonSkillLearningObjectivesError) {
            throw new Error('Error fetching lesson skill learning objectives: ' + lessonSkillLearningObjectivesError.message);
        }

        const lessonSkillMetadata = typeof lessonSkillData.metadata === 'string'
            ? JSON.parse(lessonSkillData.metadata)
            : lessonSkillData.metadata;

        const learningObjectiveIds = lessonSkillLearningObjectives.map(lo => lo.upstream_skill);

        // Fetch the learning objectives data
        const { data: learningObjectivesData, error: learningObjectivesError } = await supabase
            .from('skill')
            .select('*')
            .in('id', learningObjectiveIds);

        if (learningObjectivesError) {
            throw new Error('Error fetching learning objectives: ' + learningObjectivesError.message);
        }

        // Fetch all of the reference sentences for the learning objectives
        const { data: referenceSentencesData, error: referenceSentencesError } = await supabase
            .from('reference')
            .select('*')
            .in('id', learningObjectivesData.flatMap(lo => lo.reference_ids));

        if (referenceSentencesError) {
            throw new Error('Error fetching reference sentences: ' + referenceSentencesError.message);
        }

        const lessonWithPrerequisites = {
            lessonName: lessonSkillData._name,
            expectedDurationMinutes: lessonSkillMetadata?.expectedDurationMinutes ?? 15,
            cluster: learningObjectivesData.map(s => {
                const metadata = typeof s.metadata === 'string'
                    ? JSON.parse(s.metadata)
                    : s.metadata;
                return {
                    referenceSentences: referenceSentencesData.filter(rs => s.reference_ids?.includes(rs.id)).map(sentence => ({
                        sentence: sentence.raw_content,
                        isExactMatch: sentence.is_exact,
                        sourceChunkId: sentence.rsn_vec_id,
                        sourceDocumentId: sentence._ref_id
                    })),
                    chunkIds: s.rsn_vec_ids ?? [],
                    learningObjective: s._name,
                    ids: [s.id],
                    allSubObjectives: metadata?.allSubObjectives ?? [],
                }
            }),
            chunkIds: [],
            prerequisiteLessons: [],
        }

        // Get the generator for lesson activities
        const activityGenerator = new ActivityGeneratorV2({
            ai,
            activityTypeServers: (await Promise.all(ActivityTypesPublic.map(at => getActivityTypeServer({ activityType: at })))).filter(notEmpty)
        });
        const lessonActivityStream = generateLessonActivities(lessonParts, lessonWithPrerequisites, activityGenerator, numActivitiesPerPart);

        console.log('Starting to generate activities...');

        const activities: { id: string, type: string }[] = [];

        // Process activities one by one as they are generated
        console.log('[GenerateLesson] Starting to process activities...');

        // Properly handle the async generator
        for await (const { activityConfig, skill } of lessonActivityStream) {
            console.log('[GenerateLesson] Processing activity:', activityConfig.type);
            // Save the activity immediately
            const { data: activityData, error: activityError } = await supabase
                .from('activity')
                .insert({
                    _name: activityConfig.type,
                    _type: activityConfig.type,
                    type_config: activityConfig,
                    source: "ai-generated",
                    generated_for_user: user?.rsnUserId,
                    generated_for_skill_paths: [[skill.id]]
                })
                .select()
                .single();

            if (activityError) {
                console.error('[GenerateLesson] Error creating activity:', activityError);
                throw new Error('Error creating activity: ' + activityError.message);
            }

            console.log('[GenerateLesson] Activity saved:', activityData.id);

            // Save the activity to the lesson immediately
            const { data: lessonActivityData, error: lessonActivityError } = await supabase
                .from('lesson_activity')
                .insert({
                    lesson: lessonId,
                    activity: activityData.id,
                    position: activities.length + 1,
                })
                .select()
                .single();

            if (lessonActivityError) {
                console.error('[GenerateLesson] Error creating lesson activity:', lessonActivityError);
                throw new Error('Error creating lesson activity: ' + lessonActivityError.message);
            }

            console.log('[GenerateLesson] Lesson activity saved:', lessonActivityData.id);

            // Add the activity ID to our list and yield update
            if (lessonActivityData.activity) {
                activities.push({ id: lessonActivityData.activity, type: activityConfig.type });
                console.log('[GenerateLesson] Yielding activity update, total activities:', activities.length);
            }

            yield {
                activities,
            };
        }
    }
});