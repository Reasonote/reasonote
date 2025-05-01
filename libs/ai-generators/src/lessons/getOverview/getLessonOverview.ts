import { z } from 'zod';

import { createLessonOverviewPrompt } from './createPrompt';
import {
  GetLessonOverviewArgs,
  LessonOverviewSchema,
} from './types';

export async function getLessonOverview(args: GetLessonOverviewArgs) {
    const lessonOutput = await args.ai.genObject({
        ...args.genObjectArgs,
        prompt: createLessonOverviewPrompt(args),
        schema: z.object({
            lessonPlan: LessonOverviewSchema.pick(
                //@ts-ignore
                Object.fromEntries(args.fieldsToGet.map((f) => [f, true]))
            ).describe('The lesson plan'),
        }),
        model: args?.genObjectArgs?.model ?? 'openai:gpt-4o-2024-08-06',
        mode: args?.genObjectArgs?.mode ?? 'json',
        providerArgs: {
            structuredOutputs: true,
            ...args.genObjectArgs?.providerArgs,
        },
    });

    return lessonOutput.object?.lessonPlan;
}