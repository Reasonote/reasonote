import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const ChromeExtensionEventRoute = new ApiRoute({
  path: "/api/chrome-extension-event",
  method: "post",
  requestSchema: z.object({
    site_url: z.string().url().nullable(),
    page_title: z.string().nullable(),
    event_type: z.string(),
    metadata: z.record(z.any()).optional(),
    viewed_at: z.string().datetime(),
  }),
  responseSchema: z.object({
    id: z.string(),
    rsn_user_id: z.string(),
    site_url: z.string().nullable(),
    page_title: z.string().nullable(),
    event_type: z.string(),
    metadata: z.record(z.any()).optional(),
    viewed_at: z.string(),
    created_date: z.string(),
    updated_date: z.string(),
    created_by: z.string().nullable(),
    updated_by: z.string().nullable(),
  }),
}); 