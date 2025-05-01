import {NextResponse} from "next/server";

import {makeServerApiHandlerV2} from "../helpers/serverApiHandlerV2";
import {SnipsPOSTRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const POST = makeServerApiHandlerV2({
    route: SnipsPOSTRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger, user } = ctx;

        const rsnUserId = user?.rsnUserId

        // Create the snip
        const { data: snip, error: snipError } = await supabase
            .from('snip')
            .insert({
                _type: parsedReq.type,
                text_content: parsedReq.textContent,
                source_url: parsedReq.sourceUrl,
                _owner: rsnUserId ?? null,
            })
            .select('*')
            .single()
        
        if (!snip) {
            return NextResponse.json({
                error: 'Error returning snip!'
            }, { status: 500 });
        }

        return {
            id: snip.id,
            type: snip._type,
            textContent: snip.text_content,
            sourceUrl: snip.source_url,
        }
    }
})
