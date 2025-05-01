import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const GenerateSkillModulesRoute = new ApiRoute({
    path: "/api/skills/generate_skill_modules",
    method: "post",
    requestSchema: z.object({
        rootSkillId: z.string(),
    }),
    responseSchema: z.object({
        modules: z.array(z.object({
            moduleName: z.string(),
            subModules: z.array(z.object({
                subModuleName: z.string(),
                lessons: z.array(z.object({
                    lessonName: z.string(),
                    learningObjectives: z.array(z.string()),
                    prerequisites: z.array(z.string()),
                })),
            })),
        })),
    }),
});