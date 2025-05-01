import {NextResponse} from "next/server";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {PushNotificationGetSubscriptionsRoute} from "./routeSchema";

const handler = async (ctx) => {
  const { user, supabase } = ctx;
  
  // Ensure user is authenticated
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all subscriptions for this user
    const { data, error } = await supabase
      .from('push_notification_subscription')
      .select('id, _endpoint, created_date, user_agent, last_used_date')
      .eq('rsn_user_id', user.rsnUserId)
      .order('created_date', { ascending: false });

    if (error) {
      console.error('Error fetching push subscriptions:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch subscriptions' 
      }, { status: 500 });
    }

    // Format the response
    const subscriptions = data.map(sub => ({
      id: sub.id,
      endpoint: sub._endpoint,
      createdDate: sub.created_date,
      userAgent: sub.user_agent,
      lastUsedDate: sub.last_used_date,
    }));

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching push subscriptions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch subscriptions' 
    }, { status: 500 });
  }
};

export const POST = makeServerApiHandlerV2({
  route: PushNotificationGetSubscriptionsRoute,
  handler
}); 