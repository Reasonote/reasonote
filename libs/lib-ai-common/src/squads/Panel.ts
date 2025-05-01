import { CoreMessage } from 'ai';
import { z } from 'zod';

import {
  GenerateObjectSchema,
  GenObjectResult,
  LanguageModelTypeFromFunction,
} from '../types/types';

export interface Agent {
    name: string;
    role: string;
    goal: string;
    backstory: string;
}

export interface PanelStub {
    agents: Agent[];
    schema: z.ZodObject<any>;
}

export interface IPanel<TSchema> {
    schema: TSchema;
    executeObject<T>({model, messages, schema}: {model: LanguageModelTypeFromFunction | string, messages: CoreMessage[], schema: GenerateObjectSchema<T>}): Promise<GenObjectResult<T>[]>;
}
