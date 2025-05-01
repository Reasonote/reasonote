import _ from "lodash";

import {
  getActivityTypeServer,
} from "@/components/activity/activity-type-servers/getActivityTypeServer";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {ActivityTypesPublic} from "@reasonote/core";
import {ActivityGeneratorV2} from "@reasonote/lib-ai";

import {
  makeArrayStreamApiRoute,
} from "../../helpers/apiHandlers/makeArrayStreamApiHandler";
import {ActivityGenStreamRoute} from "./routeSchema";

export const maxDuration = 300;

export const { POST } = makeArrayStreamApiRoute({
  route: ActivityGenStreamRoute,
  handler: async function* ({ parsedReq, ai, rsn, supabase, user }) {
    // Convert skill to SkillStub
    const skillStub = parsedReq.context.skill?.id ?
      (await rsn.skill.skillIdToStub(parsedReq.context.skill.id, parsedReq.context.skill?.parentIds ?? [])).data :
      parsedReq.context.skill;

    if (!skillStub?.name) {
      throw new Error("Skill name is required");
    }

    // Get the activity information
    const activity_context = await ai.prompt.activities.formatConfigsByIds(parsedReq.activityIdsToAvoidSimilarity ?? []);
    const slide_anchor_context = await ai.prompt.activities.formatConfigsByIds([parsedReq.slideActivityIdToAnchorOn ?? '']);

    const activity_context_string = `
        ${parsedReq.activityIdsToAvoidSimilarity ? `
            <AVOID_ACTIVITIES>
                MAKE SURE TO GENERATE ACTIVITIES THAT ARE SUFFICIENTLY DIFFERENT FROM THE FOLLOWING ACTIVITIES THE USER HAS ALREADY SEEN.
                <ACTIVITIES_TO_AVOID>
                    ${activity_context}
                </ACTIVITIES_TO_AVOID>
            </AVOID_ACTIVITIES>
        ` : ''}

        ${parsedReq.slideActivityIdToAnchorOn ? `
            <ANCHOR_ACTIVITY>
                The activities should be anchored on the following slide which provides an overview of this topic:
                <SLIDE_ANCHOR>
                    ${slide_anchor_context}
                </SLIDE_ANCHOR>
            </ANCHOR_ACTIVITY>
        ` : ''}
    `;

    const additionalInstructions = activity_context_string + (parsedReq.context.specialInstructions ?? '');

    const actGenerator = new ActivityGeneratorV2({
      ai,
      activityTypeServers: (await Promise.all(ActivityTypesPublic.map(at => getActivityTypeServer({ activityType: at })))).filter(notEmpty)
    });

    const activityStream = actGenerator.generateActivities({
      from: {
        skill: {
          id: skillStub.id ?? undefined,
          name: skillStub.name,
          parentSkillIds: skillStub.parentIds ?? undefined,
        },
      },
      validActivityTypes: parsedReq.activityTypes ?? undefined,
      evaluators: {
        enabled: parsedReq.evaluators?.enabled ?? false,
        maxEvalLoops: parsedReq.evaluators?.maxEvalLoops ?? 1,
      },
      numActivities: parsedReq.numActivities ?? undefined,
      additionalInstructions: additionalInstructions ?? undefined,
      lesson: parsedReq.context.lesson ?? undefined,
      ctxInjectors: parsedReq.useDomainCtxInjectors ? [
        {
          name: 'Domain',
          config: {
            subjectName: skillStub.name,
            skillId: skillStub.id,
            specificity: 'activityGeneration'
          }
        }
      ] : undefined,
    });

    for await (const activityConfig of activityStream) {
      // Add activity to DB
      const { data, error } = await supabase
        .from('activity')
        .insert({
          _name: activityConfig.type,
          _type: activityConfig.type,
          type_config: activityConfig,
          source: "ai-generated",
          generated_for_user: user?.rsnUserId,
          generated_for_skill_paths: skillStub.id ? [
            [...(parsedReq.context.skill?.parentIds ?? []), skillStub.id].filter(notEmpty)
          ] : null,
        })
        .select()
        .single();

      if (error) {
        console.error(`Error adding activity to DB: ${error.message}`);
      }
      else {
        yield data;
      }
    }
  },
});
