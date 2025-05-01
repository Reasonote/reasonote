import {NextResponse} from "next/server";
import OpenAI from "openai";

import XenovaTransformersPipelineSingleton from "../../_common/Pipeline";
import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {SearchRsnVecRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const POST = makeServerApiHandlerV2({
    route: SearchRsnVecRoute,
    handler: async (ctx) => {
        const { req, parsedReq, supabase, logger } = ctx;

        let embedding: number[];

        // Choose embedding generation method based on column
        if (parsedReq.embeddingColumn === 'embedding_openai_text_embedding_3_small') {
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });

            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: parsedReq.text,
                encoding_format: "float",
            });

            embedding = response.data[0].embedding;
        } else {
            // Default Xenova embedding
            const generateEmbedding = await XenovaTransformersPipelineSingleton.getInstance();
            const output = await generateEmbedding(parsedReq.text, {
                pooling: "mean",
                normalize: true,
            });
            embedding = Array.from(output.data);
        }

        logger.log(`Created "${parsedReq.embeddingColumn}" embedding of length ${embedding.length}`);

        // Now, ask supabase to find the most similar vector
        const matchResult = await supabase.rpc('match_rsn_vec', {
            match_embedding: embedding as any,
            match_threshold: parsedReq.matchThreshold ?? .6,
            match_count: parsedReq.matchCount ?? 10,
            filter_tablename: parsedReq.tablename ?? undefined,
            filter_colname: parsedReq.columnname ?? undefined,
            filter_colpath: parsedReq.colpath ?? undefined,
            min_content_length: parsedReq.minContentLength ?? 2,
            embedding_column: parsedReq.embeddingColumn,
        });
        
        logger.debug(`Query: ${JSON.stringify(parsedReq, null, 2)}`, `Supabase returned: ${JSON.stringify({matchResult}, null, 2)}`);

        return NextResponse.json({
            ...matchResult,
        }, { status: 200 });
    }
})
