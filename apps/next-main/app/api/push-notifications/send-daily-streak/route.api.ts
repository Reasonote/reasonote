import {NextResponse} from "next/server";
import webpush from "web-push";

import {
  getUsersSubscribedToNotification,
} from "../../helpers/notificationHelpers";
import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {PushNotificationSendDailyStreakRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: PushNotificationSendDailyStreakRoute,
  handler: async (ctx) => {
    const { parsedReq, supabase, logger, SUPERUSER_supabase } = ctx;

    const {data: isAdminResult, error: isAdminError} = await supabase.rpc('is_admin');

    if (isAdminError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminResult) {
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
      // Get all users who have subscribed to daily streak notifications
      const subscribedUserIds = await getUsersSubscribedToNotification(
        SUPERUSER_supabase,
        'daily_streak'
      );

      if (subscribedUserIds.length === 0) {
        return NextResponse.json({
          success: true,
          sent: 0,
          failed: 0,
          message: 'No users subscribed to daily streak notifications'
        });
      }

      // Get all push subscriptions for these users
      const { data: subscriptions, error: subError } = await SUPERUSER_supabase
        .from('push_notification_subscription')
        .select('*')
        .in('rsn_user_id', subscribedUserIds);

      if (subError) {
        console.error('Error fetching push subscriptions:', subError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch subscriptions',
          sent: 0,
          failed: subscribedUserIds.length
        }, { status: 500 });
      }

      // Send notifications to each subscription
      let sent = 0;
      let failed = 0;

      const notificationPayload = {
        title: 'Daily Streak Reminder',
        body: 'Don\'t forget to continue your learning streak today!',
        icon: 'https://reasonote.com/favicon.ico',
        url: 'https://reasonote.com'
      };

      for (const subscription of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: subscription._endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          };

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify({
              title: notificationPayload.title,
              body: notificationPayload.body,
              icon: notificationPayload.icon,
              url: notificationPayload.url
            })
          );

          // Update last_used_date
          await SUPERUSER_supabase
            .from('push_notification_subscription')
            .update({ last_used_date: new Date().toISOString() })
            .eq('id', subscription.id);

          sent++;
        } catch (error: any) {
          console.error('Error sending notification:', error);
          failed++;

          // If the subscription is invalid (gone), delete it
          if (error.statusCode === 410) {
            await SUPERUSER_supabase
              .from('push_notification_subscription')
              .delete()
              .eq('id', subscription.id);
          }
        }
      }

      return NextResponse.json({
        success: true,
        sent,
        failed
      });
    } catch (error) {
      console.error('Error in daily streak notification process:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Notification process failed',
        sent: 0,
        failed: 1
      }, { status: 500 });
    }
  }
}); 