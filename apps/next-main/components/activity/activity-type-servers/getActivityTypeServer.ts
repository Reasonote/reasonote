import {
  ActivityTypeServerV2,
  ChooseTheBlankActivityTypeServerV2,
  FillInTheBlankActivityTypeServerV2,
  FlashcardActivityTypeServerV2,
  MultipleChoiceActivityTypeServerV2,
  NarrativeActivityTypeServerV2,
  RoleplayActivityTypeServerV2,
  SequenceActivityTypeServerV2,
  ShortAnswerActivityTypeServerV2,
  SlideActivityTypeServerV2,
  SocraticActivityTypeServerV2,
  TeachTheAIActivityTypeServerV2,
  TermMatchingActivityTypeServerV2,
} from "@reasonote/lib-ai";

export async function getActivityTypeServer({activityType}: {activityType: string | null | undefined}): Promise<ActivityTypeServerV2 | undefined> {
    const serversHardcoded = [
        new FillInTheBlankActivityTypeServerV2(),
        new FlashcardActivityTypeServerV2(),
        new MultipleChoiceActivityTypeServerV2(),
        new NarrativeActivityTypeServerV2(),
        new RoleplayActivityTypeServerV2(),
        new SequenceActivityTypeServerV2(),
        new SlideActivityTypeServerV2(),
        new TeachTheAIActivityTypeServerV2(),
        new ShortAnswerActivityTypeServerV2(),
        new SocraticActivityTypeServerV2(),
        new TermMatchingActivityTypeServerV2(),
        new ChooseTheBlankActivityTypeServerV2(),
    ];

    return serversHardcoded.find((atc) => atc.type === activityType);
}