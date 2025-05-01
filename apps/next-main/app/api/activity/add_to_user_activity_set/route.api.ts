import {NextResponse} from "next/server";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {AddtoUserActivitySetRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 120 seconds.
export const maxDuration = 120;

export const POST = makeServerApiHandlerV2({
    route: AddtoUserActivitySetRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger, user } = ctx;


        const { data, error } = await supabase.rpc('add_to_user_activity_set', { add_ids: parsedReq.addIds });
       
        if (error) {
            return NextResponse.json({
                error: 'Error adding to user activity set!',
                originalError: error,
            }, { status: 500 });
        }

        return NextResponse.json(data, { status: 200 });
    }
})

