import { z } from 'zod';

import { notEmpty } from '@lukebechtel/lab-ts-utils';
import {
  AllActivityTypeDefinitions,
  FillInTheBlankActivityConfigSchemav0_0_1,
  FlashcardActivityConfigSchema,
  MultipleChoiceActivityConfigSchemav0_0_1,
  RoleplayActivityConfigSchemav0_0_0,
  ShortAnswerActivityConfigSchemav0_0_0,
  SlideActivityConfigSchema,
  TeachTheAIActivityConfigV0_1_0Schema,
  TermMatchingActivityConfigGeneratorSchema,
} from '@reasonote/activity-definitions';
import {
  ActivityConfig,
  ActivityTypesPublicSchema,
} from '@reasonote/core';
import {
  AI_EXPLAINERS,
  aiExplainerFormat,
} from '@reasonote/core-static-prompts';
import {
  AIGenerator,
  DeepPartial,
} from '@reasonote/lib-ai-common';

import {
  recursivelyImproveMarkdownDiagrams,
} from '../../../utils/improveDiagram';
import { ActivityGenerateRequestFullyDefined } from './types';

export interface StreamGenActivitiesArgs {
    ai: AIGenerator,
    req: ActivityGenerateRequestFullyDefined,
    onActivityCreated?: (activity: ActivityConfig) => void,
}

// TODO: Check whether the omission and extension is needed.
export const ActivitySchema = z.union([
    SlideActivityConfigSchema.omit({version: true}).required({type: true}).extend({version: z.literal('0.0.0').nullish().default('0.0.0')}),
    MultipleChoiceActivityConfigSchemav0_0_1.omit({version: true, answerChoiceFollowUps: true}).required({type: true}).extend({version: z.literal('0.0.1').nullish().default('0.0.1')}),
    TermMatchingActivityConfigGeneratorSchema.omit({version: true}).required({type: true}).extend({version: z.literal('0.0.1').nullish().default('0.0.1')}),
    ShortAnswerActivityConfigSchemav0_0_0.omit({version: true}).required({type: true}).extend({version: z.literal('0.0.0').nullish().default('0.0.0')}),
    FillInTheBlankActivityConfigSchemav0_0_1.omit({version: true}).required({type: true}).extend({version: z.literal('0.0.1').nullish().default('0.0.1')}),
    RoleplayActivityConfigSchemav0_0_0.omit({version: true}).required({type: true}).extend({version: z.literal('0.0.0').nullish().default('0.0.0')}),
    TeachTheAIActivityConfigV0_1_0Schema.omit({version: true}).required({type: true}).extend({version: z.literal('0.1.0').nullish().default('0.1.0')}),
    FlashcardActivityConfigSchema.omit({version: true}).required({type: true}).extend({version: z.literal('0.0.1').nullish().default('0.0.1')}),
]);

// export const ActivityPlanSchema = z.object({
//     activities: z.array(z.object({
//         type: ActivityTypesPublicSchema,
//         introduceConcepts: z.array(z.string()).nullish().describe("A list of 1-2 concepts to be introduced in the activity, if any."),
//         expandConcepts: z.array(z.string()).nullish().describe("A list of 1-2 concepts to be expanded on in the activity, if any."),
//         reviewConcepts: z.array(z.string()).nullish().describe("A list of 1-2 concepts to be reviewed in the activity, if any."),
//         description: z.string().describe("A 1-sentence description of the activity that will be created. THIS IS NOT THE FULL DEFINITION OF THE ACTIVITY, JUST A BRIEF."),
//     })).describe("An ordered list of activities to be created."),
// });

// export const ActivityPlanSchema = z.object({
//     conceptsToIntroduceInOrder: z.array(z.string()).describe("A list of concepts to be introduced in the activities."),
// })

const MermaidDiagramConsiderationSchema = z.object({
    isMermaidDiagramAppropriate: z.boolean(),
    reason: z.string(),
    mermaidDiagramNecessityScore: z.number().min(0).max(10),
    suggestedMermaidDiagramType: z.enum(['flowchart', 'sequence', 'class', 'state', 'er', 'gantt', 'pie', 'mindmap']).nullish(),
});

