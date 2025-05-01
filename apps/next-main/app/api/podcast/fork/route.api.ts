import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {ForkPodcastRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: ForkPodcastRoute,
  handler: async (ctx) => {
    const { parsedReq, user, supabase } = ctx;
    const { podcastId } = parsedReq;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clone the podcast
    const { data, error } = await supabase
      .rpc('clone_podcast', { orig_pod_id: podcastId });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const newPodcastId = data;

    // Update the new podcast to set it as non-shared version
    // and associate it with the current user
    const { error: updateError } = await supabase
      .from('podcast')
      .update({ 
        is_shared_version: false, 
        for_user: user.rsnUserId
      })
      .eq('id', newPodcastId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ id: newPodcastId });
  }
});