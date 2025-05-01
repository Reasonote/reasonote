import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {updatePracticeScoreRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
    route: updatePracticeScoreRoute,
    handler: async (ctx) => {
        const { parsedReq: { skillId, practiceScore }, SUPERUSER_supabase, user } = ctx;

        if (!user) {
            throw new Error('User not found');
        }

        // Insert or update the record
        const { data, error } = await SUPERUSER_supabase
            .from('user_skill_sysdata')
            .upsert({
                rsn_user: user.rsnUserId,
                skill: skillId,
                practice_score: practiceScore
            }, {
                onConflict: 'rsn_user,skill',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('Error updating practice score:', error);
            return { success: false };
        }

        return { success: true };
    }
}); 