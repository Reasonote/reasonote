import {NextResponse} from "next/server";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {PushNotificationUsersWithSubscriptionsRoute} from "./routeSchema";

const handler = async (ctx) => {
  const { user, supabase, logger } = ctx;
  
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

  logger.log("Fetching users with push notifications");

  try {
    // Get all users who have push notification subscriptions
    const { data, error } = await supabase
      .from('push_notification_subscription')
      .select(`
        rsn_user_id,
        id
      `)
      .order('created_date', { ascending: false });

    if (error) {
      console.error('Error fetching users with push subscriptions:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch users with subscriptions' 
      }, { status: 500 });
    }

    // Group subscriptions by user and count them
    const userMap = new Map();
    
    for (const sub of data) {
      if (!userMap.has(sub.rsn_user_id)) {
        userMap.set(sub.rsn_user_id, {
          id: sub.rsn_user_id,
          subscription_count: 1
        });
      } else {
        const user = userMap.get(sub.rsn_user_id);
        user.subscription_count += 1;
        userMap.set(sub.rsn_user_id, user);
      }
    }
    
    // Get user emails for better display
    const userIds = Array.from(userMap.keys());
    
    if (userIds.length > 0) {
      const { data: userData, error: userError } = await supabase
        .from('rsn_user')
        .select('id, email')
        .in('id', userIds);
        
      if (!userError && userData) {
        // Add email to user info
        for (const user of userData) {
          if (userMap.has(user.id)) {
            const userInfo = userMap.get(user.id);
            userInfo.email = user.email;
            userMap.set(user.id, userInfo);
          }
        }
      }
    }

    // Convert map to array
    const users = Array.from(userMap.values());

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users with push subscriptions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users with subscriptions' 
    }, { status: 500 });
  }
};

export const POST = makeServerApiHandlerV2({
  route: PushNotificationUsersWithSubscriptionsRoute,
  handler
}); 