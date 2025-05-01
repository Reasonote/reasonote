import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {UpdateShareRoleRoute} from "./routeSchema";

export const {POST} = makeServerApiHandlerV3({
  route: UpdateShareRoleRoute,
  handler: async (ctx) => {
    const {parsedReq, user, supabase} = ctx;
    const {memauthId, role} = parsedReq;

    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    // Check if user has permission to update this memauth
    const {data: memauth, error: memauthError} = await supabase
      .from('memauth')
      .select('resource_entity_id')
      .eq('id', memauthId)
      .single();

    if (memauthError || !memauth) {
      return NextResponse.json({error: 'Memauth not found'}, {status: 404});
    }

    // Check if user has share permission on this entity
    const {data: permissions, error: permissionsError} = await supabase
      .from('vw_entity_permissions')
      .select('*')
      .eq('principal_id', user.rsnUserId)
      .eq('entity_id', memauth.resource_entity_id);

    if (!permissions?.some(p => p.permissions?.some(perm => perm.includes('SHARE')))) {
      return NextResponse.json({error: 'Unauthorized to modify sharing permissions'}, {status: 401});
    }

    // Update the memauth role
    const {error: updateError} = await supabase
      .from('memauth')
      .update({ access_level: role })
      .eq('id', memauthId);

    if (updateError) {
      return NextResponse.json({error: updateError.message}, {status: 500});
    }

    return {success: true};
  }
}); 