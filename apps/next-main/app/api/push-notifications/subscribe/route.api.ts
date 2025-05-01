import {NextResponse} from "next/server";
import webpush from "web-push";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {PushNotificationSubscribeRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: PushNotificationSubscribeRoute,
  handler: async (ctx) => {
    const { parsedReq, user, supabase, logger } = ctx;
    
    // Ensure user is authenticated
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Configure web-push
    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
    const privateVapidKey = process.env.VAPID_PRIVATE_KEY!;

    webpush.setVapidDetails(
      'mailto:hi@reasonote.com',
      publicVapidKey,
      privateVapidKey
    );

    try {
      // Extract subscription details
      const { endpoint, keys } = parsedReq;
      const { p256dh, auth } = keys;
      
      // Get user agent for device identification
      const userAgent = ctx.req.headers.get('user-agent') || null;

      // Store subscription in database
      const { data, error } = await supabase
        .from('push_notification_subscription')
        .upsert({
          rsn_user_id: user.rsnUserId,
          _endpoint: endpoint,
          p256dh,
          auth,
          user_agent: userAgent,
          created_by: user.rsnUserId,
          updated_by: user.rsnUserId,
        }, {
          onConflict: '_endpoint'
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing push subscription:', error);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to store subscription' 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true,
        subscriptionId: data.id
      }, { status: 201 });
    } catch (error) {
      console.error('Error in push subscription process:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Subscription process failed' 
      }, { status: 500 });
    }
  }
});
