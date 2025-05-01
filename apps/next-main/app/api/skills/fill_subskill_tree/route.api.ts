import _ from "lodash";
import {NextResponse} from "next/server";

import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {DivideAndConquerTreeMaker} from "@reasonote/ai-generators";
import {
  AIExtraContext,
} from "@reasonote/ai-generators/src/utils/AIExtraContext";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {SkillLevelsList} from "../reorganize_tree/routeSchema";
import {FillSubskillTreeRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 300;

export const {
    POST,
    handler: FillSubskillTreeRouteHandler,
} = makeServerApiHandlerV3({
    route: FillSubskillTreeRoute,
    handler: async (ctx) => {
        const { req, parsedReq, supabase, logger, user, ai } = ctx;
        const { sourceActivities } = parsedReq;
        const rsnUserId = user?.rsnUserId;

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 404 });
        }

        // Check if skill is part of a course that the user has access to
        const { data: courseData } = await supabase
            .rpc('get_courses_for_user', {
                p_principal_id: rsnUserId,
            })
            .eq('course_root_skill', parsedReq.skill.rootSkillId ?? parsedReq.skill.id);

        if (courseData && courseData.length > 0) {
            if (!courseData.some((course) => course.permissions?.includes('course.UPDATE'))) {
                return NextResponse.json({
                    error: 'You can only expand skill trees for skills in courses you have edit access to!'
                }, { status: 403 });
            }
        }

        // If the skill has a root skill ID, use that.
        // Otherwise, if the skill has parent skills, the root skill is the first parent skill.
        // Otherwise, the root skill is the skill itself.
        var parentSkillIds = _.uniq(
            [
                parsedReq.skill.rootSkillId,
                ...(parsedReq.skill.parentSkillIds ?? []),
                parsedReq.skill.id,
            ].filter(notEmpty)
        );

        const rootSkillId = parentSkillIds[0];

        // Fetch skill tree data for the ROOT SKILL!
        const { data: treeData, error: treeError } = await supabase.rpc('get_linked_skills', {
            input_skill_id: rootSkillId,
            user_id: rsnUserId,
            direction: 'upstream'
        });

        function recursivelyFindParentSkillIds(skillId: string, thisTreeData: typeof treeData): string[] {
            const parentSkill = thisTreeData?.find((sk) => sk.skill_links?.some((sl: any) => sl?.to === skillId));
            // If no parent, we're done.
            if (!parentSkill) {
                return [];
            }

            return [...recursivelyFindParentSkillIds(parentSkill.skill_id, thisTreeData), parentSkill.skill_id];
        }

        // console.debug(`Parent skill ids before: ${JSON.stringify(parentSkillIds, null, 2)}`);

        // Now, let's assemble a list of the actual parentids based on recursively traversing the tree trying to find the target skill.
        parentSkillIds = await recursivelyFindParentSkillIds(parsedReq.skill.id, treeData);

        // console.debug(`Parent skill ids after: ${JSON.stringify(parentSkillIds, null, 2)}`);

        if (!treeData) {
            return NextResponse.json({
                error: `Error fetching skill tree for skill ${parsedReq.skill.id}! (siskillTreeError: ${JSON.stringify(treeError, null, 2)})`
            }, { status: 500 });
        }

        const skillName = treeData?.find((sk) => sk.skill_id === parsedReq.skill.id)?.skill_name;
        const skillPathAIContext = (await ai.prompt.skills.getSkillPathAiContext({
            ids: [...parentSkillIds, parsedReq.skill.id],
        })).data;

        if (!skillName) {
            return NextResponse.json({
                error: `Skill ${parsedReq.skill.id} not found in skill tree!`
            }, { status: 404 });
        }


        const treeDataFromSelectedSkill = treeData.find((sk) => sk.skill_id === parsedReq.skill.id);

        if (treeDataFromSelectedSkill?.skill_links?.length ?? 0 > 0) {
            return NextResponse.json({
                newSkillIds: [],
                message: 'Tree already exists! We will not generate a new one. If you want to improve the existing tree, you can call one of the other tree routes, such as `add_to_skill_tree`.'
            }, { status: 200 });
        }

        // TODO: This assumes we're generating the subskill tree *for the current user*.
        // This may be the default behavior, but we should have an argument to specify if we're generating a skill
        // Tree for a different user.
        const userSkillDataString = await ai.prompt.skills.formatUserSkillData({
            skillId: parsedReq.skill.id,
            rsnUserId,
            skillIdPath: parentSkillIds,
        });

        // TODO: this only considers the current skill and its parents, 
        // but the resources in the rest of the tree should also be considered.
        const resourcesContextString = await ai.prompt.skills.formatAllResources({
            skillId: parsedReq.skill.id,
            parentSkillIds,
        });

        const extraContext = [
            ...(parsedReq.extraContext ?? []).map((ctx) => new AIExtraContext({
                title: ctx.title,
                description: ctx.description ?? undefined,
                body: ctx.body ?? undefined,
            })),
            new AIExtraContext({
                title: 'UserSkillData',
                description: 'The user\'s skill data for the skill we are generating the subskill tree for.',
                body: userSkillDataString,
            }),
            new AIExtraContext({
                title: 'RelevantResources',
                description: 'The relevant resources for the skill we are generating the subskill tree for.',
                body: resourcesContextString,
            }),
        ];

        const treeMaker = new DivideAndConquerTreeMaker({
            ai,
            rootSkill: skillPathAIContext ?? skillName,
            numThreads: 10,
            maxDepth: parsedReq.maxDepth,
            maxSubskillsPerSkill: parsedReq.maxSubskillsPerSkill,
            relevantDocuments: parsedReq.relevantDocuments ?? undefined,
            extraContext,
        });

        await treeMaker.aiInitialize();

        const visitedSkillNames = new Set<string>();
        const createdSkills = new Map<string, { id: string, name: string }>();

        // Recurse from top of tree (skill with same id as skill_name).
        // Push and pop from skillPathIds along the way so we can set generated_from_skill_path.
        const recursivelyCreateSkills = async (skillName: string, skillId: string): Promise<void> => {
            // Don't recurse if we've already handled this skill.
            if (visitedSkillNames.has(skillName)) {
                return;
            }
            visitedSkillNames.add(skillName);

            // console.log(`Visiting skill ${skillName} with id ${skillId}`);

            // Find Prereq / Upstream skills in treeMaker
            const immChildSkills = treeMaker.getImmediatePrereqs(skillName).map((sk) => ({
                // They're called id in the treeMaker, but they're actually just the name.
                name: sk.id,
                order: sk.order,
            }));

            // console.log(`Immediate child skills: ${JSON.stringify(immChildSkills, null, 2)}`);

            const skillsToCreate = immChildSkills
                .map((sk) => ({
                    _name: sk.name,
                    root_skill_id: rootSkillId,
                    metadata: {
                        genData: {
                            topicName: treeMaker.nodes.find((n) => n.id === sk.name)?.topicName,
                            expertQuestions: treeMaker.nodes.find((n) => n.id === sk.name)?.questions?.map((q) => ({
                                question: q,
                                answer: null
                            })),
                        }
                    },
                }))
                .filter((sk) => !createdSkills.has(sk._name));

            // console.log(`Skills to create: ${JSON.stringify(skillsToCreate, null, 2)}`);

            if (skillsToCreate.length === 0) {
                return;
            }

            // Create any child skills that don't already exist.
            const { data: childSkillData, error: childSkillError } = await supabase.from('skill')
                .insert(skillsToCreate)
                .select('id, _name');

            // Add the new skills to the map.
            childSkillData?.forEach((sk) => {
                createdSkills.set(sk._name, { id: sk.id, name: sk._name });
            });

            if (!childSkillData) {
                throw new Error(`Error creating child skills for skill ${skillName}! (childSkillError: ${JSON.stringify(childSkillError, null, 2)})`);
            }

            // console.log(createdSkills.entries());

            // Create `skill_link` to those skills, along with level
            const { data: skillLinkData, error: skillLinkError } = await supabase.from('skill_link').insert(immChildSkills.map((sk) => {
                const childSkill = createdSkills.get(sk.name);
                if (!childSkill) {
                    throw new Error(`Skill ${sk.name} not found after ostensibly successfully creating it! This should not happen.`);
                }

                // Get the level for the childSkill based on the list we got back before.
                const level = SkillLevelsList[sk.order] ?? "INTRO";
                return {
                    downstream_skill: skillId,
                    upstream_skill: childSkill.id,
                    metadata: {
                        levelOnParent: level,
                    },
                }
            })).select('id')

            if (!skillLinkData) {
                throw new Error(`Error creating skill links for skill ${skillName}! (skillLinkError: ${JSON.stringify(skillLinkError, null, 2)})`);
            }

            // Recursively call this function for each child skill
            await Promise.all(immChildSkills.map(async (sk) => {
                const childSkill = createdSkills.get(sk.name);
                if (!childSkill) {
                    throw new Error(`Child skill ${sk.name} not found after ostensibly successfully creating it! This should not happen.`);
                }
                return await recursivelyCreateSkills(sk.name, childSkill.id);
            }));
        }

        await recursivelyCreateSkills(skillPathAIContext ?? skillName, parsedReq.skill.id);

        return NextResponse.json({
            newSkillIds: Array.from(createdSkills?.values() ?? []).map((sk) => sk.id),
            message: `Created ${createdSkills.size} skills!`
        }, { status: 200 });
    }
})