const ConceptPlanSchema = z.object({
    name: z.string(),
    mermaidDiagramConsideration: MermaidDiagramConsiderationSchema,
});

export const ActivityPlanSchema = z.object({
    conceptsToIntroduce: z.array(ConceptPlanSchema).describe("A list of concepts to be introduced in the activities, with Mermaid diagram consideration for each."),
});

async function planActivities({
    ai,
    req,
    sysMessage
}: StreamGenActivitiesArgs & {
    sysMessage: string;
}) {
    return (await ai.genObject({
        // schema: z.object({
        //     activityPlans: ActivityPlanSchema.array().describe("A list of different possible activity plans."),
        // }),
        schema: ActivityPlanSchema,
        messages: [
            {
                role: 'system',
                content: `
                ${sysMessage}

                ------------------------
                <NOTE>
                    YOU ARE IN THE PLANNING PHASE

                    You are *planning* activities for a lesson -- otherwise, all instructions are identical.

                    Each concept should be *introduced* first, then *expanded*, then  *reviewed* in the activities.

                    Each activity you suggest is a SINGLE activity NOT A GROUP -- so be detailed.


                    <MERMAID_DIAGRAMS>
                        For each concept you plan to introduce:
                        1. Consider if a Mermaid diagram would be appropriate and beneficial.
                        2. Provide a reason for your decision.
                        3. Assign a Mermaid diagram necessity score from 0 to 10, where:
                            0 = A Mermaid diagram would be completely unnecessary or inappropriate
                            10 = A Mermaid diagram is crucial for understanding this concept
                        4. If appropriate, suggest a specific Mermaid diagram type (e.g., flowchart, sequence, class, state, er, gantt, pie, mindmap).

                        Remember:
                        - Mermaid diagrams are best suited for representing relationships, processes, hierarchies, and abstract concepts that can be visualized with simple shapes and lines.
                        - Mermaid diagrams are NOT suitable for detailed images, complex visual representations, or concepts that require specific visual elements beyond basic shapes and lines.
                        - Mermaid diagrams are primarily used for flowcharts, sequence diagrams, class diagrams, state diagrams, entity-relationship diagrams, Gantt charts, pie charts, and mindmaps.
                        - For subjects like poetry analysis, literature interpretation, historical narratives, language pronunciation, music appreciation, art criticism, philosophical concepts, creative writing techniques, cultural traditions, or sensory experiences, Mermaid diagrams are rarely, if ever, appropriate.
                    </MERMAID_DIAGRAMS>

                </NOTE>
                `
            },
        ],
    })).object;
}

async function processAndValidateActivity(ai: AIGenerator, activity: any): Promise<ActivityConfig | null> {
    const activityFixed = await recursivelyImproveMarkdownDiagrams(ai, activity);

    const activityParsed = ActivitySchema.safeParse(activityFixed);
    if (!activityParsed.success) {
        console.error('activityParsed found error:', activityParsed.error);
        // TODO: Try to perform a fix on the activity.
        return null;
    }
    
    return activityParsed.data as any;
}

/**
 * 
 * @param param0 
 */
