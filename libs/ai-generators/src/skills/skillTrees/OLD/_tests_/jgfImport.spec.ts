import { AIGenerator } from '@reasonote/lib-ai-common';

import { JGFSimple } from '../../../../utils/jgf';
import { SkillTreeNode } from '../../interfaces';
import { AIGenSkillTree } from '../AIGenSkillTree';

describe('JGFSimple Import', () => {
    let aiGen: AIGenerator;
    
    beforeEach(() => {
        aiGen = {} as AIGenerator; // Mock AIGenerator since we don't need it for these tests
    });

    it('should convert a simple prerequisite chain', () => {
        const simpleChain: JGFSimple = {
            graph: {
                nodes: [
                    { id: "Mathematics" },
                    { id: "Can do basic algebra" },
                    { id: "Can solve quadratic equations" }
                ],
                edges: [
                    { prereq: "Can do basic algebra", enables: "Can solve quadratic equations", level: "BEGINNER" },
                    { prereq: "Mathematics", enables: "Can do basic algebra", level: "BEGINNER" }
                ]
            }
        };

        const skillTree = AIGenSkillTree.fromSkillTreeNode({
            ai: aiGen,
            skillTree: { name: "Mathematics", subskills: null }
        });

        skillTree.loadFromJGFSimple(simpleChain);

        const expected: SkillTreeNode = {
            name: "Can solve quadratic equations",
            subskills: {
                INTRO: null,
                BASIC: [
                    {
                        name: "Can do basic algebra",
                        subskills: {
                            INTRO: null,
                            BASIC: [
                                {
                                    name: "Mathematics",
                                    subskills: null
                                }
                            ],
                            INTERMEDIATE: null,
                            ADVANCED: null,
                            MASTER: null
                        }
                    }
                ],
                INTERMEDIATE: null,
                ADVANCED: null,
                MASTER: null
            }
        };

        expect(skillTree['rootSkill']).toEqual(expected);
    });

    it('should handle multiple prerequisites for a single skill', () => {
        const multiplePrereqs: JGFSimple = {
            graph: {
                nodes: [
                    { id: "Can write complex programs" },
                    { id: "Can write functions" },
                    { id: "Can use variables" },
                    { id: "Can use control flow" }
                ],
                edges: [
                    { prereq: "Can write functions", enables: "Can write complex programs", level: "BEGINNER" },
                    { prereq: "Can use variables", enables: "Can write complex programs", level: "BEGINNER" },
                    { prereq: "Can use control flow", enables: "Can write complex programs", level: "BEGINNER" }
                ]
            }
        };

        const skillTree = AIGenSkillTree.fromSkillTreeNode({
            ai: aiGen,
            skillTree: { name: "Programming", subskills: null }
        });

        skillTree.loadFromJGFSimple(multiplePrereqs);

        const expected: SkillTreeNode = {
            name: "Can write complex programs",
            subskills: {
                INTRO: null,
                BASIC: [
                    {
                        name: "Can write functions",
                        subskills: null
                    },
                    {
                        name: "Can use variables",
                        subskills: null
                    },
                    {
                        name: "Can use control flow",
                        subskills: null
                    }
                ],
                INTERMEDIATE: null,
                ADVANCED: null,
                MASTER: null
            }
        };

        expect(skillTree['rootSkill']).toEqual(expected);
    });

    it('should throw error when no root node is found', () => {
        const cyclicGraph: JGFSimple = {
            graph: {
                nodes: [
                    { id: "A" },
                    { id: "B" }
                ],
                edges: [
                    { prereq: "A", enables: "B", level: "BEGINNER" },
                    { prereq: "B", enables: "A", level: "BEGINNER" }
                ]
            }
        };

        const skillTree = AIGenSkillTree.fromSkillTreeNode({
            ai: aiGen,
            skillTree: { name: "Test", subskills: null }
        });

        expect(() => skillTree.loadFromJGFSimple(cyclicGraph))
            .toThrow('No root node found in graph');
    });

    it('should handle a single node graph', () => {
        const singleNode: JGFSimple = {
            graph: {
                nodes: [{ id: "Single Skill" }],
                edges: []
            }
        };

        const skillTree = AIGenSkillTree.fromSkillTreeNode({
            ai: aiGen,
            skillTree: { name: "Test", subskills: null }
        });

        skillTree.loadFromJGFSimple(singleNode);

        const expected: SkillTreeNode = {
            name: "Single Skill",
            subskills: null
        };

        expect(skillTree['rootSkill']).toEqual(expected);
    });
}); 