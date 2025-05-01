import {
  SkillTreeLevel,
  SkillTreeNode,
} from '../skills/skillTrees/interfaces';
import {
  PrereqSkillTree,
  prereqSkillTreeToSkillTree,
  skillTreeToPrereqSkillTree,
} from './prereqSkillTree';

describe('prereqSkillTree utils', () => {
    describe('prereqSkillTreeToSkillTree', () => {
        it('should convert a simple prereq tree to a skill tree', () => {
            const prereqTree: PrereqSkillTree = {
                skills: [
                    {
                        name: "Programming",
                        prerequisites: []
                    },
                    {
                        name: "Variables",
                        prerequisites: [{
                            name: "Programming",
                            levelOnParent: "INTRO" as SkillTreeLevel
                        }]
                    },
                    {
                        name: "Functions",
                        prerequisites: [{
                            name: "Programming",
                            levelOnParent: "BASIC" as SkillTreeLevel
                        }]
                    }
                ]
            };

            const expected: SkillTreeNode = {
                name: "Programming",
                subskills: {
                    INTRO: [{
                        name: "Variables",
                        subskills: null
                    }],
                    BASIC: [{
                        name: "Functions",
                        subskills: null
                    }],
                    INTERMEDIATE: null,
                    ADVANCED: null,
                    MASTER: null
                }
            };

            expect(prereqSkillTreeToSkillTree(prereqTree)).toEqual(expected);
        });

        it('should throw error when multiple root nodes are found', () => {
            const prereqTree: PrereqSkillTree = {
                skills: [
                    {
                        name: "Programming",
                        prerequisites: []
                    },
                    {
                        name: "Math",
                        prerequisites: []
                    }
                ]
            };

            expect(() => prereqSkillTreeToSkillTree(prereqTree))
                .toThrow('Expected exactly one root node, found 2');
        });

        it('should throw error when prerequisite node is missing', () => {
            const prereqTree: PrereqSkillTree = {
                skills: [
                    {
                        name: "Variables",
                        prerequisites: [{
                            name: "Programming",
                            levelOnParent: "INTRO" as SkillTreeLevel
                        }]
                    }
                ]
            };

            expect(() => prereqSkillTreeToSkillTree(prereqTree))
                .toThrow('Prerequisite node not found: Programming');
        });
    });

    describe('skillTreeToPrereqSkillTree', () => {
        it('should convert a simple skill tree to a prereq tree', () => {
            const skillTree: SkillTreeNode = {
                name: "Programming",
                subskills: {
                    INTRO: [{
                        name: "Variables",
                        subskills: null
                    }],
                    BASIC: [{
                        name: "Functions",
                        subskills: null
                    }],
                    INTERMEDIATE: null,
                    ADVANCED: null,
                    MASTER: null
                }
            };

            const expected: PrereqSkillTree = {
                skills: [
                    {
                        name: "Programming",
                        prerequisites: []
                    },
                    {
                        name: "Variables",
                        prerequisites: [{
                            name: "Programming",
                            levelOnParent: "INTRO"
                        }]
                    },
                    {
                        name: "Functions",
                        prerequisites: [{
                            name: "Programming",
                            levelOnParent: "BASIC"
                        }]
                    }
                ]
            };

            expect(skillTreeToPrereqSkillTree(skillTree)).toEqual(expected);
        });

        it('should handle deeply nested skill trees', () => {
            const skillTree: SkillTreeNode = {
                name: "Programming",
                subskills: {
                    INTRO: [{
                        name: "Variables",
                        subskills: {
                            INTRO: [{
                                name: "Declaration",
                                subskills: null
                            }],
                            BASIC: null,
                            INTERMEDIATE: null,
                            ADVANCED: null,
                            MASTER: null
                        }
                    }],
                    BASIC: null,
                    INTERMEDIATE: null,
                    ADVANCED: null,
                    MASTER: null
                }
            };

            const result = skillTreeToPrereqSkillTree(skillTree);

            expect(result.skills).toHaveLength(3);
            expect(result.skills).toContainEqual({
                name: "Declaration",
                prerequisites: [{
                    name: "Variables",
                    levelOnParent: "INTRO"
                }]
            });
        });
    });
}); 