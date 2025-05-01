import _ from "lodash";

import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {UserFeelingSchema} from "@reasonote/core";
import {
  Activity,
  GetUserSkillFlatDocument,
} from "@reasonote/lib-sdk-apollo-client";
import {JSONSafeParse} from "@reasonote/lib-utils";

import {FYPV1Context} from "../FYPV1Context";

/**
 * Show the self assessment if needed.
 * 
 * If needed, this will generate a self assessment activity for the first pinned skill.
 * 
 * This will return the activity if it was generated, or null if it was not.
 * @param ctx The context to use.
 * @returns The activity if it was generated, or null if it was not.
 */
export async function showSelfAssessmentIfNeeded({ctx}: {ctx: FYPV1Context}){
    const {ac, userId} = ctx.constructorArgs;

    var selfAssessmentActivity: Activity | null = null;

    if (ctx.activityQueue.length < 1 && ctx.pinnedSkillPathIds && ctx.pinnedSkillPathIds.length > 0){
        const result = await ac.query({
            query: GetUserSkillFlatDocument,
            variables: {
            filter: {
                skill: {
                    eq: ctx.pinnedSkillPathIds[0],
                },
                rsnUser: {
                    eq: userId,
                }
            },
            }
        })

        const userFeelingsParsed = JSONSafeParse(ctx.userSettings?.feelings).data;
        const userFeelings = _.isArray(userFeelingsParsed) ? userFeelingsParsed.map((f) => UserFeelingSchema.safeParse(f)).map((f) => f.success ? f.data : undefined).filter(notEmpty) : [];
    
        const selfAssignedLevel = result.data?.userSkillCollection?.edges?.[0]?.node.selfAssignedLevel;
        if (!selfAssignedLevel){
            const skillId = ctx.pinnedSkillId;
            const skillName = ctx.pinnedSkillName;
            const parentSkillNames = ctx.pinnedSkillParentNames?.filter(notEmpty);
            if (skillId && skillName && parentSkillNames){
                throw new Error("This is old code and should be removed. We don't use self assessments anymore.");
            }
            else {
                console.warn("No skill id, name, or parent skill names! This should not happen...")
            }
        }
    }

    return selfAssessmentActivity;
}