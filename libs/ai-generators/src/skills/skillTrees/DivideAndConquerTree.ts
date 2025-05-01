import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import { trimAllLines } from '@lukebechtel/lab-ts-utils';
import { AIGenerator } from '@reasonote/lib-ai-common';

import { AIExtraContext } from '../../utils/AIExtraContext';

export interface DivideAndConquerTreeMakerArgs {
    ai: AIGenerator;
    rootSkill?: string;
    parentSkills?: string[];
    relevantDocuments?: { name: string; content: string }[];
    extraContext?: AIExtraContext[];
    numThreads?: number;
    /**
     * What is the maximum depth of iterations?
     * 
     * NOTE: The resultant diagram may be deeper than this, due to node compaction
     */
    maxDepth?: number;

    /**
     * What is the maximum number of subskills to generate per each skill?
     */
    maxSubskillsPerSkill?: number;
    existingTree?: { nodes: SkillGraphNode[]; edges: SkillGraphEdge[] };
    useQuestions?: boolean;
    useTopicNames?: boolean;
    WRITE_OUTPUT_TO_FILE?: boolean;
    /**
     * What model should we use for the AI?
     */
    model?: string;
}

const SkillGraphNodeSchema = z.object({
    // AKA objective
    id: z.string().describe('The name for the skill.'),
    topicName: z.string().optional().describe('The name of the topic that the objective is for.'),
    questions: z.array(z.string()).optional().describe('A list of 5 very difficult questions that can be used to test the user on this objective. These should be questions that an expert can solve / answer that are fully representative of that subtopic. i.e, once I can answer those questions, I will have mastered the subtopic. I want the questions to be highly specific and not abstract. Where possible, I want the questions to be concrete in terms of scenarios or specific problems to solve. Make sure that the questions cover any exceptions, nuances or edge cases that only a person who has a deep understanding of the topic will be able to answer.'),
});

export type SkillGraphNode = z.infer<typeof SkillGraphNodeSchema>;

const SkillGraphEdgeSchema = z.object({
    prereq: z.string().describe('The name of the skill that must be completed before this skill can be completed.'),
    enables: z.string().describe('The name of the skill that is enabled by completing this skill.'),
    order: z.number().describe('The suggested order of studying this prerequisite skill before the skill that it enables, relative to other prerequisite skills.'),

});

export type SkillGraphEdge = z.infer<typeof SkillGraphEdgeSchema>;

/**
 * Uses a "Divide and Conquer" approach to generate a skill tree.
 * 
 * This is a more manual approach to skill tree generation, where we iteratively and recursively
 * generate learning objectives for each skill, up to some maximum depth.
 */
export class DivideAndConquerTreeMaker {
    public nodes: SkillGraphNode[] = [];
    public edges: SkillGraphEdge[] = [];
    private ai: AIGenerator;
    private rootSkill?: string;
    private relevantDocuments?: { name: string; content: string }[];
    private extraContext?: AIExtraContext[];
    private numThreads: number;
    private maxDepth: number;
    private maxSubskillsPerSkill?: number;
    private nodeDepths: Map<string, number> = new Map();
    private outputDir: string = '';
    private useQuestions: boolean = false;
    private useTopicNames: boolean = false;
    private model: string = 'openai:gpt-4o-mini';

    private WRITE_OUTPUT_TO_FILE: boolean = false;

    constructor(args: DivideAndConquerTreeMakerArgs) {
        this.ai = args.ai;
        this.rootSkill = args.rootSkill;
        this.relevantDocuments = args.relevantDocuments;
        this.extraContext = args.extraContext;
        this.numThreads = args.numThreads || 1;
        this.maxDepth = args.maxDepth || 3;
        this.maxSubskillsPerSkill = args.maxSubskillsPerSkill;
        this.useQuestions = args.useQuestions || false;
        this.useTopicNames = args.useTopicNames || false;
        this.WRITE_OUTPUT_TO_FILE = args.WRITE_OUTPUT_TO_FILE || false;
        this.model = args.model || 'openai:gpt-4o-mini';
    }

    addNode(node: SkillGraphNode): void {
        if (node.id === this.rootSkill && this.nodes.length > 0) {
            throw new Error('Cannot add root skill to tree twice!');
        }
        if (node.id !== this.rootSkill && this.nodes.length === 0) {
            throw new Error('Cannot add non-root skill to tree before adding root skill!');
        }

        this.nodes.push(node);
    }

    getImmediatePrereqs(nodeId: string): { id: string; order: number }[] {
        return this.edges.filter(edge => edge.enables === nodeId).map(edge => {
            return {
                id: edge.prereq,
                order: edge.order
            };
        });
    }

    addEdge(edge: SkillGraphEdge): void {
        // No self-edges
        if (edge.prereq === edge.enables) {
            return;
        }

        // No repeats
        if (this.edges.some(e => e.prereq === edge.enables && e.enables === edge.prereq)) {
            return;
        }

        this.edges.push(edge);
    }

