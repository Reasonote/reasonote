import {makeServerApiHandlerV3} from "../../../helpers/serverApiHandlerV3";
import {ReadwiseSetupRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: ReadwiseSetupRoute,
  handler: async (ctx) => {
    const { parsedReq, user, supabase, logger } = ctx;
    const { token } = parsedReq;

    if (!user) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    try {
      // First validate the token
      const response = await fetch('https://readwise.io/api/v2/auth/', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: "Invalid Readwise token",
        };
      }

      // Check if user already has a Readwise integration
      const { data: existingIntegrations, error: fetchError } = await supabase
        .from('integration')
        .select('id')
        .eq('_type', 'readwise')
        .eq('for_user', user.rsnUserId)
        .limit(1);

      if (fetchError) {
        logger.error("Error fetching existing integrations:", fetchError);
        return {
          success: false,
          error: "Database error",
        };
      }

      let integrationId: string;

      if (existingIntegrations && existingIntegrations.length > 0) {
        // Update existing integration
        integrationId = existingIntegrations[0].id;
        
        const { error: updateError } = await supabase
          .from('integration')
          .update({
            metadata: {
              setup_date: new Date().toISOString(),
            },
            last_synced: null, // Trigger immediate sync
            sync_error: null,
            sync_error_count: 0,
            updated_date: new Date().toISOString(),
          })
          .eq('id', integrationId);

        if (updateError) {
          logger.error("Error updating integration:", updateError);
          return {
            success: false,
            error: "Failed to update integration",
          };
        }

        // Update the token
        const { error: tokenError } = await supabase
          .from('integration_token')
          .update({
            token: token, // TODO: Encrypt this token
            updated_date: new Date().toISOString(),
          })
          .eq('integration_id', integrationId);

        if (tokenError) {
          logger.error("Error updating token:", tokenError);
          return {
            success: false,
            error: "Failed to update token",
          };
        }

      } else {
        // Create new integration
        const { data: newIntegration, error: createError } = await supabase
          .from('integration')
          .insert({
            _type: 'readwise',
            for_user: user.rsnUserId,
            metadata: {
              setup_date: new Date().toISOString(),
            },
            last_synced: null, // Trigger immediate sync
            created_by: user.rsnUserId,
            updated_by: user.rsnUserId,
          })
          .select('id')
          .single();

        if (createError || !newIntegration) {
          logger.error("Error creating integration:", createError);
          return {
            success: false,
            error: "Failed to create integration",
          };
        }

        integrationId = newIntegration.id;

        // Create the token
        const { error: tokenError } = await supabase
          .from('integration_token')
          .insert({
            integration_id: integrationId,
            token: token, // TODO: Encrypt this token
            created_by: user.rsnUserId,
            updated_by: user.rsnUserId,
          });

        if (tokenError) {
          logger.error("Error creating token:", tokenError);
          return {
            success: false,
            error: "Failed to store token",
          };
        }
      }

      return {
        success: true,
        integrationId,
      };

    } catch (error: any) {
      logger.error("Error setting up Readwise integration:", error);
      return {
        success: false,
        error: "Network error while setting up integration",
      };
    }
  }
}); 