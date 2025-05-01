import {NextResponse} from "next/server";

import XenovaTransformersPipelineSingleton from "../../_common/Pipeline";
import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {GetEmbeddingRoute} from "./routeSchema";

export const POST = makeServerApiHandlerV2({
    route: GetEmbeddingRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger } = ctx;

        // Part 1: Create our pipe
        const generateEmbedding =
            await XenovaTransformersPipelineSingleton.getInstance();

        const output = await generateEmbedding(parsedReq.text, {
            pooling: "mean",
            normalize: true,
        });

        const embedding = Array.from(output.data);

        logger.log(`Created embedding of length ${embedding.length}`)

        return NextResponse.json({
            embedding,
        }, { status: 200 });
    }
})
