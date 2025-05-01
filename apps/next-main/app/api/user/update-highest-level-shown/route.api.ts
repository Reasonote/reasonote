import { makeServerApiHandlerV3 } from "../../helpers/serverApiHandlerV3";
import { updateHighestLevelShownRoute } from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
    route: updateHighestLevelShownRoute,
    handler: async (ctx) => {
        const { parsedReq: { level, skillId }, SUPERUSER_supabase, user } = ctx;

        if (!user) {
            throw new Error('User not found');
        }

        // Insert or update the record
        const { data, error } = await SUPERUSER_supabase
            .from('user_skill_sysdata')
            .update({
                highest_level_shown: level
            })
            .eq('rsn_user', user.rsnUserId)
            .eq('skill', skillId);

        if (error) {
            console.error('Error updating highest level shown:', error);
            return { success: false };
        }

        return { success: true };
    }
}); 