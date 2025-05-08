import _ from "lodash";
import {NextResponse} from "next/server";
import {z} from "zod";

import {
  notEmpty,
  trimAllLines,
} from "@lukebechtel/lab-ts-utils";
import {SimpleSkillTreeFactory} from "@reasonote/lib-ai-common";

import {RouteHandler} from "../../helpers/RouteHandler";
import {SkillsAddToSkillTreeRoute} from "./routeSchema";

export const AddToSkillTreeRouteHandler: RouteHandler<typeof SkillsAddToSkillTreeRoute> = async (ctx) => {
    const { req, parsedReq, supabase, logger, user, ai } = ctx;

    const rsnUserId = user?.rsnUserId

    if (!rsnUserId) {
        return NextResponse.json({
            error: 'User not found!'
        }, { status: 404 });
    }


    // Fetch the skill that we're adding.
    const parentSkills = parsedReq.skill.parentSkillIds ? (await supabase.from('skill').select('id, _name').in('id', parsedReq.skill.parentSkillIds).then(({ data }) => data))?.filter(notEmpty) : undefined;
    const parentSkillsOrderd = _.sortBy(parentSkills, (skill) => {
        return parsedReq.skill.parentSkillIds?.indexOf(skill.id);
    })


    // Get the initial skill.
    const initialSkill = (await supabase.from('skill').select('*').eq('id', parsedReq.skill.id).single()).data;

    const root_skill_id = parentSkills?.[0]?.id ?? initialSkill?.root_skill_id;

    // Check if skill is part of a course that the user has access to
    const { data: courseData } = await supabase
        .rpc('get_courses_for_user', {
            p_principal_id: rsnUserId,
        })
        .eq('course_root_skill', root_skill_id ?? parsedReq.skill.id);

    if (courseData && courseData.length > 0) {
        if (!courseData.some((course) => course.permissions?.includes('course.UPDATE'))) {
            return NextResponse.json({
                error: 'You can only expand skill trees for skills in courses you have edit access to!'
            }, { status: 403 });
        }
    }

    // If the input does not have an id, we need to create it.
    let skillId: string | undefined;
    if (!parsedReq.skill.id) {
        logger.log('Skill does not have an id, creating it...');
        skillId = (await supabase.from('skill').insert({
            _name: parsedReq.skill.name ?? '',
            root_skill_id: root_skill_id,
        }).select('id, _name, _description').single()).data?.id;
    }
    else {
        skillId = parsedReq.skill.id;
    }

    if (!skillId) {
        throw new Error(`Failed to get or create skill ${parsedReq.skill.name}!`)
    }

    const { data: treeData, error: treeError } = await supabase.rpc('get_linked_skills_with_scores', {
        input_skill_id: skillId,
        user_id: rsnUserId,
    })

    // Debug check -- look for any skills that are duplicates
    const duplicateSkills = treeData?.filter((sk) => treeData?.find((tsk) => tsk.skill_name.toLowerCase().trim() === sk.skill_name.toLowerCase().trim() && tsk.skill_id !== sk.skill_id));
    if (duplicateSkills?.length) {
        logger.warn(`Duplicate skills found in tree: ${JSON.stringify(duplicateSkills.map((sk) => sk.skill_name), null, 2)}`);
    }

    if (!treeData) {
        return NextResponse.json({
            error: `Error fetching skill tree for skill ${skillId}! (siskillTreeError: ${JSON.stringify(treeError, null, 2)})`
        }, { status: 500 });
    }

    const skillsToAddWithIds = parsedReq.skillsToAdd?.filter((sk) => sk.id) ?? [];

    console.log('skillsToAddWithoutIds Pre Filter: ', parsedReq.skillsToAdd?.filter((sk) => !sk.id));
    const skillsToAddWithoutIds = parsedReq.skillsToAdd
        ?.filter((sk) => !sk.id)
        ?.filter((sk) => !treeData.find((tsk) => tsk.skill_name.toLowerCase().trim() === sk.name?.toLowerCase().trim()))
         ?? 
        [];
    console.log('skillsToAddWithoutIds Post Filter: ', skillsToAddWithoutIds);

    console.log(`skillsToAddWithIds: ${JSON.stringify(skillsToAddWithIds, null, 2)}`);
    console.log(`skillsToAddWithoutIds: ${JSON.stringify(skillsToAddWithoutIds, null, 2)}`);

    const skillsToAddWithIdsFetched = (await supabase.from('skill').select('id, _name, _description').in('id', skillsToAddWithIds.map((sk) => sk.id)))?.data
        ?? [];


    const skillsToAddWithoutIdsCreated = (
        await supabase.from('skill').insert(
            skillsToAddWithoutIds
                // Don't create skills that are already in the tree.
                .filter((sk) => !treeData.find((tsk) => tsk.skill_name.toLowerCase().trim() === sk.name?.toLowerCase().trim()))
                .map((sk) => ({
                    _name: sk.name ?? '',
                    _description: sk.description,
                    root_skill_id
                }))
                .filter(notEmpty)
        )
            .select('id, _name, _description'))?.data ?? [];

    var allSkillsToAdd = [
        ...skillsToAddWithIdsFetched,
        ...skillsToAddWithoutIdsCreated,
    ]

    logger.debug(`allSkillsToAdd: ${JSON.stringify(allSkillsToAdd, null, 2)}`);

    // Filter the skills by those that aren't already in the tree.
    // TODO: this is done by name...
    allSkillsToAdd = allSkillsToAdd.filter((sk) => !treeData.find((tsk) => tsk.skill_name.toLowerCase().trim() === sk._name.toLowerCase().trim()))


    const simpleTree = SimpleSkillTreeFactory.fromSkillsWithScores({
        skillsWithScores: treeData,
        skillId,
    });


    // If there is a snip that references this skill_id, or any of its parents, fetch those here too.
    const snipDatas = await supabase.from('snip').select('id, _name, text_content').in('root_skill', [skillId, ...parentSkillsOrderd.map((sk) => sk.id)]).then(({ data }) => data);

    const skillTreeAsString = SimpleSkillTreeFactory.toAiStringNoLevels({ skillTree: simpleTree, indent: 0 });


    // logger.debug({skillTreeAsString})

    const parentContextString = parentSkillsOrderd ? `In the context of: ${parentSkillsOrderd.map((skl) => skl._name).join(',')}` : '';

    if (allSkillsToAdd.length < 1) {
        console.log('No skills to add, skipping...');
        return {
            
            skillsAdded: []
        }
    }

    const aiResult = await ai.genObject({
        prompt: trimAllLines(`
            # YOUR ROLE
            You are very good at organizing trees of knowledge, and you will help the user add new skills to a knowledge tree they are building.
            
            The user will provide you with several skills to add to the tree for "${simpleTree.skill_name}" ${parentContextString}

            ${snipDatas?.length ? `
                Several Relevant documents to the skill have been provided as context, which define what the skill covers.
            ` : ''}

            For each skill that you create subskills for, you should ensure you label the skills as the correct level based on the DIRECT parent.

            -----------------------------------

            # EXAMPLE
            Lets's say you were given the following tree:

            ## EXAMPLE INPUT
            \`\`\`
            Math
            -- Arithmetic
            ------ Addition
            -------- Adding two numbers
            -------- Adding negative numbers
            ------ Subtraction
            \`\`\`


            And you're asked to place the following skills in that tree:
            - "Adding three numbers"
            - "Multiplication"
            - "Calculus"
            - "Multivariable Calculus"
            - "Lebesgue Integration"
            
            ## EXAMPLE OUTPUT
            Then you might output something like:
            
            \`\`\`
            {
                newSkills: [
                    {
                        skillName: "Adding three numbers",
                        level: "INTRO",
                        parent: "Addition"
                    },
                    {
                        skillName: "Multiplication",
                        level: "INTRO",
                        parent: "Math"
                    },
                    {
                        skillName: "Calculus",
                        level: "ADVANCED",
                        parent: "Math"
                    },
                    {
                        skillName: "Multivariable Calculus",
                        level: "ADVANCED",
                        parent: "Calculus"
                    },
                    {
                        skillName: "Lebesgue Integration",
                        level: "MASTER",
                        parent: "Calculus"
                    }
                ]
            }
            \`\`\`

            This would put the skill "Adding three numbers" under the skill "Addition" at the INTRO level,
            "Calculus" under the skill "Math" at the ADVANCED level, and so on.

            -----------------------------------

            # CONTEXT
            ## EXISTING SKILL TREE
            Provided, you can see that the skill "${simpleTree.skill_name}" (${parentContextString}) is broken down into the following skills:
            
            ${skillTreeAsString}

            ${snipDatas?.length ? `
                ## RELEVANT DOCUMENTS
                ${snipDatas.map((snip) => `
                    ### ${snip._name}
                    ${snip.text_content}
                `).join('\n')}
            ` : ''}

            # FINAL NOTES
            - DO NOT create new skills, only add the ones that the user requests you add.
        `),
        functionName: "add_skills_to_tree",
        functionDescription: "Add the skills that were requested to the tree. DO NOT CREATE NEW SKILLS UNLESS THEY ARE ALONG THE PATH.",
        schema: z.object({
            skills: z.array(z.object({
                skillName: z.string().describe('The name of the skill to add (From the list of skills that were given to you)'),
                level: z.enum(['INTRO', 'BASIC', 'INTERMEDIATE', 'ADVANCED', 'MASTER']).describe('The level of the skill on its parent.'),
                parent: z.string().describe('The parent skill.')
            }))
        }),
        messages: [
            {
                role: 'user',
                content: `
                Please add these skills to the tree, in the correct place, and be careful! Thank you!

                ${allSkillsToAdd?.map((sk) => `
                    - ${sk._name ?? ''}: ${sk._description ?? ''}
                `).join('\n')}
                `
            }
        ],
    })

    // TODO: replace this back...
    const outSkills = aiResult.object?.skills;

    logger.debug(`outSkills: ${JSON.stringify(outSkills, null, 2)}`);

    // Refetch the tree data to get the new skills.
    const { data: treeDataWithNewSkills } = await supabase.rpc('get_linked_skills_with_scores', {
        input_skill_id: skillId,
        user_id: rsnUserId,
    })

    if (!treeDataWithNewSkills) {
        throw new Error(`Error fetching new skills from AI! (aiResult: ${JSON.stringify(aiResult, null, 2)})`)
    }

    const getSkillFromCaches = (name: string) => {
        const skillFromTreeData = treeDataWithNewSkills?.find((skill) => skill.skill_name.toLowerCase().trim() === name.toLowerCase().trim());
        if (skillFromTreeData) {
            return {
                id: skillFromTreeData.skill_id,
                _name: skillFromTreeData.skill_name,
                _description: null,
            }
        }
        else {
            return allSkillsToAdd.find((skill) => skill._name.toLowerCase().trim() === name.toLowerCase().trim());
        }
    }

    if (!outSkills) {
        throw new Error(`Error fetching new skills from AI! (aiResult: ${JSON.stringify(aiResult, null, 2)})`)
    }



    // For each skill in outSkills:
    // 1. Find its parent skill by name in the original list, using a lowercase / trim string matching
    // 2. Create the skill, along with its generated_from_skill_path
    // 3. Create the skill link between the parent and the child.
    // 4. Add the skill to the list of created skills.
    const results: { name: string, id?: string, link?: string }[] = await Promise.all((outSkills).map(async (sk) => {
        const parentSkill = getSkillFromCaches(sk.parent);

        if (!parentSkill) {
            return {
                name: sk.skillName,
                id: undefined,
                link: undefined,
            }
        }

        var thisSkill = getSkillFromCaches(sk.skillName);
        if (!thisSkill) {
            console.warn(`We didn't find the skill "${sk.skillName}" suggested by the AI in the tree, creating it...`)
            const newSkill = (await supabase.from('skill').insert({
                _name: sk.skillName,
                _description: '',
                root_skill_id: root_skill_id,
            }).select('id, _name, _description').single()).data;
            if (newSkill) {
                thisSkill = newSkill;
            }
        }
        else {
            console.log(`Skill "${sk.skillName}" already exists (id: ${thisSkill.id}), using that one...`);
        }

        if (!thisSkill) {
            throw new Error(`Failed to create skill ${sk.skillName}!`)
        }

        const linkCreatedResult = await supabase.from('skill_link')
            .upsert({
                downstream_skill: parentSkill.id,
                upstream_skill: thisSkill.id,
                metadata: {
                    levelOnParent: sk.level,
                },
            }, {
                onConflict: 'downstream_skill,upstream_skill',
            })
            .select('id, downstream_skill, upstream_skill')
            .single();

        return {
            name: sk.skillName,
            id: thisSkill.id,
            link: linkCreatedResult.data?.id,
            parentSkillId: parentSkill.id,
        };
    }))

    return {
        skillsAdded: results
    }
}