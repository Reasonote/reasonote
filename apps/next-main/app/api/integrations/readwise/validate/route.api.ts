import {makeServerApiHandlerV3} from "../../../helpers/serverApiHandlerV3";
import {ReadwiseValidateRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: ReadwiseValidateRoute,
  handler: async (ctx) => {
    const { parsedReq, logger } = ctx;
    const { token } = parsedReq;

    try {
      logger.log("Validating Readwise token");
      // Call Readwise API to validate token
      const response = await fetch('https://readwise.io/api/v2/auth/', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`Readwise API response: status: ${response.status}, ok: ${response.ok}, statusText: ${response.statusText}`);

      if (!response.ok) {
        if (response.status === 401) {
          return {
            valid: false,
            error: "Invalid token",
          };
        }
        
        logger.error(`Readwise API error: ${response.status} ${response.statusText}`);
        return {
          valid: false,
          error: "Failed to validate token with Readwise",
        };
      }

      return {
        valid: true,
      };

    } catch (error: any) {
      logger.error("Error validating Readwise token:", error);
      return {
        valid: false,
        error: "Network error while validating token",
      };
    }
  }
}); 