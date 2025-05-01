import OpenAI from 'openai';

import type { Maybe } from '@lukebechtel/lab-ts-utils';

import XenovaTransformersPipelineSingleton from './pipeline';
import type {
  VectorizeRequest,
  VectorWorkerContext,
} from './types';

// Get embedding type from environment or use default
const EMBEDDING_TYPE = process.env.EMBEDDING_TYPE || 'openai/text-embedding-3-small';

export async function vectorize_chunks(
  ctx: VectorWorkerContext,
  parsedReq: VectorizeRequest,
) {
  const { SUPERUSER_supabase: sb, logger } = ctx;

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  

  if (parsedReq.version !== "v1") {
    throw new Error(
      `Invalid version! Expected "v1" but got "${parsedReq.version}"`
    );
  }

  const chunks = parsedReq.chunks;

  const results: Maybe<{ message: string; rsnVecId: string }>[] =
    await Promise.all(
      chunks.map(async (chunk) => {
        try {
          // Part 2: Generate embeddings based on the selected embedding type
          const timeStart = Date.now();
          
          let xenovaEmbedding = null;
          let openaiEmbedding = null;
          
          // Generate embeddings based on the selected type
          if (EMBEDDING_TYPE === 'supabase/gte-small') {
            // Part 1: Create our pipe
            const generateEmbedding = await XenovaTransformersPipelineSingleton.getInstance();
            // Generate only Xenova embedding
            const xenovaOutput = await generateEmbedding(chunk.chunkText, {
              pooling: "mean",
              normalize: true,
            });
            xenovaEmbedding = Array.from(xenovaOutput.data);
          } else if (EMBEDDING_TYPE === 'openai/text-embedding-3-small') {
            // Generate only OpenAI embedding
            try {
              const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk.chunkText,
                encoding_format: "float",
              });
              openaiEmbedding = response.data?.[0]?.embedding ?? null;
            } catch (err) {
              logger.error("Error generating OpenAI embedding", err);
            }
          } else {
            throw new Error(`Unsupported embedding type: ${EMBEDDING_TYPE}`);
          }
          
          const timeEnd = Date.now();
          logger.debug(`Vectorization for chunk of length ${chunk.chunkText.length} took: ${timeEnd-timeStart} ms`);
          logger.debug(`Used embedding type: ${EMBEDDING_TYPE}`);

          // Part 3: Post to Supabase with the appropriate embeddings
          const upsertData: any = {
            _ref_id: chunk.id,
            content_offset: chunk.charOffsetStart,
            colname: chunk.colname,
            colpath: chunk.colpath,
            raw_content: chunk.chunkText,
          };
          
          // Add embeddings based on what was generated
          if (xenovaEmbedding) {
            upsertData.embedding = xenovaEmbedding;
          }
          
          if (openaiEmbedding) {
            upsertData.embedding_openai_text_embedding_3_small = openaiEmbedding;
          }
          
          const { data: rsnVec, error: rsnVecError } = await sb
            .from("rsn_vec")
            .upsert(
              [upsertData],
              {
                onConflict: "_ref_id,colname,colpath_str,content_offset",
              }
            )
            .select();

          const firstCreatedVector = rsnVec?.[0];

          const newVectorId = firstCreatedVector?.id;

          if (!newVectorId) {
            throw new Error(
              `Could not insert text rsnPageVector! (error: ${rsnVecError})`
            );
          }

          const data = {
            message: `Generated ${EMBEDDING_TYPE} embedding for chunk of length ${
              chunk.chunkText.length
            } (Starting with "${chunk.chunkText.slice(0, 50)}...")`,
            rsnVecId: newVectorId,
          };

          return {
            error: undefined,
            success: true,
            data: data,
          };
        } catch (err: any) {
          return {
            error: err,
            success: false,
          };
        }
      })
    );

  return results;
}
