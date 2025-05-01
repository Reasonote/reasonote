import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const UserProfilePictureUploadRouteResponseSchema = z.object({
  profile_image_url: z.string(),
});
export type UserProfilePictureUploadRouteResponse = z.infer<typeof UserProfilePictureUploadRouteResponseSchema>;

export const UserProfilePictureUploadRouteRequestSchema = z.object({
  body: z.instanceof(FormData),
});

export const UserProfilePictureUploadRoute = new ApiRoute({
  path: "/api/user_profile/picture/upload",
  method: "post",
  requestSchema: UserProfilePictureUploadRouteRequestSchema,
  responseSchema: UserProfilePictureUploadRouteResponseSchema,
}); 