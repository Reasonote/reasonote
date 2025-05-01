import _ from 'lodash';

//@ts-ignore
import * as Priompt from '@anysphere/priompt';
import { Maybe } from '@lukebechtel/lab-ts-utils';
import {
  ActivityConfig,
  ActivityGenConfig,
  ActivityGenerateManyRequest,
  ActivityGenerateRequest,
  ActivitySubmitResult,
} from '@reasonote/core';
import {
  ActivityGeneratorV2,
  AI,
} from '@reasonote/lib-ai';

import { ActivityRequestHydratedValues } from './types';
import { ValidActivityTypeServer } from './ValidActivityTypeServer';

export abstract class ActivityTypeServerV2<TConfig extends ActivityConfig = any, TSubmitResult extends ActivitySubmitResult = any> implements ValidActivityTypeServer<TConfig, any> {
    abstract type: string;
    //@ts-ignore
    abstract getGenConfig(args: ActivityGenerateRequest | ActivityGenerateManyRequest, ai: AI): Promise<ActivityGenConfig>;
    abstract postProcessConfig?: ({config, request, ai}: {config: TConfig, request: ActivityGenerateRequest, ai: AI}) => Promise<TConfig>;
    abstract evaluateConfig?: (args: {config: TConfig, ai: AI, request: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues}}) => Promise<{isValid: boolean, feedback: any}>;
    
    /**
     * Grades a user's answer for this activity type.
     * 
     * @param args - The arguments for grading the user's answer
     * @returns A promise that resolves to the grading result
     */
    abstract gradeUserAnswer?(args: {
        config: TConfig, 
        userAnswer: any, 
        ai: AI
    }): Promise<TSubmitResult>;

    /**
     * 
     * // Generation steps:
     * // 0. Generate Several activities in a stream
     * // As activities are yielded by the stream, do the following for each activity:
     * // 1. PostGenerate Processing
     * // 2. Evaluate (if evaluateConfig is provided)
     * // 3. If not valid, Generate again, go back to 1
     * // 4. If valid, return
     * 
     * @param _req 
     * @param ai 
     * @returns 
     */
    async generate(_req: ActivityGenerateRequest, ai: AI, options?: {
        getHydratedValuesOverride?: (generator: ActivityGeneratorV2, req: ActivityGenerateRequest) => Promise<ActivityRequestHydratedValues>;
    }): Promise<Maybe<TConfig>> {
        const activityGenerator = new ActivityGeneratorV2({
            activityTypeServers: [this],
            ai,
            getHydratedValuesOverride: options?.getHydratedValuesOverride
        });

        // Ask for a single activity from the generator
        const activityIterator = activityGenerator.generateActivities({
            ..._req,
            numActivities: 1
        });
        
        const result = await activityIterator.next();
        if (result.done) {
            return { success: false, error: new Error('No activity generated') };
        }
        
        return { success: true, data: result.value as TConfig };
    }
}