export async function* streamGenActivitiesV1({
    ai,
    req,
    onActivityCreated,
}: StreamGenActivitiesArgs) {

    const {
        specialInstructions,
        subject,
        context,
        numActivities
    } = req;


    const includeExamples = true;


    const StreamActivityOutputSchema = z.object({
        actions: z.union([
            z.object({
                outType: z.literal('outputActivities'),
                activityGroup: ActivitySchema.array().describe('A group of fully-defined activities to show the user.'),
                isLastGroup: z.boolean().describe('Whether this is the last group of activities to show the user.'),
            }),
            z.object({
                outType: z.literal('think'),
                thoughts: z.object({
                    agentScratchpad: z.string().describe('A private scratchpad you can use for chain-of-thought reasoning.'),
                    nextActivityGroupPlan: z.object({
                        activityType: ActivityTypesPublicSchema.describe('The type of activity you will output in the next Activity Group.'),
                        role: z.enum(['intro-question', 'info', 'example', 'diagram', 'eval', 'expand']).describe('The role of the activity in the next Activity Group.'),
                        concepts: z.array(z.string()).describe('The concepts this activity will cover.'),
                        referToInterests: z.array(z.string()).optional().describe('Make these references to the user\'s interests.'),
                    }).describe('A planned activity.').array().describe('The types of activities you will output in the next Activity Group. Use this to plan the next activity group.'),
                })
            }),
            z.object({
                outType: z.literal('done'),
            })
        ]).array().describe('Actions you should take in order -- ALWAYS THINK BEFORE ACTING')
    })
    type StreamActivityOutput = z.infer<typeof StreamActivityOutputSchema>;

    const criticalMessage = `
        <CRITICAL>
            ${numActivities ? `<GENERATE_EXACTLY_${numActivities}_ACTIVITIES>
                You should generate exactly ${numActivities} activities.
            </GENERATE_EXACTLY_${numActivities}_ACTIVITIES>` : ''}
            <FOLLOW_SPECIAL_INSTRUCTIONS>
                If special instructions are given, they should be followed even if they contradict the other instructions.
            </FOLLOW_SPECIAL_INSTRUCTIONS>
            <INTEREST_REFERENCES>
                WHENEVER APPROPRIATE -- make references to the user's interests. This is *critical* to ensure they are engaged and interested in the subject.

                This DOES NOT mean that the entire activity should be based on the user's interests, but that the activity content should make references to the user's interests.

                For instance, if the user is interested in FOO, you don't need to make *the whole lesson* about FOO, but you can use *references* to FOO as a portion of the activities.

                Use the 'referToInterests' field to make references to the user's interests.
            </INTEREST_REFERENCES>
            
            <INTRODUCE_CONCEPTS_IN_ORDER>
                You should ALWAYS introduce each term you're using before expanding on it, or asking questions about it.

                This is CRITICAL so that students don't feel lost.

                    Follow these guidelines:
                    1. Before introducing a new concept, list all prerequisite concepts it depends on.
                    2. Ensure all prerequisite concepts have been introduced and explained earlier in the lesson.
                    3. If a prerequisite concept hasn't been covered, introduce it first before proceeding.
                    4. Maintain a logical progression from basic to more advanced concepts.
                    5. Use a "concept map" to visualize and plan the relationships between concepts.
                    6. Regularly review previously introduced concepts to reinforce understanding.
                    7. When referencing a concept, briefly recap its key points if it hasn't been mentioned recently.

            </INTRODUCE_CONCEPTS_IN_ORDER>

            <INTRODUCE_CONCEPTS_GRADUALLY>
                You should ALWAYS introduce each concept over 4-5 informational activities before moving on to any sort of evaluation.

                Some concepts require 5-10 slides to introduce -- and that's okay.

                This is CRITICAL so that students don't feel overwhelmed.
            </INTRODUCE_CONCEPTS_GRADUALLY>
                

            <DIVERSE_ACTIVITY_TYPES>
                Utilize the following core activity types:
                1. Informational Activities (e.g., slide, flashcard)
                2. Question-Based Activities (e.g., multiple-choice, short-answer, fill-in-the-blank)
                3. AI Roleplay Activities (e.g., teach-the-ai, roleplay)

                When creating activities, use these core types to address a wide range of learning objectives and styles, such as:
                a) Analytical thinking (e.g., case studies, data interpretation, image analysis)
                b) Visual and interactive learning (e.g., interactive diagrams, timelines, concept maps)
                c) Problem-solving (e.g., scenarios, troubleshooting exercises, ethical dilemmas)
                d) Application and demonstration (e.g., examples, live demos, virtual labs)
                e) Reflection and metacognition (e.g., personal reflection, prediction/outcome comparisons)

                For example:
                - Use a slide (Informational Activity) to present a case study (Analytical thinking)
                - Create a multiple-choice question (Question-Based Activity) about interpreting a diagram (Visual and interactive learning)
                - Design a roleplay scenario (AI Roleplay Activity) to explore an ethical dilemma (Problem-solving)

                Aim to include activities that cover at least 4 different learning objectives or styles in each lesson sequence, while using a mix of the core activity types.
            </DIVERSE_ACTIVITY_TYPES>

            <DIAGRAMS>
                <DIAGRAM_PRIORITY>
                    Prioritize creating Mermaid diagrams for concepts that benefit from visual representation.
                    If a concept can be explained more clearly with a visual representation, create a diagram.
                </DIAGRAM_PRIORITY>

                <SUBJECT_SPECIFIC_DIAGRAMS>
                    For different subjects, consider these diagram types:
                    - Computer Science: flowcharts, class diagrams, state diagrams
                    - Biology: process diagrams, hierarchical structures
                    - Physics: force diagrams, circuit diagrams
                    - Chemistry: molecular structures, reaction processes
                    - Mathematics: graphs, geometric shapes
                    - Business: organizational charts, process flows
                </SUBJECT_SPECIFIC_DIAGRAMS>

                <DIAGRAM_TEMPLATE>
                    When including a diagram, use this template:
                    \`\`\`markdown
                    Here's a diagram illustrating [concept]:

                    \`\`\`mermaid
                    [Your Mermaid.js code here]
                    \`\`\`

                    [Explanation of the diagram]
                    \`\`\`
                </DIAGRAM_TEMPLATE>
            </DIAGRAMS>

            
            <ALWAYS_THINK_BEFORE_ACTING>
                You must ALWAYS think before acting.

                Because you are an LLM, this helps you make better decisions.

                ${includeExamples ? `<EXAMPLE>
                    <EXAMPLE_INPUT>
                        <SUBJECT>
                            <SKILL>
                                <NAME>
                                    ${subject.skills?.[0]?.name}
                                </NAME>
                            </SKILL>
                        </SUBJECT> 
                        <CONTEXT>
                            <USER>
                                - Interested in COOL_INTEREST
                                - Interested in ANOTHER_INTEREST
                            </USER>
                        </CONTEXT>
                    </EXAMPLE_INPUT>

                    <EXAMPLE_OUTPUT>
                        {
                            actions: [
                                {
                                    outType: 'think',
                                    thoughts: {
                                        agentScratchpad: 'I should start out by introducing X, by showing several slides that build on each other. Then, I should ask a question about X to evaluate the user's understanding.',
                                        nextActivityGroupPlan: [
                                            {
                                                activityType: 'slide',
                                                role: 'info',
                                                concepts: ['X'],
                                                referToInterests: ['COOL_INTEREST'],
                                            },
                                            {
                                                activityType: 'slide',
                                                role: 'example',
                                                concepts: ['X'],
                                                referToInterests: ['ANOTHER_INTEREST']
                                            },
                                            {
                                                activityType: 'slide',
                                                role: 'info',
                                                concepts: ['X', 'Detail About X'],
                                            },
                                            {
                                                activityType: 'slide',
                                                role: 'info',
                                                concepts: ['X', 'X: Common Misconceptions'],
                                            },
                                            {
                                                activityType: 'slide',
                                                role: 'diagram',
                                                concepts: ['X'],
                                            },
                                            {
                                                activityType: 'multiple-choice',
                                                role: 'eval',
                                                concepts: ['X'],
                                            },
                                            {
                                                activityType: 'term-matching',
                                                role: 'eval',
                                                concepts: ['X'],
                                            }
                                        ]
                                    }
                                },
                                {
                                    outType: 'outputActivities',
                                    activityGroup: [
                                        {
                                            type: 'slide',
                                            titleEmoji: '[SLIDE-APPROPRIATE-EMOJI]',
                                            title: 'X',
                                            markdownContent: 'X is ...  [REFERENCE TO COOL_INTEREST]'
                                        },
                                        {
                                            type: 'slide',
                                            titleEmoji: '[SLIDE-APPROPRIATE-EMOJI]',
                                            title: 'X: example',
                                            markdownContent: '[EXAMPLE OF X, REFERENCING ANOTHER_INTEREST]'
                                        },
                                        {
                                            type: 'slide',
                                            titleEmoji: '[SLIDE-APPROPRIATE-EMOJI]',
                                            title: 'X: More Info',
                                            markdownContent: '[DETAIL ABOUT PARTICULAR PROPERTY OF X, using LaTeX $$...$$ wrappers when appropriate]'
                                        },
                                        {
                                            type: 'slide',
                                            titleEmoji: '[SLIDE-APPROPRIATE-EMOJI]',
                                            title: 'X: Common Misconceptions',
                                            markdownContent: '[DETAIL ABOUT SOMETHING COUNTERINTUITIVE ABOUT X]'
                                        },
                                        {
                                            type: 'slide',
                                            titleEmoji: '⚛️',
                                            title: 'X: diagram',
                                            markdownContent: '[INTRO TEXT]\n[MERMAID DIAGRAM OF X]\n[FOOTER TEXT]'
                                        },
                                        {
                                            type: 'flashcard',
                                            ...
                                        },
                                        {
                                            type: 'multiple-choice',
                                            ...
                                        },
                                        {
                                            type: 'term-matching',
                                            ...
                                        }
                                    ],
                                    isLastGroup: false
                                },
                                {
                                    outType: 'think',
                                    thoughts: {
                                        agentScratchpad: 'Now that I've introduced X, Y and Z should probably come next.',
                                        nextActivityGroupPlan: [
                                            {
                                                activityType: 'slide',
                                                role: 'intro-question',
                                                concepts: ['X', 'Y'],
                                            },
                                            {
                                                activityType: 'slide',
                                                role: 'info',
                                                concepts: ['Y', 'Z'],
                                            },
                                            {
                                                activityType: 'slide',
                                                role: 'example',
                                                concepts: ['Y'],
                                                referToInterests: ['ANOTHER_INTEREST']
                                            }
                                        ]
                                    }
                                },
                                {
                                    outType: 'outputActivities',
                                    activityGroup: [
                                        {
                                            type: 'slide',
                                            titleEmoji: '[SLIDE-APPROPRIATE-EMOJI]',
                                            title: 'Why does [DETAIL ABOUT PARTICULAR PROPERTY OF X]?',
                                            markdownContent: '[DETAILS OF PROVOCATIVE QUESTION ROOTED IN X]'
                                        },
                                        {
                                            type: 'slide',
                                            titleEmoji: '[SLIDE-APPROPRIATE-EMOJI]',
                                            title: 'Y & Z',
                                            markdownContent: 'Well -- it turns out that [INTRO TO Y, WITH REFERENCES TO X]'
                                        },
                                        {
                                            type: 'slide',
                                            titleEmoji: '[SLIDE-APPROPRIATE-EMOJI]',
                                            title: 'Y: example',
                                            markdownContent: '[EXAMPLE OF Y]'
                                        },
                                        {
                                            type: 'short-answer',
                                            ...
                                        },
                                        {
                                            type: 'term-matching',
                                            ...
                                        }
                                    ],
                                    isLastGroup: true
                                },
                                {
                                    outType: 'done',
                                }
                            ]
                        }
                    </EXAMPLE_OUTPUT>
                </EXAMPLE>` : ''}
            </ALWAYS_THINK_BEFORE_ACTING>
            <ALWAYS_END_WITH_A_THOUGHT>
                You must ALWAYS end with a 'done' output.

                This tells us when you're complete.
            </ALWAYS_END_WITH_A_THOUGHT>
            <MARKDOWN_FORMATTING>
                Whenever you encounter a text field, assume it is markdown.

                <LATEX_FORMATTING>
                - REMEMBER: You can use markdown to format the slide.
                - REMEMBER: LaTeX must be wrapped in $$...$$, and you must use DOUBLE BACKSLASHES \`\\\\\` to render in LaTeX.
                - REMEMBER: If you do not wrap your LaTeX in $$...$$, IT WILL NOT RENDER.
                </LATEX_FORMATTING>

                <MD_MERMAID_DIAGRAMS>
                    In any markdown field, you can use Mermaid.js to create diagrams.
                    
                    This is particularly helpful in the following situations:

                    1. Explaining Processes: Use flowcharts to visualize step-by-step procedures, algorithms, or decision-making processes.

                    2. Showing Relationships: Employ class diagrams or entity-relationship diagrams to illustrate connections between different concepts or database structures.

                    3. Depicting Timelines: Utilize Gantt charts or timeline diagrams to represent project schedules, historical events, or any time-based information.

                    4. Illustrating System Interactions: Create sequence diagrams to show how different parts of a system interact over time.

                    5. Representing Data: Use pie charts to display proportional data or statistics.

                    6. Mapping Concepts: Employ mindmaps to brainstorm ideas or show hierarchical relationships between topics.

                    7. Visualizing Code Structures: Use class diagrams to explain object-oriented programming concepts or system architectures.

                    8. Demonstrating State Changes: Implement state diagrams to show how a system or object changes states based on different conditions.

                    9. Explaining User Flows: Create user journey diagrams to illustrate how users interact with a product or service.

                    10. Showing Data Flow: Use Sankey diagrams to visualize the flow of data, energy, or resources in a system.

                    When creating diagrams:
                    - Keep them simple and focused on the key information.
                    - Use clear labels and annotations to explain diagram elements.
                    - Ensure the diagram type matches the content you're trying to convey.
                    - Consider the complexity of the diagram in relation to the learner's level of understanding.

                    Remember, while Mermaid.js is versatile, it's best suited for diagrams that can be represented with simple shapes, lines, and text. For more complex or specialized diagrams (like molecular structures or detailed anatomical drawings), you may need to suggest using other tools or formats.

                    To include a Mermaid diagram in a slide, use the following format:

                    \`\`\`markdown
                    Here's a diagram explaining [concept]:

                    \`\`\`mermaid
                    [Your Mermaid.js code here]
                    \`\`\`

                    [Additional explanation or questions about the diagram]
                    \`\`\`

                    By integrating diagrams effectively, you can enhance understanding, provide visual aids for complex concepts, and create more engaging and informative slides.
                </MD_MERMAID_DIAGRAMS>
            </MARKDOWN_FORMATTING>
        </CRITICAL> 
    `

    //@ts-ignore
    const activityTypeInstructions = AllActivityTypeDefinitions.map((activityType) => {
        return activityType.aigenPrompts?.instructions ? {
            type: activityType.type,
            instructions: activityType.aigenPrompts.instructions,
        } : null;
    }).filter(notEmpty)

    const lesson = subject.lesson;

    
    const sysMessage = `
        <YOUR_ROLE>
            You are an expert at generating highly-engaging activities to help the user learn.
            You will be given a list of activity types and a context, and you will generate a list of activities to show the user in sequence.

            You will do this by taking a list of actions.
            1. think: Produce a private thought you can use for chain-of-thought reasoning.
            1. outputActivities: Produce a list of activities to show the user.
            3. done: ALWAYS do this when you're done.

            NOTE: if you are given special instructions, you must follow them even if they contradict the other instructions.
            
            ${criticalMessage}
        </YOUR_ROLE>

        <ACTIVITY_SPECIFIC_INSTRUCTIONS>
            ${activityTypeInstructions.map(activityType => `
                <${activityType.type}>
                    <INSTRUCTIONS>
                        ${activityType.instructions}
                    </INSTRUCTIONS>
                </${activityType.type}>
            `).join('\n\n')}
        </ACTIVITY_SPECIFIC_INSTRUCTIONS>

        
        ${specialInstructions ? `<SPECIAL_INSTRUCTIONS>
            ${specialInstructions}
        </SPECIAL_INSTRUCTIONS>
        ` : ''}

        <SUBJECT>
            ${lesson ? `
                <LESSON description="The lesson to generate activities for.">
                    <NAME>
                        ${lesson.basic.name}
                    </NAME>
                    <DESCRIPTION>
                        ${lesson.basic.summary}
                    </DESCRIPTION>
                    <EXISTING_ACTIVITIES>
                        ${lesson.activities?.map(activity => `
                            <ACTIVITY>
                                <TYPE>
                                    ${activity.type}
                                </TYPE>
                                <CONFIG>
                                    ${JSON.stringify(activity.config, null, 2)}
                                </CONFIG>
                            </ACTIVITY>
                        `).join('\n') ?? ''}
                    </EXISTING_ACTIVITIES>
                </LESSON>
            ` : ''}
            <MAIN_SKILL>
                <NAME>
                    ${subject.skills?.[0]?.name}
                </NAME>
            </MAIN_SKILL>
            <OTHER_SKILLS>
                ${subject.skills?.slice(1).map(skill => `
                    <SKILL>
                        <NAME>
                            ${skill.name}
                        </NAME>
                    </SKILL>
                `).join('\n')}
            </OTHER_SKILLS>
        </SUBJECT>
        
        <CONTEXT>
            ${context.user ? aiExplainerFormat(AI_EXPLAINERS.USER_PROFILE(context.user)) : null}
        </CONTEXT>

        ${criticalMessage}
    `

    // console.log(sysMessage);

    // First, make plan
    const activityPlan = await planActivities({ai, req, sysMessage});

    // console.log(JSON.stringify({activityPlan}, null, 2));


    const streamResult = (await ai.streamGenObject({
        model: 'openai:gpt-4o-mini',
        mode: 'json',
        schema: StreamActivityOutputSchema,
        messages: [
            {
                role: 'system',
                content: sysMessage
            },
            {
                role: 'assistant',
                content: `
                <ACTIVITY_PLAN>
                    ${JSON.stringify(activityPlan, null, 2)}
                </ACTIVITY_PLAN>
                `
            }
        ],
    }));
    
    const finishedActions: any[] = [];
    const finishedActivities: any[] = [];
    var partialObject: DeepPartial<StreamActivityOutput> | null = null;
    for await (partialObject of streamResult.partialObjectStream) {
        const nonLastOutputs = partialObject?.actions?.slice(0, -1) ?? [];

        // Handle output checking
        for (const output of nonLastOutputs) {
            // First, check if we've already registered this output. If so, skip it.
            if (finishedActions.map(o => JSON.stringify(o)).includes(JSON.stringify(output))) {
                continue;
            }
            
            finishedActions.push(output);
        }

        const allActivities = partialObject?.actions?.filter(notEmpty).map((o) => o.outType === 'outputActivities' ? o.activityGroup: null).flat().filter(notEmpty) ?? []

        // Now get non-last activity and check in a similar way.
        const nonLastActivities = allActivities.slice(0, -1);

        for (const activity of nonLastActivities) {
            if (finishedActivities.map(a => JSON.stringify(a)).includes(JSON.stringify(activity))) {
                continue;
            }
            // First, mark that the activity is done.
            // We must do this even if the process / validate fails.
            // NOTE: it may be edited still, but the initial activity is done.
            finishedActivities.push(activity);

            const activityFinal = await processAndValidateActivity(ai, activity);
            if (activityFinal) {
                yield activityFinal;
            }
        }
    }

    const allActivities = partialObject?.actions?.filter(notEmpty).map((o) => o.outType === 'outputActivities' ? o.activityGroup: null).flat().filter(notEmpty) ?? [];

    // Get the last activity, we need to check if it is an activity and yield its activities.
    const lastActivity = allActivities[allActivities.length - 1];
    if (lastActivity) {
        const lastActivityFinal = await processAndValidateActivity(ai, lastActivity);
        if (lastActivityFinal) {
            yield lastActivityFinal;
        }
    }
}
