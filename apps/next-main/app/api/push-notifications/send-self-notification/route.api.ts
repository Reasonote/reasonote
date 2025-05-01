import {NextResponse} from "next/server";
import webpush from "web-push";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {PushNotificationSendSelfNotificationRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: PushNotificationSendSelfNotificationRoute,
  handler: async (ctx) => {
    const { parsedReq, user, supabase, logger } = ctx;
    
    // Ensure user is authenticated
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { subscription, message } = parsedReq;

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

      // Verify that the subscription belongs to the current user
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('push_notification_subscription')
        .select('id')
        .eq('rsn_user_id', user.rsnUserId)
        .eq('_endpoint', subscription.endpoint)
        .single();

      if (subscriptionError || !subscriptionData) {
        logger.log("User attempted to send notification to a subscription they don't own");
        return NextResponse.json(
          { success: false, error: 'You can only send notifications to your own subscriptions' },
          { status: 403 }
        );
      }

      // Set VAPID details
      webpush.setVapidDetails(
        'mailto:hi@reasonote.com',
        publicVapidKey,
        privateVapidKey
      );

      // Send notification with more detailed error handling
      try {
        await webpush.sendNotification(
          subscription,
          typeof message === 'string' ? message : JSON.stringify(message)
        );
        
        // Update last_used_date for this subscription if it exists in our database
        await supabase
          .from('push_notification_subscription')
          .update({ last_used_date: new Date().toISOString() })
          .match({ _endpoint: subscription.endpoint })
          .then(({ error }) => {
            if (error) {
              console.warn('Could not update last_used_date for subscription:', error);
            }
          });
          
        return NextResponse.json({ success: true });
      } catch (pushError: any) {
        console.error('Push service error:', {
          statusCode: pushError.statusCode,
          body: pushError.body,
          _endpoint: subscription.endpoint,
          headers: pushError.headers
        });
        
        // Handle specific error cases
        if (pushError.statusCode === 403 && pushError.body?.includes('invalid JWT')) {
          return NextResponse.json(
            { success: false, error: 'Authentication failed with push service. VAPID keys may be invalid or expired.' },
            { status: 500 }
          );
        } else if (pushError.statusCode === 404 || pushError.statusCode === 410) {
          // If subscription is expired, remove it from our database
          await supabase
            .from('push_notification_subscription')
            .delete()
            .match({ _endpoint: subscription.endpoint })
            .then(({ error }) => {
              if (error) {
                console.warn('Could not delete expired subscription:', error);
              }
            });
            
          return NextResponse.json(
            { success: false, error: 'Subscription has expired or is no longer valid', code: 'SUBSCRIPTION_EXPIRED' },
            { status: 410 }
          );
        }
        
        throw pushError; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to send notification' },
        { status: 500 }
      );
    }
  }
});