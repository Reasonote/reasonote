import { jsonSchema } from 'ai';
import { z } from 'zod';

import {
  notEmpty,
  prefixAllLines,
  trimAllLines,
  trimLines,
  typedUuidV4,
} from '@lukebechtel/lab-ts-utils';
import { AIGenerator } from '@reasonote/lib-ai-common';

import { AIExtraContext } from '../../../utils/AIExtraContext';
import {
  JGFSimple,
  JGFSimpleSchema,
} from '../../../utils/jgf';
import {
  PrereqSkillTreeSchema,
  prereqSkillTreeToSkillTree,
  skillTreeToPrereqSkillTree,
} from '../../../utils/prereqSkillTree';
import {
  InitializeSkillTreeAIOutput,
  InitializeSkillTreeAIOutputJsonSchema,
  SkillTreeLevelSchema,
  SkillTreeNode,
} from '../interfaces';
import { giveFeedbackOnSkillTree } from './feedback/giveFeedbackOnSkillTree';

function SkillTreeRequirementsPrompt() {
    return `
        <REQUIREMENTS>
            <SKILL_TREE_BASICS>
                The skill tree is intended to be used in a DAG-based spaced-repetition system.

                As such, all skills are formatted as learning objectives.
                
                This is ensured by the fact that skills other than the root skill must start with the word "Can".

                Furthermore, the skills near the "top" of the tree should be more abstract, and the skills near the "bottom" of the tree should be more specific.
            </SKILL_TREE_BASICS>

            <LEARNING_OBJECTIVES>
                Skill Names (except the root) must ALWAYS be learning objectives, and must ALWAYS start with the word "Can".
            </LEARNING_OBJECTIVES>

            <SKILL_LEVELS>   
                For each skill that you create subskills for, you should ensure you label the skills as the correct level based on the DIRECT parent.
            </SKILL_LEVELS>

            <SKILL_DIVERSITY>
                When you create subskills, you should try to diversify them in skill level -- i.e. you should generate some INTRO, some BASIC, some INTERMEDIATE, some ADVANCED, and some MASTER.
            
                For instance, if the subject is "Calculus" then you should span everything from "Can do basic algebra" to "Lebesgue Integrals".

                If the subject is "Programming", then you should span everything from "Can write a for loop" to "Can implement a search algorithm".
            </SKILL_DIVERSITY>
        </REQUIREMENTS>
    `
}

function SkillTreeOutputFormatPrompt() {
    return `
        <OUTPUT_FORMAT>
            You can output the subskills in the following format:
            \`\`\`
            {
                name: "Parent Skill Name",
                subskills: {
                    INTRO: [
                        {
                            name: "Can do This Intro-Level Child Thing",
                            subskills: {
                                INTRO: [
                                    {
                                        name: "Can do this Intro-Level Grandchild thing",
                                    },
                                    {
                                        name: "Can do this Intro-Level other Grandchild thing",
                                    },
                                ]
                                BASIC: [{
                                    name: "Can do this Basic thing",
                                }]
                            }
                        },
                        {
                            name: "Can do This Other Basic-Level Child Thing 2",
                            subskills: {
                                BASIC: [{
                                    name: "Can do this Basic thing 2",
                                }]
                            }
                        }
                    ]
                    ...
                    MASTER: [{
                        name: "Can do this Master thing",
                        subskills: [
                            ...
                        ]
                    }]
                }
            }
            \`\`\`
        </OUTPUT_FORMAT> 
    `
}
export interface AIGenSkillTreeCreateArgs {
    // No args needed.
}

export interface AIGenSkillTreeAddSkillsArgs {
    skillsToAdd?: { name: string }[];
    relevantDocuments?: { name: string; content: string }[];
    sourceActivities?: string;
    feedback?: string;
}

interface AIGenSkillTreeFromSkillTreeNodeArgs {
    ai: AIGenerator;
    skillTree: SkillTreeNode;
    relevantDocuments?: { name: string; content: string }[];
    sourceActivities?: string;
    parentSkillNames?: string[];
}

interface AIGenSkillTreeConstructorArgs {
    ai: AIGenerator;
    skillTree: SkillTreeNode;
    relevantDocuments?: { name: string; content: string }[];
    sourceActivities?: string;
    parentSkillNames?: string[];
}

export interface AIGenSkillTreeInitializeTreeArgs {
    ai: AIGenerator;
}

// A skill tree.
export class AIGenSkillTree {
    private ai: AIGenerator;
    private rootSkill: SkillTreeNode;
    private relevantDocuments?: { name: string; content: string }[];
    private sourceActivities?: string;
    private parentSkillNames?: string[];


    private constructor(args: AIGenSkillTreeConstructorArgs) {
        this.ai = args.ai;
        this.rootSkill = args.skillTree;
        this.relevantDocuments = args.relevantDocuments;
        this.sourceActivities = args.sourceActivities;
        this.parentSkillNames = args.parentSkillNames;
    }

    updateRootSkill(skillTree: SkillTreeNode) {
        this.rootSkill = skillTree;
    }

    clone(overrides: Partial<AIGenSkillTreeConstructorArgs>) {
        return new AIGenSkillTree({
            ai: overrides.ai ?? this.ai,
            skillTree: overrides.skillTree ?? this.rootSkill,
            relevantDocuments: overrides.relevantDocuments ?? this.relevantDocuments,
            sourceActivities: overrides.sourceActivities ?? this.sourceActivities,
            parentSkillNames: overrides.parentSkillNames ?? this.parentSkillNames,
        });
    }

    static fromSkillTreeNode(args: AIGenSkillTreeFromSkillTreeNodeArgs) {
        return new AIGenSkillTree({ ai: args.ai, skillTree: args.skillTree });
    }

    get hasExistingSkillTree(): boolean {
        return this.rootSkill.subskills !== null;
    }

    async aiGetFeedback({ treeVisualizationMode }: { treeVisualizationMode?: 'prereqTree' | 'skillTree' } = {}) {
        if (!this.hasExistingSkillTree) {
            return null;
        }

        const feedback = await giveFeedbackOnSkillTree({
            ai: this.ai,
            rootSkill: this.rootSkill,
            treeVisualizationMode,
        });

        return feedback;
    }

