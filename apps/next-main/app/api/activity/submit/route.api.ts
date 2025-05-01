import {NextResponse} from "next/server";

import {
  getActivityTypeServer,
} from "@/components/activity/activity-type-servers/getActivityTypeServer";
import {
  ActivityResultBase,
  ActivitySubmitResult,
  ActivityType,
} from "@reasonote/core";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {ActivitySubmitRoute} from "./routeSchema";

const ACTIVITY_XP_MAP: Record<ActivityType, number> = {
  'slide': 0,
  'flashcard': 20,
  'multiple-choice': 30,
  'sequence': 30,
  'choose-the-blank': 30,
  'term-matching': 40,
  'fill-in-the-blank': 50,
  'short-answer': 75,
  'roleplay': 100,
  'teach-the-ai': 150,
};

function calculateXpForActivity(activityType: ActivityType, score: number): number {
  const maxXp = ACTIVITY_XP_MAP[activityType] || 10; // Default to 10 if type not found
  return Math.round((score / 100) * maxXp);
}

export const { POST } = makeServerApiHandlerV3({
  route: ActivitySubmitRoute,
  handler: async (ctx) => {
    const { parsedReq, ai, supabase, user, SUPERUSER_supabase } = ctx;
    const { activityId, userAnswer, lessonSessionId, skipped } = parsedReq;

    try {
      // Get the activity from the database
      const { data: activity, error } = await supabase
        .from('activity')
        .select('*, generated_for_skill_paths')
        .eq('id', activityId)
        .single();

      if (error || !activity) {
        return NextResponse.json({ error: `Activity not found: ${activityId}` }, { status: 404 });
      }

      const activityType = activity._type;

      if (!activityType) {
        return NextResponse.json({ error: `Activity type not found: ${activityId}` }, { status: 404 });
      }

      // Construct the ActivityResult shape
      const resultData: Partial<ActivityResultBase> = {
        activityType: activityType,
        activityConfig: activity.type_config as any,
        resultData: userAnswer,
      };

      let gradingResult: ActivitySubmitResult | undefined;

      // If skipped is true, mark as skipped and don't attempt to grade
      if (skipped) {
        resultData.type = 'skipped';
      } else {
        // Get the activity type server
        const activityTypeServer = await getActivityTypeServer({
          activityType: activityType
        });

        if (!activityTypeServer) {
          return NextResponse.json({ error: `Activity type server not found for type: ${activity._type}` }, { status: 404 });
        }

        console.log("activityTypeServer", activityTypeServer);

        const config = activity.type_config as any;

        // Check if the activity type server has a gradeUserAnswer method
        if (!activityTypeServer.gradeUserAnswer) {
          // TODO: if there is no grade function, we still create a result, it's just not graded.
          console.log("No grade function found, creating ungraded result");
          resultData.type = 'ungraded';
        }
        else {
          // Grade the user's answer
          gradingResult = await activityTypeServer.gradeUserAnswer({
            config,
            userAnswer,
            ai
          });
          
          // Add grading information if available
          if (gradingResult) {
            // submitResult is same as gradingResult
            resultData.submitResult = gradingResult;
            if (gradingResult.score !== undefined) {
              resultData.type = 'graded';
              resultData.gradeType = 'graded-numeric';
              resultData.grade0to100 = gradingResult.score * 100; // Convert to 0-100 scale
            } else {
              resultData.type = 'ungraded';
            }
            
            // Add feedback if available
            if (gradingResult.shortFeedback) {
              resultData.feedback = {
                markdownFeedback: gradingResult.shortFeedback,
                aboveTheFoldAnswer: gradingResult.shortFeedback
              };
            }
            
            if (gradingResult.details) {
              // ResultData is the same as userAnswer
              resultData.resultData = userAnswer;
            }
          } else {
            // Default to ungraded if no grading result
            resultData.type = 'ungraded';
          }
        }
      }

      // If the user is authenticated, save the result to the database
      if (user) {
        try {
          const result = await supabase
            .from('user_activity_result')
            .insert({
              // @ts-ignore
              activity: activityId,
              _user: user.rsnUserId,
              result_data: resultData.resultData,
              submit_result: gradingResult,
              score: resultData.grade0to100 || 0,
              lesson_session_id: lessonSessionId,
              skipped: skipped || false,
              created_by: user.rsnUserId,
              updated_by: user.rsnUserId
            })
            .select('*')
            .single();
          const resultId = result.data?.id;

          console.log("result", result);

          if (!resultId) {
            return NextResponse.json({ error: `Failed to save activity result: ${result.error}` }, { status: 500 });
          }

          console.log("resultId", resultId);

          // Calculate and add XP
          let xpEarned = 0;
          
          // Only calculate XP if not skipped and has a grade
          if (!skipped && resultData.type === 'graded') {
            const score = resultData.grade0to100 || 0;
            const rootSkillId = activity?.generated_for_skill_paths?.[0]?.[0];

            // Only award XP if there's a root skill and the activity is graded
            if (rootSkillId && typeof score === 'number' && score > 0) {
              xpEarned = calculateXpForActivity(
                activityType as ActivityType,
                score
              );

              // Add XP to the root skill
              if (SUPERUSER_supabase) {
                const { error: addXpError } = await SUPERUSER_supabase.rpc('add_skill_xp', {
                  user_id: user.rsnUserId,
                  skill_id: rootSkillId,
                  xp_amount: xpEarned,
                });

                if (addXpError) {
                  // Even if XP addition fails, return success with the activity result
                  console.error('Failed to add XP:', addXpError);
                  xpEarned = 0;
                }
              } else {
                console.error('SUPERUSER_supabase not available, cannot add XP');
                xpEarned = 0;
              }
            }
          }

          return {
            resultId,
            resultData,
            xpEarned
          };
        } catch (saveError) {
          console.error("Error saving activity result:", saveError);
          // Continue with the response even if saving fails
          throw saveError;
        }
      }
      else {
        console.log("No user, not saving result");
        return NextResponse.json({ error: "No user, not saving result" }, { status: 401 });
      }
    } catch (error) {
      console.error("Error grading activity:", error);
      return NextResponse.json({ error: `Error grading activity: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
    }
  }
}); 