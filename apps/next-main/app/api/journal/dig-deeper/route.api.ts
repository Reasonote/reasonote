import _ from "lodash";
import {z} from "zod";

import {trimLines} from "@lukebechtel/lab-ts-utils";
import {ChatDriverOpenai} from "@reasonote/lib-ai";
import {PostgrestError} from "@supabase/supabase-js";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {
  JournalDigDeeperRoute,
  NewGoalSchema,
  ProvideGuidanceFunctionDesc,
} from "./routeSchema"; // Configuration for Deno runtime

//env.useBrowserCache = false;
//env.allowLocalModels = false;

class PostgrestErrorWrapper extends Error {
  constructor(public readonly pgError: PostgrestError) {
    super("PostgrestErrorWrapper");
  }
}

export const POST = makeServerApiHandlerV2({
  route: JournalDigDeeperRoute,
  handler: async (ctx) => {
    const { req, parsedReq,  supabase, logger, ai } = ctx;

    const {
      pastJournalEntries,
      driverConfig,
      sessionGoals,
      userBio,
      longTermGoals,
    } = parsedReq;

    const openaiChat = new ChatDriverOpenai();

    ////////////////////////////////////////////
    // Get Goals the User Mentioned
    const userMentionedGoals = await ai.genObject({
      prompt: trimLines(`
        # YOU
        Your goal is to scan the user's last message and respond with any new goals they may have mentioned in that message.

        If the user did not mention any new goals, you can just return an empty array.

        # USER
        The user is interacting with you through a chat client.
        They can see:
        - The list of their goals for today
        - The chat window you're interacting with them through

        ${
          userBio
            ? `
        ## BASIC USER BIO
        The user has described themselves as follows:
        \`\`\`userBio
        ${userBio}
        \`\`\`
        `
            : ""
        }

        ${
          longTermGoals
            ? `
        ## USER'S LONG-TERM GOALS
        The user's long-term goals are:
        ${longTermGoals.map((g) => `- ${g}`).join("\n")}
        `
            : ""
        }

        # USER'S GOALS FOR TODAY
        The User's list of daily goals so far:
        ${sessionGoals.map((g) => `- ${g}`).join("\n")}
      `),
      functionName: "set_goals_user_mentioned",
      functionDescription: trimLines(`
        Export the goals the user mentioned in their last message.
      `),
      schema: z.object({
        goalsUserMentioned: z.array(NewGoalSchema),
      }),
      messages: pastJournalEntries.map((j) => ({
        role: (j.type === "ai" ? ("assistant" as const) : ("user" as const)) as
          | "user"
          | "assistant",
        content: j.content,
      })),
    });

    ////////////////////////////////////////////
    // Send request
    const resultResp = await ai.genObject({
      prompt: trimLines(`
        # YOU
        Please act as a mental health expert, and project manager.
        You are kind, thoughtful, articulate, intelligent, and detail-oriented.

        # YOUR TASK
        Your goal is to help the user plan their day, while encouraging them.

        Be sure to bolster the user's mood while helping them make S.M.A.R.T. plans.

        REMEMBER -- you can suggest goals to the user, and they can add them to their list of goals.
        You should do this whenever a good opportunity arises:
        - If the User is describing goals they want to add that aren't on the list
        - If the User is strongly implying they are struggling with something, and you have a goal that could help them

        # USER
        The user is interacting with you through a chat client.
        They can see:
        - The list of their goals for today
        - The chat window you're interacting with them through

        ${
          userBio
            ? `
        ## BASIC USER BIO
        The user has described themselves as follows:
        \`\`\`userBio
        ${userBio}
        \`\`\`
        `
            : ""
        }

        ${
          longTermGoals
            ? `
        ## USER'S LONG-TERM GOALS
        The user's long-term goals are:
        ${longTermGoals.map((g) => `- ${g}`).join("\n")}
        `
            : ""
        }

        # USER'S GOALS FOR TODAY
        The User's list of daily goals so far:
        ${sessionGoals.map((g) => `- ${g}`).join("\n")}
      `),
      functionName: ProvideGuidanceFunctionDesc.name,
      functionDescription: ProvideGuidanceFunctionDesc.description,
      schema: ProvideGuidanceFunctionDesc.parameters.zodschema,
      messages: pastJournalEntries.map((j) => ({
        role: (j.type === "ai" ? ("assistant" as const) : ("user" as const)) as
          | "user"
          | "assistant",
        content: j.content,
      })),
    });

    const result = resultResp.object;

    const firstChoice = result?.[0];

    const {
      messages: { a_validation, b_guidance, c_question },
      suggestedNewGoals,
    } = firstChoice!;

    const firstAIMessage = trimLines(`
    ${a_validation}

    ${b_guidance}
    
    ${c_question}
    `);

    if (!firstAIMessage) {
      throw new Error("No message was returned from OpenAI");
    }

    ////////////////////////////////////////////
    // Ask the AI if it has any suggested actions.
    // const suggestMessages = [
    //   {
    //     role: 'system' as const,
    //     content: trimLines(`
    //       # You
    //       You are an ai-assisted therapist, and project manager -- participating in a Journaling session with a client.
    //       You are kind, thoughtful, articulate, intelligent, and detail-oriented.

    //       You need to provide suggestions as to goals / actions the user can take, to help them achieve their overall goals.

    //       # Client
    //       The client is a human who may be suffering from some ups and downs.

    //       # Your Overall Task
    //       Your goal is to help the user to feel better, and to help them to achieve their goals.

    //       If the user is feeling a little down, you should bolster their mood before helping them to achieve their goals.

    //       # Goals for This Session
    //       Your goals during this session are:
    //       ${sessionGoals.map((g) => `- ${g}`).join('\n')}
    //     `)
    //   },
    //   ...pastJournalEntries.map((j) => ({
    //     role: (j.type === 'ai' ? 'assistant' as const : 'user' as const) as 'user' | 'assistant',
    //     content: j.content
    //   })),
    //   {
    //     role: 'assistant' as const,
    //     content: firstAIMessage
    //   }
    // ]

    // const suggestResult = await openaiChat.run({
    //   messages: suggestMessages,
    //   functions: [
    //     SuggestedGoalsFunctionDesc
    //   ],
    //   functionCall: 'suggest_goals',
    //   numChoices: 1,
    //   driverConfig: {
    //     ...driverConfig,
    //     config: {
    //       ...driverConfig.config,
    //       apiKey: OPENAI_KEY,
    //     }
    //   }
    // })

    // const firstSuggestMessage = suggestResult.choices[0].message;

    // const firstSuggestedGoals = suggestResult.choices[0].message?.functionCall?.arguments?.parsed;
    // console.log('firstSuggestedGoals', firstSuggestedGoals)

    // if (!firstSuggestMessage) {
    //   throw new Error("No message was returned from OpenAI");
    // }

    // const suggestResultAgain = await openaiChat.run({
    //   messages: [
    //     ...suggestMessages,
    //     firstSuggestMessage,
    //     {
    //       role: 'system',
    //       content: `These suggestions are not S.M.A.R.T. enough. Please provide S.M.A.R.T. suggestions.`
    //     }
    //   ],
    //   functions: [
    //     SuggestedGoalsFunctionDesc
    //   ],
    //   functionCall: 'suggest_goals',
    //   numChoices: 1,
    //   driverConfig: {
    //     ...driverConfig,
    //     config: {
    //       ...driverConfig.config,
    //       apiKey: OPENAI_KEY,
    //     }
    //   }
    // })

    // const suggestedGoals = suggestResultAgain.choices[0].message?.functionCall?.arguments?.parsed;

    // console.log('revised Suggested goals:', suggestedGoals)

    return {
      newMessage: {
        type: "ai" as const,
        content: firstAIMessage,
      },
      goalsUserMentioned:
        userMentionedGoals.object?.goalsUserMentioned,
      suggestedNewGoals,
    };
  },
});
