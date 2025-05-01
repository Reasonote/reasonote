// apps/next-main/app/api/getYoutubeTranscript/route.ts
import _ from "lodash";
import {NextResponse} from "next/server";
import {YoutubeTranscript} from "youtube-transcript";
import {z} from "zod";

import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";

import {YoutubeTranscriptRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 60 seconds.
export const maxDuration = 60;

export const {POST} = makeServerApiHandlerV3({
  route: YoutubeTranscriptRoute,
  handler: async (ctx) => {
    const { req, parsedReq,  supabase, logger, ai } = ctx;

    // Parsed request
    const {youtubeUrl, skipAiProcessing} = parsedReq;

    // Process the request
    try {
      const videoId = new URL(youtubeUrl).searchParams.get('v');
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
      const transcript = transcriptArray.map(part => part.text).join(' ');

      logger.info(`Fetched transcript for ${youtubeUrl}`);

      // Skip AI processing if requested
      let aiTranscript = '';
      
      if (!skipAiProcessing) {
        // Preprocess to identify speaker names
        const speakerNamesResult = await ai.genObject({
          functionName: 'identifySpeakerNames',
          functionDescription: 'Identify speaker names from the entire transcript',
          schema: z.object({
            speakerNames: z.array(z.string()),
          }),
          system: `
            You will receive a complete YouTube transcript.
            Your task is to identify the names of speakers mentioned in the transcript.
            If no specific names are mentioned, use generic labels like "Host", "Guest", "Interviewer", "Interviewee", etc.
            Output the list of speaker names or labels.
          `,
          messages: [
            {
              role: 'user',
              content: `
                <COMPLETE_YOUTUBE_TRANSCRIPT>
                ${transcript}
                </COMPLETE_YOUTUBE_TRANSCRIPT>
              `
            }
          ],
        });

        const speakerNames = speakerNamesResult.object?.speakerNames || [];

        // Split transcript into sections
        const MAX_SECTION_LENGTH = 4000;
        const sections: string[] = [];
        let currentSection = '';

        for (const char of transcript) {
          currentSection += char;
          if (currentSection.length >= MAX_SECTION_LENGTH && char === '.') {
            sections.push(currentSection.trim());
            currentSection = '';
          }
        }
        if (currentSection.length > 0) {
          sections.push(currentSection.trim());
        }

        // Process sections with AI in parallel
        // const aiPromises = sections.map((section, index) => null 
        //   ai.genObject({
        //     functionName: 'outputCleanedYoutubeTranscript',
        //     functionDescription: 'Output a cleaned-up version of the input youtube transcript section, in markdown, with reasonably inserted newlines and speaker identification.',
        //     schema: z.object({
        //         cleanedYoutubeTranscriptSection: z.string(),
        //     }),
        //     system: `
        //       You will receive a section of a youtube transcript and a list of identified speaker names. 
        //       Output a cleaned-up version of this section, in markdown, with reasonably inserted newlines. 
        //       DO NOT SKIP ANY CONTENT.

        //       All of the words, and video sections, should be included in the output.

        //       You're just cleaning up the text and removing weird artifacts, you are NOT skipping anything, or changing the meaning.

        //       Additionally, each time you think there is a new speaker, prefix that new line with the name of the speaker from the provided list.
        //       If you're unsure which speaker is talking, use the most appropriate name from the list.

        //       Here is the list of identified speaker names: ${speakerNames.join(", ")}

        //       <EXAMPLE description="This is a badly formatted youtube transcript section, you should clean it up and add speaker identification.">
        //       <INPUT>
        //         Hi i &quot;am&quot; form-ating this text. It is not&nbspgood. and [applause] has weird tags. By the way this is another point. There should probably have been a newline before this here. Now someone else is talking.
        //       </INPUT>
        //       <OUTPUT>
        //         ${speakerNames[0]}: Hi I "am" formatting this text. It is not good. And has weird tags.

        //         ${speakerNames[0]}: By the way, this is another point. There should probably have been a newline before this.

        //         ${speakerNames[1]}: Now someone else is talking.
        //       </OUTPUT>
        //       </EXAMPLE>
        //     `,
        //     messages: [
        //       {
        //         role: 'user',
        //         content: `
        //           <YOUTUBE_TRANSCRIPT_SECTION_${index + 1}>
        //           ${section}
        //           </YOUTUBE_TRANSCRIPT_SECTION_${index + 1}>
        //         `
        //       }
        //     ],
        //   })
        // );

        // const aiResults = await Promise.all(aiPromises);

        // Join the processed sections
        const aiOut = {
          data: {
            // cleanedYoutubeTranscript: aiResults.map(result => 
            //   result.object?.cleanedYoutubeTranscriptSection || '<SECTION FAILED>'
            // ).join('\n\n')
            cleanedYoutubeTranscript: '<DISABLED>'
          }
        };
        
        aiTranscript = aiOut.data?.cleanedYoutubeTranscript ?? '';
      }

      ////////////////////////////////////////////
      // Return result
      return {
        transcript: transcript,
        aiTranscript: aiTranscript,
      };
    } catch (error: any) {
      logger.error(`Failed to fetch transcript for ${youtubeUrl}`, error);
      
      // Throw an error that will be caught by the error handler
      return NextResponse.json({
        status: 500,
        body: {
          error: 'Failed to fetch transcript',
          errorDetails: JSON.stringify(error, null, 2),
          youtubeUrl: youtubeUrl
        }
      });
    }
  },
});