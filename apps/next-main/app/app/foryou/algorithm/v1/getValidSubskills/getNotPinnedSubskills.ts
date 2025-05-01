import _ from "lodash";

import {
  GetValidSubskillsV1Route,
} from "@/app/api/skills/get_valid_subskills_v1/routeSchema";
import {
  notEmpty,
  sampleSizeGuaranteed,
} from "@lukebechtel/lab-ts-utils";

import {FYPV1Context} from "../FYPV1Context";
import {ValidSubskillToUse} from "../interfaces/ValidSubskillToUse";

interface GetNotPinnedSubskillsArgs {
    ctx: FYPV1Context;
    numToGen: number;
}

/**
 * Get valid subskills in the situation that we don't have anything pinned.
 * @param param0 
 * @returns 
 */
export async function getNotPinnedSubskills({ctx, numToGen}: GetNotPinnedSubskillsArgs): Promise<ValidSubskillToUse[]> {
    // const skillPaths = ctx.skillData?.map((sk) => [sk.name]).filter(notEmpty) ?? [];
    // TODO: very hacky, skillData should actually just be "what skills does the user have saved in their skill set."
    const skillIdPaths = ctx.skillData?.map((sk) => [sk.id]).filter(notEmpty) ?? [];

    const pickedSkillIdPaths = sampleSizeGuaranteed(skillIdPaths, numToGen);

    // TODO: what do we do here?
    if (!pickedSkillIdPaths){
        return [];
    }

    return (
        await Promise.all((pickedSkillIdPaths).map(async (skillIdPath) => {
            try {
                const skillId = skillIdPath[skillIdPath.length - 1];

                const validSubskills = (await GetValidSubskillsV1Route.call({
                    skill: {
                        id: skillId 
                    },
                    activitiesAlreadyQueued: ctx.returnedActivities,
                }))?.data;

                const subskill = validSubskills?.validSubskillsAscendingScore[0];

                if (!subskill){
                    console.error(`No subskills found for skill: "${skillId}"`)
                    return null;
                }

                return {
                    skillId: skillId,
                    subskill,
                    // TODO: hacky
                    pathFromRootSkill: _.uniq([skillId, ...subskill.path_to])
                }
            }
            catch (e){
                console.error("FAILED to get valid subskills for skill:", skillIdPath, e)
                return null;
            }
        }))
    ).filter(notEmpty)
}