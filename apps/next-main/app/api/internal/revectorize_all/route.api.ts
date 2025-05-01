import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {RevectorizeAllRoute} from "./routeSchema";

export const POST = makeServerApiHandlerV2({
    route: RevectorizeAllRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger } = ctx;

        const magicWord = parsedReq.magicWord;

        if (magicWord !== 'please') {
            throw new Error('Invalid magic word!')
        }

        const rsnVecConfigs = await supabase.from('rsn_vec_config').select('*')

        if (!rsnVecConfigs.data) {
            throw new Error('No rsn_vec_config found!')
        }

        const groupedByTablename = rsnVecConfigs.data.reduce((acc, config) => {
            if (!acc[config.tablename]) {
                acc[config.tablename] = []
            }

            acc[config.tablename].push(config)

            return acc
        }, {} as Record<string, any[]>)

        const results: {
            tablename: string, 
            colname: string, 
            colpath: string[], 
            numQueuedVecs: number,
            numVecsFailedToQueue: number,
        }[] = []

        // For each table name
        await Promise.all(Object.entries(groupedByTablename).map(async ([tablename, configs]) => {
            // TODO: this is huge, but for now it'll be okay...
            const tableIdResults = await supabase.from(tablename as any).select('id').limit(1_000_000)
            const tableIds = tableIdResults.data?.map((item) => item.id)

            if (!tableIds) {
                console.warn(`No ids found for table ${tablename}`)
                return
            }

            // Now for each colname + colpath config for this table,
            // push all these ids onto the queue
            await Promise.all(configs.map(async (config) => {
                const {colname, colpath} = config

                if (!colname) {
                    console.warn(`No colname found for config on table ${tablename}`)
                }
                
                const { data: vecQueueItems, error: vecQueueItemsError } = await supabase
                    .from('rsn_vec_queue')
                    .upsert(
                        tableIds.map((id) => ({
                            _ref_id: id,
                            tablename,
                            colname,
                            colpath,
                        })) as any,
                        {
                            onConflict: "_ref_id,colname,colpath_str",
                        }
                    )
                    .select('*')
                
                console.log({vecQueueItems, vecQueueItemsError})
                
                if (vecQueueItemsError) {
                    console.error(`Error inserting into rsn_vec_queue: ${JSON.stringify(vecQueueItemsError)}`)
                    results.push({
                        tablename,
                        colname,
                        colpath,
                        numQueuedVecs: 0,
                        numVecsFailedToQueue: tableIds.length,
                    })
                }
                else {
                    results.push({
                        tablename,
                        colname,
                        colpath,
                        numQueuedVecs: tableIds.length,
                        numVecsFailedToQueue: 0,
                    })
                }

                console.log({results})
            }))
        }))

        return {results};
    }
})
