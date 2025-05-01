import _ from "lodash";

import {ActivityTypesInternalOnlySchema} from "@reasonote/core";

import {
  generateFYPActivityProps,
  generateFYPActivityResult,
} from "../generateFYPActivityTypes";
import {FYPV1Context} from "./FYPV1Context";
import {
  generateAndReturnActivitiesForSubskills,
} from "./generateActivity/generateAndReturnActivitiesForSubskills";
import {getNotPinnedSubskills} from "./getValidSubskills/getNotPinnedSubskills";
import {getPinnedSubskills} from "./getValidSubskills/getPinnedSubskills";
import {ValidSubskillToUse} from "./interfaces/ValidSubskillToUse";
import {
  showSelfAssessmentIfNeeded,
} from "./selfAssessments/showSelfAssessmentIfNeeded";

export async function generateFYPActivityV1({
    ac,
    sb,
    token,
    userId,
    pinned,
    allowedActivityTypes,
    numToGen,
    activityQueue,
    skillData,
    onActivityComplete,
}: generateFYPActivityProps): Promise<generateFYPActivityResult> {
    ///////////////////////////////////////////////////////////////////////////
    // PART 1: CREATE CONTEXT
    // Here, we create a ctx object that will prefetch and
    // hold all the data we need for this run of the algorithm.
    const ctx = new FYPV1Context({
      ac,
      sb,
      token,
      userId,
      pinned,
      // The actual allowed activityTypes are the ones that are not internal only.
      allowedActivityTypes: allowedActivityTypes.filter((x) => !ActivityTypesInternalOnlySchema.safeParse(x).success),
      numToGen,
      activityQueue,
      skillData,
      onActivityComplete,
    });
    await ctx.prefetchData({ac});

    ///////////////////////////////////////////////////////////////////////////
    // PART 1.5: IF WE ARE NEWLY PINNED, GENERATE SKILL ASSESSMENT IN PARALLEL
    // If we are newly pinned, we need to show a skill assessment.
    // TODO: this only handles pinned mode; needs better interplay with the non-pinned mode.
    const didShowAssessment = await showSelfAssessmentIfNeeded({ctx});

    // TODO: we could probably guess the user's most likely skill levels, and then predictively 
    // make 1 activity for the N most likely skill levels here.
    if (didShowAssessment){
      return ctx.returnedActivities;
    }

    ///////////////////////////////////////////////////////////////////////////
    // PART 2: GET/CREATE VALID SUBSKILLS
    //////////////
    // Next, we choose which subskills we'll use. This breaks down into:
    // 1. Pick skills that seem like they need work (given our constraints)
    // 2. Build subskills for these skills, if we don't have a deep enough tree.
    // TODO: We may want part 2 to be called before this section.
    var validSubskillsToUse: ValidSubskillToUse[] | undefined = undefined;

    if (ctx.pinnedSkillPathIds && ctx.pinnedSkillPathIds.length > 0){
      validSubskillsToUse = await getPinnedSubskills({
        ctx,
        pinnedSkillPathIds: ctx.pinnedSkillPathIds,
      })
    }
    else {
      validSubskillsToUse = await getNotPinnedSubskills({
        ctx,
        numToGen,
      })
    }

    if (!validSubskillsToUse){
      throw new Error("No valid subskills to use!")
    }

    ////////////////////////////////////////////////////////////////////////
    // PART 3: GENERATE ACTIVITIES
    ///////////////
    // Finally, we generate activities for the subskills we chose.
    const result = await generateAndReturnActivitiesForSubskills({
      ctx,
      validSubskillsToUse,
    })

    if (ctx.returnedActivities.length < 1){
      throw new Error("No activities returned!")
    }

    return ctx.returnedActivities;
}