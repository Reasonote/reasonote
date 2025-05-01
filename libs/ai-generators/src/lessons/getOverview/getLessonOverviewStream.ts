import { z } from 'zod';

import { notEmpty } from '@lukebechtel/lab-ts-utils';
import { partialObjectStreamToArrayGenerator } from '@reasonote/lib-utils';

import { createLessonOverviewPrompt } from './createPrompt';
import {
  GetLessonOverviewStreamArgs,
  LessonOverviewItem,
  LessonOverviewSchema,
} from './types';

export async function* getLessonOverviewStream(args: GetLessonOverviewStreamArgs): AsyncGenerator<LessonOverviewItem> {
    const streamResult = await args.ai.streamGenObject({
        ...args.streamGenObjectArgs,
        prompt: createLessonOverviewPrompt(args),
        schema: z.object({
            lessonPlan: LessonOverviewSchema.pick(
                //@ts-ignore
                Object.fromEntries(args.fieldsToGet.map((f) => [f, true]))
            ).describe('The lesson plan'),
        }),
        model: args?.streamGenObjectArgs?.model ?? 'openai:gpt-4o-2024-08-06',
        mode: args?.streamGenObjectArgs?.mode ?? 'json',
        providerArgs: {
            structuredOutputs: true,
            ...args.streamGenObjectArgs?.providerArgs,
        },
    });

    // Convert the stream to an array generator of items
    const itemGenerator = partialObjectStreamToArrayGenerator(
        streamResult.partialObjectStream,
        (partial) => {
            const items: LessonOverviewItem[] = [];
            
            // Add slides if they exist
            if (partial?.lessonPlan?.slides) {
                items.push(...(partial.lessonPlan.slides ? partial.lessonPlan.slides : []).filter(notEmpty) as any[]);
            }
            
            // Add activities if they exist
            if (partial?.lessonPlan?.practice?.activities) {
                items.push(...(partial.lessonPlan.practice.activities ?? []).filter(notEmpty) as any[]);
            }
            
            return items;
        }
    );

    yield* itemGenerator;
} 