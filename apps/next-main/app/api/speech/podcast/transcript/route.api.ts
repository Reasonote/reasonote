import * as _ from "lodash";
import {NextResponse} from "next/server";
import {Readable} from "stream";
import {z} from "zod";

import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";
import {
  notEmpty,
  trimLines,
} from "@lukebechtel/lab-ts-utils";
import {ApiRoute} from "@reasonote/lib-api-sdk";
import {partialObjectStreamToArrayGenerator} from "@reasonote/lib-utils";

export const maxDuration = 300; // 5 minutes, adjust as needed

type Podcast = {
  id?: string;
  podcastType: string;
  specialInstructions?: string | null;
  topic: string;
  outline?: any;
  transcript?: (
    | {
        speaker: string;
        dialogue: string;
        dig_deeper_topics: string[] | null;
        isPodcastFullyComplete?: boolean;
      }
    | any
  )[] | null;
};

export const { POST } = makeServerApiHandlerV3({
  route: new ApiRoute({
    path: "/api/speech/podcast/transcript",
    method: "post",
    requestSchema: z.object({
      podcastId: z.string(),
      topic: z.string().nullish(),
      documents: z.array(z.string()).nullish(),
      numTurns: z.number().nullish(),
      existingOutline: z.any().nullish(),
      existingTranscript: z.array(z.any()).nullish(),
      startAfterIndex: z.number().nullish(),
      newTopic: z.string().nullish(),
      userMessage: z.string().nullish(),
      specialInstructions: z.string().nullish(),
      podcastType: z.string().nullish(),
    }),
    responseSchema: z.any(),
  }),
  handler: async (ctx) => {
    const { ai, parsedReq, supabase, rsn, logger } = ctx;
    const {
      podcastId,
      numTurns,
      startAfterIndex,
      newTopic,
      podcastType,
      userMessage,
    } = parsedReq;


    // Load voices
    let voices = await ai.audio.speech.getAllVoices();
    
    // Filter voices by license type.
    const {data: hasPaidLicense, error: hasPaidLicenseError} = await rsn.user.userHasActivePaidLicense()

    logger.debug('hasPaidLicense:', hasPaidLicense, 'hasPaidLicenseError:', hasPaidLicenseError)
    if (!hasPaidLicense){
      voices = voices.filter(v => v.quality !== 'enhanced')
    }

    logger.debug('voices available:', JSON.stringify(voices, null, 2))

    // Get the full ids of the voices.
    const voiceFullIds = (await ai.audio.speech.getFullIds(voices)) as [string, ...string[]]

    const PodcastOutlineSchema = z.object({
      title: z.string(),
      sections: z.array(
        z.object({
          title: z.string(),
          bulletPoints: z.array(z.string()),
        })
      ),
      hosts: z.array(
        z.object({
          name: z.string().describe(
            "The name of the host -- this does not have to match the voice name!"
          ),
          description: z
            .string()
            .describe(
              "A short personality description of the host -- NOTE: this is *not* the voice description, this is a personality description!"
            ),
          voice: z
            .enum(voiceFullIds)
            .describe("The voice of the host to use for the podcast."),
        })
      ),
    });

    // Get the podcast from the database if a podcastId is provided
    var podcast: Podcast | null = null;

    if (podcastId) {
      const podcastResponse = await supabase
        .from("podcast")
        .select("*")
        .eq("id", podcastId)
        .single();

      if (podcastResponse.error) {
        return new Response(
          JSON.stringify({
            error: "Failed to get podcast",
            errorDetails: podcastResponse.error,
          }),
          { status: 500 }
        );
      }

      const podcastLinesResponse = await supabase
        .from("podcast_line")
        .select("*")
        .eq("podcast_id", podcastId)
        .order("line_number", { ascending: true });

      if (podcastLinesResponse.error) {
        return new Response(
          JSON.stringify({
            error: "Failed to get podcast lines",
            errorDetails: podcastLinesResponse.error,
          }),
          { status: 500 }
        );
      }

      podcast = {
        id: podcastResponse.data.id,
        podcastType: podcastResponse.data.podcast_type,
        specialInstructions: podcastResponse.data.special_instructions,
        topic: podcastResponse.data.topic,
        outline: podcastResponse.data.outline,
        transcript: podcastLinesResponse.data,
      };
    } else {
      throw new Error("No podcast id provided");
    }

    if (!podcast.topic && !newTopic) {
      return new Response(
        JSON.stringify({ error: "Topic or newTopic is required" }),
        { status: 400 }
      );
    }

    /*
     * The stream that will be immediately returned to the client, and used to stream the podcast transcript.
     */
    const stream = new Readable({
      read() {},
    });

    const pushToStream = (data) => {
      stream.push(JSON.stringify(data) + "\n");
    };

    (async () => {
      try {
        ////////////////////////////////////////////////////////////////////////////
        // Step 0: Update the transcript with the new topic or user message
        ////////////////////////////////////////////////////////////////////////////
        if ((newTopic || userMessage) && notEmpty(startAfterIndex)) {
          // If the user has provided a new topic or user message, we need to truncate the transcript to the point of interruption,
          podcast.transcript =
            podcast.transcript?.slice(0, startAfterIndex + 1) ?? [];

          // Remove all transcript lines after the startAfterIndex
          const deleteLinesResponse = await supabase
            .from("podcast_line")
            .delete()
            .eq("podcast_id", podcastId)
            .gt("line_number", startAfterIndex);
          if (deleteLinesResponse.error) {
            throw new Error("Failed to delete podcast lines");
          }

          // Add the user message to the transcript, if provided.
          if (userMessage) {
            podcast.transcript.push({
              speaker: "USER",
              dialogue: userMessage,
              dig_deeper_topics: [],
              isPodcastFullyComplete: false,
            });

            // Update the podcast line table with the new line
            const { data: newLineData, error: newLineError } = await supabase
              .from("podcast_line")
              .insert({
                dialogue: userMessage,
                speaker: "USER",
                dig_deeper_topics: [],
                podcast_id: podcastId,
                line_number: 0, // auto-set by trigger
              });

            if (newLineError) {
              throw new Error("Failed to insert podcast line");
            }
          }

          // Push to stream so the client knows the transcript has been reset
          pushToStream({ type: "transcript-reset", data: podcast.transcript });
        }

        // Step 1: Generate or update podcast outline
        let outline;

        const resourceSection = await ai.prompt.resources.formatResources({
          queryText: `${podcast.topic}`,
          filter: {
            podcastId: podcastId
          },
          includeAllFilteredResourcesIfPossible: true,
          matchMaxTokens: 75_000,
          matchMaxResults: 100
        })

        console.log('resourceSection:', resourceSection)

        ////////////////////////////////////////////////////////////////////////////
        // CASE 1: GENERATING WITH AN EXISTING OUTLINE / NEW TOPIC
        ////////////////////////////////////////////////////////////////////////////
        if (podcast.outline && (newTopic || userMessage)) {
          const outlineResponse = await ai.genObject({
            schema: PodcastOutlineSchema.omit({
              title: true,
              hosts: true,
            }),
            system: trimLines(`
              You are an excellent podcast creator.

              You will be given an existing outline and the transcript up to the point of interruption, and a new topic to incorporate.

              Update the outline to smoothly transition to and include the new topic.

              The hosts and the title should remain constant; you just need to update the sections.

              IMPORTANT: The "USER" character is a special character that represents the user. It is not played by any of the hosts.

              ${podcast.specialInstructions ? `SPECIAL INSTRUCTIONS: ${podcast.specialInstructions}` : ''}
            `),
            prompt: trimLines(`
              ${JSON.stringify({
                existingOutline: podcast.outline,
                existingTranscript: startAfterIndex
                  ? podcast.transcript?.slice(0, startAfterIndex)
                  : podcast.transcript,
              })}

              <DOCUMENTS description="Use the following documents as reference">
              ${resourceSection}
              </DOCUMENTS>

              New topic to incorporate: "${newTopic}"

              IMPORTANT: The conversation must immediately shift to discussing the new topic: "${newTopic}".

              Make this transition smooth and natural, as if one of the hosts has just brought up this new subject.

              IMPORTANT: You are only updating the outline, not the transcript.

              IMPORTANT: The "USER" character is a special character that represents the user. It is not played by any of the hosts.

              Output new sections for the outline to include the new topic, starting from the point of interruption.

              The hosts and the title should remain constant; you just need to update the sections.
            `),
            model: "openai:gpt-4o",
          });

          outline = {
            ...podcast.outline,
            ...outlineResponse.object,
          };
        ////////////////////////////////////////////////////////////////////////////
        // CASE 2: GENERATING FOR THE FIRST TIME
        ////////////////////////////////////////////////////////////////////////////
        } else {
          const outlineResponse = await ai.genObject({
            schema: PodcastOutlineSchema,
            system: trimLines(`
              You are tasked with writing a podcast outline about the concept of "${podcast.topic}". The podcast should emulate the depth and intellectual curiosity of shows like the Lex Fridman Podcast or The Duwarkesh Podcast, combined with the relatable and engaging style of NPR programs like Hidden Brain.

              **Instructions:**

              1. **Hosts and Tone:**
                - Create two hosts who are intellectually curious and have a natural rapport.
                - The conversation should be personable, engaging, and non-generic.
                - Hosts should challenge each other with probing, tangible questions.
                - Language should be specific, concise, and highly articulate.

              2. **Structure:**
                - Begin with an introduction.
                - Outline the main sections and topics to be discussed.
                - Plan for a natural flow with give and take between the hosts.
                - Include thorough examples and real-world anecdotes.

              3. **Content Guidelines:**
                - Explore the scientific, social, and personal aspects of "${podcast.topic}".
                - Discuss real or realistic scenarios related to the topic.
                - Delve into the challenges and benefits associated with the topic.
                - Pose ethical questions and consider future implications.
                - Conclude with a thoughtful takeaway or call to action for the audience.
                - Some lines in the transcript should be short interjections, and some lines should be long.
                - NOT ALL LINES should end in a question!

              4. **Formatting:**
                - Define clear section titles and bullet points.
                - Assign each host a name, description, and voice from the available VOICE_PROFILES.

              ${podcast.specialInstructions ? `SPECIAL INSTRUCTIONS: ${podcast.specialInstructions}` : ''}
            `),
            prompt: trimLines(`
              Create an outline for a "${podcastType}" style podcast about "${podcast.topic}".

              <DOCUMENTS description="Use the following documents as reference">
              ${resourceSection}
              </DOCUMENTS>

              Available VOICE_PROFILES:
              ${JSON.stringify(voices)}

              Ensure that each host is assigned a voice from the available VOICE_PROFILES.

              Make sure the outline reflects the "${podcastType}" podcast style.
            `),
            model: "openai:gpt-4o-mini",
          });

          outline = outlineResponse.object;
        }

        if (!outline) {
          throw new Error("Failed to generate outline");
        }

        // Insert the new outline into the podcast table
        const { data: outlineData } = await supabase
          .from("podcast")
          .update({
            outline: outline,
          })
          .eq("id", podcastId)
          .select("id")
          .single();

        pushToStream({
          type: "outline",
          data: {
            id: outlineData?.id,
            ...outline,
          },
        });

        // Step 2: Generate and stream podcast transcript
        const transcriptStream = await ai.streamGenObject({
          output: 'object',
          model: "openai:gpt-4o-mini",
          mode: 'json',
          schema: z.object({
            transcript: z.array(
              z.object({
                chainOfThought: z.object({
                  characterReflections: z.array(z.object({
                    type: z.enum(["question", "statement", "thought"]),
                    reflection: z.string().describe("A thought the other speaker would have about the line of dialogue."),
                  })).describe("A list of thoughts the other speaker would have."),
                  dialoguePlan: z.union([
                    z.object({
                      type: z.literal('introduction'),
                    }).describe("Introducing the podcast topic and hosts."),
                    z.object({
                      type: z.literal('acknowledgmentToken')
                    }).describe("(Also known as a backchannel response) This simply acknowledges what the other speaker said without adding much new information."),
                    z.object({
                      type: z.literal('elaboration'),
                      gist: z.string().describe("The gist of the dialogue that will be spoken next."),
                    }).describe("An elaboration on a point."),
                    z.object({
                      type: z.literal('correctError'),
                      error: z.string().describe("The error that will be corrected."),
                      correction: z.string().describe("The correction to the error."),
                    }).describe('This corrects an error made by the previous speaker.'),
                    z.object({
                      type: z.literal('correctCommonMisconceptions'),
                      misconception: z.string().describe("The misconception that will be corrected."),
                      correction: z.string().describe("The correction to the misconception."),
                    }).describe('This corrects a common misconception made by the previous speaker.'),
                    z.object({
                      type: z.literal('provideSupportingAnalogy'),
                      analogySubject: z.string().describe("The subject of the analogy that will be provided."),
                    }).describe('This simply supports what the previous speaker said, by providing an analogy. i.e. "Thats kind of like..."'),
                    z.object({
                      type: z.literal('reframe'),
                      newPerspective: z.string().describe("The new perspective to consider")
                    }).describe('Present a topic or issue from a different perspective to offer new insights.'),
                    z.object({
                      type: z.literal('askQuestion'),
                      questionTopic: z.string().describe('What does the question pertain to?')
                    }),
                    z.object({
                      type: z.literal('shareAnecdote'),
                      anecdoteTopic: z.string().describe('What does the anecdote pertain to?')
                    })
                  ])
                
                  
                  // z.object({
                  //   type: z.enum(['long', 'short', 'acknowledgment_token']).describe("The length of the dialogue that will be spoken next. There should be a good mix of long and short dialogue in any given conversation. Backchannel responses"),
                  //   characterFocus: z.enum(['primary', 'supporting']).describe("Does this character have the primary focus for this line of dialogue, or should they be supporting the other character? It is important that there should be a give and take between the two characters."),
                  //   subtype: z.enum([
                  //     "askOpenEndedQuestion",
                  //     "askClosedEndedQuestion",
                  //     "askForClarification",
                  //     "askHypotheticalQuestion",
                  //     "encourageElaboration",
                  //     "activeListening",
                  //     "paraphrasing",
                  //     "echoing",
                  //     "reflectingEmotion",
                  //     "provideFeedback",
                  //     "changeTopic",
                  //     "makeTransition",
                  //     "useSegue",
                  //     "reframeDiscussion",
                  //     "provideInformation",
                  //     "setContext",
                  //     "summarize",
                  //     "reinforceKeyPoints",
                  //     "introduceHumor",
                  //     "shareAnecdote",
                  //     "expressAgreement",
                  //     "expressDisagreement",
                  //     "expressEmpathy",
                  //     "sharePersonalOpinion",
                  //     "facilitateDebate",
                  //     "controlPace",
                  //     "useSilenceStrategically",
                  //     "challengeGuest",
                  //     "correctError",
                  //     "introduceGuest",
                  //     "wrapUp",
                  //     "thankGuest",
                  //     "teaseFutureContent",
                  //     "provideDisclaimer",
                  //     "inviteAudienceParticipation",
                  //     "acknowledgeAudienceFeedback",
                  //     "useMetaphorOrAnalogy",
                  //     "setTone",
                  //     "storytelling",
                  //     "useQuote",
                  //     "encourageGuestToShareResources",
                  //     "bringUpControversialTopic",
                  //     "engageInSmallTalk",
                  //     "expressCuriosity",
                  //     "summonPastDiscussion",
                  //     "callToAction",
                  //     "givePraise",
                  //     "facilitateReflection",
                  //     "useNonVerbalAffirmation",
                  //   ])
                  //   .describe(
                  //     `The type of dialogue that will be spoken next.`
                  //   ),
                  //   shouldEndInQuestion: z.boolean().describe("Whether the dialogue should end in a question, or be left open as a statement."),
                  //   dialogueGist: z.string().describe("The gist of the dialogue that will be spoken next."),
                  // }).describe("The dialogue plan for the next turn of conversation."),
                }).describe("Thoughts for the AI as it generates the podcast transcript"),
                line: z.object({
                  character: z.string().describe(
                    "The name of the character speaking the line of dialogue"
                  ),
                  dialogue: z.string().describe("The line of dialogue itself"),
                  // digDeeperTopics: z
                  //   .array(z.string())
                  //   .nullish()
                  //   .describe(
                  //     "Topics the user will be able to click on to get more information about them and change the course of the conversation. These should be specific & related to the dialogue, and not just random topics."
                  //   ),
                  isPodcastFullyComplete: z
                    .boolean()
                    .describe(
                      "If true, the podcast is complete and no more lines of dialogue should be generated"
                    ),
                })
              })
            ).describe(
              "The transcript of the podcast episode, with each line of dialogue attributed to the correct character and voice"
            ),
          }),
          messages: [
            {
              role: "system",
              content: trimLines(`
                  You are tasked with writing a podcast transcript about the concept of "${podcast.topic}". The podcast should emulate the depth and intellectual curiosity of shows like the Lex Fridman Podcast or The Duwarkesh Podcast, combined with the relatable and engaging style of NPR programs like Hidden Brain.

                  **Instructions:**

                  1. **Hosts and Tone:**
                    - Use the hosts defined in the outline.
                    - The conversation should be personable, engaging, and non-generic.
                    - Hosts should challenge each other with probing, tangible questions.
                    - Language should be specific, concise, and highly articulate.

                  2. **Structure:**
                    - Begin with intro music fading in.
                    - Hosts introduce themselves and the topic.
                    - The discussion should flow naturally with give and take between the hosts.
                    - Occasionally, one host may speak at length while the other offers small interjections like "yeah" or "hmm."
                    - Midway through, the other host should take the lead in the conversation.
                    - Use thorough examples and real-world anecdotes to illustrate points.
                    - Include non-verbal cues in brackets when appropriate (e.g., [Both Laugh], [Thoughtful Pause]).

                  3. **Content Guidelines:**
                    - Explore the scientific, social, and personal aspects of "${podcast.topic}".
                    - Discuss real or realistic scenarios related to the topic.
                    - Delve into the challenges and benefits associated with the topic.
                    - Pose ethical questions and consider future implications.
                    - Conclude with a thoughtful takeaway or call to action for the audience.

                  4. **Formatting:**
                    - Use clear speaker labels (e.g., **Host1:**, **Host2:**).
                    - Maintain a conversational style appropriate for a podcast.
                    - Keep the transcript clean and free of grammatical errors.

                  ${podcast.specialInstructions ? `SPECIAL INSTRUCTIONS: ${podcast.specialInstructions}` : ''}

                  ${podcast.transcript && startAfterIndex !== undefined ? `
                  IMPORTANT: You are continuing an existing conversation. The transcript up to this point will be provided.

                  You must continue the conversation from where it left off, smoothly transitioning to the new topic if one is provided.

                  Do not repeat information that has already been covered in the existing transcript.

                  IMPORTANT: The "USER" character is a special character that represents the user. It is not played by any of the hosts.
                  ` : ''}

                  ${newTopic ? `
                  IMPORTANT: The conversation must immediately shift to discussing the new topic: "${newTopic}".

                  Make this transition smooth and natural, as if one of the hosts has just brought up this new subject.
                  ` : ''}

                  IMPORTANT: YOU SHOULD NOT STOP GENERATING THE PODCAST UNTIL THE PODCAST IS COMPLETE.

                  <ConversationalMoves description="These are some conversational moves that you can think about.">
                  askOpenEndedQuestion
                  Description: Pose questions that require more than a yes or no answer to encourage detailed responses and stimulate deeper discussion.

                  askClosedEndedQuestion
                  Description: Pose questions that can be answered with a simple yes or no, or a specific piece of information, to obtain concise answers.

                  askForClarification
                  Description: Request the guest to explain or elaborate on a point that is unclear to ensure understanding.

                  askHypotheticalQuestion
                  Description: Present imaginary scenarios to explore ideas or test the guest's opinions.

                  encourageElaboration
                  Description: Prompt the guest to expand further on a topic or point they've mentioned.

                  activeListening
                  Description: Demonstrate attentiveness through verbal acknowledgments and non-verbal cues like nodding or saying "I see."

                  paraphrasing
                  Description: Restate the guest's statements in your own words to confirm understanding and show engagement.
                 
                  echoing
                  Description: Repeat key words or phrases to prompt the guest to delve deeper.
                  
                  reflectingEmotion
                  Description: Acknowledge and mirror the guest's emotions to build rapport and show empathy.
                  
                  provideFeedback
                  Description: Offer reactions such as nodding or saying "exactly" to show engagement and encourage the guest to continue.
                  
                  changeTopic
                  Description: Shift the conversation to a new subject or area of interest.
                  
                  makeTransition
                  Description: Use bridging statements to smoothly move from one topic to another.
                  
                  useSegue
                  Description: Link current discussions to upcoming topics for seamless flow.
                  
                  reframeDiscussion
                  Description: Present a topic or issue from a different perspective to offer new insights.
                  
                  provideInformation
                  Description: Share relevant facts, statistics, or data to enrich the conversation.
                  
                  setContext
                  Description: Offer background information to help the audience understand the discussion.
                  
                  summarize
                  Description: Recap key points discussed to highlight important information.
                  
                  reinforceKeyPoints
                  Description: Emphasize significant ideas to ensure they resonate with the audience.
                  
                  introduceHumor
                  Description: Use jokes or lighthearted comments to make the conversation enjoyable.
                  
                  shareAnecdote
                  Description: Tell personal stories or experiences related to the topic.
                  
                  expressAgreement
                  Description: Verbally concur with the guest to show alignment and support.
                  
                  expressDisagreement
                  Description: Politely offer a differing opinion to foster debate and explore different viewpoints.
                  
                  expressEmpathy
                  Description: Show understanding and compassion towards the guest's feelings or experiences.
                  
                  sharePersonalOpinion
                  Description: Contribute your own viewpoints to the discussion to create a more dynamic conversation.
                  
                  facilitateDebate
                  Description: Encourage exploration of different perspectives on a topic.
                  
                  controlPace
                  Description: Adjust the speed of the conversation to maintain engagement and ensure clarity.
                  
                  useSilenceStrategically
                  Description: Allow pauses to give the guest time to think or to emphasize a point.
                  
                  challengeGuest
                  Description: Politely question the guest's statements to provoke deeper thought and analysis.
                  
                  correctError
                  Description: Address any mistakes made during the conversation in a respectful manner.
                  
                  introduceGuest
                  Description: Provide the audience with background information about the guest at the start.
                 
                  wrapUp
                  Description: Conclude the conversation or segment, summarizing key takeaways.
                  
                  thankGuest
                  Description: Express gratitude to the guest for their participation.
                  
                  teaseFutureContent
                  Description: Mention upcoming topics or episodes to retain audience interest.
                  
                  provideDisclaimer
                  Description: Mention any necessary legal or content warnings.
                  
                  inviteAudienceParticipation
                  Description: Encourage listeners to engage through comments, questions, or social media.
                  
                  acknowledgeAudienceFeedback
                  Description: Reference listener comments or questions during the podcast.
                  
                  useMetaphorOrAnalogy
                  Description: Explain complex ideas in relatable terms to aid audience understanding.
                  
                  setTone
                  Description: Establish the mood or atmosphere of the conversation.
                  
                  storytelling
                  Description: Use narratives to illustrate points and engage listeners.
                  
                  useQuote
                  Description: Incorporate relevant quotations to support points and add authority.
                  
                  encourageGuestToShareResources
                  Description: Ask the guest for recommendations or resources for the audience.
                  
                  bringUpControversialTopic
                  Description: Introduce provocative subjects to stimulate discussion and interest.
                  
                  engageInSmallTalk
                  Description: Engage in brief, casual conversation to build rapport.
                  
                  expressCuriosity
                  Description: Show genuine interest in the topic to encourage the guest to share more.
                  
                  summonPastDiscussion
                  Description: Refer back to something said earlier to create continuity.
                  
                  callToAction
                  Description: Encourage the audience to take specific action.
                  
                  givePraise
                  Description: Compliment the guest or their work to build a positive atmosphere.
                  
                  facilitateReflection
                  Description: Encourage the guest to reflect on their experiences or insights.
                 
                  useNonVerbalAffirmation
                  Description: Employ non-verbal cues like nodding or smiling to encourage the guest (not always visible in audio but can affect tone).
                  </ConversationalMoves>

                  <SPECIAL_GUIDELINES>
                  ${numTurns ? `You should only generate ${numTurns} turns in conversation.` : ''}
                  ${podcast.specialInstructions ? `SPECIAL INSTRUCTIONS: ${podcast.specialInstructions}` : ''}
                  </SPECIAL_GUIDELINES>
              `),
            },
            {
              role: "user",
              content: JSON.stringify(
                {
                  outline: outline,
                  existingTranscript: podcast.transcript?.slice(
                    startAfterIndex || 0
                  ),
                  startAfterIndex: startAfterIndex ?? undefined,
                  newTopic: newTopic ?? undefined,
                  voices,
                  podcastType,
                  documents: resourceSection,
                },
                null,
                2
              ),
            },
          ],
        });

        const arrGenerator = partialObjectStreamToArrayGenerator(
          transcriptStream.partialObjectStream,
          (chunk) => chunk.transcript
        );

        for await (const chunk of arrGenerator) {
          if (!chunk) {
            continue;
          }

          const { line, chainOfThought } = chunk;

          if (!line) {
            continue;
          }

          // Sometimes the AI will try to repeat lines that have already been said. Filter those.
          if (podcast.transcript && line && startAfterIndex !== undefined) {
            // Only add this chunk if it isn't in the transcript yet
            const doesLineExist = podcast.transcript.some(
              (line) =>
                line.speaker === line.character &&
                line.dialogue === line.dialogue
            );

            if (doesLineExist) {
              continue;
            }
          }

          console.log('AFTER', line)

          const newLine = {
            dialogue: line.dialogue ?? "",
            speaker: line.character ?? "",
            // dig_deeper_topics: line.digDeeperTopics?.filter(notEmpty) ?? [],
            podcast_id: podcastId,
            // This will be set by the trigger
            line_number: 0,
          };

          // Insert the new line into the podcast_line table
          const { error } = await supabase.from("podcast_line").insert(newLine);

          if (error) {
            console.error("Error inserting podcast line:", error);
            pushToStream({ type: "error", data: "Failed to insert podcast line" });
          } else {
            pushToStream({ type: "transcript", data: newLine });
          }
        }

        pushToStream({ type: "generation-complete", data: {} });
      } catch (error) {
        console.error("Error generating podcast transcript:", error);
        pushToStream({ type: "error", data: "Failed to generate podcast transcript" });
      } finally {
        stream.push(null); // End the stream
      }
    })();

    return new NextResponse(Readable.toWeb(stream) as any, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  },
});
