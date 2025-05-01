import { CoreMessage } from "ai";
import { z } from "zod";

import {
    AIGenObjectArgs,
    GenObjectResult,
} from "@reasonote/lib-ai-common";

import {
    ActivityType,
    OneShotAIArgs,
    OneShotAIResponse,
} from "./";
import { ActivityConfig } from "./ActivityConfig";
import { RNCtxInjectorInvokeConfig } from "./CtxInjector/InvokeConfig";
import { LessonConfig } from "./LessonConfig";
import { ReasoningConfig } from "./Reasoning";
import { SkillLevel } from "./SkillLevels";
import { UserFeeling } from "./UserFeelings";

export interface UserActivityGeneratedFor {
    id: string;
    givenName?: string;
    familyName?: string;
    aiContext?: string;
    feelings?: UserFeeling[];
}

export interface ActivityGenerateContextDocument {
    name?: string | null;
    pageContent?: string | null;
}

export interface ActivityGenerateExpertQuestion {
    question: string;
    answer: string;
}

export interface ActivityGenerateSkill {
    /** It's recommended to provide this, but for now, we don't require it. */
    id?: string;
    name: string;
    parentSkillIds?: string[];
    parentSkillContext?: string;
    documents?: ActivityGenerateContextDocument[];
    expertQuestions?: ActivityGenerateExpertQuestion[];
    referenceSentences?: string[];
    referenceChunks?: string[];
}

export const ActivityGenerateFromDocumentSchema = z.object({
    id: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    text: z.string(),
    sourceUrl: z.string().optional().nullable(),
});
export type ActivityGenerateFromDocument = z.infer<typeof ActivityGenerateFromDocumentSchema>;


interface ActivityGenerateEvaluatorConfigBase {
    /**
     * Whether to enable the evaluator.
     */ 
    enabled: boolean;

    /**
     * Configuration for the reasoning-step of the evaluator.
     */
    reasoning?: ReasoningConfig;

    // /**
    //  * If provided, this will override the default evaluator for this activity type.
    //  */
    // customEvaluator?: {
    //     /**
    //      * The prompt to use for the evaluator.
    //      * 
    //      * If provided, this will override the default prompt for this activity type evaluator.
    //      */
    //     prompt?: string;

    //     /**
    //      * The schema to use for the evaluator's output.
    //      * 
    //      * If not provided, the default evaluator for this activity type will be used.
    //      */
    //     outputSchema?: z.ZodObject<any>;
    // }

    /**
     * The maximum number of loops to allow the evaluator to run.
     */
    maxEvalLoops?: number;
}

export interface ActivityGenerateSingleEvaluatorConfig extends ActivityGenerateEvaluatorConfigBase {}

export interface ActivityGenerateFrom {
    skill?: ActivityGenerateSkill,
    documents?: ActivityGenerateFromDocument[],
    activityIds?: string[],
    activityConfigs?: ActivityConfig[],
}

export interface ActivityGenerateUserSkill {
    id: string,
    selfAssignedLevel?: SkillLevel,
    interestReasons?: string[],
}

export interface ActivityGenerateTypeSpecificConfig {
    
}

export interface ActivityGenerateManyRequestSequencingEntry {
    /**
     * The activity types to generate.
     * 
     * If not provided, the default activity types for the top-level request will be used.
     */
    activityTypes?: ActivityType[],

    /**
     * Configuration for the post-processing for this activity.
     * 
     * If not provided, the default post-processing config for the top-level request will be used.
     */
    postprocessing?: ActivityGeneratePostprocessing,

    /**
     * Configuration for the evaluators for this activity.
     * 
     * If not provided, the default evaluators for the top-level request will be used.
     */
    evaluators?: ActivityGenerateSingleEvaluatorConfig,

    /**
     * Additional instructions for this activity.
     * 
     * If not provided, the default additional instructions for the top-level request will be used.
     */
    additionalInstructions?: string,
}

