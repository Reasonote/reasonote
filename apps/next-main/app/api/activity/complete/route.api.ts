import {NextResponse} from "next/server";

import {ActivityType} from "@reasonote/core";
import {
  createUserActivityResultFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {ActivityCompleteRoute} from "./routeSchema";

const ACTIVITY_XP_MAP: Record<ActivityType, number> = {
  'slide': 0,
  'flashcard': 20,
  'multiple-choice': 30,
  'choose-the-blank': 30,
  'term-matching': 40,
  'fill-in-the-blank': 50,
  'short-answer': 75,
  'roleplay': 100,
  'teach-the-ai': 150,
  'sequence': 30,
};

function calculateXpForActivity(activityType: ActivityType, score: number): number {
  const maxXp = ACTIVITY_XP_MAP[activityType] || 10; // Default to 10 if type not found
  return Math.round((score / 100) * maxXp);
}

export const { POST } = makeServerApiHandlerV3({
  route: ActivityCompleteRoute,
  handler: async (ctx) => {
    const { activityId, lessonSessionId, score, resultData, skipped } = ctx.parsedReq;
    const rsnUserId = ctx.user?.rsnUserId;
    const { supabase, ac, SUPERUSER_supabase } = ctx;

    if (!rsnUserId) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    try {
      // Create activity result using Apollo Client
      const res = await ac.mutate({
        mutation: createUserActivityResultFlatMutDoc,
        variables: {
          objects: [
            {
              activity: activityId,
              user: rsnUserId,
              lessonSessionId,
              score: score,
              resultData: JSON.stringify(resultData),
              skipped,
            }
          ]
        }
      });

      const activityResultId = res.data?.insertIntoUserActivityResultCollection?.records?.[0]?.id;

      if (!activityResultId) {
        return NextResponse.json({
          error: 'Failed to create activity result',
        }, { status: 400 });
      }

      // Get root skill ID
      const { data: activity } = await supabase
        .from('activity')
        .select('generated_for_skill_paths, _type')
        .eq('id', activityId)
        .single();

      const rootSkillId = activity?.generated_for_skill_paths?.[0]?.[0];

      // If no root skill, return success but with 0 XP
      if (!rootSkillId) {
        return {
          xpEarned: 0,
          activityResultId
        };
      }

      let xpEarned = 0;

      // Only award XP for graded activities
      if (score !== undefined && !skipped) {
        xpEarned = calculateXpForActivity(
          activity._type as ActivityType,
          score
        );

        // Add XP to the root skill
        const { error: addXpError } = await SUPERUSER_supabase.rpc('add_skill_xp', {
          user_id: rsnUserId,
          skill_id: rootSkillId,
          xp_amount: xpEarned,
        });

        if (addXpError) {
          // Even if XP addition fails, return success with the activity result
          console.error('Failed to add XP:', addXpError);
          return {
            xpEarned: 0,
            activityResultId
          };
        }
      }

      return {
        xpEarned,
        activityResultId
      };
    } catch (error) {
      return NextResponse.json({
        error: `Error in activity complete: ${error}`,
      }, { status: 400 });
    }
  },
});