    /**
     * Creates the initial skill tree. Allows choosing between v1 (direct skill tree) and v2 (prerequisite-based) approaches.
     */
    async aiInitializeTree({
        shouldGiveFeedback = true,
        feedback,
        doPreStages = [],
        version = 'v1'
    }: {
        shouldGiveFeedback?: boolean,
        feedback?: string,
        version?: 'v1' | 'v2' | 'jgf',
        doPreStages?: ('aiGenerateExpertJourneyMap' | 'aiGenerateCompetencyFramework' | 'aiGenerateProblemCenteredApproach')[]
    } = {}): Promise<AIGenSkillTree> {
        return this.ai.observe({ name: 'aiInitializeTree', sessionId: typedUuidV4('aiInitializeTree') }, async () => {
            // Run all pre-stages in parallel
            const extraContext: AIExtraContext[] = (await Promise.all([
                doPreStages.includes('aiGenerateExpertJourneyMap') ?
                    new AIExtraContext({
                        title: 'ExpertJourneyMap',
                        description: 'An imagined expert journey map for this skill -- a mapping of the journey of an expert in learning this skill.',
                        body: JSON.stringify(await this.aiGenerateExpertJourneyMap(), null, 2),
                    }) : null,
                doPreStages.includes('aiGenerateCompetencyFramework') ?
                    new AIExtraContext({
                        title: 'CompetencyFramework',
                        description: 'A competency framework for this skill, comparing and contrasting properties of a beginner vs an expert.',
                        body: JSON.stringify(await this.aiGenerateCompetencyFramework(), null, 2),
                    }) : null,
                doPreStages.includes('aiGenerateProblemCenteredApproach') ?
                    new AIExtraContext({
                        title: 'ProblemCenteredApproach',
                        description: 'A problem-centered analysis approach to the skill. This is a list of problems that someone would need to solve in order to master the skill.',
                        body: JSON.stringify(await this.aiGenerateProblemCenteredApproach(), null, 2),
                    }) : null,
            ])).filter(notEmpty)

            if (version === 'v1') {
                return this.aiInitializeTreeV1({ shouldGiveFeedback, feedback, extraContext });
            } else if (version === 'v2') {
                return this.aiInitializeTreeV2({ shouldGiveFeedback, feedback, extraContext });
            } else if (version === 'jgf') {
                return this.aiInitializeTreeJGF({ shouldGiveFeedback, feedback, extraContext });
            }

            throw new Error(`Unknown version: ${version}`);
        });
    }

