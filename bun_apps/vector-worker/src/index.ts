import _ from 'lodash';

import {
  asyncSleep,
  notEmpty,
} from '@lukebechtel/lab-ts-utils';
import { createClient } from '@supabase/supabase-js';

import { createChunks } from './chunking';
import type { VectorWorkerContext } from './types';
import { vectorize_chunks } from './vectorize_chunks';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY and SUPABASE_SERVICE_KEY must be set");
}

const NUM_ITEMS_POP_QUEUE = 50;
const SLEEP_TIME_MS = 1000;
// Define embedding types
const EMBEDDING_TYPE = process.env.EMBEDDING_TYPE || 'openai/text-embedding-3-small'; // Alternative: 'supabase/gte-small'

// Custom logger function
function createCustomLogger(level: string) {
    return {
        debug: (...args: any[]) => level === 'debug' && console.debug(...args),
        info: (...args: any[]) => ['debug', 'info'].includes(level) && console.log(...args),
        warn: (...args: any[]) => ['debug', 'info', 'warn'].includes(level) && console.warn(...args),
        error: (...args: any[]) => console.error(...args),
        log: (...args: any[]) => console.log(...args),
    };
}

export async function main() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const ctx: VectorWorkerContext = {
        logger: createCustomLogger(logLevel),
        SUPERUSER_supabase: createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!),
    };

    ctx.logger.log('vector-worker started.')

    while (true) {
        try {
            const dataResultVecQueue = await getVecQueue(ctx);

            if (dataResultVecQueue.length === 0) {
                ctx.logger.debug("No vecQueueItems found");
                await asyncSleep(SLEEP_TIME_MS);
                continue;
            }

            const itemsToVectorize = _.flatten(await Promise.all(
                dataResultVecQueue.map(async (tableResult) => {
                    if (tableResult.error || !tableResult.data) {
                        ctx.logger.warn("Error in tableResult", tableResult.error);
                        return;
                    } else {
                        // Chunk the value of this item and put it in the queue.
                        const { tableName, colname, colpath, value, fullItem } =
                            tableResult.data;

                        if (!value) {
                            // logger.warn("No value found in tableResult, skipping");
                            return;
                        }

                        if (typeof value !== "string") {
                            // logger.warn("Value is not a string, skipping");
                            return;
                        }

                        // Fetch the correct data for this item.
                        if (colpath) {
                            const { data: deleteResult, error: deleteError } = await ctx.SUPERUSER_supabase
                                .from("rsn_vec")
                                .delete()
                                .eq("_ref_id", fullItem.id)
                                .eq("colname", colname)
                                .eq("colpath", colpath)
                                .order("created_date", { ascending: true })
                                .limit(5000); // TODO: this is arbitrary, but we need to limit it somehow so we don't accidentally delete all things.

                            // logger.debug(`Deleted old chunks for ${tableName}.${colname}`);
                            // logger.debug(deleteResult, deleteError);
                        } else {
                            const { data: deleteResult, error: deleteError } = await ctx.SUPERUSER_supabase
                                .from("rsn_vec")
                                .delete()
                                .eq("_ref_id", fullItem.id)
                                .eq("colname", colname)
                                .order("created_date", { ascending: true })
                                .limit(5000); // TODO: this is arbitrary, but we need to limit it somehow so we don't accidentally delete all things.

                            // logger.debug(`Deleted old chunks for ${tableName}.${colname}`);
                            // logger.debug(deleteResult, deleteError);
                        }

                        /////////////////////////////////////////////////
                        // CHUNK
                        const chunks = await createChunks({
                            value,
                            metadata: {
                                id: fullItem.id,
                                tableName,
                                colname,
                                colpath,
                            },
                        });

                        // Final processing
                        return chunks.map((itemChunk) => {
                            // The embedding is calculated on the full text of the chunk,
                            // So we need to join the items together.
                            const chunkText = itemChunk.chunkText;

                            return {
                                //Bookkeeping data
                                id: fullItem.id,
                                tableName,
                                colname,
                                colpath,
                                //Chunk data
                                charOffsetStart: itemChunk.metadata.loc.rawOffset,
                                chunkText: chunkText,
                            };
                        });
                    }
                })
            )).filter(notEmpty);


            /** How many chunks do we send to `vectorize_chunks` at once? */
            const maxNetworkChunksAtOnce = 50;
            const processingChunks = _.chunk(itemsToVectorize, maxNetworkChunksAtOnce);
            let totalChunksProcessed = 0;

            for (const procChnk of processingChunks) {
                const vectorize_params = {
                    chunks: procChnk,
                    version: "v1",
                    embeddingType: EMBEDDING_TYPE,
                };

                const output = await vectorize_chunks(ctx, vectorize_params);

                totalChunksProcessed += output.length;
                ctx.logger.info(`Processed ${output.length} chunks, total processed: ${totalChunksProcessed}`);
            }

            ctx.logger.info(`Processed ${totalChunksProcessed} chunks`);
        } catch (error) {
            ctx.logger.error("Error in main loop:", error);
        }

        await asyncSleep(SLEEP_TIME_MS);
    }
}


