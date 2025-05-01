import { z } from 'zod';

import { ActivityTypesPublic } from '@reasonote/core';

import { UnifiedResource } from '../../interfaces';
import { ActivityGeneratorV2 } from '../ActivityGeneratorV2.priompt';
import { ActivityRequestHydratedValues } from '../types';

export function stubHydratedValues(overrides?: Partial<ActivityRequestHydratedValues>): ActivityRequestHydratedValues {
  return {
    validActivityTypeServers: [],
    outputSchema: z.object({}),
    activityConfigsFormatted: [],
    ctxInjectorsFormatted: [],
    subjectDefinitionString: 'JavaScript Fundamentals',
    resources: [],
    referencesAndChunks: {
      references: [],
      chunks: []
    },
    ...overrides
  }
}




/**
 * Creates a getHydratedValuesOverride function with customizable options
 * 
 * @param options Configuration options for the hydrated values
 * @returns A function that can be used as getHydratedValuesOverride in tests
 */
export function createHydratedValuesOverride(options: {
  subjectDefinitionString?: string;
} = {}) {
  return async (generator: ActivityGeneratorV2, req: any): Promise<ActivityRequestHydratedValues> => {
    const validActivityTypeServers = await generator._getValidActivityTypeServers(req.validActivityTypes ?? [...ActivityTypesPublic]);
    const outputSchema = await generator.createOutputSchema(req);

    // Convert provided documents to unified resources
    const prefetchedResources: UnifiedResource[] = req.from?.documents?.map((doc: any) => {
      return {
        id: doc.id ?? '',
        type: 'page',
        name: doc.title ?? '',
        source: doc.sourceUrl ?? '',
        content: doc.text
      }
    }) ?? [];

    const ret: ActivityRequestHydratedValues = {
      validActivityTypeServers,
      outputSchema,
      activityConfigsFormatted: [],
      ctxInjectorsFormatted: [],
      subjectDefinitionString: options.subjectDefinitionString ?? 'JavaScript Fundamentals',
      resources: prefetchedResources,
      referencesAndChunks: {
        references: [],
        chunks: []
      }
    }

    return ret;
  };
} 