    async aiInitialize() {
        if (!this.rootSkill) {
            throw new Error('Root skill must be set before initialization');
        }

        if (this.WRITE_OUTPUT_TO_FILE) {
            // Create timestamped output directory
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const rootSkillHyphenated = this.rootSkill.replace(/\s+/g, '-').toLowerCase();
            this.outputDir = path.join(process.cwd(), 'skill-trees', `${rootSkillHyphenated}-${timestamp}`);
            await fs.mkdir(this.outputDir, { recursive: true });
        }

        // Add the root node
        this.addNode({ id: this.rootSkill, topicName: this.rootSkill, questions: [] });
        this.nodeDepths.set(this.rootSkill, 0);

        // Process the root node first
        const initialObjectives = await this.generateLearningObjectives(this.rootSkill);
        initialObjectives.forEach(objective => {
            this.addNode(objective);
            // @ts-ignore
            this.addEdge({ prereq: objective.id, enables: this.rootSkill });
            this.nodeDepths.set(objective.id, 1);
        });

        // Group nodes by depth for level-order processing
        const nodesByDepth: Map<number, Set<string>> = new Map();
        nodesByDepth.set(1, new Set(initialObjectives.map(o => o.id)));

        // Process each level until we hit max depth or run out of nodes
        let currentDepth = 1;
        while (currentDepth < this.maxDepth) {
            const nodesAtDepth = nodesByDepth.get(currentDepth);
            if (!nodesAtDepth || nodesAtDepth.size === 0) break;

            // Convert nodes to array for parallel processing
            const nodesToProcess = Array.from(nodesAtDepth);
            
            // Process nodes in parallel batches
            const results = await this.processNodesInParallel(nodesToProcess, currentDepth);
            
            // Initialize next depth's set if needed
            if (!nodesByDepth.has(currentDepth + 1)) {
                nodesByDepth.set(currentDepth + 1, new Set());
            }

            // Add new objectives to the next depth
            results.forEach(({ node, objectives }) => {
                objectives.forEach((objective, index) => {
                    // Check all the nodes above this one in the tree.
                    // If this objective is already in that set, skip it.
                    // TODO: flag this and ask AI to generate an analysis of the conflict and try to resolve it.
                    for (let i = 1; i < currentDepth; i++) {
                        if (nodesByDepth.get(i)?.has(objective.id)) {
                            return;
                        }
                    }

                    // Check if this node already exists at this depth.
                    // If so, don't add the node, but the edge is fine.
                    if (nodesByDepth.get(currentDepth + 1)?.has(objective.id)) {
                        this.addEdge({ prereq: objective.id, enables: node, order: index });
                    }
                    else {
                        this.addNode(objective);
                        this.addEdge({ prereq: objective.id, enables: node, order: index });
                        this.nodeDepths.set(objective.id, currentDepth + 1);
                        nodesByDepth.get(currentDepth + 1)?.add(objective.id);
                    }
                    
                });
            });

            currentDepth++;
        }
    }

