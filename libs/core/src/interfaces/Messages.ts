import { z } from "zod";

export const AuthorSchema = z.object({
    id: z.string(),
    name: z.string(),
    avatarUrl: z.string(),
    description: z.string(),
    prompt: z.string(),
});
export type Author = z.infer<typeof AuthorSchema>;

export const MessageWithAuthorSchema = z
    .object({
        id: z.string(),
        author: AuthorSchema,
        role: z.enum(["user", "system", "assistant"]),
        content: z.string(),
    })
    .passthrough();
export type MessageWithAuthor = z.infer<typeof MessageWithAuthorSchema>;