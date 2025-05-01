import {NextResponse} from "next/server";

import {notEmpty} from "@lukebechtel/lab-ts-utils";

import XenovaTransformersPipelineSingleton from "../../_common/Pipeline";
import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {SlowEmbeddingGroupRoute} from "./routeSchema";

export const POST = makeServerApiHandlerV2({
    route: SlowEmbeddingGroupRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger } = ctx;

        // Part 1: Create our pipe
        const generateEmbedding =
            await XenovaTransformersPipelineSingleton.getInstance();

        const getGroupAverageEmbeddings = async (group: {groupId: string, texts: string[]}) => {
            if (group.texts.length === 0) {
                return undefined;
            }
            
            const embeddings: number[][] = await Promise.all(group.texts.map(async (text) => {
                const output = await generateEmbedding(text, {
                    pooling: "mean",
                    normalize: true,
                });

                return Array.from(output.data);
            }));

            const averageEmbedding = embeddings.reduce((acc, val) => {
                return acc.map((v, i) => v + val[i]);
            }, new Array(embeddings[0].length).fill(0)).map((v) => v / embeddings.length);

            return {
                groupId: group.groupId,
                avgEmbedding: averageEmbedding,
            };
        }

        const groupAverageEmbeddings = (await Promise.all(parsedReq.groups.map(async (group) => {
            return await getGroupAverageEmbeddings(group);
        }))).filter(notEmpty);

        // Now generate embeddings for the query.
        const queryEmbedding = await generateEmbedding(parsedReq.query, {
            pooling: "mean",
            normalize: true,
        });

        // Calculate cosine similarity between the query and each group.
        const groupSimilarities = groupAverageEmbeddings.map((group) => {
            const dotProduct = group.avgEmbedding.reduce((acc, val, i) => {
                return acc + val * queryEmbedding.data[i];
            }, 0);
        
            const magnitudeA = Math.sqrt(group.avgEmbedding.reduce((acc, val) => acc + val * val, 0));
            const magnitudeB = Math.sqrt(queryEmbedding.data.reduce((acc: any, val: any) => acc + val * val, 0));
        
            const similarityScore = dotProduct / (magnitudeA * magnitudeB);
        
            return {
                groupId: group.groupId,
                similarityScore,
            };
        });

        return NextResponse.json({
            groupSimilarities
        }, { status: 200 });
    }
})
