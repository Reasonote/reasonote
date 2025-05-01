import {NextResponse} from "next/server";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {RemoveFromUserBotSetRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const POST = makeServerApiHandlerV2({
    route: RemoveFromUserBotSetRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger, user } = ctx;

        const rsnUserId = user?.rsnUserId

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 401 });
        }
 
        // Now, remove the bot from the user's bot set.
        const ret = await supabase
            .from('bot_set_bot')
            .delete()
            .in('bot', parsedReq.removeBotIds)

        if (ret.error) {
            return NextResponse.json({
                error: `Error removing bot from bot set! (ERR: ${JSON.stringify(ret.error, null, 2)})`
            }, { status: 500 });
        }

        return {
            botsRemoved: parsedReq.removeBotIds
        }
    }
})
