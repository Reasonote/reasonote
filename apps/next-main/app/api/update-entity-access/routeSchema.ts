import { ApiRoute } from "@reasonote/lib-api-sdk";
import { z } from "zod";

export const UpdateEntityAccessRoute = new ApiRoute({
    path: "/api/update-entity-access",
    method: "post",
    requestSchema: z.object({
      entityId: z.string(),
      entityType: z.string(),
      isPublic: z.boolean(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
    }),
}); 