    async getLearningObjectives({
        extraContext,
        maxIterations = 1,
        existingObjectives = [],
        temperature = 1,
        numThreads = 1,
        targetNumberObjectives,
    }: {
        extraContext?: AIExtraContext[],
        maxIterations?: number,
        existingObjectives?: string[],
        temperature?: number,
        numThreads?: number,
        targetNumberObjectives?: number,
    } = {}): Promise<{ learningObjectives: string[] }> {
        return this.ai.observe({ name: 'getLearningObjectives' }, async () => {
            let allObjectives = new Set(existingObjectives);
            let totalIterations = 0;
            let isComplete = false;

            // Create a function for a single thread's work
            const threadWork = async () => {
                let threadIterations = 0;

                while (!isComplete && threadIterations < maxIterations) {
                    const parentContextString = this.parentSkillNames?.length ?
                        `In the context of: ${this.parentSkillNames.join(',')}` : '';

                    const aiResult = await this.ai.genObject({
                        prompt: trimAllLines(`
                            <YOUR_TASK>
                            Output learning objectives for the skill "${this.rootSkill.name}" ${parentContextString}.
                            ${allObjectives.size > 0 ? `
                                <EXISTING_OBJECTIVES>
                                These objectives have already been identified:
                                ${Array.from(allObjectives).map(obj => `- ${obj}`).join('\n')}
                                </EXISTING_OBJECTIVES>
                            ` : ''}
                            ${targetNumberObjectives ? `
                                <TARGET>
                                We are aiming for ${targetNumberObjectives} total objectives.
                                Current count: ${allObjectives.size}
                                Remaining: ${Math.max(0, targetNumberObjectives - allObjectives.size)}
                                </TARGET>
                            ` : ''}
                            </YOUR_TASK>

                            <REQUIREMENTS>
                                - Learning objectives should be measurable, and *must* begin with the word "Can" (i.e. "Can write a for loop" or "Can debug a program")
                                - Do not repeat any existing objectives
                                - If you can't think of any more meaningful objectives, return type: "list-complete"
                                - Otherwise, return type: "add-to-list" with new objectives
                                ${targetNumberObjectives ? `- If we've reached or exceeded ${targetNumberObjectives} objectives, return type: "list-complete"` : ''}
                            </REQUIREMENTS>

                            <CONTEXT description="Context and Pre-Work you should use to complete your task.">
                                ${this.defaultContextSectionBody()}

                                ${extraContext?.length ? `
                                    ${extraContext.map((context) => context.toPrompt()).join('\n')}
                                ` : ''}
                            </CONTEXT>

                            ${SkillTreeRequirementsPrompt()}
                        `),
                        schema: z.object({
                            result: z.union([
                                z.object({
                                    type: z.literal('list-complete')
                                }),
                                z.object({
                                    type: z.literal('add-to-list'),
                                    learningObjectives: z.array(z.string())
                                })
                            ])
                        }),
                        model: 'openai:gpt-4o-mini-2024-07-18',
                        mode: 'json',
                        temperature,
                        providerArgs: {
                            structuredOutputs: true,
                        }
                    });

                    if (aiResult.object.result.type === 'list-complete') {
                        isComplete = true;
                        break;
                    }

                    // Add new objectives to our set
                    aiResult.object.result.learningObjectives.forEach(obj => allObjectives.add(obj));
                    threadIterations++;
                    totalIterations++;

                    // Check if we've reached target number of objectives
                    if (targetNumberObjectives && allObjectives.size >= targetNumberObjectives) {
                        isComplete = true;
                        break;
                    }
                }
            };

            // Run all threads in parallel
            await Promise.all(
                Array(numThreads).fill(null).map(() => threadWork())
            );

            return {
                learningObjectives: Array.from(allObjectives)
            };
        });
    }

    /**
     * Original version that directly generates a skill tree structure
     */
    private async aiInitializeTreeV1({ shouldGiveFeedback = true, feedback, extraContext }: { shouldGiveFeedback?: boolean, feedback?: string, extraContext?: AIExtraContext[] } = {}): Promise<AIGenSkillTree> {
        const parentContextString = this.parentSkillNames?.length ? `In the context of: ${this.parentSkillNames.join(',')}` : '';

        const prompt = trimAllLines(`
            <YOUR_ROLE>
                You are very good at breaking concepts down into smaller pieces.

                ${feedback ? `
                    <FEEDBACK description="You have been given feedback on the skill tree.">
                        ${feedback}
                    </FEEDBACK>
                ` : ''}
            </YOUR_ROLE>

            <YOUR_TASK>
                You are going to break down the skill "${this.rootSkill.name}" ${parentContextString} into smaller learning objectives.

                ${SkillTreeRequirementsPrompt()}
            </YOUR_TASK>

            <EXISTING_TREE description="The existing tree, if it exists.">
                ${this.hasExistingSkillTree ? `
                        ${this.toAiString()}
                    ` : ''
            }
            </EXISTING_TREE>
            
            <CONTEXT>
            ${this.relevantDocuments?.length ? `
                Several Relevant documents to the skill have been provided as context, which define what the skill covers.
            ` : ''}

            ${this.sourceActivities?.length ? `
                <CONTEXT_ACTIVITIES description="Several activities that are relevant to the skill. The skill tree created should include places for ALL of these activities.">
                ${this.sourceActivities}
                </CONTEXT_ACTIVITIES>
            ` : ''}
            ${extraContext?.length ? `
                ${extraContext.map((context) => context.toPrompt()).join('\n')}
            ` : ''}
            </CONTEXT>

            ${SkillTreeOutputFormatPrompt()}

            ${this.relevantDocuments?.length ? `
                <RELEVANT_DOCUMENTS description="Several documents that are relevant to the skill. The skill tree should reflect the content of these documents.">
                    ${this.relevantDocuments?.map((doc) => `
                        ### ${doc.name}
                        ${doc.content}
                    `).join('\n')}
                </RELEVANT_DOCUMENTS>
            ` : ''}

            <FINAL_NOTES>
                - You should try to create subskills that are at different levels.
                - You MUST add the skills that need placing.
                - Remember, IF (and ONLY IF) the tree is already complete, you can say "TREE_IS_DONE" to finish the tree.
            </FINAL_NOTES>
        `)

        const aiResult = await this.ai.genObject<InitializeSkillTreeAIOutput>({
            prompt,
            messages: [
                {
                    role: 'user',
                    content: `
                        Please ensure you nest at least 3 levels deep.
                    `
                }
            ],
            schema: jsonSchema(InitializeSkillTreeAIOutputJsonSchema),
            model: 'openai:gpt-4o-mini-2024-07-18',
            mode: 'json',
            providerArgs: {
                structuredOutputs: true,
            }
        });

        const initialResult = aiResult.object;

        if (!initialResult.rootSkill) {
            return this;
        }

        // If feedback is disabled, set our root skill andreturn the result.
        if (!shouldGiveFeedback) {
            this.updateRootSkill(initialResult.rootSkill);
            return this;
        }

        this.updateRootSkill(initialResult.rootSkill);

        const secondaryResult = await this.ai.genObject<InitializeSkillTreeAIOutput>({
            prompt,
            messages: [
                {
                    role: 'assistant',
                    content: JSON.stringify(initialResult, null, 2)
                },
                {
                    role: 'user',
                    content: `
                        Can you think hard about the output you already produced, and ensure that you have added all the skills that are needed?

                        Please output a better version of the full tree below.
                    `
                }
            ],
            schema: jsonSchema(InitializeSkillTreeAIOutputJsonSchema),
            model: 'openai:gpt-4o',
            mode: 'json',
            providerArgs: {
                structuredOutputs: true,
            }
        });

        const secondaryResultObject = secondaryResult.object;

        if (!secondaryResultObject.rootSkill) {
            return this;
        }

        this.updateRootSkill(secondaryResultObject.rootSkill);


        // TODO: integrate feedback again.
        // console.log('initialResult', this.toAiString());

        // // If there's feedback, generate it, and call this recursively with shouldGiveFeedback set to false.
        // const initialFeedback = await this.aiGetFeedback();

        // console.log('initialFeedback', JSON.stringify(initialFeedback, null, 2));

        // // If there's feedback, generate it, and call this recursively with shouldGiveFeedback set to false.
        // const resultAfterFeedback = await this.aiApplyFeedback(JSON.stringify(initialFeedback, null, 2));

        // console.log('resultAfterFeedback', resultAfterFeedback.toAiString());

        return this;
    }

    async aiInitializeTreeJGF({ shouldGiveFeedback = true, feedback, extraContext }: { shouldGiveFeedback?: boolean, feedback?: string, extraContext?: AIExtraContext[] } = {}) {
        const parentContextString = this.parentSkillNames?.length ? `In the context of: ${this.parentSkillNames.join(',')}` : '';

        const aiResult = await this.ai.genObject({
            prompt: trimAllLines(`
                <YOUR_ROLE>
                    You are very good at breaking concepts down into smaller pieces.

                    ${feedback ? `
                        <FEEDBACK description="You have been given feedback on the skill tree.">
                            ${feedback}
                        </FEEDBACK>
                    ` : ''}
                </YOUR_ROLE>
    
                <YOUR_TASK>
                    Break down the skill "${this.rootSkill.name}" ${parentContextString} into a comprehensive prerequisite network.
                    
                    Important principles to follow:
                    - Most advanced skills require multiple prerequisites
                    - Skills often develop in parallel tracks (e.g., frontend vs backend development)
                    - Some basic skills are prerequisites for multiple advanced skills
                    - Look for natural groupings of related skills
                    - Consider both technical and practical prerequisites
                    - The Root node must ALWAYS be connected to AT LEAST one other node.

                    ${SkillTreeRequirementsPrompt()}
                </YOUR_TASK>

                <EXAMPLES>
                    Here are examples of good prerequisite relationships:
                    1. "Build Full-Stack Web App" might require both:
                    - "Create Frontend Interface"
                    - "Develop Backend API"
                    
                    2. "Create Frontend Interface" might require:
                    - "Write HTML/CSS"
                    - "Use JavaScript"
                    - "Understand UI Principles"
                    
                    3. Multiple advanced skills might require the same basic prerequisite:
                    - Both "Write Complex Queries" and "Design Database Schema" require "Understand SQL Basics"
                </EXAMPLES>


                <EXISTING_TREE description="The existing tree, if it exists.">
                    ${this.hasExistingSkillTree ? `
                            ${this.toAiString()}
                        ` : ''
                }
                </EXISTING_TREE>
                
                <CONTEXT>
                ${this.relevantDocuments?.length ? `
                    Several Relevant documents to the skill have been provided as context, which define what the skill covers.
                ` : ''}
    
                ${this.sourceActivities?.length ? `
                    <CONTEXT_ACTIVITIES description="Several activities that are relevant to the skill. The skill tree created should include places for ALL of these activities.">
                    ${this.sourceActivities}
                    </CONTEXT_ACTIVITIES>
                ` : ''}

                ${extraContext?.length ? `
                    ${extraContext.map((context) => context.toPrompt()).join('\n')}
                ` : ''}
                </CONTEXT>
    
                <OUTPUT_FORMAT>
                    Output a prerequisite-based skill tree in simplified JGF format. 
                    Remember:
                    - The root node (i.e. the main subject of study) should be included as-is.
                    - A skill can have multiple prerequisites (multiple incoming edges)
                    - A skill can be a prerequisite for multiple other skills (multiple outgoing edges)
                    - The graph should form a DAG (Directed Acyclic Graph), not a linear chain

                    So, if you have a skill "Foo" with prerequisites "Bar" and "Baz", the output should be:
                    {
                        "graph": {
                            "nodes": [{"id": "Foo"}, {"id": "Bar"}, {"id": "Baz"}],
                            "edges": [{"prereq": "Bar", "enables": "Foo"}, {"prereq": "Baz", "enables": "Foo"}]
                        }
                    }
                </OUTPUT_FORMAT>
    
                ${this.relevantDocuments?.length ? `
                    <RELEVANT_DOCUMENTS description="Several documents that are relevant to the skill. The skill tree should reflect the content of these documents.">
                        ${this.relevantDocuments?.map((doc) => `
                            ### ${doc.name}
                            ${doc.content}
                        `).join('\n')}
                    </RELEVANT_DOCUMENTS>
                ` : ''}
    
                <FINAL_NOTES>
                    - You should try to create skills at different levels.
                    - You MUST add the skills that need placing.
                    - Remember, IF (and ONLY IF) the tree is already complete, you can say "TREE_IS_DONE" to finish the tree.
                </FINAL_NOTES>
            `),
            schema: JGFSimpleSchema,
            model: 'openai:gpt-4o-mini-2024-07-18',
            feedbackModel: 'openai:gpt-4o-mini-2024-07-18',
            mode: 'json',
            providerArgs: {
                structuredOutputs: true,
            },
            maxFeedbackLoops: 1
        });

        const initialResult = aiResult.object;


        console.log('initialResult', JSON.stringify(initialResult, null, 2));

        if (!initialResult.graph) {
            return this;
        }

        // Convert the prerequisite tree to a skill tree
        const skillTree = this.loadFromJGFSimple(initialResult);


        // TODO: integrate feedback again.
        return this;
    }

    loadFromJGFSimple(graph: JGFSimple) {
        // Create a map of the nodes by their id
        const nodes = new Map<string, SkillTreeNode>();

        // First pass: Create all nodes
        for (const node of graph.graph.nodes) {
            nodes.set(node.id, {
                name: node.id,
                subskills: null
            });
        }

        // Second pass: Build the tree structure
        // Keep track of children for each node
        const childrenMap = new Map<string, Set<string>>();

        // Initialize sets for each node
        nodes.forEach((_, id) => {
            childrenMap.set(id, new Set());
        });

        // Add children based on edges
        // If A is a prereq of B, then A should be a child of B in our tree
        for (const edge of graph.graph.edges) {
            const childSet = childrenMap.get(edge.enables);
            if (childSet) {
                childSet.add(edge.prereq);
            }
        }

        // Find root node (node with no prerequisites)
        const rootId = Array.from(nodes.keys()).find(nodeId =>
            !graph.graph.edges.some(edge => edge.prereq === nodeId)
        );

        if (!rootId || !nodes.get(rootId)) {
            throw new Error('No root node found in graph');
        }

        // Recursive function to build the tree structure
        const buildSubtree = (nodeId: string): SkillTreeNode => {
            const node = nodes.get(nodeId);
            if (!node) {
                throw new Error(`Node ${nodeId} not found`);
            }

            const children = childrenMap.get(nodeId);
            if (!children || children.size === 0) {
                return {
                    name: node.name,
                    subskills: null
                };
            }

            // Group children by level (for now, assuming all are BASIC)
            return {
                name: node.name,
                subskills: {
                    INTRO: null,
                    BASIC: Array.from(children).map(childId => buildSubtree(childId)),
                    INTERMEDIATE: null,
                    ADVANCED: null,
                    MASTER: null
                }
            };
        };

        // Build the tree starting from the root
        const skillTree = buildSubtree(rootId);

        // Update the root skill
        this.updateRootSkill(skillTree);
    }

    /**
     * V2 version that generates a prerequisite-based tree structure and converts it
     */
    private async aiInitializeTreeV2({ shouldGiveFeedback = true, feedback, extraContext }: { shouldGiveFeedback?: boolean, feedback?: string, extraContext?: AIExtraContext[] } = {}): Promise<AIGenSkillTree> {
        const parentContextString = this.parentSkillNames?.length ? `In the context of: ${this.parentSkillNames.join(',')}` : '';

        const aiResult = await this.ai.genObject({
            prompt: trimAllLines(`
                <YOUR_ROLE>
                    You are very good at breaking concepts down into smaller pieces.

                    ${feedback ? `
                        <FEEDBACK description="You have been given feedback on the skill tree.">
                            ${feedback}
                        </FEEDBACK>
                    ` : ''}
                </YOUR_ROLE>
    
                <YOUR_TASK>
                    You are going to break down the skill "${this.rootSkill.name}" ${parentContextString} into smaller learning objectives.
                    Instead of organizing them in a traditional tree, you'll define them in terms of prerequisites.
    
                    ${SkillTreeRequirementsPrompt()}
                </YOUR_TASK>

                <EXISTING_TREE description="The existing tree, if it exists.">
                    ${this.hasExistingSkillTree ? `
                            ${this.toAiString()}
                        ` : ''
                }
                </EXISTING_TREE>
                
                <CONTEXT>
                ${this.relevantDocuments?.length ? `
                    Several Relevant documents to the skill have been provided as context, which define what the skill covers.
                ` : ''}
    
                ${this.sourceActivities?.length ? `
                    <CONTEXT_ACTIVITIES description="Several activities that are relevant to the skill. The skill tree created should include places for ALL of these activities.">
                    ${this.sourceActivities}
                    </CONTEXT_ACTIVITIES>
                ` : ''}

                ${extraContext?.length ? `
                    ${extraContext.map((context) => context.toPrompt()).join('\n')}
                ` : ''}
                </CONTEXT>
    
                <OUTPUT_FORMAT>
                    Output a prerequisite-based skill tree in this format:
                    {
                        "nodes": [
                            {
                                "name": "Root Skill Name",
                                "prerequisites": []
                            },
                            {
                                "name": "Can do Basic, High-Level Thing On Root Skill",
                                "prerequisites": [{
                                    "name": "Root Skill Name",
                                    "levelOnParent": "BASIC"
                                }]
                            },
                            {
                                "name": "Can do  Thing On Root Skill",
                                "prerequisites": [{
                                    "name": "Root Skill Name",
                                    "levelOnParent": "INTERMEDIATE"
                                }]
                            },
                            {
                                "name": "Can do Master-Level Thing On Root Skill",
                                "prerequisites": [{
                                    "name": "Root Skill Name",
                                    "levelOnParent": "MASTER"
                                }]
                            }
                        ]
                    }
                </OUTPUT_FORMAT>
    
                ${this.relevantDocuments?.length ? `
                    <RELEVANT_DOCUMENTS description="Several documents that are relevant to the skill. The skill tree should reflect the content of these documents.">
                        ${this.relevantDocuments?.map((doc) => `
                            ### ${doc.name}
                            ${doc.content}
                        `).join('\n')}
                    </RELEVANT_DOCUMENTS>
                ` : ''}
    
                <FINAL_NOTES>
                    - You should try to create skills at different levels.
                    - You MUST add the skills that need placing.
                    - Remember, IF (and ONLY IF) the tree is already complete, you can say "TREE_IS_DONE" to finish the tree.
                </FINAL_NOTES>
            `),
            schema: z.object({
                prereqTree: PrereqSkillTreeSchema
            }),
            model: 'openai:gpt-4o-mini-2024-07-18',
            feedbackModel: 'openai:gpt-4o-mini-2024-07-18',
            mode: 'json',
            providerArgs: {
                structuredOutputs: true,
            },
            maxFeedbackLoops: 1
        });

        const initialResult = aiResult.object;


        console.log('initialResult', JSON.stringify(initialResult, null, 2));

        if (!initialResult.prereqTree) {
            return this;
        }

        // Convert the prerequisite tree to a skill tree
        const skillTree = prereqSkillTreeToSkillTree(initialResult.prereqTree);

        // If feedback is disabled, set our root skill and return the result
        if (!shouldGiveFeedback) {
            this.updateRootSkill(skillTree);
            return this;
        }

        this.updateRootSkill(skillTree);

        // TODO: integrate feedback again.
        return this;
    }

    toMermaidString() {
        const nodes: string[] = [];
        const connections: string[] = [];
        const processedNodes = new Set<string>();

        const processNode = (node: SkillTreeNode, parentId?: string) => {
            // Create safe ID by replacing spaces and special characters
            const safeId = node.name.replace(/[^a-zA-Z0-9]/g, '_');

            if (!processedNodes.has(safeId)) {
                nodes.push(`${safeId}["${node.name}"]`);
                processedNodes.add(safeId);
            }

            if (parentId) {
                connections.push(`${parentId} --> ${safeId}`);
            }

            if (node.subskills) {
                const levels: (keyof typeof node.subskills)[] = ['INTRO', 'BASIC', 'INTERMEDIATE', 'ADVANCED', 'MASTER'];

                for (const level of levels) {
                    const subskills = node.subskills[level];
                    if (subskills) {
                        for (const subskill of subskills) {
                            processNode(subskill, safeId);
                        }
                    }
                }
            }
        };

        // Start processing from the root skill
        processNode(this.rootSkill);

        return [
            'graph TD;',
            ...nodes,
            ...connections
        ].join('\n');
    }

    async aiGenerateExpertJourneyMap() {
        const parentContextString = this.parentSkillNames?.length ? `in the context of: ${this.parentSkillNames.join(',')}` : '';

        const aiResult = await this.ai.genObject({
            prompt: trimAllLines(`
                Imagine you are the world expert in ${this.rootSkill.name} ${parentContextString}. Walk me through:
                1. Your learning journey from beginner to expert
                2. Key moments where your understanding deepened
                3. Critical skills that unlocked new capabilities
                4. Common stumbling blocks and how to overcome them
            `),
            schema: z.object({
                journeyMap: z.array(z.object({
                    stageName: SkillTreeLevelSchema.describe('The name of the stage.'),
                    keyMoments: z.array(z.string()).describe('Key moments where your understanding deepened.'),
                    criticalSkills: z.array(z.string()).describe('Critical skills that unlocked new capabilities.'),
                    commonStumblingBlocks: z.array(z.object({
                        name: z.string().describe('The name of the stumbling block.'),
                        description: z.string().describe('A description of the stumbling block.'),
                        howToOvercome: z.string().describe('How to overcome the stumbling block.'),
                    })).describe('Common stumbling blocks and how to overcome them.'),
                })).describe('A detailed map of the learning journey from beginner to expert.'),
            }),
            model: 'openai:gpt-4o-mini-2024-07-18',
            mode: 'json',
            providerArgs: {
                structuredOutputs: true,
            }
        });

        return aiResult.object;
    }

    async aiGenerateProblemCenteredApproach() {
        const parentContextString = this.parentSkillNames?.length ? `in the context of: ${this.parentSkillNames.join(',')}` : '';

        const aiResult = await this.ai.genObject({
            prompt: trimAllLines(`
                List the 20 most important problems a ${this.rootSkill.name} ${parentContextString} practitioner needs to solve.
                For each problem:
                1. What skills are needed to solve it?
                2. What prerequisites enable those skills?
                3. What more advanced problems does this unlock?
            `),
            schema: z.object({
                problems: z.array(z.object({
                    problem: z.string().describe('The problem.'),
                    skillsNeeded: z.array(z.string()).describe('The skills needed to solve the problem.'),
                    prerequisites: z.array(z.string()).describe('The prerequisites that enable those skills.'),
                    moreAdvancedProblems: z.array(z.string()).describe('What more advanced problems does this unlock?'),
                })).describe('A list of the 20 most important problems a ${this.rootSkill.name} ${parentContextString} practitioner needs to solve.'),
            }),
            model: 'openai:gpt-4o-mini-2024-07-18',
            mode: 'json',
            providerArgs: {
                structuredOutputs: true,
            }
        });

        return aiResult.object.problems;
    }

    async aiGenerateCompetencyFramework() {
        const parentContextString = this.parentSkillNames?.length ? `in the context of: ${this.parentSkillNames.join(',')}` : '';

        const aiResult = await this.ai.genObject({
            prompt: trimAllLines(`
                Describe a complete beginner in ${this.rootSkill.name} ${parentContextString}.
                Now describe an expert.
                What are the key differences in:
                1. Knowledge
                2. Skills
                3. Mental models
                4. Tools they can use
                5. Problems they can solve

                For each difference, what are the intermediate stages?
            `),
            schema: z.object({
                beginner: z.string().describe('A description of a complete beginner.'),
                expert: z.string().describe('A description of an expert.'),
                differences: z.object({
                    knowledge: z.string().describe('The key differences in knowledge between a beginner and an expert.'),
                    skills: z.string().describe('The key differences in skills between a beginner and an expert.'),
                    mentalModels: z.string().describe('The key differences in mental models between a beginner and an expert.'),
                    tools: z.string().describe('The key differences in tools a beginner and an expert can use.'),
                    problems: z.string().describe('The key differences in problems a beginner and an expert can solve.'),
                }).describe('The key differences in knowledge, skills, mental models, tools, and problems between a beginner and an expert.'),
            }),
            model: 'openai:gpt-4o-mini-2024-07-18',
            mode: 'json',
            providerArgs: {
                structuredOutputs: true,
            }
        });

        return aiResult.object;
    }

    defaultContextSectionBody() {
        return `
            ${this.relevantDocuments?.length ? `
                Several Relevant documents to the skill have been provided as context, which define what the skill covers.
            ` : ''}

            ${this.sourceActivities?.length ? `
                <CONTEXT_ACTIVITIES description="Several activities that are relevant to the skill. The skill tree created should include places for ALL of these activities.">
                ${this.sourceActivities}
                </CONTEXT_ACTIVITIES>
            ` : ''}
        `
    }

    defaultExistingTreeSectionBody() {
        return this.hasExistingSkillTree ? this.toAiString() : '';
    }

    // async aiApplyFeedback(feedback: string) {
    //     if (!this.hasExistingSkillTree) {
    //         console.warn('No existing skill tree to apply feedback to.');
    //         return this;
    //     }

    //     const parentContextString = this.parentSkillNames?.length ? `in the context of: ${this.parentSkillNames.join(',')}` : '';

    //     const aiResult = await this.ai.genObject({
    //         prompt: trimAllLines(`
    //             <YOUR_ROLE>
    //                 You are world-class at breaking concepts down into small, digestible, learning objectives -- known as "skills".

    //                 You are responsible for applying the given feedback to improve the skill tree.

    //                 ${feedback ? `
    //                     <FEEDBACK description="You have been given feedback on the skill tree.">
    //                         ${feedback}
    //                     </FEEDBACK>
    //                 ` : ''}
    //             </YOUR_ROLE>

    //             <YOUR_TASK>
    //                 You are going to break down the skill "${this.rootSkill.name}" ${parentContextString} into smaller learning objectives.

    //                 ${SkillTreeRequirementsPrompt()}
    //             </YOUR_TASK>

    //             <EXISTING_TREE description="The existing tree, if it exists.">
    //                 ${this.defaultExistingTreeSectionBody()}
    //             </EXISTING_TREE>

    //             <CONTEXT>
    //                 ${this.defaultContextSectionBody()}
    //             </CONTEXT>

    //             <EXPECTED_OUTPUT>
    //                 You should output a list of JSON-Patch operations to apply to the skill tree.
    //                 <EXAMPLE_1>
    //                     <GIVEN_INPUT>
    //                         {
    //                             name: "Parent Skill Name",
    //                             subskills: {
    //                                 BASIC: [{
    //                                     name: "Can do this Basic thing",
    //                                     subskills: null
    //                                 }]
    //                             }
    //                         }
    //                     </GIVEN_INPUT>
    //                     <YOUR_OUTPUT>
    //                         [
    //                             {
    //                                 path: "/root/subskills/BASIC",
    //                                 op: "add",
    //                                 value: [{
    //                                     name: "Can do this other Basic thing",
    //                                     subskills: null
    //                                 }]
    //                             }
    //                         ]
    //                     </YOUR_OUTPUT>
    //                 </EXAMPLE_1>
    //             </EXPECTED_OUTPUT>

    //             ${this.relevantDocuments?.length ? `
    //                 <RELEVANT_DOCUMENTS description="Several documents that are relevant to the skill. The skill tree should reflect the content of these documents.">
    //                     ${this.relevantDocuments?.map((doc) => `
    //                         ### ${doc.name}
    //                         ${doc.content}
    //                     `).join('\n')}
    //                 </RELEVANT_DOCUMENTS>
    //             ` : ''}

    //             <FINAL_NOTES>
    //                 - You should try to create subskills that are at different levels.
    //                 - You MUST add the skills that need placing.
    //                 - Remember, IF (and ONLY IF) the tree is already complete, you can say "TREE_IS_DONE" to finish the tree.
    //             </FINAL_NOTES>
    //         `),
    //         schema: z.object({
    //             patches: JsonPatchSchema.describe('A list of patches to apply to the skill tree.'),
    //         }),
    //         model: 'openai:gpt-4o-mini-2024-07-18',
    //         mode: 'json',
    //         // Don't use structured outputs for this, because we explicitly want to allow `any` values.
    //         // providerArgs: {
    //         //     structuredOutputs: true,
    //         // }
    //     });

    //     const patch = aiResult.object;

    //     console.log('patch', JSON.stringify(patch, null, 2));

    //     const patchedSkillTree = applyPatch(this.rootSkill, patch.patches as Operation[]);

    //     // Validate that the shape matches the original schema.
    //     const validatedSkillTree = skillTreeNodeSchema.parse(patchedSkillTree.newDocument);

    //     this.updateRootSkill(validatedSkillTree);

    //     return this;
    // }

    // async aiApplyFeedbackJsonPatch(feedback: string) {
    //     if (!this.hasExistingSkillTree) {
    //         console.warn('No existing skill tree to apply feedback to.');
    //         return this;
    //     }

    //     const parentContextString = this.parentSkillNames?.length ? `in the context of: ${this.parentSkillNames.join(',')}` : '';

    //     const aiResult = await this.ai.genObject({
    //         prompt: trimAllLines(`
    //             <YOUR_ROLE>
    //                 You are world-class at breaking concepts down into small, digestible, learning objectives -- known as "skills".

    //                 You are responsible for applying the given feedback to improve the skill tree.

    //                 ${feedback ? `
    //                     <FEEDBACK description="You have been given feedback on the skill tree.">
    //                         ${feedback}
    //                     </FEEDBACK>
    //                 ` : ''}
    //             </YOUR_ROLE>

    //             <YOUR_TASK>
    //                 You are going to break down the skill "${this.rootSkill.name}" ${parentContextString} into smaller learning objectives.

    //                 ${SkillTreeRequirementsPrompt()}
    //             </YOUR_TASK>

    //             <EXISTING_TREE description="The existing tree, if it exists.">
    //                 ${
    //                     this.hasExistingSkillTree ? `
    //                         ${this.toAiString()}
    //                     ` : ''
    //                 }
    //             </EXISTING_TREE>

    //             <CONTEXT>
    //             ${this.relevantDocuments?.length ? `
    //                 Several Relevant documents to the skill have been provided as context, which define what the skill covers.
    //             ` : ''}

    //             ${this.sourceActivities?.length ? `
    //                 <CONTEXT_ACTIVITIES description="Several activities that are relevant to the skill. The skill tree created should include places for ALL of these activities.">
    //                 ${this.sourceActivities}
    //                 </CONTEXT_ACTIVITIES>
    //             ` : ''}
    //             </CONTEXT>

    //             <EXPECTED_OUTPUT>
    //                 You should output a list of JSON-Patch operations to apply to the skill tree.
    //                 <EXAMPLE_1>
    //                     <GIVEN_INPUT>
    //                         {
    //                             name: "Parent Skill Name",
    //                             subskills: {
    //                                 BASIC: [{
    //                                     name: "Can do this Basic thing",
    //                                     subskills: null
    //                                 }]
    //                             }
    //                         }
    //                     </GIVEN_INPUT>
    //                     <YOUR_OUTPUT>
    //                         [
    //                             {
    //                                 path: "/root/subskills/BASIC",
    //                                 op: "add",
    //                                 value: [{
    //                                     name: "Can do this other Basic thing",
    //                                     subskills: null
    //                                 }]
    //                             }
    //                         ]
    //                     </YOUR_OUTPUT>
    //                 </EXAMPLE_1>
    //             </EXPECTED_OUTPUT>

    //             ${this.relevantDocuments?.length ? `
    //                 <RELEVANT_DOCUMENTS description="Several documents that are relevant to the skill. The skill tree should reflect the content of these documents.">
    //                     ${this.relevantDocuments?.map((doc) => `
    //                         ### ${doc.name}
    //                         ${doc.content}
    //                     `).join('\n')}
    //                 </RELEVANT_DOCUMENTS>
    //             ` : ''}

    //             <FINAL_NOTES>
    //                 - You should try to create subskills that are at different levels.
    //                 - You MUST add the skills that need placing.
    //                 - Remember, IF (and ONLY IF) the tree is already complete, you can say "TREE_IS_DONE" to finish the tree.
    //             </FINAL_NOTES>
    //         `),
    //         schema: z.object({
    //             patches: JsonPatchSchema.describe('A list of patches to apply to the skill tree.'),
    //         }),
    //         model: 'openai:gpt-4o-mini-2024-07-18',
    //         mode: 'json',
    //         // Don't use structured outputs for this, because we explicitly want to allow `any` values.
    //         // providerArgs: {
    //         //     structuredOutputs: true,
    //         // }
    //     });

    //     const patch = aiResult.object;

    //     console.log('patch', JSON.stringify(patch, null, 2));

    //     const patchedSkillTree = applyPatch(this.rootSkill, patch.patches as Operation[]);

    //     // Validate that the shape matches the original schema.
    //     const validatedSkillTree = skillTreeNodeSchema.parse(patchedSkillTree.newDocument);

    //     this.updateRootSkill(validatedSkillTree);

    //     return this;
    // }

    async aiAddSkills(args: AIGenSkillTreeAddSkillsArgs) {

    }

    toAiString() {
        return JSON.stringify(this.rootSkill, null, 2);
    }

    toDebugString() {
        const asPrereqTree = skillTreeToPrereqSkillTree(this.rootSkill);
        return trimLines(`
            <NUMBER_OF_SKILLS>
                ${Object.keys(asPrereqTree.skills).length}
            </NUMBER_OF_SKILLS>
            <SKILL_TREE>
                \`\`\`json
                ${prefixAllLines(JSON.stringify(this.rootSkill, null, 2), '                ')}
                \`\`\`
            </SKILL_TREE>
        `);
    }

    // async applyChanges(changes: SkillTreeChange[]) {
    //     // Run through each change and apply it to the skill tree.
    //     for (const change of changes) {
    //         change.apply(this.rootSkill);
    //     }
    // }

    // async aiAdjustPrerequisites() {
    //     const parentContextString = this.parentSkillNames?.length ? 
    //         `in the context of: ${this.parentSkillNames.join(',')}` : '';

    //     const aiResult = await this.ai.genObject({
    //         prompt: trimAllLines(`
    //             <YOUR_ROLE>
    //                 You are an expert at analyzing prerequisite relationships between skills.
    //                 Your job is to suggest improvements to the prerequisite structure of a skill tree.
    //             </YOUR_ROLE>

    //             <CURRENT_TREE>
    //                 ${this.toAiString()}
    //             </CURRENT_TREE>

    //             <TASK>
    //                 Analyze the prerequisite relationships in the skill tree for "${this.rootSkill.name}" ${parentContextString}.
    //                 Suggest adjustments to improve the learning progression.

    //                 Important considerations:
    //                 - Prerequisites should form a clear learning path
    //                 - Advanced skills often require multiple prerequisites
    //                 - Some basic skills may be prerequisites for multiple advanced skills
    //                 - Prerequisites should be at an appropriate level (not too basic, not too advanced)
    //                 - The relationship between skills should be logical and necessary
    //                 - Consider both theoretical and practical prerequisites
    //             </TASK>

    //             <ADJUSTMENT_TYPES>
    //                 You can suggest three types of adjustments:
    //                 1. ADD_PREREQUISITE: Add a new prerequisite relationship
    //                 2. REMOVE_PREREQUISITE: Remove an unnecessary prerequisite
    //                 3. MODIFY_PREREQUISITE: Change the level of an existing prerequisite

    //                 For each adjustment, explain WHY you're suggesting it.
    //             </ADJUSTMENT_TYPES>

    //             <OUTPUT_FORMAT>
    //                 Output a list of prerequisite adjustments in this format:
    //                 {
    //                     "adjustments": [
    //                         {
    //                             "type": "ADD_PREREQUISITE",
    //                             "enables": "Can write complex SQL queries",
    //                             "prereq": "Can write basic SELECT statements",
    //                             "level": "BASIC",
    //                             "reason": "Understanding basic SELECT statements is fundamental before writing complex queries"
    //                         },
    //                         {
    //                             "type": "REMOVE_PREREQUISITE",
    //                             "enables": "Can use Git branches",
    //                             "prereq": "Can write Python scripts",
    //                             "reason": "Git branching can be learned independently of Python programming"
    //                         },
    //                         {
    //                             "type": "MODIFY_PREREQUISITE",
    //                             "enables": "Can implement authentication",
    //                             "prereq": "Can handle HTTP requests",
    //                             "level": "INTERMEDIATE",
    //                             "reason": "This prerequisite requires more than basic HTTP knowledge"
    //                         }
    //                     ]
    //                 }
    //             </OUTPUT_FORMAT>

    //             <GUIDELINES>
    //                 - Focus on the most important adjustments first
    //                 - Explain each adjustment clearly
    //                 - Consider the overall learning progression
    //                 - Don't suggest removing core prerequisites
    //                 - Ensure adjustments maintain a coherent learning path
    //             </GUIDELINES>
    //         `),
    //         schema: PrerequisiteAdjustmentsSchema,
    //         model: 'openai:gpt-4o-mini-2024-07-18',
    //         mode: 'json',
    //         providerArgs: {
    //             structuredOutputs: true,
    //         }
    //     });

    //     const adjustments = aiResult.object.adjustments;

    //     // Apply the adjustments to the JGF graph
    //     const jgfGraph = this.toJGFSimple();

    //     for (const adjustment of adjustments) {
    //         switch (adjustment.type) {
    //             case 'ADD_PREREQUISITE':
    //                 // Add nodes if they don't exist
    //                 if (!jgfGraph.graph.nodes.some(n => n.id === adjustment.enables)) {
    //                     jgfGraph.graph.nodes.push({ id: adjustment.enables });
    //                 }
    //                 if (!jgfGraph.graph.nodes.some(n => n.id === adjustment.prereq)) {
    //                     jgfGraph.graph.nodes.push({ id: adjustment.prereq });
    //                 }
    //                 // Add the edge
    //                 jgfGraph.graph.edges.push({
    //                     prereq: adjustment.prereq,
    //                     enables: adjustment.enables,
    //                     level: adjustment.level ?? null
    //                 });
    //                 break;

    //             case 'REMOVE_PREREQUISITE':
    //                 // Remove the edge
    //                 jgfGraph.graph.edges = jgfGraph.graph.edges.filter(edge => 
    //                     !(edge.prereq === adjustment.prereq && edge.enables === adjustment.enables)
    //                 );
    //                 break;

    //             case 'MODIFY_PREREQUISITE':
    //                 // Update the edge
    //                 const edge = jgfGraph.graph.edges.find(edge => 
    //                     edge.prereq === adjustment.prereq && edge.enables === adjustment.enables
    //                 );
    //                 if (edge && adjustment.level) {
    //                     edge.level = adjustment.level;
    //                 }
    //                 break;
    //         }
    //     }

    //     // Convert back to skill tree
    //     this.loadFromJGFSimple(jgfGraph);

    //     return {
    //         adjustments,
    //         updatedTree: this
    //     };
    // }

    // toJGFSimple(): JGFSimple {
    //     const nodes = new Set<string>();
    //     const edges: Array<{prereq: string, enables: string, level: string | null}> = [];

    //     // Helper function to process nodes recursively
    //     const processNode = (node: SkillTreeNode) => {
    //         nodes.add(node.name);

    //         if (node.subskills) {
    //             Object.entries(node.subskills).forEach(([level, subskills]) => {
    //                 if (subskills) {
    //                     subskills.forEach(subskill => {
    //                         edges.push({
    //                             prereq: subskill.name,
    //                             enables: node.name,
    //                             level: level as string | null
    //                         });
    //                         processNode(subskill);
    //                     });
    //                 }
    //             });
    //         }
    //     };

    //     processNode(this.rootSkill);

    //     return {
    //         graph: {
    //             nodes: Array.from(nodes).map(id => ({ id })),
    //             edges
    //         }
    //     };
    // }
}
