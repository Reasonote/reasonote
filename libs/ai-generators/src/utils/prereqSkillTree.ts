import { z } from 'zod';

import {
  SkillTreeLevel,
  SkillTreeLevelSchema,
  SkillTreeNode,
} from '../skills/skillTrees/interfaces';

export const PrereqSkillTreeNodeSchema = z.object({
    name: z.string().describe('The name of the skill.'),
    prerequisites: z.array(z.object({
        name: z.string().describe('The name of the prerequisite skill.'),
        levelOnParent: SkillTreeLevelSchema.describe('The level of the prerequisite skill on the parent in the skill tree.'),
    })).describe('The prerequisites for the skill.'),
});

export type PrereqSkillTreeNode = z.infer<typeof PrereqSkillTreeNodeSchema>

export const PrereqSkillTreeSchema = z.object({
    skills: z.array(PrereqSkillTreeNodeSchema).describe('The skills in the skill tree.'),
});

export type PrereqSkillTree = z.infer<typeof PrereqSkillTreeSchema>

export const PrereqSkillTreeSimpleNodeSchema = z.object({
    name: z.string().describe('The name of the skill.'),
    prerequisites: z.array(z.string()).describe('The names of the prerequisites for the skill.'),
});
export type PrereqSkillTreeSimpleNode = z.infer<typeof PrereqSkillTreeSimpleNodeSchema>;

export const PrereqSkillTreeSimpleSchema = z.object({
    skills: z.array(PrereqSkillTreeSimpleNodeSchema).describe('The skills in the skill tree.'),
});
export type PrereqSkillTreeSimple = z.infer<typeof PrereqSkillTreeSimpleSchema>;

export function simplePrereqSkillTreeToPrereqSkillTree(simple: PrereqSkillTreeSimple): PrereqSkillTree {
    return {
        skills: simple.skills.map(s => ({
            ...s,
            prerequisites: s.prerequisites.map(p => ({ name: p, levelOnParent: 'INTERMEDIATE' as SkillTreeLevel })),
        })),
    };
}

export function prereqSkillTreeToSkillTree(prereqSkillTree: PrereqSkillTree): SkillTreeNode {
    // Create a map of all nodes for easy lookup
    const nodeMap = new Map<string, PrereqSkillTreeNode>();
    prereqSkillTree.skills.forEach(node => nodeMap.set(node.name, node));

    // First validate that all prerequisites exist
    prereqSkillTree.skills.forEach(node => {
        node.prerequisites.forEach(prereq => {
            if (!nodeMap.has(prereq.name)) {
                throw new Error(`Prerequisite node not found: ${prereq.name}`);
            }
        });
    });

    // Find nodes that have prerequisites
    const hasPrereqs = new Set<string>();
    prereqSkillTree.skills.forEach(node => {
        node.prerequisites.forEach(prereq => {
            hasPrereqs.add(node.name);
        });
    });

    // Find the root node - it should be the only node that has no prerequisites
    const rootNodes = prereqSkillTree.skills.filter(node => !hasPrereqs.has(node.name));
    
    if (rootNodes.length !== 1) {
        throw new Error(`Expected exactly one root node, found ${rootNodes.length}`);
    }
    const rootNode = rootNodes[0];

    // Recursive function to build the skill tree
    function buildSkillTreeNode(nodeName: string): SkillTreeNode {
        const node = nodeMap.get(nodeName);
        if (!node) {
            throw new Error(`Prerequisite node not found: ${nodeName}`);
        }

        // Find all nodes that have this node as a prerequisite
        const childNodes = prereqSkillTree.skills.filter(n => 
            n.prerequisites.some(p => p.name === nodeName)
        );

        // Group children by their level on this node
        const subskillsByLevel: Record<SkillTreeLevel, SkillTreeNode[]> = {
            INTRO: [],
            BASIC: [],
            INTERMEDIATE: [],
            ADVANCED: [],
            MASTER: [],
        };

        // Process each child node
        childNodes.forEach(childNode => {
            const prereq = childNode.prerequisites.find(p => p.name === nodeName)!;
            const childSkillTree = buildSkillTreeNode(childNode.name);
            subskillsByLevel[prereq.levelOnParent].push(childSkillTree);
        });

        // Convert empty arrays to null
        const subskills = Object.entries(subskillsByLevel).reduce((acc, [level, skills]) => {
            acc[level as SkillTreeLevel] = skills.length > 0 ? skills : null;
            return acc;
        }, {} as Record<SkillTreeLevel, SkillTreeNode[] | null>);

        return {
            name: node.name,
            subskills: Object.values(subskills).some(s => s !== null) ? subskills : null,
        };
    }

    // Build the tree starting from the root node
    return buildSkillTreeNode(rootNode.name);
}

export function skillTreeToPrereqSkillTree(skillTree: SkillTreeNode): PrereqSkillTree {
    const nodes: PrereqSkillTreeNode[] = [];
    
    // Recursive function to process each node
    function processNode(node: SkillTreeNode, parentName?: string, levelOnParent?: SkillTreeLevel) {
        // Create prerequisites array if this is a child node
        const prerequisites = parentName ? [{
            name: parentName,
            levelOnParent: levelOnParent!
        }] : [];

        // Add this node to our collection
        nodes.push({
            name: node.name,
            prerequisites
        });

        // Process all subskills if they exist
        if (node.subskills) {
            Object.entries(node.subskills).forEach(([level, skills]) => {
                if (skills) {
                    skills.forEach(skill => {
                        processNode(skill, node.name, level as SkillTreeLevel);
                    });
                }
            });
        }
    }

    processNode(skillTree);
    return { skills: nodes };
}