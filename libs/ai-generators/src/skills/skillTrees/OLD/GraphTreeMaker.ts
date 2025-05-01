import { z } from 'zod';

import { trimAllLines } from '@lukebechtel/lab-ts-utils';
import { AIGenerator } from '@reasonote/lib-ai-common';

import { AIExtraContext } from '../../../utils/AIExtraContext';

export interface GraphTreeMakerArgs {
    ai: AIGenerator;
    rootSkill?: string;
    parentSkills?: string[];
    relevantDocuments?: { name: string; content: string }[];
    extraContext?: AIExtraContext[];
}

const SkillGraphNodeSchema = z.object({
    id: z.string().describe('The name for the skill.')
});

type SkillGraphNode = z.infer<typeof SkillGraphNodeSchema>;

const SkillGraphEdgeSchema = z.object({
    prereq: z.string().describe('The name of the skill that must be completed before this skill can be completed.'),
    enables: z.string().describe('The name of the skill that is enabled by completing this skill.'),
});

type SkillGraphEdge = z.infer<typeof SkillGraphEdgeSchema>;

// A skill tree.
export class GraphTreeMaker {
    public nodes: SkillGraphNode[] = [];
    public edges: SkillGraphEdge[] = [];
    private ai: AIGenerator;
    private rootSkill?: string;
    private parentSkills: string[] = [];
    private relevantDocuments?: { name: string; content: string }[];
    private extraContext?: AIExtraContext[];

    constructor(args: GraphTreeMakerArgs) {
        this.ai = args.ai;
        this.rootSkill = args.rootSkill;
        this.parentSkills = args.parentSkills || [];
        this.relevantDocuments = args.relevantDocuments;
        this.extraContext = args.extraContext;
    }

    addNode(node: SkillGraphNode): void {
        this.nodes.push(node);
    }

    addEdge(edge: SkillGraphEdge): void {
        this.edges.push(edge);
    }

    async aiInitialize({
        numNodeThreads = 3,
        numEdgeThreads = 2,
        maxNodesPerThread = 10,
        maxEdgesPerThread = 15,
        temperature = 0.7
    } = {}) {
        if (!this.rootSkill) {
            throw new Error('Root skill must be set before initialization');
        }

        // Initialize with root node
        const nodeSet = new Set([this.rootSkill]);
        let isNodeGenerationComplete = false;
        let isEdgeGenerationComplete = false;

        // First iteration: Generate initial set of nodes synchronously
        const initialNodeResult = (await this.generateNodes({
            existingNodes: Array.from(nodeSet),
            temperature
        })).object.result;

        if (initialNodeResult.type === 'add-nodes') {
            initialNodeResult.nodes.forEach(node => nodeSet.add(node));
        } else {
            isNodeGenerationComplete = true;
        }

        // Create a function for node generation threads
        const nodeThreadWork = async () => {
            let threadNodeCount = 0;

            while (!isNodeGenerationComplete && threadNodeCount < maxNodesPerThread) {
                const result = (await this.generateNodes({
                    existingNodes: Array.from(nodeSet),
                    temperature
                })).object.result;

                if (result.type === 'generation-complete') {
                    isNodeGenerationComplete = true;
                    break;
                }

                result.nodes.forEach(node => nodeSet.add(node));
                threadNodeCount += result.nodes.length;
            }
        };

        // Create a function for edge generation threads
        const edgeSet = new Set<string>();  // Using stringified edges for deduplication
        const edgeThreadWork = async () => {
            let threadEdgeCount = 0;

            while (!isEdgeGenerationComplete && threadEdgeCount < maxEdgesPerThread) {
                const result = (await this.generateEdges({
                    nodes: Array.from(nodeSet),
                    existingEdges: Array.from(edgeSet).map(e => JSON.parse(e)),
                    temperature
                })).object.result;

                if (result.type === 'generation-complete') {
                    isEdgeGenerationComplete = true;
                    break;
                }

                result.edges.forEach(edge => 
                    edgeSet.add(JSON.stringify({
                        prereq: edge.prereq,
                        enables: edge.enables,
                    }))
                );
                threadEdgeCount += result.edges.length;
            }
        };

        // Run both node and edge generation threads in parallel
        await Promise.all([
            ...Array(numNodeThreads).fill(null).map(() => nodeThreadWork()),
            ...Array(numEdgeThreads).fill(null).map(() => edgeThreadWork())
        ]);

        // Update internal nodes and edges arrays
        this.nodes = Array.from(nodeSet).map(id => ({ id }));
        this.edges = Array.from(edgeSet).map(e => JSON.parse(e));

        return this;
    }

