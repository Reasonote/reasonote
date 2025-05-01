// Don't need this, handled by Next.js
// import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import _ from "lodash";
import {NextResponse} from "next/server";

import sgMail from "@sendgrid/mail";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {EmailSendRoute} from "./routeSchema";

export const {POST} = makeServerApiHandlerV3({
  route: EmailSendRoute,
  handler: async (ctx) => {
    const { req, parsedReq,  supabase, logger, user } = ctx;

    console.log(JSON.stringify(user))

    // Only @reasonote.com emails can send emails
    if (!user?.supabaseUser?.email?.endsWith('@reasonote.com')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
    }

    const { to, subject, text, html } = parsedReq;

    sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? '');

    const msg = {
        to,
        from: 'Reasonote <hi@reasonote.com>',
        subject,
        text,
        html,
    };

    console.log('SENDING EMAIL', JSON.stringify(msg, null, 2))

    try {
        await sgMail.send(msg);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
          { error: 'Failed to send email' },
          { status: 500 }
        );
    }

    return NextResponse.json(
      {},
      { status: 200 }
    );
  },
});
