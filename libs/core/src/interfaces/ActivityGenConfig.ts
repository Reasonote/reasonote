import { z } from "zod";

import { ActivityGenerateRequest } from "./ActivityGenerate";

export interface ActivityGenExampleOutput { 
    /**
     * The name of the output.
     */
    name?: string,
    /**
     * The output for the activity.
     */
    output: any,
}

export interface ActivityGenExample {
    /**
     * The name of the example.
     */
    name?: string,

    /**
     * The input for the activity.
     */
    input: string,

    /**
     * The output for the activity.
     */
    outputs: {
        /**
         * The name of the output.
         */
        name?: string,

        /**
         * The quality of the output.
         */
        quality: 'good' | 'bad',

        /**
         * The output for the activity.
         */
        output: any,

        /**
         * The explanation for the output.
         */
        explanation?: string
    }[]
}


export interface ActivityGenConfig {
    /**
     * The schema the defines the structure of the activity config for generation.
     * 
     * This is the most up-to-date version of the schema, and should include the type of the activity config as well.
     */
    schema: z.ZodObject<any, any, any>;

    /**
     * A short description of the activity type.
     * 
     * This is used to help the AI understand the activity type and generate activities accordingly.
     */
    shortDescription: string;

    /**
     * Good situations to use this activity type.
     * 
     * This is used to help the AI understand the activity type and generate activities accordingly.
     */
    whenToUse: string[];

    /**
     * Bad situations to use this activity type.
     * 
     * This is used to help the AI understand the activity type and generate activities accordingly.
     */
    whenToAvoid: string[];

    /**
     * If provided, this will be used to generate the header for the activity.
     * @param args 
     * @returns 
     */
    headerGenerator?: (args: ActivityGenerateRequest) => Promise<string>;

    /**
     * Primary instructions for generating this type of Activity.
     * 
     */
    primaryInstructions: (args: ActivityGenerateRequest) => Promise<string>;


    /**
     * Final instructions for generating this type of Activity.
     * 
     * This is inserted later in the context, and can be used to provide reminders, etc.
     */
    finalInstructions?: (args: ActivityGenerateRequest) => Promise<string>;

    taskSpecificHeader?: string;
    /**
     * Examples of good and bad activities of this type.
     * 
     * This is used to help the AI understand the activity type and generate activities accordingly.
     */
    examples?: ActivityGenExample[];

    /**
     * Final notes for generating this type of Activity.
     * 
     * This is used to help the AI understand the activity type and generate activities accordingly.
     */
    finalNotes?: string[] | string;
}