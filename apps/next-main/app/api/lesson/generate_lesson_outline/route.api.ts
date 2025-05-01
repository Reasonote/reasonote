import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";
import {generateLessonParts} from "@reasonote/lib-ai/src/lessons";

import {GenerateLessonOutlineRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 300 seconds.
export const maxDuration = 300;

export const { POST } = makeServerApiHandlerV3({
    route: GenerateLessonOutlineRoute,
    handler: async (ctx) => {
        const { parsedReq, supabase, rsn, logger, user, ai } = ctx;
        if (!user || !user.rsnUserId) {
            throw new Error('User not authenticated');
        }

        const { lessonSkillId, numActivitiesPerPart } = parsedReq;

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

        // Generate the lesson outline
        const lesson = await generateLessonParts(ai, lessonWithPrerequisites);

        // Save the lesson to the database
        const { data: lessonData, error: lessonError } = await supabase
            .from('lesson')
            .insert({
                _name: lessonWithPrerequisites.lessonName,
                _summary: lesson.summary,
                metadata: JSON.stringify({ numParts: lesson.partOutlines.length, numActivitiesPerPart }),
                for_user: user.rsnUserId,
                root_skill: lessonSkillId,
            })
            .select()
            .single();

        if (lessonError) {
            throw new Error('Error creating lesson: ' + lessonError.message);
        }

        return {
            lessonId: lessonData.id,
            lessonParts: lesson.partOutlines,
        };
    }
});