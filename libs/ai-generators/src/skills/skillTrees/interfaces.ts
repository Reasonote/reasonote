import { z } from 'zod';

import { JSONSchema7 } from '@ai-sdk/provider';
import { SkillLevelSchema } from '@reasonote/core';

export const skillTreeNodeBaseSchema = z.object({
    name: z.string(),
});

export type SkillTreeNode = z.infer<typeof skillTreeNodeBaseSchema> & {
    subskills: {
        INTRO: SkillTreeNode[] | null;
        BASIC: SkillTreeNode[] | null;
        INTERMEDIATE: SkillTreeNode[] | null;
        ADVANCED: SkillTreeNode[] | null;
        MASTER: SkillTreeNode[] | null;
    } | null;
};

export const skillTreeNodeSchema: z.ZodType<SkillTreeNode> = skillTreeNodeBaseSchema.extend({
    subskills: z.object({
        INTRO: z.lazy(() => skillTreeNodeSchema.array().nullable()),
        BASIC: z.lazy(() => skillTreeNodeSchema.array().nullable()),
        INTERMEDIATE: z.lazy(() => skillTreeNodeSchema.array().nullable()),
        ADVANCED: z.lazy(() => skillTreeNodeSchema.array().nullable()),
        MASTER: z.lazy(() => skillTreeNodeSchema.array().nullable()),
    }).nullable()
});

export const FlatSkillTreeNodeSchema = z.object({
    name: z.string(),
    prerequisites: z.array(z.string()),
});

export type InitializeSkillTreeAIOutput = {
    resultType: 'TREE_IS_DONE' | 'ENHANCE_TREE';
    rootSkill: SkillTreeNode | null;
}

export const SkillTreeLevelSchema = z.enum(['INTRO', 'BASIC', 'INTERMEDIATE', 'ADVANCED', 'MASTER']);

export type SkillTreeLevel = z.infer<typeof SkillTreeLevelSchema>
// We must use JSON Schema, rather than Zod, because Recursive Zod schemas are not supported.
export const InitializeSkillTreeAIOutputJsonSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#" as const,
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
      "rootSkill": {
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
    required: ["resultType", "rootSkill"]
} as JSONSchema7;

export type PrerequisiteAdjustmentType = 'ADD_PREREQUISITE' | 'REMOVE_PREREQUISITE' | 'MODIFY_PREREQUISITE';

export interface PrerequisiteAdjustment {
    type: PrerequisiteAdjustmentType;
    enables: string;  // The skill that requires prerequisites
    prereq: string;   // The prerequisite skill
    level?: string;   // The new level (for ADD or MODIFY)
    reason: string;   // Why this adjustment is being made
}

export const PrerequisiteAdjustmentSchema = z.object({
    type: z.enum(['ADD_PREREQUISITE', 'REMOVE_PREREQUISITE', 'MODIFY_PREREQUISITE'])
        .describe('The type of adjustment to make'),
    enables: z.string()
        .describe('The skill that requires prerequisites'),
    prereq: z.string()
        .describe('The prerequisite skill'),
    level: SkillTreeLevelSchema.nullable()
        .describe('The new level (for ADD or MODIFY)'),
    reason: z.string()
        .describe('Why this adjustment is being made'),
});

export const PrerequisiteAdjustmentsSchema = z.object({
    adjustments: z.array(PrerequisiteAdjustmentSchema)
        .describe('List of prerequisite adjustments to make'),
});

