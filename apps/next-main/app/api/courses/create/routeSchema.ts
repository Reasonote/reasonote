import { z } from "zod";
import { ApiRoute } from "@reasonote/lib-api-sdk";

export const CreateCourseRoute = new ApiRoute({
    path: "/api/courses/create",
    method: "post",
    requestSchema: z.object({
        name: z.string(),
        description: z.string(),
        rootSkillName: z.string(),
    }),
    responseSchema: z.object({
        courseId: z.string(),
        rootSkillId: z.string(),
    }),
});