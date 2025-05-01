import {NextResponse} from "next/server";

import {notEmpty} from "@lukebechtel/lab-ts-utils";

import {makeServerApiHandlerV3} from "../helpers/serverApiHandlerV3";
import {NotificationSubscriptionsRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: NotificationSubscriptionsRoute,
  handler: async (ctx) => {
    const { parsedReq, user, supabase } = ctx;
    const { daily_streak } = parsedReq;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      let data: any;

      // First try to get existing subscription
      let { data: data1, error } = await supabase.rpc(
        'get_or_create_notification_subscription',
        { p_user_id: user.rsnUserId }
      );
      data = data1?.[0];

      if (error) {
        console.error('Error getting notification subscription:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // If we have updates to apply
      if (notEmpty(daily_streak)) {
        const { data: updatedData, error: updateError } = await supabase
          .from('notification_subscription')
          .update({
            daily_streak: daily_streak,
            updated_by: user.rsnUserId,
          })
          .eq('rsn_user_id', user.rsnUserId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating notification subscription:', updateError);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        data = updatedData;
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error('Error in notification subscription process:', error);
      return NextResponse.json({ 
        error: 'Subscription process failed' 
      }, { status: 500 });
    }
  }
}); 