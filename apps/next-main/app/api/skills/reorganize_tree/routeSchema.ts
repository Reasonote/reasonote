import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

// Request schema
export const SkillsReorganizeTreeRouteRequestSchema = z.object({
    skillId: z.string().describe("The ID of the root skill of the tree to reorganize"),
    userId: z.string().describe("The ID of the user who owns this skill tree"),
});

export type SkillsReorganizeTreeRouteRequest = z.infer<typeof SkillsReorganizeTreeRouteRequestSchema>;

export const SkillLevelsList = ["INTRO", "BASIC", "INTERMEDIATE", "ADVANCED", "MASTER"] as const;

// Define the level enum
export const SkillLevel = z.enum(SkillLevelsList);

// Define move and create operation schemas
export const MoveOperationSchema = z.object({
    type: z.literal("move"),
    skillNames: z.array(z.string()).describe('The EXACT names of the skills to move'),
    newParentName: z.string().describe('The EXACT name of the new parent skill'),
    newLevel: SkillLevel.describe('The new level of the skills on the parent'),
});
export type MoveOperation = z.infer<typeof MoveOperationSchema>;

export const CreateOperationSchema = z.object({
    type: z.literal("create"),
    newSkillName: z.string(),
    parentName: z.string().describe('The EXACT name of the parent skill'),
    newLevel: SkillLevel,
});
export type CreateOperation = z.infer<typeof CreateOperationSchema>;

// Combine into a union type
export const OperationSchema = z.discriminatedUnion("type", [MoveOperationSchema, CreateOperationSchema]);
export type Operation = z.infer<typeof OperationSchema>;


// Response schema
export const SkillsReorganizeTreeRouteResponseSchema = z.object({
    operations: z.array(OperationSchema),
    updatedTreeString: z.string(),
});

export const SkillsReorganizeTreeRoute = new ApiRoute({
    path: "/api/skills/reorganize_tree",
    method: "post",
    requestSchema: SkillsReorganizeTreeRouteRequestSchema,
    responseSchema: SkillsReorganizeTreeRouteResponseSchema,
});