import _ from "lodash";
import {z} from "zod";

import {
  GetValidSubskillsV1Route,
} from "@/app/api/skills/get_valid_subskills_v1/routeSchema";
import {
  generateActivityForSkill,
} from "@/components/activity/generate/generateActivityForSkill";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  ActivityType,
  ActivityTypes,
  ActivityTypesInternalOnly,
  UserFeelingSchema,
} from "@reasonote/core";
import {getActivityFlatQueryDoc} from "@reasonote/lib-sdk-apollo-client";
import {JSONSafeParse} from "@reasonote/lib-utils";

import {SkillActivityCountLevel} from "../../../FYPTypes";
import {FYPV1Context} from "../FYPV1Context";
import {getValidPastActivityV1} from "./getValidPastActivityV1";

interface GenerateFYPActivityForSubSkillV1Props {
    /**
     * The ids of all parents of this subskill.
     */
    pathFromRootSkill: string[];
    subskill: Awaited<z.infer<typeof GetValidSubskillsV1Route['responseSchema']>>['validSubskillsAscendingScore'][number];
    allowedActivityTypes: ActivityType[];
    ctx: FYPV1Context;
}


export async function generateFYPActivityForSubskillV1({
    pathFromRootSkill,
    allowedActivityTypes,
    ctx,
    subskill,
}: GenerateFYPActivityForSubSkillV1Props){
    const {ac, userId, sb, activityQueue} = ctx.constructorArgs;

    // TODO: get the user's level for this skill.
    // for now, we can ascertain this by:
    // 1. No Activities -> 0-5 Activities, Good Standing -> 0
    // 2. 5-10 Activities, Good Standing -> 1
    // 3. 10-20 Activities, Good Standing -> 2
    // 4. 20-50 Activities, Good Standing -> 3
    // 5. 50+ Activities, Good Standing -> 4
    // 6. No Activities, Bad Standing -> 0
    // 7. 5-10 Activities, Bad Standing -> 1
    // 8. 10-20 Activities, Bad Standing -> 1
    // 9. 20-50 Activities, Bad Standing -> 2
    const userIsInGoodStanding = subskill.average_normalized_score_upstream && subskill.average_normalized_score_upstream > 0.9;

    const skillActivityCountLevels: SkillActivityCountLevel = subskill.activity_result_count_upstream === 0 ?
        SkillActivityCountLevel.NONE
        :
        subskill.activity_result_count_upstream < 3 ?
        SkillActivityCountLevel.FEW
        :
        subskill.activity_result_count_upstream < 10 ?
            SkillActivityCountLevel.SOME
            :
            subskill.activity_result_count_upstream < 25 ?
            SkillActivityCountLevel.MANY
            :
            SkillActivityCountLevel.TONS;

    // console.log("worstSubskillNumberOfChildren", worstSubskillNumberOfChildren)
    // console.log("skillActivityCountLevels", worstSubskill.activity_result_count_upstream)
    
    // TODO: need number of children to make this better...
    const userLevel = userIsInGoodStanding ?
        skillActivityCountLevels === SkillActivityCountLevel.NONE ?
        0
        :
        skillActivityCountLevels === SkillActivityCountLevel.FEW ?
            1
            :
            skillActivityCountLevels === SkillActivityCountLevel.SOME ?
            2
            :
            skillActivityCountLevels === SkillActivityCountLevel.MANY ?
                3
                :
                4
        :
        skillActivityCountLevels === SkillActivityCountLevel.NONE ?
        0
        :
        skillActivityCountLevels === SkillActivityCountLevel.FEW ?
            1
            :
            skillActivityCountLevels === SkillActivityCountLevel.SOME ?
            1
            :
            skillActivityCountLevels === SkillActivityCountLevel.MANY ?
                2
                :
                3;

    console.log("userLevel", userLevel)

    // This is the list of activity types that are allowed for each level.
    // We repeat some entries to make them more likely.
    const activityTypesPerLevel: {[k: number]: ActivityType[]} = {
        0: [
            ...Array(2).fill('flashcard'),
            ...Array(2).fill('multiple-choice'),
            ...Array(2).fill('choose-the-blank'),
            ...Array(1).fill('slide'),
        ],
        1: [
            ...Array(2).fill('flashcard'),
            ...Array(2).fill('multiple-choice'),
            ...Array(2).fill('choose-the-blank'),
            ...Array(1).fill('slide'),
            ...Array(1).fill('term-matching'),
        ],
        2: [
            ...Array(2).fill('flashcard'),
            ...Array(2).fill('multiple-choice'),
            ...Array(2).fill('choose-the-blank'),
            ...Array(1).fill('slide'),
            ...Array(1).fill('term-matching'),
            ...Array(1).fill('fill-in-the-blank'),
        ],
        3: [
            ...Array(2).fill('flashcard'),
            ...Array(2).fill('multiple-choice'),
            ...Array(2).fill('choose-the-blank'),
            ...Array(1).fill('term-matching'),
            ...Array(1).fill('fill-in-the-blank'),
            ...Array(1).fill('short-answer'),
            ...Array(1).fill('teach-the-ai'),
            ...Array(1).fill('roleplay'),
        ],
        4: [
            ...Array(1).fill('flashcard'),
            ...Array(1).fill('multiple-choice'),
            ...Array(1).fill('choose-the-blank'),
            ...Array(1).fill('term-matching'),
            ...Array(1).fill('fill-in-the-blank'),
            ...Array(1).fill('short-answer'),
            ...Array(1).fill('teach-the-ai'),
            ...Array(1).fill('roleplay'),
        ],
    }

    /**
     * Has the user added filters to the activity types?
     * We have to subtract the internal-only activity types because we don't show them as options in the UI.
     */
    const userHasChangedActivityTypes = allowedActivityTypes.length !== (ActivityTypes.length - ActivityTypesInternalOnly.length);

    console.debug("userHasChangedActivityTypes", userHasChangedActivityTypes)

    /**
     * If the user has changed activity types, we should only show them the ones they've selected.
     * 
     * Otherwise, we should show them types appropriate for their level.
     */
    const sampledActivityTypeAtCurrentLevel = _.sample(activityTypesPerLevel[userLevel]) as ActivityType | undefined;
    const validActivityTypes: ActivityType[] = userHasChangedActivityTypes ? 
        allowedActivityTypes 
        :
        (sampledActivityTypeAtCurrentLevel ? [sampledActivityTypeAtCurrentLevel] : allowedActivityTypes)

    console.debug("validActivityTypes", validActivityTypes)

    ///////////////////////////////////////////////////////////////////////
    // Get activity to repair (if needed)
    // Get all activity results for this skill.
    // If there are any that aren't perfect, AND haven't been repaired,
    // we should show that activity again.
    // Otherwise, we should generate a new one.
    const validPastActivity = await getValidPastActivityV1({
        ctx,
        skill: subskill.obj,
        validActivityTypes,
    })
    
    // If we have an unrepaired activity, we should show it.
    if (validPastActivity){
        if (!validPastActivity.activity){
            console.warn("No activity on unrepaired activity", validPastActivity)
        }
        else {
            console.debug("Showing unrepaired activity:", validPastActivity)
            // activityCompleteCb({
            //     skillIdStack: [skill.id, ...worstSubskill.path_to],
            //     // skillIdStack: subskill.path_to,
            //     activity: {...validPastActivity.activity}
            // })

            return {
                activity: validPastActivity.activity
            }
        }
    }
    else{
        console.debug(`No unrepaired activity found for skill ${subskill.skill_name}`)
    }

    const parentSkillIds = pathFromRootSkill; 

    const userFeelingsParsed = JSONSafeParse(ctx.userSettings?.feelings).data;
    const userFeelings = _.isArray(userFeelingsParsed) ? userFeelingsParsed.map((f) => UserFeelingSchema.safeParse(f)).map((f) => f.success ? f.data : undefined).filter(notEmpty) : [];

    const ret = await generateActivityForSkill({
        ac,
        sb,
        skill: {
            id: subskill.obj.id,
            name: subskill.obj._name,
            skillIdPath: _.uniq([...parentSkillIds, subskill.obj.id]),
        },
        generatedforUser: {
            id: ctx.userId,
            givenName: ctx.givenName ?? undefined,
            familyName: ctx.familyName ?? undefined,
            aiContext: ctx.userSettings?.aiAboutMe ?? undefined,
            feelings: userFeelings,
        },
        allowedActivityTypes: validActivityTypes,
    });

    const createdActivityId = ret?.data?.activityIds?.[0];

    const createdActivity = createdActivityId ? (await ac.query({
        query: getActivityFlatQueryDoc,
        variables: {
            filter: {
                id: {
                    eq: createdActivityId,
                }
            }
        }
    })).data?.activityCollection?.edges?.[0]?.node : undefined;

    if (!createdActivity){
        console.warn("Failed to create activity for skill", subskill.obj._name)
        return null;
    }

    return {
        activity: createdActivity,
    }
}