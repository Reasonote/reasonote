import {NextResponse} from "next/server";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {SnipExtractTextCronRoute} from "./routeSchema";

export const POST = makeServerApiHandlerV2({
    route: SnipExtractTextCronRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger, SUPERUSER_supabase } = ctx;
 
        // 1. Get all snips that have a url but no text content
        const { data: snips, error: snipError } = await SUPERUSER_supabase
            .from('snip')
            .select('*')
            .not('source_url', 'is', null)
            .is('text_content', null)
            .neq('extraction_state', 'success')
            .neq('extraction_state', 'failed')
            .neq('extraction_state', 'processing')

        
        if (snipError) {
            logger.error('Error fetching snips', snipError)
            return NextResponse.json({
                error: 'Error fetching snips!'
            }, { status: 500 });
        }

        logger.debug(`Found ${snips.length} snips to extract text from.`)

        // 2. Extract text from each snip
        const result = await Promise.all(snips.map(async (snip) => {
            const { id } = snip;

            const theUrl = `${ctx.pathHelpers.baseUrl}/api/internal/snip_extract_text`;
            // TODO: permissions
            try {
                const outputNew = await fetch(theUrl, {
                    method: "POST",
                    body: JSON.stringify({snipId: id}),
                });

                if (!outputNew.ok){
                    throw new Error(`Error returned from snip_extract_text: ${JSON.stringify(outputNew)}`)
                }

                return {
                    id,
                    success: true,
                }

                // logger.log(await outputNew.json());
            } catch (err: any) {
                logger.error("Error in snip_extract_text", err);
                return {
                    id,
                    success: false,
                    error: err.message,
                }
            }
        }));

        logger.debug(`Finished extracting text from ${result.length} snips. (${result.filter(({ success }) => success).length} succeeded, ${result.length - result.filter(({ success }) => success).length} fail)`)

        return NextResponse.json({
            result: result.map(({ id, error, success }) => ({
                id,
                success
            }))
        }, { status: 200 });
    }
})
