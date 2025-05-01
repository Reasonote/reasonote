import {NextResponse} from "next/server";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {OnboardingCompleteRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const POST = makeServerApiHandlerV2({
    route: OnboardingCompleteRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, SUPERUSER_supabase, logger, user } = ctx;

        const rsnUserId = user?.rsnUserId

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 404 });
        }

        // Mark the sysdata
        const { data: sysdata, error: sysdataError } = await SUPERUSER_supabase
            .from('rsn_user_sysdata')
            .update({
                has_onboarded: true,
            })
            .eq('rsn_user_id', rsnUserId)
            .select('*')
            .single();
        
        if (!sysdata) {
            return NextResponse.json({
                error: `Error updating user sysdata! (ERR: ${JSON.stringify(sysdataError, null, 2)})`
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            sysdata,
        });
    }
})
