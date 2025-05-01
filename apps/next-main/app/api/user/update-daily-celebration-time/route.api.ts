import { makeServerApiHandlerV3 } from "../../helpers/serverApiHandlerV3";
import { updateDailyCelebrationTimeRoute } from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
    route: updateDailyCelebrationTimeRoute,
    handler: async (ctx) => {
        const { parsedReq: { dailyXpGoalCelebrationTime }, SUPERUSER_supabase, user } = ctx;

        if (!user) {
            throw new Error('User not found');
        }

        // Insert or update the record
        const { data, error } = await SUPERUSER_supabase
            .from('rsn_user_sysdata')
            .update({
                daily_xp_goal_celebration_time: dailyXpGoalCelebrationTime
            })
            .eq('rsn_user_id', user.rsnUserId);

        if (error) {
            console.error('Error updating daily celebration time:', error);
            return { success: false };
        }

        return { success: true };
    }
}); 