import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";
import {SupabaseDocDB} from "@reasonote/lib-ai/src/docdb/SupabaseDocDB";
import {DocumentToDag} from "@reasonote/lib-ai/src/DocumentToDag";

import {GenerateRootDAGRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 300 seconds.
export const maxDuration = 800;

export const { POST } = makeServerApiHandlerV3({
    route: GenerateRootDAGRoute,
    handler: async (ctx) => {
        const { parsedReq, ai, supabase } = ctx;
        const { rootSkillId, threshold } = parsedReq;

        if (!rootSkillId) {
            throw new Error('rootSkillId is required');
        }

        // Update the skill to indicate that the DAG creation has started
        const { data: rootSkillData, error: rootSkillError } = await supabase.from('skill').update({
            processing_state: 'CREATING_DAG'
        }).eq('id', rootSkillId).select('*').single();

        if (rootSkillError || !rootSkillData) {
            throw new Error('Skill not found');
        }

        try {
            const { data: resourceData, error: resourceError } = await supabase.from('resource').select('*').eq('parent_skill_id', rootSkillId).single();
            if (resourceError || !resourceData) {
                throw new Error('Resource not found');
            }
            if (!resourceData.child_page_id) {
                throw new Error('Resource does not have a child page id');
            }
            const docId = resourceData.child_page_id;
            const metadata = typeof rootSkillData.metadata === 'string'
                ? JSON.parse(rootSkillData.metadata)
                : rootSkillData.metadata;
            const summary = {
                summary: rootSkillData._description ?? '',
                learningObjectives: metadata?.learningObjectives ?? [],
            };

            const docDB = new SupabaseDocDB({ ai, supabase });

            const dagCreator = new DocumentToDag(ai);
            const lessonGroups = await dagCreator.createDag({ documentId: docId, docDB, summary, threshold });

            const learningObjectives = lessonGroups.flatMap(lg => lg.cluster);

            // Save to database
            // Create a map to store reference sentence to reference ID mapping
            const referenceMap = new Map<string, string>();

            // Save all references first
            const referencesToCreate = learningObjectives.flatMap(lo => lo.referenceSentences.map(ref => ({
                raw_content: ref.sentence,
                is_exact: ref.isExactMatch,
                rsn_vec_id: ref.sourceChunkId,
                _ref_id: ref.sourceDocumentId
            })));

            if (referencesToCreate.length > 0) {
                const { data: referencesData, error: referencesError } = await supabase
                    .from('reference')
                    .insert(referencesToCreate)
                    .select('id, raw_content');

                if (referencesError) throw new Error(`Failed to save references: ${referencesError}`);
                if (!referencesData) throw new Error('No data returned when creating references');

                // Create mapping of sentence to reference ID
                referencesData.forEach(ref => {
                    referenceMap.set(ref.raw_content, ref.id);
                });
            }

            // Save each learning objective as a skill and get back the IDs
            const skillsToCreate = learningObjectives.map(lo => {
                // Get reference IDs for this learning objective
                const referenceIds = lo.referenceSentences
                    .map(ref => referenceMap.get(ref.sentence))
                    .filter((id): id is string => id !== undefined);

                return {
                    _name: lo.learningObjective,
                    metadata: {
                        allSubObjectives: lo.allSubObjectives
                    },
                    _type: 'learning_objective',
                    root_skill_id: rootSkillId,
                    reference_ids: referenceIds,
                    rsn_vec_ids: lo.chunkIds
                };
            });

            const { data: skillsData, error: skillsError } = await supabase.from('skill').insert(skillsToCreate).select('id, _name');

            if (skillsError) throw new Error(`Failed to save skills: ${skillsError}`);
            if (!skillsData) throw new Error('No data returned when creating skills');

            // Create a mapping from learning objective names to their skill IDs
            const objectiveToSkillId = new Map(
                skillsData.map(skill => [skill._name, skill.id])
            );

            // Save lessons as skills too
            const lessonsToCreate = lessonGroups.map(lesson => ({
                _name: lesson.lessonName,
                _type: 'lesson',
                root_skill_id: rootSkillId,
                reference_ids: [...new Set(lesson.cluster.flatMap(obj => obj.referenceSentences.map(ref => referenceMap.get(ref.sentence))).filter((id): id is string => id !== undefined))],
                rsn_vec_ids: lesson.chunkIds,
                metadata: {
                    expected_duration_minutes: lesson.expectedDurationMinutes
                }
            }));

            const { data: lessonsData, error: lessonsError } = await supabase.from('skill').insert(lessonsToCreate).select('id, _name');

            if (lessonsError) throw new Error(`Failed to save lessons: ${lessonsError}`);
            if (!lessonsData) throw new Error('No data returned when creating lessons');

            // Create a mapping from lesson names to their skill IDs
            const lessonToSkillId = new Map(
                lessonsData.map(lesson => [lesson._name, lesson.id])
            );

            // Save links from learning objectives to lessons
            const lessonObjectiveLinks = Array.from(new Map(
                lessonGroups.flatMap(lesson =>
                    lesson.cluster.map(obj => ({
                        downstream_skill: lessonToSkillId.get(lesson.lessonName),
                        upstream_skill: objectiveToSkillId.get(obj.learningObjective),
                        _type: 'lesson_objective'
                    }))
                )
                .filter(link => link.upstream_skill && link.downstream_skill)
                // Use composite key for deduplication
                .map(link => [`${link.downstream_skill}-${link.upstream_skill}`, link])
            ).values());

            console.log('Attempting to save lesson objective links:', {
                count: lessonObjectiveLinks.length,
                sampleLinks: lessonObjectiveLinks.slice(0, 2),
                lessonNames: [...lessonToSkillId.keys()].slice(0, 2),
                objectiveNames: [...objectiveToSkillId.keys()].slice(0, 2)
            });

            const { error: lessonObjectiveLinksError } = await supabase.from('skill_link').insert(lessonObjectiveLinks);

            if (lessonObjectiveLinksError) {
                console.error('Warning: Failed to save lesson objective links:', {
                    error: lessonObjectiveLinksError,
                    code: lessonObjectiveLinksError.code,
                    details: lessonObjectiveLinksError.details,
                    hint: lessonObjectiveLinksError.hint
                });
            }

            const lessonLinks = Array.from(new Map(
                lessonGroups.flatMap(lesson =>
                    lesson.prerequisites.map(prerequisite => ({
                        downstream_skill: lessonToSkillId.get(lesson.lessonName),
                        upstream_skill: lessonToSkillId.get(prerequisite),
                        _type: 'lesson_link'
                    }))
                )
                .filter(link => link.upstream_skill && link.downstream_skill)
                // Use composite key for deduplication
                .map(link => [`${link.downstream_skill}-${link.upstream_skill}`, link])
            ).values());

            console.log('Attempting to save lesson links:', {
                count: lessonLinks.length,
                sampleLinks: lessonLinks.slice(0, 2),
                lessonNames: [...lessonToSkillId.keys()].slice(0, 2)
            });

            const { error: lessonLinksError } = await supabase.from('skill_link').insert(lessonLinks);

            if (lessonLinksError) {
                console.error('Warning: Failed to save lesson links:', {
                    error: lessonLinksError,
                    code: lessonLinksError.code,
                    details: lessonLinksError.details,
                    hint: lessonLinksError.hint
                });
            }
            // Save links from lessons to the root skill
            const lessonsThatArePrerequisites = new Set(
                lessonGroups.flatMap(lesson => lesson.prerequisites)
            );

            const rootSkillLinks = Array.from(new Map(
                lessonGroups
                    .filter(lesson => !lessonsThatArePrerequisites.has(lesson.lessonName))
                    .map(lesson => ({
                        downstream_skill: rootSkillId,
                        upstream_skill: lessonToSkillId.get(lesson.lessonName),
                        _type: 'lesson_root_skill'
                    }))
                    .filter(link => link.upstream_skill)
                    // Use composite key for deduplication
                    .map(link => [`${link.downstream_skill}-${link.upstream_skill}`, link])
            ).values());

            console.log('Attempting to save root skill links:', {
                count: rootSkillLinks.length,
                sampleLinks: rootSkillLinks.slice(0, 2),
                rootSkillId,
                lessonsThatArePrereqs: [...lessonsThatArePrerequisites].slice(0, 2)
            });

            const { error: lessonRootSkillLinksError } = await supabase.from('skill_link').insert(rootSkillLinks);

            if (lessonRootSkillLinksError) {
                console.error('Warning: Failed to save lesson root skill links:', {
                    error: lessonRootSkillLinksError,
                    code: lessonRootSkillLinksError.code,
                    details: lessonRootSkillLinksError.details,
                    hint: lessonRootSkillLinksError.hint
                });
            }

            // Update state to DAG_GENERATED only if everything succeeded
            await supabase.from('skill').update({
                processing_state: 'DAG_GENERATED'
            }).eq('id', rootSkillId);

            return { lessonSkillIds: lessonsData.map(lesson => lesson.id) };

        } catch (error) {
            // Log the full error for debugging
            console.error('Error in DAG creation:', error);

            // Set failure state and rethrow to be handled by the API wrapper
            await supabase.from('skill').update({
                processing_state: 'DAG_CREATION_FAILED'
            }).eq('id', rootSkillId);

            throw error;
        }
    }
}); 