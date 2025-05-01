import {
  ChooseTheBlankActivityTypeDefinition,
  FillInTheBlankActivityTypeDefinition,
  FlashcardActivityTypeDefinition,
  MultipleChoiceActivityTypeDefinition,
  NarrativeActivityTypeDefinition,
  RoleplayActivityTypeDefinition,
  SequenceActivityTypeDefinition,
  ShortAnswerActivityTypeDefinition,
  SlideActivityTypeDefinition,
  SocraticActivityTypeDefinition,
  TeachTheAIActivityTypeDefinition,
  TermMatchingActivityTypeDefinition,
} from "@reasonote/activity-definitions";
import {ValidActivityTypeDefinition} from "@reasonote/core";

export interface GetActivityTypeDefinitionArgs {
    activityType: string | null | undefined;
}

export async function getActivityTypeDefinition({ activityType }: GetActivityTypeDefinitionArgs): Promise<ValidActivityTypeDefinition<any, any> | undefined> { 
    // TODO: in the future, we'll fetch our activity types from supabase.
    // For now, they are hardcoded.
    const activityTypeDefinitions = [
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
    ];

    return activityTypeDefinitions.find((atc) => atc.type === activityType);
}