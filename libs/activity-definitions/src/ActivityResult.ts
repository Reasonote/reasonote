import { z } from "zod";

import { ActivityResultSkippedBaseSchema } from "@reasonote/core";

import {
    ChooseTheBlankActivityResultSchema,
    FillInTheBlankActivityResultSchema,
    FlashcardResultSchema,
    MultipleChoiceResultSchema,
    RoleplayResultSchema,
    SequenceResultSchema,
    ShortAnswerActivityResultSchema,
    SlideResultSchema,
    SocraticResultSchema,
    TeachTheAIResultSchema,
    TermMatchingActivityResultSchema,
} from "./index";

export const ActivityResultSchema = z.union([
    FillInTheBlankActivityResultSchema,
    MultipleChoiceResultSchema,
    TeachTheAIResultSchema,
    SlideResultSchema,
    FlashcardResultSchema,
    RoleplayResultSchema,
    ActivityResultSkippedBaseSchema,
    ShortAnswerActivityResultSchema,
    TermMatchingActivityResultSchema,
    SocraticResultSchema,
    ChooseTheBlankActivityResultSchema,
    SequenceResultSchema,
]);
export type ActivityResult = z.infer<typeof ActivityResultSchema>;