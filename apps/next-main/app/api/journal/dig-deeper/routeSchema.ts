import {z} from "zod";

import {trimLines} from "@lukebechtel/lab-ts-utils";
import {OpenAIConfigSchema} from "@reasonote/lib-ai-common";
import {ApiRoute} from "@reasonote/lib-api-sdk";

import {
  GoalTypeEnumSchema,
} from "../../../app/goals/_common/interfaces/goaltype";

export const NewGoalSchema = z.object({
  type: GoalTypeEnumSchema.describe("The type of goal."),
  name: z.string().describe("The name of the goal."),
});

export const SuggestedGoalsFunctionDesc = {
  name: "suggest_new_goals",
  description:
    "Suggests goals the user can set. These may be small, like a simple action, a habit, or larger, like a project. Any goal you set should be SMART -- Specific, Measurable, Attainable, Realistic, Timely.",
  parameters: {
    type: "zodschema" as const,
    zodschema: z.object({
      newGoals: z
        .array(NewGoalSchema)
        .optional()
        .describe(
          "Goals the user could set -- These will be ADDED to the existing list of goals."
        ),
    }),
  },
};

export const ProvideGuidanceFunctionDesc = {
  name: "provide_guidance",
  description: `
  Provides guidance to the user on how to achieve their goals. 
  This should be done in three parts: 
  (A) Validate the user\'s feelings
  (B) Provide expert guidance
  (C) Ask a question to dig deeper into the issue.
  `,
  parameters: {
    type: "zodschema" as const,
    zodschema: z.object({
      messages: z
        .object({
          a_validation: z
            .string()
            .describe("A validation of the user's feelings."),
          b_guidance: z
            .string()
            .describe("Expert guidance you want to provide to the user."),
          c_question: z
            .string()
            .describe(
              "A question to ask the user to dig deeper into the issue."
            ),
        })
        .describe(
          "Messages that will be concatenated together to form the message to the user."
        ),
      goalsUserMentioned: z
        .array(NewGoalSchema)
        .optional()
        .describe(
          "Formatted Goals the user mentioned. The User will be prompted to add these to their list of goals."
        ),
      suggestedNewGoals: z
        .array(NewGoalSchema)
        .optional()
        .describe(
          trimLines(`
        Goals the user could set -- These will be ADDED to the existing list of goals.
        These goals should be SMART -- Specific, Measurable, Attainable, Realistic, Timely.
      `)
        ),
    }),
  },
};

////////////////////////////////////////////////////////////////////////
// REQUEST
////////////////////////////////////////////////////////////////////////
export const JournalEntrySchema = z.object({
  type: z.union([z.literal("human"), z.literal("ai")]),
  content: z.string(),
});
export type JournalEntry = z.infer<typeof JournalEntrySchema>;

export const JournalDigDeeperRouteRequestSchema = z.object({
  userBio: z.string().optional(),
  longTermGoals: z.array(z.string()).optional(),
  sessionGoals: z.array(z.string()),
  currentHabits: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        schedule: z.object({
          type: z.enum([
            "daily",
            "weekly",
            "monthly",
            "every n days",
            "every n weeks",
            "every n months",
          ]),
          interval: z.number().min(1),
        }),
        status: z
          .object({
            missedInstances: z
              .number()
              .min(0)
              .describe("The number of times this habit was missed."),
          })
          .optional(),
      })
    )
    .optional(),
  pastJournalEntries: z.array(JournalEntrySchema).nonempty(),
  driverConfig: z
    .object({
      type: z.literal("openai"),
      config: OpenAIConfigSchema.extend({
        apiKey: z.string().optional(),
      }),
    })
    .optional(),
});
export type JournalDigDeeperRouteRequestIn = z.input<
  typeof JournalDigDeeperRouteRequestSchema
>;
export type JournalDigDeeperRouteRequestOut = z.output<
  typeof JournalDigDeeperRouteRequestSchema
>;

////////////////////////////////////////////////////////////////////////
// RESPONSE
////////////////////////////////////////////////////////////////////////
const JournalDigDeeperRouteResponseSchema = z.object({
  newMessage: z.object({
    type: z.literal("ai"),
    content: z.string(),
  }),
  goalsUserMentioned: z.array(NewGoalSchema).optional(),
  suggestedNewGoals: z.array(NewGoalSchema).optional(),
});
export type JournalDigDeeperRouteResponse = z.infer<
  typeof JournalDigDeeperRouteResponseSchema
>;

////////////////////////////////////////////////////////////////////////
// ROUTE
////////////////////////////////////////////////////////////////////////
export const JournalDigDeeperRoute = new ApiRoute({
  path: "/api/journal/dig-deeper",
  method: "post",
  requestSchema: JournalDigDeeperRouteRequestSchema,
  responseSchema: JournalDigDeeperRouteResponseSchema,
});
