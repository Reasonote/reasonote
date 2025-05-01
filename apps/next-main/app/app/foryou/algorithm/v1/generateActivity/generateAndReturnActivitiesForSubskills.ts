import _ from "lodash";

import {
  GetValidSubskillsV1RouteResponse,
} from "@/app/api/skills/get_valid_subskills_v1/routeSchema";

import {FYPV1Context} from "../FYPV1Context";
import {
  generateFYPActivityForSubskillV1,
} from "./generateFYPActivityForSubSkillV1";

export interface GenerateFYPActivityForSubskillV1Args {
    ctx: FYPV1Context;
    validSubskillsToUse: {
        subskill: Awaited<GetValidSubskillsV1RouteResponse>['validSubskillsAscendingScore'][number]
        skillId: string,
        pathFromRootSkill: string[]
    }[],
}

export async function generateAndReturnActivitiesForSubskills({
    validSubskillsToUse,
    ctx,
}: GenerateFYPActivityForSubskillV1Args) {
    return await Promise.all(validSubskillsToUse.map(async (subskill) => {
        try {
            const res = await generateFYPActivityForSubskillV1({
                pathFromRootSkill: subskill.pathFromRootSkill,
                subskill: subskill.subskill,
                allowedActivityTypes: ctx.allowedActivityTypes,
                ctx,
            })
    
            if (!res) {
                throw new Error(`generateActivityForSkill(${subskill.subskill.obj._name}) returned no response. This could mean the AI did not provide a valid output value.`)
            }
    
            const newActivity = res.activity;
            
            if (!newActivity) {
                return;
            }
    
            ctx.activityCompleteCb({
                // TODO: cannot have cycles... good, but needs better formalization...
                skillIdStack: _.uniq([...(ctx.pinnedSkillPathIds ?? []), subskill.skillId, ...subskill.subskill.path_to]),
                activity: {...newActivity}
            })

            return {
                activity: newActivity,
                skillIdStack: _.uniq([...(ctx.pinnedSkillPathIds ?? []), subskill.skillId, ...subskill.subskill.path_to]),
            }
        }
        catch(e){
          console.error("FAILED to generate activity for subskill:", subskill, e)
        }
      }))
}