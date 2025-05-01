import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const AdminSendEmailRoute = new ApiRoute({
  path: "/api/admin/send-email",
  method: "post",
  requestSchema: z.object({
    subject: z.string(),
    fromName: z.string(),
    fromEmail: z.string().email().endsWith("@reasonote.com"),
    htmlContent: z.string(),
    textContent: z.string().optional(),
    groups: z.array(z.enum(["product_updates", "edtech_updates", "newsletter", "account_updates"])),
    emails: z.array(z.string().email()).optional(),
    dryRun: z.boolean().optional(),
  }),
  responseSchema: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    error: z.string().optional(),
    recipientEmails: z.array(z.string()),
  }),
});