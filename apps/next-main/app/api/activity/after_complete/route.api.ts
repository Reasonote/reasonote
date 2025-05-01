import _ from "lodash";
import {NextResponse} from "next/server";

import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {createActivitySkillFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";
import {JSONSafeParse} from "@reasonote/lib-utils";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {
  AddToSkillTreeRouteHandler,
} from "../../skills/add_to_skill_tree/handler";
import {
  SkillsAddToSkillTreeRoute,
} from "../../skills/add_to_skill_tree/routeSchema";
import {getDefaultActivitySkills} from "./defaultActivitySkills";
import {ActivityAfterCompleteRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 120;

export const POST = makeServerApiHandlerV2({
    route: ActivityAfterCompleteRoute,
    handler: async (ctx) => {
        const { ac, ai, req, parsedReq, supabase, logger, user } = ctx;

        const warnings: { code: string, text: string }[] = [];

        const activityType = parsedReq.activityResult.activityType;

        const activity = (await supabase.from('activity').select('*').eq('id', parsedReq.activityId).single())?.data;

        const generatedForSkillPaths = JSONSafeParse(activity?.generated_for_skill_paths)?.data as string[][];
        const firstPath = generatedForSkillPaths?.[0];
        var rootSkillId: string | undefined = firstPath?.[0];


        // Now, wherever this activity was generated from, 
        // we must determine what root skill tree we are concerning ourself with.
        // Also check the lesson, if it exists.
        const lessonSessionId = parsedReq.lessonSessionId;
        if (lessonSessionId) {
            const lessonSession = (await supabase.from('lesson_session').select('*').eq('id', parsedReq.lessonSessionId ?? 'FAKE').single())?.data;
            const lessonId = lessonSession?.lesson;
            if (lessonId) {
                const lesson = (await supabase.from('lesson').select('*').eq('id', lessonId).single())?.data;
                if (lesson) {
                    rootSkillId = lesson?.root_skill ?? undefined;
                }
            }
        }

        // If we still don't have a rootSkillId, go through all ActivitySkill for this activity,
        // And take the earliest created skill, assume that's the root.
        if (!rootSkillId) {
            const activitySkills = (await supabase.from('activity_skill')
                .select('*')
                .eq('activity', parsedReq.activityId)
            )?.data;

            if (activitySkills) {
                const earliestSkill = _.minBy(activitySkills, 'created_date');
                if (earliestSkill) {
                    rootSkillId = earliestSkill.skill ?? undefined;
                }
            }
        }

        if (!rootSkillId) {
            return NextResponse.json({
                error: 'No root skill id could be determined for this activity!'
            }, { status: 400 });
        }

        // TODO: actually use this
        // if (actServer?.getRelatedSkills){

        // }

        const rsnUserId = user?.rsnUserId

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 404 });
        }

        const {
            skillsForActivity,
            treeData
        } = await getDefaultActivitySkills({
            skillId: rootSkillId,
            ai,
            rsnUserId: rsnUserId,
            supabase,
            activityConfig: parsedReq.activityResult.activityConfig
        })

        logger.debug({ skillsForActivity })

        // Check if the root skill is part of a course
        const { data: courseData } = await supabase
            .from('course')
            .select('*')
            .eq('root_skill', rootSkillId)

        // If the root skill is not part of a course, add it to the tree.
        if (!courseData || courseData.length === 0) {
            console.log('Skill is not part of a course, adding subskills to tree');
            ////////////////////////////////////////////////////
            // Create Missing Skills
            const missingSkills = skillsForActivity.filter(skill => {
                return !treeData.find(t => t.skill_name.trim().toLowerCase() === skill.name.trim().toLowerCase())
            })
            const createdSkills = (await supabase.from('skill').insert(missingSkills.map(skill => ({
                _name: skill.name,
                root_skill_id: rootSkillId
            }))).select('id, _name'))?.data;

            ////////////////////////////////////////////////////
            // Link Skills to Activity (if not already there)
            const foundSkillIds = skillsForActivity.map(skill => {
                return treeData.find(t => t.skill_name.trim().toLowerCase() === skill.name.trim().toLowerCase())?.skill_id;
            }).filter(notEmpty);

            const activitySkillResult = await ac.mutate({
                mutation: createActivitySkillFlatMutDoc,
                variables: {
                    objects: [
                        ...foundSkillIds.map(skillId => ({
                            activity: parsedReq.activityId,
                            skill: skillId,
                            weight: .5
                        })),
                        ...createdSkills?.map(skill => ({
                            activity: parsedReq.activityId,
                            skill: skill.id,
                            weight: .5
                        })) ?? []
                    ]
                }
            })

            // logger.debug(JSON.stringify({ activitySkillResult }, null, 2))

            // Add Skills to Tree (if not already there)
            // Add all of these to the tree, they may not be in the tree yet.
            const addToSkillTreeRouteRes = await AddToSkillTreeRouteHandler({
                ...ctx,
                route: SkillsAddToSkillTreeRoute,
                parsedReq: {
                    skill: {
                        id: rootSkillId
                    },
                    skillsToAdd: skillsForActivity
                }
            })
            logger.debug(JSON.stringify({ addToSkillTreeRouteRes }, null, 2))
        }
        else {
            console.log(`Skill ${rootSkillId} is part of a course, not adding subskills to tree`);
        }

        return {
            activityResult: parsedReq.activityResult,
        }
    }
})
