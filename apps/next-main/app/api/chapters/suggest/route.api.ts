import {NextResponse} from "next/server";

import {RouteWarning} from "../../_common/schema/RouteWarningSchema";
import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {getNormalChapters} from "./getNormalChapters";
import {ChaptersSuggestRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const POST = makeServerApiHandlerV2({
    route: ChaptersSuggestRoute,
    handler: async (ctx) => {
        const { req, ac, rsn, parsedReq,  supabase, logger, user, ai } = ctx;

        const rsnUserId = user?.rsnUserId
    
        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 404 });
        }
        const warnings: RouteWarning[] = []

        return getNormalChapters(ctx); 
    }
})
