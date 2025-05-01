import { z } from "zod";
import { ApiRoute } from "@reasonote/lib-api-sdk";

export const UploadCourseCoverImageRoute = new ApiRoute({
    path: "/api/courses/upload_cover_image",
    method: "post",
    requestSchema: z.object({
        courseId: z.string(),
        fileName: z.string(),
        fileType: z.string(),
        fileData: z.string(), // Base64 encoded file data
    }),
    responseSchema: z.object({
        image_url: z.string(),
    }),
}); 