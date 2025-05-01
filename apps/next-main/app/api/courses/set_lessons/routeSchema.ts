import { z } from "zod";
import { ApiRoute } from "@reasonote/lib-api-sdk";
import { LessonSchema } from "../get/types";

export const SetCourseLessonsRoute = new ApiRoute({
    path: "/api/courses/set_lessons",
    method: "post",
    requestSchema: z.object({
        courseId: z.string(),
        lessons: z.array(LessonSchema),
    }),
    responseSchema: z.object({
        lessons: z.array(LessonSchema),
    }),
});