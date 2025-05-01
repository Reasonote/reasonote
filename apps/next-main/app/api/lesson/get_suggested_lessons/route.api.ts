import {NextResponse} from "next/server";

import {RouteWarning} from "../../_common/schema/RouteWarningSchema";
import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {getNormalLessons} from "./getNormalLessons";
import {GetSuggestedLessonsRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const POST = makeServerApiHandlerV2({
    route: GetSuggestedLessonsRoute,
    handler: async (ctx) => {
        const { req, ac, rsn, parsedReq,  supabase, logger, user, ai } = ctx;

        const rsnUserId = user?.rsnUserId
    
        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 404 });
        }
        const warnings: RouteWarning[] = []

        const lastSkillId = parsedReq.skillIdPath[parsedReq.skillIdPath.length - 1];

        // Get any lessons for this skill
        // const lessons = await rsn.skill..getLessonsForSkill({skillId: parsedReq.skillIdPath[0], userId: rsnUserId});
        const existingLessonRes = await supabase.from('lesson').select('*').eq('root_skill', lastSkillId).eq('for_user', rsnUserId);

        if (existingLessonRes.error) {
            warnings.push({
                code: 'lesson_fetch_error',
                text: `Error fetching lessons: ${existingLessonRes.error.message}`
            })
        }

        const lessons = existingLessonRes.data;

        return getNormalLessons(ctx); 
    }
})
