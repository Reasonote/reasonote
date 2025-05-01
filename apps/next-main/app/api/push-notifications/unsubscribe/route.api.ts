import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {PushNotificationUnsubscribeRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: PushNotificationUnsubscribeRoute,
  handler: async (ctx) => {
    const { parsedReq, user, supabase, logger } = ctx;
    
    // Ensure user is authenticated
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Extract subscription endpoint
      const { endpoint } = parsedReq;
      
      // Delete subscription from database
      // Note: We ensure users can only delete their own subscriptions by matching rsn_user_id
      const { error } = await supabase
        .from('push_notification_subscription')
        .delete()
        .match({ 
          rsn_user_id: user.rsnUserId,
          endpoint 
        });

      if (error) {
        console.error('Error removing push subscription:', error);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to remove subscription' 
        }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error in push unsubscription process:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Unsubscription process failed' 
      }, { status: 500 });
    }
  }
}); 