async function getVecQueue(ctx: VectorWorkerContext) {
    const { SUPERUSER_supabase: sb } = ctx;
    // Get items from our queue
    // TODO: better limit on this.
    const { data: vecQueueItems, error: vecQueueError } = await ctx.SUPERUSER_supabase
        .from("rsn_vec_queue")
        .select("*")
        .limit(NUM_ITEMS_POP_QUEUE);

    ctx.logger.debug("vecQueueItems", vecQueueItems)

    if (!vecQueueItems || vecQueueItems.length === 0) {
        return [];
    }

    // TODO: Don't delete here, only delete after we've successfully generated the embeddings.
    // This probably implies we need the ability to mark
    // "jobStartedAt" on a rsn_vec entry. That will prevent other workers from trying to
    // vectorize the same thing. If that date was "too long ago", then we can assume
    // it failed, and try again. We should also mark the number of failures.

    const deleteResults = await Promise.all(_.chunk(vecQueueItems, 50).map(async (vecQueueItemsChunk) => {
        const { data: dataResultDelete, error: errorResultDelete } = await sb
            .from("rsn_vec_queue")
            .delete()
            .in(
                "id",
                vecQueueItemsChunk.map((queueItem) => queueItem.id)
            );

        // logger.debug(
        //   "Deleted items from queue:",
        //   dataResultDelete,
        //   "error",
        //   errorResultDelete
        // );
    }))

    /////////////////////////////////////////////////////////
    // Handle different data types

    // Get pages corresponding to the items in our queue
    const rsnIds = vecQueueItems.map((queueItem) => queueItem._ref_id);

    // Group items from queue by tableName
    const rsnIdsByTable: Record<
        string,
        { id: string; colname: string; colpath: string[] | null }[]
    > = {};


    vecQueueItems.forEach((queueItem) => {
        if (!queueItem.tablename) {
            ctx.logger.error("No tablename found for queueItem", queueItem)
            return;
        }
        if (!rsnIdsByTable[queueItem.tablename]) {
            rsnIdsByTable[queueItem.tablename] = [];
        }

        rsnIdsByTable[queueItem.tablename].push({
            id: queueItem._ref_id,
            colname: queueItem.colname,
            colpath: queueItem.colpath,
        });
    });

    // Iterate through each table, get the items for that table.
    const itemsFetched = await Promise.all(
        (Object.keys(rsnIdsByTable) as (keyof typeof rsnIdsByTable)[]).map(
            async (tableName) => {
                const itemChunks = await Promise.all(_.chunk(rsnIdsByTable[tableName], 50).map(async (itemsToVectorizeChunk) => {
                    const idList = itemsToVectorizeChunk.map((item) => item.id)

                    const { data: items, error: itemsError } = await sb
                        .from(tableName as any)
                        .select("*")
                        .in("id", idList);

                    if (!items) {
                        return { tableName, itemsWithValues: [], error: itemsError };
                    }

                    const itemsWithValues = itemsToVectorizeChunk.map((rsnObj) => {
                        const item = items.find((item) => item.id === rsnObj.id);
                        
                        if (!item) {
                            ctx.logger.error("No item found for rsnObj", rsnObj);
                            return;
                        }

                        // Only process the specific column for this item
                        const colVal = item[rsnObj.colname];
                        return {
                            tableName,
                            colname: rsnObj.colname,
                            colpath: rsnObj.colpath,
                            value: rsnObj.colpath ? _.get(colVal, rsnObj.colpath) : colVal,
                            fullItem: item,
                            error: null,
                        };
                    }).filter(notEmpty);

                    return { tableName, itemsWithValues, error: itemsError };
                }));

                return {
                    tableName,
                    itemsWithValues: _.flatten(itemChunks.map((itemChunk) => itemChunk.itemsWithValues)),
                    error: null,
                };
            }
        )
    );

    // Flatten the items, storing tableName and error correctly
    const ret = itemsFetched.reduce(
        (acc, itemMeta) => {
            if (itemMeta.error) {
                // If there is an error in the item, store it as such
                acc.items.push({ error: itemMeta.error });
            } else {
                itemMeta.itemsWithValues?.forEach((item) => {
                    if (item.error) {
                        acc.items.push({ error: item.error });
                    } else {
                        const { tableName, colname, colpath, value, fullItem } = item;
                        acc.items.push({
                            data: { tableName, colname, colpath, value, fullItem },
                        });
                    }
                });
            }

            return acc;
        },
        {
            items: [] as (
                | {
                    data: {
                        tableName: string;
                        colname: string;
                        colpath: string[] | null;
                        value: any;
                        fullItem: any;
                    };
                    error?: undefined;
                }
                | { data?: undefined; error: any }
            )[],
        }
    );
    return ret.items;
}


main().catch((err) => console.error("Fatal error in main loop:", err));