    private async processNodesInParallel(nodes: string[], depth: number) {
        const results: { node: string; objectives: { id: string; topicName?: string; questions?: string[] }[] }[] = [];    

        // Process nodes in batches based on numThreads
        for (let i = 0; i < nodes.length; i += this.numThreads) {
            const batch = nodes.slice(i, i + this.numThreads);
            const batchPromises = batch.map(async node => {
                const objectives = await this.generateLearningObjectives(node);
                return { node, objectives };
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Log progress
            console.log(`Processed ${i + batch.length}/${nodes.length} nodes at depth ${depth}`);
        }

        return results;
    }

    // Helper method to get the current depth of the tree
    getCurrentMaxDepth(): number {
        return Math.max(...Array.from(this.nodeDepths.values()));
    }

    async generateLearningObjectives(node: string): Promise<{ id: string; topicName?: string; questions?: string[] }[]> {
        const maxNumObjectives = this.maxSubskillsPerSkill || 6;
        const prompt = `
            <YOUR_TASK>
                You are generating a prerequisite tree for the skill "${this.rootSkill}".

                This tree should be sufficient to exhaustively teach the subject: "${this.rootSkill}"

                <CURRENT_TARGET_SKILL>
                    Currently, you are generating prerequisite learning objectives for the following skill: "${node}"
                </CURRENT_TARGET_SKILL>

                <REQUIREMENTS>
                    ${this.useTopicNames ? `
                        <SUBTOPIC_REQUIREMENTS>
                            - The subtopic should be a short, concise name for the learning objective that is no more than 4 words, but ideally 1-2 words.
                        </SUBTOPIC_REQUIREMENTS>
                    ` : ''}

                    <OBJECTIVE_REQUIREMENTS>
                        - Each learning objective should begin with "Can" and be a demonstrable ability that can be directly tested.
                        - Each learning objective should be in the active voice and no more than 1 sentence.
                        - You may output no more than ${maxNumObjectives} learning objectives.
                        - You may output less learning objectives if those you would output would be redundant or extraneous.
                        - The learning objectives should be in order of increasing difficulty.
                    </OBJECTIVE_REQUIREMENTS>

                    ${this.useQuestions ? `
                        <QUESTION_REQUIREMENTS>
                            - Each learning objective should have 5 very difficult questions that can be used to test the user on the objective.
                            - The questions should be highly specific and not abstract.
                            - The questions should be concrete in terms of scenarios or specific problems to solve.
                            - The questions should cover any exceptions, nuances or edge cases that only a person who has a deep understanding of the topic will be able to answer.
                        </QUESTION_REQUIREMENTS>
                    ` : ''}
                </REQUIREMENTS>
            </YOUR_TASK>

            ${this.getContextSection()}

            <EXISTING_TREE>
                <MERMAID_DIAGRAM>
                    ${this.toMermaidString()}
                </MERMAID_DIAGRAM>
                <EXISTING_TREE_STRUCTURE_JSON>
                    ${this.toAIString()}
                </EXISTING_TREE_STRUCTURE_JSON>
            </EXISTING_TREE>

            <FINAL_NOTES>
                - Remember, you are currently generating prerequsite learning objectives for the CURRENT_TARGET_SKILL: "${node}".
                - Use any relevant information from the context section to inform your learning objectives.
                - Ensure the learning objectives align with any provided documentation or context.
            </FINAL_NOTES>
        `;

        // Leave for debugging.
        //console.debug(`Prompt: ${prompt}`);


        var objectiveSchemaBase = z.object({
            objective: z.string().describe('The learning objective.'),
        });

        if (this.useTopicNames) {
            objectiveSchemaBase = objectiveSchemaBase.extend({
                topicName: z.string().describe('The name of the topic that the objective is for.'),
            });
        }

        if (this.useQuestions) {
            objectiveSchemaBase = objectiveSchemaBase.extend({
                questions: z.array(z.string()).describe('A list of 5 very difficult questions that can be used to test the user on this objective. These should be questions that an expert can solve / answer that are fully representative of that subtopic. i.e, once I can answer those questions, I will have mastered the subtopic. I want the questions to be highly specific and not abstract. Where possible, I want the questions to be concrete in terms of scenarios or specific problems to solve. Make sure that the questions cover any exceptions, nuances or edge cases that only a person who has a deep understanding of the topic will be able to answer.'),
            });
        }

        const learningObjectives = await this.ai.genObject({
            schema: z.object({
                result: z.union([
                    z.object({
                        type: z.literal('add_objectives'),
                        skill: z.string().describe('The skill that the learning objectives are for. This should be IDENTICAL to the CURRENT_TARGET_SKILL.'),
                        objectives: z.array(objectiveSchemaBase).max(maxNumObjectives).describe(`A list of learning objectives for the skill. There should be no more than ${maxNumObjectives} objectives. These should be in the order of increasing difficulty.`),
                    }),
                    z.object({
                        type: z.literal('node_should_be_leaf'),
                    }),
                ]),
            }),
            prompt,
            model: this.model,
            mode: 'json',
            providerArgs: {
                structuredOutput: true,
            },
        });


        // // Write learning objectives to file
        if (this.WRITE_OUTPUT_TO_FILE) {
            const hyphenatedNodeId = node.replace(/\s+/g, '-').toLowerCase();
            const filePath = path.join(this.outputDir, `${hyphenatedNodeId}.json`);
            await fs.writeFile(filePath, JSON.stringify(learningObjectives.object.result, null, 2));
        }

        if (learningObjectives.object.result.type === 'add_objectives') {
            if (learningObjectives.object.result.skill !== node) {
                console.warn(`Learning objectives for skill "${node}" were generated for skill "${learningObjectives.object.result.skill}"`);
                return [];
            }
            else {
                return learningObjectives.object.result.objectives.map(o => ({
                    id: o.objective,
                    topicName: 'topicName' in o ? o.topicName as string : undefined,
                    questions: 'questions' in o ? o.questions as string[] : undefined,
                }));
            }
        }

        return [];
    }


    private getContextSection(): string {
        return trimAllLines(`
            <CONTEXT>
            ${this.relevantDocuments?.length ? `
                <RELEVANT_DOCUMENTS>
                ${this.relevantDocuments.map(doc => `
                    ### ${doc.name}
                    ${doc.content}
                `).join('\n')}
                </RELEVANT_DOCUMENTS>
            ` : ''}

            ${this.extraContext?.length ? `
                ${this.extraContext.map(context => context.toPrompt()).join('\n')}
            ` : ''}
            </CONTEXT>
        `);
    }

    toAIString(): string {
        return JSON.stringify({
            nodes: this.nodes,
            edges: this.edges,
        }, null, 2)
    }

    toMermaidString(): string {
        const lines = ['graph TD;'];
        
        // Add nodes
        this.nodes.forEach(node => {
            const safeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
            lines.push(`    ${safeId}["${node.id}"]`);
        });
        
        // Add edges
        this.edges.forEach(edge => {
            const safePrereq = edge.prereq.replace(/[^a-zA-Z0-9]/g, '_');
            const safeEnables = edge.enables.replace(/[^a-zA-Z0-9]/g, '_');
            lines.push(`    ${safePrereq} --> ${safeEnables}`);
        });
        
        return lines.join('\n');
    }
}
