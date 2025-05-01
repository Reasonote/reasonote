import {NextResponse} from "next/server";
import {Resend} from "resend";
import {z} from "zod";

import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {Database} from "@reasonote/lib-sdk";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {AdminSendEmailRoute} from "./routeSchema";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BATCH_SIZE = 100;

export const { POST } = makeServerApiHandlerV3({
  route: AdminSendEmailRoute,
  handler: async (ctx) => {
    try {
      const { supabase } = ctx;
      const { subject, fromName, fromEmail, htmlContent, textContent, groups, emails, dryRun } = ctx.parsedReq;

      const isAdminResult = await supabase.rpc('is_admin');

      if (!isAdminResult) {
        return NextResponse.json({ error: 'Could not verify admin status' }, { status: 500 });
      }

      if (!isAdminResult.data) {
        return NextResponse.json({ error: 'You are not an admin' }, { status: 403 });
      }

      if (!RESEND_API_KEY) {
        return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 });
      }

      const resend = new Resend(RESEND_API_KEY);

      var users: Database['public']['Functions']['get_subscribed_user_info']['Returns'] = [];
      var error: Error | null = null;
      if (groups.length > 0) {
        // Fetch users based on selected groups
        const { data: fetchedUsers, error } = await supabase.rpc('get_subscribed_user_info', { groups });

        if (error) {
          return NextResponse.json({ success: false, error: error.message, recipientEmails: [] }, { status: 500 });
        }
        users = fetchedUsers;
      }

      const emailSchema = z.string().email();

      // Combine group recipients and individual emails, filter out invalid emails
      const recipients: string[] = [
        ...users.map(user => user.auth_email),
        ...(emails || [])
      ]
        .filter(notEmpty)
        .filter((email) => {
          const result = emailSchema.safeParse(email);
          if (!result.success) {
            console.error(`Invalid email: ${email}`);
          }
          return result.success;
        })

      // Remove duplicates
      const uniqueRecipients = [...new Set(recipients)];

      if (dryRun) {
        return NextResponse.json({ 
          success: true, 
          message: `Dry run completed. Would have sent to ${uniqueRecipients.length} recipients.`,
          recipientEmails: uniqueRecipients
        });
      }

      try {
        let sentCount = 0;
        let failedCount = 0;

        // Process recipients in batches
        for (let i = 0; i < uniqueRecipients.length; i += BATCH_SIZE) {
          const batch = uniqueRecipients.slice(i, i + BATCH_SIZE);
          const emailBatches = batch.map(recipient => ({
            from: `${fromName} <${fromEmail}>`,
            to: recipient,
            subject: subject,
            html: htmlContent,
            text: textContent ?? '',
          }));

          const result = await resend.batch.send(emailBatches);

          if (result.error) {
            console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, result.error);
            failedCount += batch.length;
          } else {
            sentCount += batch.length;
          }
        }

        const totalCount = uniqueRecipients.length;
        const message = `Email sent successfully to ${sentCount} out of ${totalCount} recipients. ${failedCount} failed.`;

        return NextResponse.json({ 
          success: true, 
          message: message,
          recipientEmails: uniqueRecipients
        });
      } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: (error as Error).message, recipientEmails: [] });
      }
    } catch (error) {
      console.error(error);
      return NextResponse.json({ success: false, error: (error as Error).message, recipientEmails: [] });
    }
  }
});