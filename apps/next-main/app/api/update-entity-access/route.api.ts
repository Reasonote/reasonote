import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "../helpers/serverApiHandlerV3";
import {UpdateEntityAccessRoute} from "./routeSchema";

export const {POST} = makeServerApiHandlerV3({
  route: UpdateEntityAccessRoute,
  handler: async (ctx) => {
    const {parsedReq, user, supabase} = ctx;
    const {entityId, entityType, isPublic} = parsedReq;

    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    if (isPublic) {
      // Create or update public memauth entry
      const {error: memauthError} = await supabase
        .from('memauth')
        .upsert({
          resource_entity_id: entityId,
          resource_entity_type: entityType,
          is_public: true,
          access_level: 'viewer', // Public access is always viewer level
        }, {
          onConflict: 'resource_entity_id,is_public'
        });

      if (memauthError) {
        return NextResponse.json({error: memauthError.message}, {status: 500});
      }
    } else {
      // Remove public memauth entry if it exists
      const {error: deleteError} = await supabase
        .from('memauth')
        .delete()
        .match({
          resource_entity_id: entityId,
          is_public: true,
        });

      if (deleteError) {
        return NextResponse.json({error: deleteError.message}, {status: 500});
      }
    }

    return {success: true};
  }
}); 