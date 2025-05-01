import { z } from "zod";
import { ApiRoute } from "@reasonote/lib-api-sdk";
import { CourseSchema } from "./types";

export const GetCourseRoute = new ApiRoute({
    path: "/api/courses/get",
    method: "post",
    requestSchema: z.object({
        courseId: z.string().optional(),
    }),
    responseSchema: z.object({
        courses: z.array(CourseSchema),
    }),
}); 