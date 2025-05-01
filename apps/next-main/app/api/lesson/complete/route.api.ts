import {NextResponse} from "next/server";
import {z} from "zod";

import {
  notEmpty,
  trimAllLines,
  trimLines,
} from "@lukebechtel/lab-ts-utils";
import {GetActivityResultsDeepDocument} from "@reasonote/lib-sdk-apollo-client";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {LessonCompleteRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const POST = makeServerApiHandlerV2({
    route: LessonCompleteRoute,
    handler: async (ctx) => {
        const { req, ac, ai, parsedReq,  supabase, logger, user } = ctx;

        const rsnUserId = user?.rsnUserId

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 404 });
        }


        // Get the lesson id
        const lessonSession = await supabase.from('lesson_session').select('*').eq('id', parsedReq.lessonSessionId).single();

        const lessonId = lessonSession.data?.lesson;
        if (!lessonId) {
            return NextResponse.json({
                error: 'Lesson not found!'
            }, { status: 404 });
        }

        // Create lesson result.
        const res = await supabase.from('user_lesson_result').insert({
            _user: rsnUserId,
            lesson: lessonId,
        })

        // Get the lesson
        const lesson = await supabase.from('lesson').select('*').eq('id', lessonId).single();

        // Get all activity results for this lesson
        const activityResults = await ac.query({
            query: GetActivityResultsDeepDocument,
            variables: {
                filter: {
                    lessonSessionId: {
                        eq: parsedReq.lessonSessionId
                    },
                    user: {
                        eq: rsnUserId
                    }
                }
            }
        })

        const resultNodes = activityResults.data?.userActivityResultCollection?.edges?.map(e => e.node) ?? [];

        const resultScores = resultNodes.map((e) => e.score).filter(notEmpty) ?? [];
        const totalScore = resultScores.reduce((acc, score) => acc + score, 0);
        const percentCorrect = resultScores.filter((score) => score >= 90).length / resultScores.length;
        const percentIncorrect = resultScores.filter((score) => score < 90).length / resultScores.length;



        const createFinishData = async () => {
            // TODO add lesson info
            // const lessonText = AI_EXPLAINERS.LESSON({lessonConfig: {
            //     basic: {
            //         name: lesson.data?._name ?? '',
            //         summary: lesson.data?._summary ?? '',
            //     }, 
            //     rootSkillId: lesson.data?.root_skill ?? '',
            // }})


            // Now, filter down to the relevant data.
            const activityText = resultNodes.map((r, idx) => trimLines(`
            # Activity ${idx}
            ## Type
            ${r.activity?.type}
            ## Type Config
            ${JSON.stringify(r.activity?.typeConfig, null, 2)}

            ## User's Result Data
            ${JSON.stringify(r.resultData, null, 2)}

            ## User's Score
            ${r.score}
            `)).join('\n');

            // Ask the AI to provide a judgment
            const aiResp = await ai.genObject({
                prompt: `
                A User has just finished the lesson: ${lesson.data?._name}.

                They got ${percentCorrect * 100}% questions correct and ${percentIncorrect * 100}% questions incorrect.

                Your job is to provide them with feedback they can use to improve.

                ----------------------
                ${activityText}
                
                `,
                functionName: 'output_feedback',
                functionDescription: 'Output feedback for a user based on their lesson results',
                schema: z.object({
                    completionMessage: z.string().describe("A friendly message that will be shown at the start of your feedback."),
                    whatWentWell: z.string().describe("A message that describes what the user did well. (Can use markdown)"),
                    whatToImprove: z.string().describe("A message that describes what the user can improve. (Can use markdown)"),
                }),
            })

            return trimAllLines(`
            ${aiResp.object?.completionMessage}

            -------

            ### ✨ What Went Well
            ${aiResp.object?.whatWentWell}

            -------

            ### 🌱 What To Improve
            ${aiResp.object?.whatToImprove}

            -------
            `)
        }

        // TODO: create the "finish text" that the user will see, based on how they did.

        if (res.error) {
            return NextResponse.json({
                error: res.error
            }, { status: 500 });
        }

        // Finish text doesn't get created if it's an initial assessment lesson.
        const finishText = lesson.data?.lesson_type === 'initial-assessment-lesson' ? '' : await createFinishData();

        return {
            lessonSessionId: parsedReq.lessonSessionId,
            finishText
        }
    }
})



