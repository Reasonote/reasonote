import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {RemoveShareAccessRoute} from "./routeSchema";

export const {POST} = makeServerApiHandlerV3({
  route: RemoveShareAccessRoute,
  handler: async (ctx) => {
    const {parsedReq, user, supabase} = ctx;
    const {memauthId} = parsedReq;

    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    // Check if user has permission to remove this memauth
    const {data: memauth, error: memauthError} = await supabase
      .from('memauth')
      .select('id, resource_entity_id, access_level')
      .eq('id', memauthId)
      .single();

    if (memauthError || !memauth) {
      return NextResponse.json({error: 'Memauth not found'}, {status: 404});
    }

    // Don't allow removing owner access
    if (memauth.access_level?.toLowerCase() === 'owner') {
      return NextResponse.json({error: 'Cannot remove owner access'}, {status: 400});
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

    // Delete the memauth entry
    const {error: deleteError} = await supabase
      .from('memauth')
      .delete()
      .eq('id', memauthId);

    if (deleteError) {
      return NextResponse.json({error: deleteError.message}, {status: 500});
    }

    return {success: true};
  }
}); 