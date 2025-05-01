import { z } from 'zod';

export const ActivityStubSchema = z.object({
    id: z.string().describe('The id of the activity stub'),
    subject: z.string().describe('The subject of the activity'),
    type: z.string().describe('The type of the activity.'),
    specifics: z.string().optional().describe("Specific details about the activity which should be created"),
    dependencies: z.array(z.object({
        type: z.enum(['evaluates', 'expandsOn']).describe("Does this activity evaluate the referenced activity, or expand on it?"),
        stubSubject: z.string().describe("The name of the activity stub this activity should expand on"),
    }))
        .optional()
        .describe("What other activities this activity depends on. These connections will be used to create a DAG for ordered contextual generation."),
    bloomTaxonomyLevel: z.enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']).optional(),
    metadata: z.object({
        activityId: z.string().optional().describe('The id of the activity'),
    }).passthrough().optional()
}).passthrough().describe('An abstract description of an activity.')
export type ActivityStub = z.infer<typeof ActivityStubSchema>