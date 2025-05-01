import {NextResponse} from "next/server";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {RemoveFromUserActivitySetRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const POST = makeServerApiHandlerV2({
    route: RemoveFromUserActivitySetRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger, user } = ctx;

        const rsnUserId = user?.rsnUserId

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 401 });
        }
 
        // Now, remove the activity from the user's activity set.
        const ret = await supabase
            .from('activity_set_activity')
            .delete()
            .in('activity', parsedReq.removeActivityIds)

        if (ret.error) {
            return NextResponse.json({
                error: `Error removing activity from activity set! (ERR: ${JSON.stringify(ret.error, null, 2)})`
            }, { status: 500 });
        }

        return {
            activitiesRemoved: parsedReq.removeActivityIds
        }
    }
})
