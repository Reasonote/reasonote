import {NextResponse} from "next/server";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {LessonGetActivityListRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 90;

export const POST = makeServerApiHandlerV2({
    route: LessonGetActivityListRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, rsn, logger, user, ai } = ctx;

        const rsnUserId = user?.rsnUserId

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 404 });
        }

        return NextResponse.json({
            error: 'Not implemented yet!'
        }, { status: 501 });
    }
})
