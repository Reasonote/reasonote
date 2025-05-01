import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {extractAndFillSnip} from "./_helpers/extractText";
import {SnipExtractTextRoute} from "./routeSchema";

export const POST = makeServerApiHandlerV2({
    route: SnipExtractTextRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger, SUPERUSER_supabase } = ctx;
 
        const id = parsedReq.snipId;

        logger.debug(`Extracting text from snip ${id}`)

        try {
            const textContent = await extractAndFillSnip({
                supabase: SUPERUSER_supabase,
                id,
                logger
            });

            if (!textContent) {
                const err = new Error(`Error extracting text from snip ${id}: no text content returned`);
                logger.error(err);
                throw err;
            }
            return {
                id,
                markdownResult: textContent
            }
        } catch (error: any) {
            const err = new Error(`Error extracting text from snip ${id}: ${error?.message}`);
            logger.error(err);
            throw err;
        }
    }
})
