
import {z} from "zod";
import { OneShotAIArgs, OneShotAIResponse } from "./OneShotAI";

export interface AIDriver {
    oneShotAI<T extends z.ZodTypeAny>(args: OneShotAIArgs<T>): Promise<OneShotAIResponse<T>>;
}