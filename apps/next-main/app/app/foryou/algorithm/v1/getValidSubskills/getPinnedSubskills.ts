import _ from "lodash";

import {
  GetValidSubskillsV1Route,
} from "@/app/api/skills/get_valid_subskills_v1/routeSchema";

import {FYPV1Context} from "../FYPV1Context";

interface GetPinnedSubskillsArgs {
    ctx: FYPV1Context;
    pinnedSkillPathIds: string[];
}

/**
 * Get valid subskills for a pinned skill. 
 */
export async function getPinnedSubskills({ctx, pinnedSkillPathIds}: GetPinnedSubskillsArgs){
    const {sb} = ctx;
    const pinnedSkillId = pinnedSkillPathIds[pinnedSkillPathIds.length - 1];
    
    ////////////////////////////////////////////////////////////////////
    // Get valid subskills for the pinned skill.
    const validSubskills = (await GetValidSubskillsV1Route.call({
        skill: {
            id: pinnedSkillPathIds[pinnedSkillPathIds.length - 1],
        },
        parentSkillIds: pinnedSkillPathIds.slice(0, pinnedSkillPathIds.length - 1),
        activitiesAlreadyQueued: ctx.activityQueue,
    }))?.data;

    // Get numToGen activities for the pinned skill.
    // We should get the N worst subskills, and generate activities for them.
    const worstSubskills = validSubskills?.validSubskillsAscendingScore.slice(0, ctx.numToGen);
    
    // console.debug(`[pinned]: worstSubskills(${pinnedSkill?._name}): ${worstSubskills?.map((s) => `\n\t"${s.obj._name}"`).join(',')}`)        

    return worstSubskills?.map((subskill) => {
        return {
            subskill,
            skillId: pinnedSkillPathIds[pinnedSkillPathIds.length - 1],
            // TODO: hacky
            pathFromRootSkill: _.uniq([...pinnedSkillPathIds, ...subskill.path_to])
        }
    })
}