import { ValidActivityTypeDefinition } from "@reasonote/core";

import {
    ChooseTheBlankActivityTypeDefinition,
} from "./ChooseTheBlankActivityTypeDefinition";
import {
    FillInTheBlankActivityTypeDefinition,
} from "./FillInTheBlankActivityTypeDefinition";
import {
    FlashcardActivityTypeDefinition,
} from "./FlashcardActivityTypeDefinition";
import {
    MultipleChoiceActivityTypeDefinition,
} from "./MultipleChoiceActivityTypeDefinition";
import {
    NarrativeActivityTypeDefinition,
} from "./NarrativeActivityTypeDefinition";
import {
    RoleplayActivityTypeDefinition,
} from "./RoleplayActivityTypeDefinition";
import {
    SequenceActivityTypeDefinition,
} from "./SequenceActivityTypeDefinition";
import {
    ShortAnswerActivityTypeDefinition,
} from "./ShortAnswerActivityTypeDefinition";
import { SlideActivityTypeDefinition } from "./SlideActivityTypeDefinition";
import {
    SocraticActivityTypeDefinition,
} from "./SocraticActivityTypeDefinition";
import {
    TeachTheAIActivityTypeDefinition,
} from "./TeachTheAIActivityTypeDefinition";
import {
    TermMatchingActivityTypeDefinition,
} from "./TermMatchingActivityTypeDefinition";

export * from './FillInTheBlankActivityTypeDefinition';
export * from './FlashcardActivityTypeDefinition';
export * from './MultipleChoiceActivityTypeDefinition';
export * from './NarrativeActivityTypeDefinition';
export * from './RoleplayActivityTypeDefinition';
export * from './SlideActivityTypeDefinition';
export * from './TeachTheAIActivityTypeDefinition';
export * from './ShortAnswerActivityTypeDefinition';
export * from './SocraticActivityTypeDefinition';
export * from './TermMatchingActivityTypeDefinition';
export * from './ActivityResult';
export * from './ChooseTheBlankActivityTypeDefinition';
export * from './SequenceActivityTypeDefinition';


export const AllActivityTypeDefinitions = [
    FillInTheBlankActivityTypeDefinition,
    FlashcardActivityTypeDefinition,
    MultipleChoiceActivityTypeDefinition,
    NarrativeActivityTypeDefinition,
    RoleplayActivityTypeDefinition,
    SequenceActivityTypeDefinition,
    SlideActivityTypeDefinition,
    TeachTheAIActivityTypeDefinition,
    ShortAnswerActivityTypeDefinition,
    SocraticActivityTypeDefinition,
    TermMatchingActivityTypeDefinition,
    ChooseTheBlankActivityTypeDefinition,
] as ValidActivityTypeDefinition<any, any>[];
