import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const GenerateLessonRoute = new ApiRoute({
    path: "/api/lesson/generate_lesson",
    method: "post",
    requestSchema: z.object({
        lessonId: z.string(),
        lessonSkillId: z.string(),
        numActivitiesPerPart: z.number(),
        lessonParts: z.array(z.object({
            learningObjectives: z.array(z.string()),
            keyPoints: z.array(z.string()),
            examples: z.array(z.string()),
            expertQuestions: z.array(z.string()),
        })),
    }),
    responseSchema: z.object({
        activities: z.array(z.object({
            id: z.string(),
            type: z.string(),
        })),
    }),
});
