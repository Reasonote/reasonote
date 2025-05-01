import {NextResponse} from "next/server";

import {notEmpty} from "@lukebechtel/lab-ts-utils";

import {makeServerApiHandlerV3} from "../helpers/serverApiHandlerV3";
import {EmailSubscriptionsRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: EmailSubscriptionsRoute,
  handler: async (ctx) => {
    const { parsedReq, user, supabase } = ctx;
    const { product_updates, edtech_updates, newsletter } = parsedReq;

    console.log('product_updates', user);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('email_subscription')
      .upsert({
        rsn_user_id: user.rsnUserId,
        product_updates: notEmpty(product_updates) ? product_updates : undefined,
        edtech_updates: notEmpty(edtech_updates) ? edtech_updates : undefined,
        newsletter: notEmpty(newsletter) ? newsletter : undefined,
      }, {
        onConflict: 'rsn_user_id'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }
});