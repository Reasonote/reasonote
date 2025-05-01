import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {CanceledSubscriptionsRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: CanceledSubscriptionsRoute,
  handler: async (ctx) => {
    const { user, supabase } = ctx;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Use the RPC function we created in the migration
      const { data, error } = await supabase.rpc('get_user_canceled_subscriptions');

      if (error) {
        console.error('Error fetching canceled subscriptions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data || []);
    } catch (error) {
      console.error('Error in canceled subscriptions endpoint:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
        { status: 500 }
      );
    }
  }
}); 