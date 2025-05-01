import {NextResponse} from "next/server";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {AddtoUserBotSetRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const POST = makeServerApiHandlerV2({
    route: AddtoUserBotSetRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger, user } = ctx;

        const rsnUserId = user?.rsnUserId

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 404 });
        }

        // Get the user's bot set.
        const { data: botSets, error: botSetsError } = await supabase
            .from('bot_set')
            .select('*')
            .eq('for_user', rsnUserId)
        
        if (botSets === null) {
            return NextResponse.json({
                error: 'Error fetching bot sets!'
            }, { status: 500 });
        }

        var botSet = botSets[0] ?? null

        // If the user doesn't have a bot set, create one.
        if (!botSet) {
            const { data: newbotSet, error: newbotSetError } = await supabase
                .from('bot_set')
                .insert({
                    for_user: rsnUserId,
                })
                .select('*')
                .limit(1)
                .single()
            
            if (!newbotSet) {
                return NextResponse.json({
                    error: `Error creating bot set! (ERR: ${JSON.stringify(newbotSetError, null, 2)})`
                }, { status: 500 });
            }

            botSet = newbotSet
        }

        var allIds = parsedReq.addIds;
        
        // Now, add the bot to the user's bot set.
        const { data: botSetActivities, error: botSetbotsError } = await supabase
            .from('bot_set_bot')
            .insert(allIds.map((id) => ({
                bot_set: botSet.id,
                bot: id,
            })))
            .select('*')
        
        if (!botSetActivities) {
            return NextResponse.json({
                error: 'Error adding bot to bot set!',
                botSetId: botSet.id,
                botIds: allIds,
            }, { status: 500 });
        }

        return {
            botSetId: botSet.id,
            botSetBotIds: botSetActivities.map((sk) => sk.id),
            botIds: allIds,
        }
    }
})
