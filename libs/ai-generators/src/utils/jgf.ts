import { SkillLevelSchema } from '@reasonote/core';
import { z } from 'zod';

export const JGFNodeSchema = z.object({
  id: z.string().describe('The id of the node.'),
  label: z.string().optional().describe('The label of the node.'),
  metadata: z.record(z.any()).optional().describe('The metadata of the node.'),
})

export const JGFEdgeSchema = z.object({
  prereq: z.string().describe('The prerequisite skill.'),
  enables: z.string().describe('The skill that this prerequisite enables.'),
  relation: z.string().optional().describe('The relation between the prereq and enabled skills.'),
  metadata: z.record(z.any()).optional().describe('The metadata of the edge.'),
})

export const JGFSchema = z.object({
  graph: z.object({
    directed: z.boolean().optional().default(false).describe('Whether the graph is directed.'),
    type: z.string().optional().describe('The type of the graph.'),
    label: z.string().optional().describe('The label of the graph.'),
    metadata: z.record(z.any()).optional().describe('The metadata of the graph.'),
    nodes: z.array(JGFNodeSchema).describe('The nodes in the graph.'),
    edges: z.array(JGFEdgeSchema).describe('The edges in the graph.'),
  })
})

// Example type inference
export type JGF = z.infer<typeof JGFSchema>

export const JGFSimpleNodeSchema = z.object({
    id: z.string().describe('The id of the node.'),
});

export type JGFSimpleNode = z.infer<typeof JGFSimpleNodeSchema>

export const JGFSimpleEdgeSchema = z.object({
    prereq: z.string().describe('The prerequisite skill.'),
    enables: z.string().describe('The skill that this prerequisite enables.'),
    level: SkillLevelSchema.nullable().describe('The level of the prerequisite skill.'),
});

export const JGFSimpleGraphSchema = z.object({
    nodes: z.array(JGFSimpleNodeSchema).describe('The nodes in the graph.'),
    edges: z.array(JGFSimpleEdgeSchema).describe('The edges in the graph.'),
});
export type JGFSimpleGraph = z.infer<typeof JGFSimpleGraphSchema>

export const JGFSimpleSchema = z.object({
    graph: JGFSimpleGraphSchema.describe('A simple graph with nodes and edges.'),
});
export type JGFSimple = z.infer<typeof JGFSimpleSchema>