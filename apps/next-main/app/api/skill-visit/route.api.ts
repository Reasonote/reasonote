import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "../helpers/serverApiHandlerV3";
import {SkillVisitRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: SkillVisitRoute,
  handler: async (ctx) => {
    const { parsedReq, user, supabase } = ctx;
    const { skillId } = parsedReq;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_history')
      .upsert([{
        rsn_user_id: user.rsnUserId,
        skill_id_visited: skillId,
        updated_date: new Date().toISOString(),
        created_by: user.rsnUserId,
        updated_by: user.rsnUserId,
      }], {
        onConflict: 'rsn_user_id, skill_id_visited'
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }
});