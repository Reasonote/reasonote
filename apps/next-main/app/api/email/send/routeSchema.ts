import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

////////////////////////////////////////////////////////////////////////
// REQUEST
////////////////////////////////////////////////////////////////////////

// const { to, subject, text, html } = req.body;
const EmailSendRouteRequestSchema = z.object({
    to: z.string().email().describe("The email address to send the email to."),
    subject: z.string().describe("The subject of the email."),
    text: z.string().describe("The text content of the email."),
    html: z.string().describe("The HTML content of the email."),
});
export type EmailSendRouteRequestIn = z.input<
  typeof EmailSendRouteRequestSchema
>;
export type EmailSendRouteRequestOut = z.infer<
  typeof EmailSendRouteRequestSchema
>;

////////////////////////////////////////////////////////////////////////
// RESPONSE
////////////////////////////////////////////////////////////////////////
const EmailSendRouteResponseSchema = z.object({
});
export type EmailSendRouteResponse = z.infer<
  typeof EmailSendRouteResponseSchema
>;

////////////////////////////////////////////////////////////////////////
// ROUTE
////////////////////////////////////////////////////////////////////////
export const EmailSendRoute = new ApiRoute({
  path: "/api/email/send",
  method: "post",
  requestSchema: EmailSendRouteRequestSchema,
  responseSchema: EmailSendRouteResponseSchema,
});
