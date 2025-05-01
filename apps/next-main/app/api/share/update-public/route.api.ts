import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {UpdatePublicShareRoute} from "./routeSchema";

export const {POST} = makeServerApiHandlerV3({
  route: UpdatePublicShareRoute,
  handler: async (ctx) => {
    const {parsedReq, user, supabase} = ctx;
    const {entityId, entityType, isPublic} = parsedReq;

    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    // Check if user has share permission on this entity
    const {data: permissions, error: permissionsError} = await supabase
      .from('vw_entity_permissions')
      .select('*')
      .eq('principal_id', user.rsnUserId)
      .eq('entity_id', entityId);

    if (!permissions?.some(p => p.permissions?.some(perm => perm.includes('SHARE')))) {
      return NextResponse.json({error: 'Unauthorized to modify sharing permissions'}, {status: 401});
    }

    if (isPublic) {
      // First check if a public entry already exists
      const {data: existingPublic} = await supabase
        .from('memauth')
        .select('id')
        .eq('resource_entity_id', entityId)
        .eq('is_public', true)
        .single();

      if (!existingPublic) {
        // Create new public memauth entry
        const {error: createError} = await supabase
          .from('memauth')
          .insert({
            resource_entity_id: entityId,
            resource_entity_type: entityType,
            is_public: true,
            access_level: 'viewer', // Public access is always viewer level
          });

        if (createError) {
          return NextResponse.json({error: createError.message}, {status: 500});
        }
      }
    } else {
      // Remove all public memauth entries for this entity
      const {error: deleteError} = await supabase
        .from('memauth')
        .delete()
        .eq('resource_entity_id', entityId)
        .eq('is_public', true);

      if (deleteError) {
        return NextResponse.json({error: deleteError.message}, {status: 500});
      }
    }

    return {success: true};
  }
}); 