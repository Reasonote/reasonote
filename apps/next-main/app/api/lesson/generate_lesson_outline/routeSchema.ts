import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const GenerateLessonOutlineRoute = new ApiRoute({
    path: "/api/lesson/generate_lesson_outline",
    method: "post",
    requestSchema: z.object({
        lessonSkillId: z.string(),
        numActivitiesPerPart: z.number(),
    }),
    responseSchema: z.object({
        lessonId: z.string(),
        lessonParts: z.array(z.object({
            learningObjectives: z.array(z.string()),
            keyPoints: z.array(z.string()),
            examples: z.array(z.string()),
            expertQuestions: z.array(z.string()),
        })),
    }),
});