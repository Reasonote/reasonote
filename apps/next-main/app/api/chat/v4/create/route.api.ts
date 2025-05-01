import _ from "lodash";
import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";
import {PostgrestError} from "@supabase/supabase-js";

import {ChatV4CreateRoute} from "./routeSchema";

//env.useBrowserCache = false;
//env.allowLocalModels = false;

class PostgrestErrorWrapper extends Error {
  constructor(public readonly pgError: PostgrestError) {
    super("PostgrestErrorWrapper");
  }
}

// Tells next.js to set the maximum duration of the request to 60 seconds.
export const maxDuration = 90;

export const {POST} = makeServerApiHandlerV3({
  route: ChatV4CreateRoute,
  handler: async (ctx) => {
    const { req, parsedReq,  supabase, ai, logger, user } = ctx;

    // First, check if the user is signed in
    if (!user?.rsnUserId){
      return NextResponse.json({
        error: 'User not found!'
      }, { status: 404 });
    }

    ////////////////////////////////////
    // 1. Create the chat room.
    const chatCreateRes = await supabase.from('chat').insert({}).select('*').single();

    const chatId = chatCreateRes.data?.id;

    if (!chatId){
      return NextResponse.json({
        error: 'Failed to create chat room!'
      }, { status: 500 });
    }


    ////////////////////////////////////
    // 2. Add the context messages.
    const contextItemsToAdd = parsedReq.contextItems;
    if (contextItemsToAdd){
      // Do this in a for loop because ordering may matter.
      for (const citem of contextItemsToAdd){
        await ai.chat.upsertContext({
          ...citem,
          chatId
        })
      }
    }

    ////////////////////////////////////
    // 3. Add the bots to the chat room.
    const botIdsToAdd = parsedReq.botIds;
    if (botIdsToAdd){
      console.log({botIdsToAdd})
      // Do this in a for loop because ordering may matter.
      for (const botId of botIdsToAdd){
        const memberAuthResp = await supabase.from('member_authorization').insert({
          access_level: 'COMMENTOR',
          bot_id: botId,
          granted_chat_id: chatId,
        })

        console.log({memberAuthResp})
      }
    }

    ////////////////////////////////////////////
    // Return result
    return {
        chatId
    };
  },
});
