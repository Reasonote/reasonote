import { Schema } from 'ai';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

import { JSONSchema7 } from '@ai-sdk/provider';
import { isZodLikeSchema } from '@reasonote/core';

import { createStrippedJsonSchemaForStructuredOutputs } from './fixSchema';
import { jsonSchemaRefFixer } from './jsonSchemaRefFixer';

export type OutputSchemaWithThinking<TThinking extends z.ZodTypeAny, TResult extends z.ZodTypeAny> = z.ZodObject<{
    thinking: TThinking;
    result: TResult;
}>;

export const DefaultThinkingSchema = z.object({
    thoughts: z.array(z.string()),
});

export function convertToThinkingSchema<TResult extends z.ZodTypeAny = z.ZodTypeAny, TThinking extends z.ZodTypeAny = typeof DefaultThinkingSchema>(resultSchema: TResult, thinkingSchema: TThinking): OutputSchemaWithThinking<TThinking, TResult> {
    return z.object({
        thinking: thinkingSchema,
        result: resultSchema,
    });
}

type GenObjSchema<T> = z.Schema<T, z.ZodTypeDef, any> | Schema<T>;


export function convertToFinalSchema<TResult, TThinking>(resultSchema: GenObjSchema<TResult>, thinkingSchema?: GenObjSchema<TThinking>): JSONSchema7 {
    var fullSchema: JSONSchema7;

    if (thinkingSchema) {
        // 1. Convert both schemas to jsonSchema.
        const resultJsonSchema = isZodLikeSchema(resultSchema) ? zodToJsonSchema(resultSchema as any) : resultSchema.jsonSchema as any;
        const thinkingJsonSchema = isZodLikeSchema(thinkingSchema) ? zodToJsonSchema(thinkingSchema as any) : thinkingSchema.jsonSchema as any;

        // 2. Create a json schema for output, that has both thinking and result, in that order:
        fullSchema = {
            type: 'object' as const,
            properties: {
                thinking: thinkingJsonSchema,
                result: resultJsonSchema,
            },
            required: ['thinking', 'result'],
            additionalProperties: false,
        };
    }
    else {
        fullSchema = isZodLikeSchema(resultSchema) ? zodToJsonSchema(resultSchema as any) : resultSchema.jsonSchema as any;
    }

    // 3. Strip the schema of any value types that are inappropiate for structured outputs.
    const fixedJsonSchemaFirst = createStrippedJsonSchemaForStructuredOutputs(fullSchema);

    // 4. Fix refs within the json schema.
    const fixedJsonSchema = jsonSchemaRefFixer(fixedJsonSchemaFirst);

    return fixedJsonSchema;
}
