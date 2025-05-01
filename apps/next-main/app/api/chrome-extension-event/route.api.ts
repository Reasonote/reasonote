import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "../helpers/serverApiHandlerV3";
import {ChromeExtensionEventRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: ChromeExtensionEventRoute,
  handler: async (ctx) => {
    const { parsedReq, user, supabase, logger } = ctx;
    const { site_url, page_title, event_type, metadata, viewed_at } = parsedReq;

    logger.info('Received Chrome extension event', { event_type, site_url, page_title });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Insert into the chrome_extension_event table
      const { data, error } = await supabase
        .from('chrome_extension_event' as any)
        .insert({
          rsn_user_id: user.rsnUserId,
          site_url,
          page_title,
          event_type: event_type === 'youtube_video_view' ? 'page_view' : event_type,
          metadata,
          viewed_at,
          created_by: user.rsnUserId,
          updated_by: user.rsnUserId,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error storing Chrome extension event', { error: JSON.stringify(error) });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    } catch (error) {
      logger.error('Unexpected error storing Chrome extension event', { error: JSON.stringify(error) });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
}); 