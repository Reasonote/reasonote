import {z} from "zod";

export const UserFeelingSchema = z.object({
    /** The ID of the feeling */
    id: z.string(),
    /** The name of the subject */
    subject_name: z.string(),
    /** The type of the subject */
    subject_type: z.string(),
    /** How the user feels about the subject */
    feeling: z.string(),
});
export type UserFeeling = z.infer<typeof UserFeelingSchema>;