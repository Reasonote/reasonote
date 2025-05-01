import { z } from "zod";

export interface ReasoningConfig {
    /**
     * Whether to enable reasoning.
     */
    enabled: boolean;
    
    /**
     * The structure of the reasoning.
     */
    structure: z.ZodObject<any> | any;
}