import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";
import {
  generateCourseStructure,
  LessonGroup,
} from "@reasonote/lib-ai/src/lessons";

import {GenerateSkillModulesRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 300 seconds.
export const maxDuration = 800;

const DEFAULT_BATCH_SIZE = 25;

async function batchProcessIds<T>(
    ids: string[],
    queryFn: (batchIds: string[]) => Promise<{ data: T[] | null; error: any }>,
    batchSize: number = DEFAULT_BATCH_SIZE
): Promise<{ data: T[]; error: any }> {
    // Create batches
    const batches: string[][] = [];
    for (let i = 0; i < ids.length; i += batchSize) {
        batches.push(ids.slice(i, i + batchSize));
    }

    try {
        // Process all batches in parallel
        const batchResults = await Promise.all(
            batches.map((batchIds) => queryFn(batchIds))
        );

        // Check for errors in any batch
        const errorResult = batchResults.find(result => result.error);
        if (errorResult) {
            return { data: [], error: errorResult.error };
        }

        // Combine all results
        const results: T[] = batchResults.flatMap(result => result.data || []);
        return { data: results, error: null };
    } catch (error) {
        return { data: [], error };
    }
}

export const { POST } = makeServerApiHandlerV3({
    route: GenerateSkillModulesRoute,
    handler: async (ctx) => {
        const { parsedReq, supabase, rsn, logger, user, ai } = ctx;
        if (!user || !user.rsnUserId) {
            throw new Error('User not authenticated');
        }

        const { rootSkillId } = parsedReq;

        // Update state to indicate module creation has started
        const { error: updateError } = await supabase.from('skill').update({
            processing_state: 'CREATING_MODULES'
        }).eq('id', rootSkillId);

        if (updateError) {
            throw new Error('Failed to update skill state');
        }

        try {
            // Fetch the lesson summary
            const { data: lessonSummary, error: lessonSummaryError } = await supabase
                .from('skill')
                .select('_description')
                .eq('id', rootSkillId)
                .single();

            if (lessonSummaryError) {
                throw new Error('Error fetching lesson summary: ' + lessonSummaryError.message);
            }

            // Fetch the lesson skill
            const { data: lessonSkills, error: lessonSkillsError } = await supabase
                .from('skill')
                .select('*')
                .eq('root_skill_id', rootSkillId)
                .eq('_type', 'lesson');

            if (lessonSkillsError) {
                throw new Error('Error fetching lesson skills: ' + lessonSkillsError.message);
            }

            // Fetch the learning objective ids
            const { data: skillLinks, error: skillLinksError } = await batchProcessIds(
                lessonSkills.map(ls => ls.id),
                async (batchIds) => await supabase
                    .from('skill_link')
                    .select('upstream_skill, downstream_skill, _type')
                    .in('downstream_skill', batchIds)
                    .eq('_type', 'lesson_objective')
            );

            if (skillLinksError) {
                throw new Error('Error fetching skill links: ' + skillLinksError.message);
            }

            // Fetch prerequisite links
            const validLessonIds = lessonSkills.map(ls => ls.id).filter((id): id is string => id != null);
            const { data: prerequisiteLinks, error: prerequisiteLinksError } = await batchProcessIds(
                validLessonIds,
                async (batchIds) => await supabase
                    .from('skill_link')
                    .select('upstream_skill, downstream_skill')
                    .in('downstream_skill', batchIds)
                    .eq('_type', 'lesson_link')
            );

            if (prerequisiteLinksError) {
                throw new Error('Error fetching prerequisite links: ' + prerequisiteLinksError.message);
            }

            // Create a mapping of lesson IDs to their names
            const lessonIdToName = new Map<string, string>();
            lessonSkills.forEach(lesson => {
                if (lesson.id && lesson._name) {
                    lessonIdToName.set(lesson.id, lesson._name);
                }
            });

            // Create a mapping of lesson names to their IDs (for reverse lookup)
            const lessonNameToId = new Map<string, string>();
            lessonSkills.forEach(lesson => {
                if (lesson.id && lesson._name) {
                    lessonNameToId.set(lesson._name, lesson.id);
                }
            });

            // Create a mapping of lesson IDs to their prerequisites
            const lessonIdToPrerequisites = new Map<string, string[]>();
            prerequisiteLinks.forEach(link => {
                if (link.downstream_skill && link.upstream_skill) {
                    const prerequisites = lessonIdToPrerequisites.get(link.downstream_skill) || [];
                    const upstreamName = lessonIdToName.get(link.upstream_skill);
                    if (upstreamName) {
                        prerequisites.push(upstreamName);
                        lessonIdToPrerequisites.set(link.downstream_skill, prerequisites);
                    }
                }
            });

            // Fetch the learning objectives data
            const { data: learningObjectivesData, error: learningObjectivesError } = await batchProcessIds(
                skillLinks.filter(sl => sl._type === 'lesson_objective').map(sl => sl.upstream_skill).filter((id): id is string => id != null),
                async (batchIds) => await supabase
                    .from('skill')
                    .select('*')
                    .in('id', batchIds)
            );

            if (learningObjectivesError) {
                throw new Error('Error fetching learning objectives: ' + learningObjectivesError.message);
            }

            // Create a mapping of lesson IDs to their learning objectives
            const lessonIdToObjectives = new Map<string, string[]>();
            skillLinks.forEach(link => {
                if (link._type === 'lesson_objective' && link.downstream_skill && link.upstream_skill) {
                    const objectives = lessonIdToObjectives.get(link.downstream_skill) || [];
                    const objective = learningObjectivesData.find(lo => lo.id === link.upstream_skill)?._name;
                    if (objective) {
                        objectives.push(objective);
                        lessonIdToObjectives.set(link.downstream_skill, objectives);
                    }
                }
            });

            // Create the lessons array with prerequisites and learning objectives
            const lessons = lessonSkills.map(lesson => {
                if (!lesson.id || !lesson._name) {
                    return null;
                }
                return {
                    lessonName: lesson._name,
                    prerequisites: lessonIdToPrerequisites.get(lesson.id) || [],
                    learningObjectives: lessonIdToObjectives.get(lesson.id) || []
                };
            }).filter((lesson): lesson is LessonGroup => lesson !== null);

            const modules = await generateCourseStructure(ai, lessonSummary._description || '', lessons);

            // Store the modules and submodules in the skill_module table
            for (const module of modules) {
                // Create the module record
                const { data: moduleData, error: moduleError } = await supabase
                    .from('skill_module')
                    .insert({
                        _name: module.moduleName,
                        position: module.position,
                        root_skill_id: rootSkillId,
                        children_ids: null, // Will update after creating submodules
                    })
                    .select()
                    .single();

                if (moduleError) {
                    throw new Error(`Error creating module ${module.moduleName}: ${moduleError.message}`);
                }

                // Create submodule records and collect their IDs
                const submoduleIds: string[] = [];
                for (const submodule of module.subModules) {
                    // Get lesson IDs for this submodule
                    const lessonIds = submodule.lessons
                        .map(lesson => lessonNameToId.get(lesson.lessonName))
                        .filter((id): id is string => id != null);

                    const { data: submoduleData, error: submoduleError } = await supabase
                        .from('skill_module')
                        .insert({
                            _name: submodule.subModuleName,
                            position: submodule.position || 1,
                            root_skill_id: rootSkillId,
                            children_ids: lessonIds,
                        })
                        .select()
                        .single();

                    if (submoduleError) {
                        throw new Error(`Error creating submodule ${submodule.subModuleName}: ${submoduleError.message}`);
                    }

                    submoduleIds.push(submoduleData.id);
                }

                // Update the module with submodule IDs
                const { error: updateError } = await supabase
                    .from('skill_module')
                    .update({ children_ids: submoduleIds })
                    .eq('id', moduleData.id);

                if (updateError) {
                    throw new Error(`Error updating module ${module.moduleName} with submodule IDs: ${updateError.message}`);
                }
            }

            // Update state to SUCCESS only if everything succeeded
            await supabase.from('skill').update({
                processing_state: 'SUCCESS'
            }).eq('id', rootSkillId);

            return { modules };

        } catch (error) {
            // Log the full error for debugging
            console.error('Error in module creation:', error);

            // Set failure state and rethrow to be handled by the API wrapper
            await supabase.from('skill').update({
                processing_state: 'MODULE_CREATION_FAILED'
            }).eq('id', rootSkillId);

            throw error;
        }
    }
});