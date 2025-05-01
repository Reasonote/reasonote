import {z} from "zod";

export const OldSkillLevels = ["INTRO", "BASIC", "INTERMEDIATE", "ADVANCED", "MASTER"] as const;
export const OldSkillLevelSchema = z.enum(OldSkillLevels);
export type OldSkillLevel = z.infer<typeof OldSkillLevelSchema>;

// export type NewSkillLevel = const idxOfAttested = ["beginner", "novice", "adept", "pro", "expert"].indexOf(attestedLevel);

export const SkillLevelDefiniteSchema = z.enum(["BEGINNER", "NOVICE", "ADEPT", "PRO", "EXPERT"] as const);
export type SkillLevelDefinite = z.infer<typeof SkillLevelDefiniteSchema>;

export const SkillLevels = ["UNKNOWN", "BEGINNER", "NOVICE", "ADEPT", "PRO", "EXPERT"] as const;
export const SkillLevelSchema = z.enum(SkillLevels);
export type SkillLevel = z.infer<typeof SkillLevelSchema>;

export const OldSkillLevelToNewSkillLevelMap = {
    INTRO: "BEGINNER",
    BASIC: "NOVICE",
    INTERMEDIATE: "ADEPT",
    ADVANCED: "PRO",
    MASTER: "EXPERT",
} as const;

export const NewSkillLevelToOldSkillLevelMap = {
    BEGINNER: "INTRO",
    NOVICE: "BASIC",
    ADEPT: "INTERMEDIATE",
    PRO: "ADVANCED",
    EXPERT: "MASTER",
} as const;