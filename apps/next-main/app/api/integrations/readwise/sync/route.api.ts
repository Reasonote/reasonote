import {makeServerApiHandlerV3} from "../../../helpers/serverApiHandlerV3";
import {ReadwiseSyncRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: ReadwiseSyncRoute,
  handler: async (ctx) => {
    const { parsedReq, user, supabase, logger } = ctx;
    const { integrationId } = parsedReq;

    if (!user) {
      return {
        success: false,
        message: "",
        error: "Authentication required",
      };
    }

    try {
      // Verify the integration belongs to the user
      const { data: integration, error: fetchError } = await supabase
        .from('integration')
        .select('id, _type, for_user')
        .eq('id', integrationId)
        .eq('for_user', user.rsnUserId)
        .eq('_type', 'readwise')
        .single();

      if (fetchError || !integration) {
        logger.error("Integration not found or access denied:", fetchError);
        return {
          success: false,
          message: "",
          error: "Integration not found or access denied",
        };
      }

      // Trigger immediate sync by setting last_synced to null
      const { error: updateError } = await supabase
        .from('integration')
        .update({
          last_synced: null,
          sync_error: null,
          sync_error_count: 0,
          updated_date: new Date().toISOString(),
        })
        .eq('id', integrationId);

      if (updateError) {
        logger.error("Error triggering sync:", updateError);
        return {
          success: false,
          message: "",
          error: "Failed to trigger sync",
        };
      }

      return {
        success: true,
        message: "Sync triggered successfully. Your highlights will be updated shortly.",
      };

    } catch (error: any) {
      logger.error("Error triggering Readwise sync:", error);
      return {
        success: false,
        message: "",
        error: "Network error while triggering sync",
      };
    }
  }
}); 