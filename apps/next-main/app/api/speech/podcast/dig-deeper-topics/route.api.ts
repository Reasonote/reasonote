import {NextResponse} from "next/server";
import {z} from "zod";

import {makeServerApiHandlerV3} from "../../../helpers/serverApiHandlerV3";
import {DigDeeperTopicsRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: DigDeeperTopicsRoute,
  handler: async (ctx) => {
    const { parsedReq, supabase, ai } = ctx;
    const { podcastLineId } = parsedReq;

    // Get the current line and its podcast
    const { data: currentLine, error: lineError } = await supabase
      .from('podcast_line')
      .select('*, podcast:podcast_id(*)')
      .eq('id', podcastLineId)
      .single();

    if (lineError || !currentLine) {
      return NextResponse.json(
        { error: lineError?.message || 'Line not found' },
        { status: 404 }
      );
    }

    if (!currentLine.podcast_id) {
      return NextResponse.json(
        { error: 'Podcast ID is required for all podcast lines' },
        { status: 500 }
      );
    }

    // Get all previous lines in the podcast to provide context
    const { data: previousLines, error: prevLinesError } = await supabase
      .from('podcast_line')
      .select('dialogue, speaker')
      .eq('podcast_id', currentLine.podcast_id)
      .lte('line_number', currentLine.line_number)
      .order('line_number', { ascending: true });

    if (prevLinesError) {
      return NextResponse.json(
        { error: prevLinesError.message },
        { status: 500 }
      );
    }

    // Create the transcript context
    const transcript = previousLines
      .map(line => `${line.speaker}: ${line.dialogue}`)
      .join('\n');

    // Use AI to generate dig deeper topics
    const result = await ai.genObject({
      model: 'openai:gpt-4o-mini',
      schema: z.object({
        digDeeperTopics: z.array(z.string()).describe(
          'A list of 2-4 specific topics from the line that would be interesting to explore further. ' +
          'Topics should be concise (2-5 words) and directly related to the content.'
        )
      }),
      prompt: `
        CONTEXT: You are analyzing a podcast transcript to identify interesting topics that listeners might want to learn more about.
        Focus on the latest line, but use the context of previous lines to ensure relevance.

        FULL TRANSCRIPT SO FAR:
        ${transcript}

        CURRENT LINE:
        ${currentLine.speaker}: ${currentLine.dialogue}

        TASK: Generate 2-3 specific topics from this line that would be interesting to explore further.
        - Topics should be concise (2-5 words)
        - Topics should be directly related to the content
        - Topics should be interesting and educational
        - Avoid overly broad or generic topics
      `
    });

    if (!result.object.digDeeperTopics) {
      return NextResponse.json(
        { error: 'No dig deeper topics found' },
        { status: 500 }
      );
    }

    // Update the podcast line with the new topics
    const { error: updateError } = await supabase
      .from('podcast_line')
      .update({ dig_deeper_topics: result.object.digDeeperTopics })
      .eq('id', podcastLineId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return {
      digDeeperTopics: result.object.digDeeperTopics
    };
  },
});

