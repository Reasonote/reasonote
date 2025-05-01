'use client'
import {
  z,
  ZodTypeAny,
} from "zod";

interface FunctionDefinition {
    description: string;
    parameters: ZodTypeAny;
}

type FunctionDefinitions = {
    [key: string]: FunctionDefinition;
};

type FunctionOutcome<TFunctions extends FunctionDefinitions, TKey extends keyof TFunctions> = {
    name: TKey;
    parameters: z.infer<TFunctions[TKey]['parameters']>;
};

type AllFunctionOutcomes<TFunctions extends FunctionDefinitions> = {
    [K in keyof TFunctions]: FunctionOutcome<TFunctions, K>
}[keyof TFunctions];


type DataResult<TFunctions extends FunctionDefinitions> = {
    content: string | null | undefined;
    functionCall?: AllFunctionOutcomes<TFunctions> | null | undefined;
}