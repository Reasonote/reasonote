import {SupabaseClient} from "@supabase/supabase-js";

/**
 * Checks if a user has subscribed to a specific notification type
 * @param supabase Supabase client
 * @param userId User ID to check
 * @param notificationType Type of notification to check (e.g., 'daily_streak')
 * @returns Boolean indicating if the user is subscribed
 */
export async function isUserSubscribedToNotification(
  supabase: SupabaseClient<any>,
  userId: string,
  notificationType: 'daily_streak'
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('notification_subscription')
      .select(notificationType)
      .eq('rsn_user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error checking notification subscription:', error);
      return false;
    }

    return data[notificationType] === true;
  } catch (error) {
    console.error('Error checking notification subscription:', error);
    return false;
  }
}

/**
 * Gets all users who have subscribed to a specific notification type
 * @param supabase Supabase client
 * @param notificationType Type of notification to check (e.g., 'daily_streak')
 * @returns Array of user IDs who are subscribed
 */
export async function getUsersSubscribedToNotification(
  supabase: SupabaseClient<any>,
  notificationType: 'daily_streak'
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('notification_subscription')
      .select('rsn_user_id')
      .eq(notificationType, true);

    if (error || !data) {
      console.error('Error getting subscribed users:', error);
      return [];
    }

    return data.map(item => item.rsn_user_id);
  } catch (error) {
    console.error('Error getting subscribed users:', error);
    return [];
  }
}