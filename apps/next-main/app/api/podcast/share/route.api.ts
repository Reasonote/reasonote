import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {SharePodcastRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: SharePodcastRoute,
  handler: async (ctx) => {
    const { parsedReq, user, supabase } = ctx;
    const { podcastId } = parsedReq;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clone the podcast
    const { data: newPodcastId, error: cloneError } = await supabase
      .rpc('clone_podcast', { orig_pod_id: podcastId });

    if (cloneError) {
      return NextResponse.json({ error: cloneError.message }, { status: 500 });
    }


    return NextResponse.json({ newPodcastId: newPodcastId });
  }
});