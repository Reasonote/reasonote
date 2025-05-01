import { jsonSchema } from 'ai';
import _ from 'lodash';

import { trimAllLines } from '@lukebechtel/lab-ts-utils';
import { AIGenerator } from '@reasonote/lib-ai-common';

import { giveFeedbackOnSkillTree } from '../feedback/giveFeedbackOnSkillTree';
import { FillSubskillTreeResult } from './interfaces';

export interface FillSubskillTreeArgs {
    ai: AIGenerator;
    skillName: string;
    parentSkillNames?: string[];
    existingSkillTree?: string;
    skillsToAdd?: { name: string }[];
    relevantDocuments?: { name: string; content: string }[];
    sourceActivities?: string;
    feedback?: string;
    shouldGiveFeedback?: boolean;
}

export async function fillSubskillTree({
    ai,
    skillName,
    parentSkillNames = [],
    existingSkillTree = "",
    skillsToAdd = [],
    relevantDocuments = [],
    sourceActivities = '',
    feedback,
    shouldGiveFeedback = true,
}: FillSubskillTreeArgs): Promise<FillSubskillTreeResult> {
    const parentContextString = parentSkillNames.length ? `In the context of: ${parentSkillNames.join(',')}` : '';

    const aiResult = await ai.genObject<FillSubskillTreeResult>({
        prompt: trimAllLines(`
            <YOUR_ROLE>
            You are very good at breaking concepts down into smaller pieces.

            ${feedback ? `
              <FEEDBACK>
                You have been given feedback on the existing skill tree, and you should use that feedback to improve the skill tree, while meeting other requirements.
                
                ${feedback}
              </FEEDBACK>
            ` : ''}

            </YOUR_ROLE>

            <YOUR_TASK>
                You are going to break down the skill "${skillName}" ${parentContextString} into smaller learning objectives.

                <REQUIREMENTS>
                    <LEARNING_OBJECTIVES>
                        Skill Names (except the root) must ALWAYS be learning objectives, and must ALWAYS start with the word "Can".
                    </LEARNING_OBJECTIVES>

                    <SKILL_LEVELS>   
                        For each skill that you create subskills for, you should ensure you label the skills as the correct level based on the DIRECT parent.
                    </SKILL_LEVELS>

                    <SKILL_DIVERSITY>
                        When you create subskills, you should try to diversify them in skill level -- i.e. you should generate some INTRO, some BASIC, some INTERMEDIATE, some ADVANCED, and some MASTER.
                    </SKILL_DIVERSITY>

                    <TREE_DONE>
                        IF THE TREE IS ALREADY COMPLETE, YOU CAN SAY "TREE_IS_DONE".
                    </TREE_DONE>
                </REQUIREMENTS>
            </YOUR_TASK>
            
            <CONTEXT>
            ${relevantDocuments.length ? `
                Several Relevant documents to the skill have been provided as context, which define what the skill covers.
            ` : ''}

            ${sourceActivities.length ? `
            ## CONTEXT ACTIVITIES
            Several activities have been provided as well. The skill tree created should include places for ALL of these activities.

            <CONTEXT_ACTIVITIES>
            ${sourceActivities}
            </CONTEXT_ACTIVITIES>
            ` : ''}
            </CONTEXT>

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

            <EXISTING_SKILL_TREE>
                Provided, you can see that the skill "${skillName}" (${parentContextString}) is broken down into the following skills:
                
                ${existingSkillTree}
            </EXISTING_SKILL_TREE>

            ${relevantDocuments.length ? `
                ## Relevant Documents
                ${relevantDocuments.map((doc) => `
                    ### ${doc.name}
                    ${doc.content}
                `).join('\n')}
            ` : ''}

            <SKILLS_TO_ADD>
                In addition to the skills above, and whatever skills you decide to add, you should also add the following skills to the tree:
                
                ${skillsToAdd.map((sk) => `- "${sk.name}"`).join('\n')}
            </SKILLS_TO_ADD>

            <FINAL_NOTES>
                - You should try to create subskills that are at different levels.
                - You MUST add the skills that need placing.
                - Remember, IF (and ONLY IF) the tree is already complete, you can say "TREE_IS_DONE" to finish the tree.
            </FINAL_NOTES>
        `),
        functionName: "outputMoreSkills",
        functionDescription: "Output more skills, or DONE if done.",
        schema: jsonSchema({
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "additionalProperties": false,
            "definitions": {
              "SkillTreeNode": {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "subskills": {
                    "additionalProperties": false,
                    "anyOf": [
                      { 
                        "type": "null",
                        "additionalProperties": false,
                      },
                      {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                          "INTRO": {
                            "anyOf": [
                              {
                                "type": "null"
                              },
                              {
                                "type": "array",
                                "items": {
                                  "$ref": "#/definitions/SkillTreeNode"
                                }
                              }
                            ]
                          },
                          "BASIC": {
                            "anyOf": [
                              {
                                "type": "null"
                              },
                              {
                                "type": "array",
                                "items": {
                                  "$ref": "#/definitions/SkillTreeNode"
                                }
                              }
                            ]
                          },
                          "INTERMEDIATE": {
                            "anyOf": [
                              {
                                "type": "null"
                              },
                              {
                                "type": "array",
                                "items": {
                                  "$ref": "#/definitions/SkillTreeNode"
                                }
                              }
                            ]
                          },
                          "ADVANCED": {
                            "anyOf": [
                              {
                                "type": "null"
                              },
                              {
                                "type": "array",
                                "items": {
                                  "$ref": "#/definitions/SkillTreeNode"
                                }
                              }
                            ]
                          },
                          "MASTER": {
                            "anyOf": [
                              {
                                "type": "null"
                              },
                              {
                                "type": "array",
                                "items": {
                                  "$ref": "#/definitions/SkillTreeNode"
                                }
                              }
                            ]
                          }
                        },
                        "required": ["INTRO", "BASIC", "INTERMEDIATE", "ADVANCED", "MASTER"]
                      }
                    ]
                  }
                },
                "required": ["name", "subskills"]
              }
            },
            "properties": {
              "resultType": {
                "type": "string",
                "enum": ["TREE_IS_DONE", "ENHANCE_TREE"],
                "description": "The type of result to return -- if TREE_IS_DONE, subskills can be set to null."
              },
              "adjustedRootSkill": {
                
                "anyOf": [
                  {
                    "type": "null"
                  },
                  {
                    "$ref": "#/definitions/SkillTreeNode"
                  }
                ],
                "additionalProperties": false,
                "description": "The changes to the skill tree. Only set if resultType is ENHANCE_TREE."
              }
            },
            "required": ["resultType", "adjustedRootSkill"]
          }),
        model: 'openai:gpt-4o-mini-2024-07-18',
        mode: 'json',
        providerArgs: {
            structuredOutputs: true,
        }
    });

    const initialResult = aiResult.object;

    if (!initialResult.adjustedRootSkill) {
        return initialResult;
    }

    // If feedback is disabled, return the result.
    if (!shouldGiveFeedback) {
        return initialResult;
    }

    console.log('initialResult', JSON.stringify(initialResult, null, 2));
    
    // If there's feedback, generate it, and call this recursively with shouldGiveFeedback set to false.
    const initialFeedback = await giveFeedbackOnSkillTree({
        ai,
        rootSkill: initialResult.adjustedRootSkill,
    });


    console.log('initialFeedback', JSON.stringify(initialFeedback, null, 2));
    
    const resultAfterFeedback = await fillSubskillTree({
        ai,
        skillName,
        parentSkillNames,
        existingSkillTree,
        skillsToAdd,
        feedback: JSON.stringify(initialFeedback),
        shouldGiveFeedback: false,
    });

    console.log('resultAfterFeedback', JSON.stringify(resultAfterFeedback, null, 2));

    return resultAfterFeedback;
} 