export interface ActivityGenerateManyRequestSequencing {
    /**
     * A list of overrides for each activity in the sequence.
     * 
     * For instance, you could provide: 
     * [
     *    {
     *      activityTypes: ['activity-type-1', 'activity-type-2'],
     *      postprocessing: {
     *          enabled: false,
     *      },
     *      additionalInstructions: 'Do not use any images.',
     *      evaluators: {
     *          enabled: false,
     *      },
     *    },
     *    {
     *      activityTypes: ['activity-type-3', 'activity-type-4'],
     *      evaluators: {
     *          enabled: true,
     *      },
     *      postprocessing: {
     *          enabled: true,
     *      },
     *    },
     * ]
     * 
     * This would generate:
     *  - one activity which could be of type 'activity-type-1' or 'activity-type-2',
     *    With the additional instructions 'Do not use any images.', the evaluators disabled, and the postprocessing disabled.
     *  - and another activity which could be of type 'activity-type-3' or 'activity-type-4',
     *    With the evaluators enabled, and the postprocessing enabled.
     */
    sequence?: ActivityGenerateManyRequestSequencingEntry[],
}


export interface ActivityGenerateManyRequest extends ActivityGenerateRequestBase {
    /**
     * The number of activities to generate.
     * 
     * NOTE: only one of numActivities or sequencing can be provided.
     */
    numActivities?: number,

    /**
     * If you want to limit the activity types that can be generated, you can provide a list of valid activity types.
     */
    validActivityTypes?: ActivityType[],

    /**
     * Configuration for each activity in the sequence.
     * 
     * This allows you fine-tune how each activity in the sequence is configured.
     * 
     * NOTE: only one of numActivities or sequencing can be provided.
     */
    sequencing?: ActivityGenerateManyRequestSequencing,

    /**
     * Configuration for each activity type.
     */
    typeConfigs?: {
        [type: string]: Partial<ActivityGenerateRequestBase> & {
            activityTypeSpecificConfig?: any | null,
        };
    }

    /**
     * Other messages to include to the AI generation calls.
     */
    otherMessages?: CoreMessage[] | null,
}

/**
 * Configuration for post-processing the generated activity.
 */
export interface ActivityGeneratePostprocessing {
    /**
     * Whether to enable post-processing of the generated activity.
     * 
     * DEFAULT: true
     */
    enabled?: boolean,
}


export interface ActivityGenerateRequestBase {
    /**
     * The source material to use for the activity generation.
     */
    from: ActivityGenerateFrom,

    /**
     * The user skill to use for the activity generation.
     */
    userSkill?: ActivityGenerateUserSkill,

    /**
     * Whether to enable post-processing of the generated activity.
     */
    postprocessing?: ActivityGeneratePostprocessing,

    /**
     * Configuration for the evaluators.
     * 
     * Can be a single config, or a config-per-activity type.
     */
    evaluators?: ActivityGenerateSingleEvaluatorConfig,

    /**
     * The lesson to use for the activity generation.
     */
    lesson?: LessonConfig,

    /**
     * The user to use for the activity generation.
     */
    user?: UserActivityGeneratedFor,

    /**
     * The context injectors to use for the activity generation.
     */
    ctxInjectors?: RNCtxInjectorInvokeConfig[],

    /**
     * If you want to provide special instructions, do so here.
     */
    additionalInstructions?: string,
}


/**
 * The request for generating a single activity.
 */
export interface ActivityGenerateRequestSingle extends ActivityGenerateRequestBase {
    /**
     * Additional args you can pass to the specific activity type.
     */
    activityTypeSpecificConfig?: any | null,

    /**
     * Other messages to include to the AI generation calls.
     */
    otherMessages?: CoreMessage[] | null,
}

/**
 * The request for generating a single activity.
 */
export type ActivityGenerateRequest = ActivityGenerateRequestSingle & {
    /**
     * The number of activities to generate.
     */
    numActivities?: number,
}

export interface ActivityGenerateFunctions {
    genObject<T>(args: AIGenObjectArgs<T>): Promise<GenObjectResult<T>>;
    /**
     * @deprecated use genObject
     */
    oneShotAI<T extends z.ZodTypeAny>(args: OneShotAIArgs<T>): Promise<OneShotAIResponse<T>>;
}
