import { Maybe } from '@lukebechtel/lab-ts-utils';
import { ActivityConfig } from '@reasonote/core/src/interfaces/ActivityConfig';
import {
  ActivityGenConfig,
} from '@reasonote/core/src/interfaces/ActivityGenConfig';
import {
  ActivityGenerateRequest,
} from '@reasonote/core/src/interfaces/ActivityGenerate';
import {
  ActivityResultBase,
} from '@reasonote/core/src/interfaces/ActivityResultBase';
import { SkillLevel } from '@reasonote/core/src/interfaces/SkillLevels';

import { AI } from '../';

export interface ValidActivityTypeServer<TConfig extends ActivityConfig, TResult extends ActivityResultBase> {
    /** The typename for this activity type. */
    type: string;
   
    /**
     * Get config for generating an activity related to this activity type, in the given context.
     */
    getGenConfig?: (args: ActivityGenerateRequest, ai: AI) => Promise<ActivityGenConfig>;

    /**
     * Generates a config for this activity using AI.
     * @param rest parameters.
     * @returns A promise that resolves to the config.
     */
    generate: (args: ActivityGenerateRequest, ai: AI) => Promise<Maybe<TConfig>>;


       /**
     * Generates a tip for this activity, after completion.
     * @param result 
     * @returns 
     */
    getCompletedTip?: (result: TResult) => Promise<string | null | undefined>;

    /** If it's possible to get related skills using just the config, 
     * this method can be run to do so. */
    getRelatedSkills?: (config: TConfig) => Promise<{name: string, parent?: string, level?: SkillLevel}[]>;

    /** If related skills are requested after the result has been shown,
     * this method can be run to do so. */
    getRelatedSkillsAfterResult?: (args: {config: TConfig, result: TResult}) => Promise<string[]>;
}

export function staticValidateActivityTypeServer<TConfig extends ActivityConfig, TResult extends ActivityResultBase>(act: ValidActivityTypeServer<TConfig, TResult>){}
