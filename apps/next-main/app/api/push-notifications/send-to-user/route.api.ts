import {NextResponse} from "next/server";
import webpush from "web-push";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {PushNotificationSendToUserRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: PushNotificationSendToUserRoute,
  handler: async (ctx) => {
    const { parsedReq, user, supabase, logger } = ctx;
    
    // Ensure user is authenticated and is an admin
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: isAdmin, error: userError } = await supabase
      .rpc('is_admin');

    logger.log("Checking if user is admin");

    if (userError || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      const { userId, title, body, icon, url, data } = parsedReq;

      // Validate that VAPID keys are present
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

      if (!publicVapidKey || !privateVapidKey) {
        console.error('VAPID keys are not configured properly');
        return NextResponse.json(
          { success: false, error: 'Server configuration error: VAPID keys missing' },
          { status: 500 }
        );
      }

      // Set VAPID details
      webpush.setVapidDetails(
        'mailto:hi@reasonote.com',
        publicVapidKey,
        privateVapidKey
      );

      // Get all subscriptions for the target user
      const { data: subscriptions, error: fetchError } = await supabase
        .from('push_notification_subscription')
        .select('id, _endpoint, p256dh, auth')
        .eq('rsn_user_id', userId);

      if (fetchError) {
        console.error('Error fetching push subscriptions:', fetchError);
        return NextResponse.json({ 
          success: false,
          error: 'Failed to fetch subscriptions' 
        }, { status: 500 });
      }

      if (!subscriptions || subscriptions.length === 0) {
        return NextResponse.json({ 
          success: false,
          error: 'No subscriptions found for this user',
          sent: 0,
          failed: 0
        });
      }

      // Prepare notification payload
      const payload = JSON.stringify({
        title,
        body,
        icon: icon || '/logo192.png',
        url: url || '/',
        data: data || {},
        timestamp: new Date().getTime()
      });

      // Send notifications to all subscriptions
      const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
          const subscription = {
            endpoint: sub._endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };

          try {
            await webpush.sendNotification(subscription, payload);
            
            // Update last_used_date
            await supabase
              .from('push_notification_subscription')
              .update({ last_used_date: new Date().toISOString() })
              .eq('id', sub.id);
              
            return { success: true, id: sub.id };
          } catch (error: any) {
            // If subscription is expired, remove it
            if (error.statusCode === 404 || error.statusCode === 410) {
              await supabase
                .from('push_notification_subscription')
                .delete()
                .eq('id', sub.id);
            }
            
            return { 
              success: false, 
              id: sub.id, 
              error: error.message,
              statusCode: error.statusCode 
            };
          }
        })
      );

      // Count successes and failures
      const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - sent;
      const errors = results
        .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
        .map(r => {
          if (r.status === 'rejected') {
            return r.reason.toString();
          } else {
            return `Subscription ${r.value.id}: ${r.value.error} (${r.value.statusCode})`;
          }
        });

      return NextResponse.json({ 
        success: sent > 0,
        sent,
        failed,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Error sending notifications to user:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send notifications',
          sent: 0,
          failed: 1
        },
        { status: 500 }
      );
    }
  }
}); 