    private async generateNodes({
        existingNodes,
        temperature
    }: {
        existingNodes: string[],
        temperature: number
    }) {
        const parentContext = this.parentSkills.length ? 
            `in the context of: ${this.parentSkills.map(skill => `"${skill}"`).join(', ')}` : '';

        return this.ai.genObject({
            prompt: trimAllLines(`
                <YOUR_TASK>
                    Generate learning objectives (nodes) for the skill "${this.rootSkill}" ${parentContext}.

                    <EXISTING_NODES>
                    These nodes already exist:
                    ${existingNodes.map(node => `- ${node}`).join('\n')}
                    </EXISTING_NODES>

                    <REQUIREMENTS>
                    - Each node must be a measurable learning objective starting with "Can" (e.g., "Can write a for loop")
                    - Nodes should span different difficulty levels from basic to advanced
                    - Do not repeat existing nodes
                    - If you can't think of meaningful new nodes, return type: "generation-complete"
                    - Otherwise return type: "add-nodes" with new nodes
                    - Focus on creating comprehensive, well-defined learning objectives
                    - Include both theoretical and practical skills
                    </REQUIREMENTS>
                </YOUR_TASK>


                ${this.getContextSection()}
            `),
            schema: z.object({
                result: z.union([
                    z.object({
                        type: z.literal('generation-complete')
                    }),
                    z.object({
                        type: z.literal('add-nodes'),
                        nodes: z.array(z.string())
                    })
                ])
            }),
            model: 'openai:gpt-4o-mini-2024-07-18',
            temperature,
            mode: 'json',
            providerArgs: {
                structuredOutputs: true
            }
        });
    }

    private async generateEdges({
        nodes,
        existingEdges,
        temperature
    }: {
        nodes: string[],
        existingEdges: SkillGraphEdge[],
        temperature: number
    }) {
        const parentContext = this.parentSkills.length ? 
            `in the context of: ${this.parentSkills.map(skill => `"${skill}"`).join(', ')}` : '';

        return this.ai.genObject({
            prompt: trimAllLines(`
                <YOUR_TASK>
                Create prerequisite relationships between learning objectives for the subject "${this.rootSkill}" ${parentContext}.

                

                <REQUIREMENTS>
                - The ROOT SKILL
                - Each edge must connect two existing nodes
                - The relationship must be logically necessary (prereq truly enables the other skill)
                - Assign appropriate difficulty levels (INTRO, BASIC, INTERMEDIATE, ADVANCED, MASTER)
                - Avoid cycles in prerequisites
                - If you can't think of meaningful new edges, return type: "generation-complete"
                - Otherwise return type: "add-edges" with new edges
                - Consider both direct and indirect prerequisites
                - Ensure a clear learning progression
                </REQUIREMENTS>

                </YOUR_TASK>
                    <AVAILABLE_NODES>
                    ${nodes.map(node => `- ${node}`).join('\n')}
                    </AVAILABLE_NODES>

                    <EXISTING_EDGES>
                    ${existingEdges.map(edge => 
                        `- ${edge.prereq} enables ${edge.enables}`
                    ).join('\n')}
                    </EXISTING_EDGES>
                <CURRENT_TREE>

                ${this.getContextSection()}
            `),
            schema: z.object({
                result: z.union([
                    z.object({
                        type: z.literal('generation-complete')
                    }),
                    z.object({
                        type: z.literal('add-edges'),
                        edges: z.array(SkillGraphEdgeSchema.extend({
                            aiChainOfThought: z.string().describe('Explanation for why the prerequisite logically enables this other skill')
                        }))
                    })
                ])
            }),
            model: 'openai:gpt-4o-mini-2024-07-18',
            temperature,
            mode: 'json',
            providerArgs: {
                structuredOutputs: true
            }
        });
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
