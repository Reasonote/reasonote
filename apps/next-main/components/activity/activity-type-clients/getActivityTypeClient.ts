'use client';
import {
  ValidActivityTypeClient,
} from "@reasonote/core/src/interfaces/ActivityTypeClient";
import {Database} from "@reasonote/lib-sdk";
import {SupabaseClient} from "@supabase/supabase-js";

import {
  ChooseTheBlankActivityTypeClient,
} from "../activities/ChooseTheBlankActivity/client/client";
import {
  FillInTheBlankActivityTypeClient,
} from "../activities/FillInTheBlankActivity/client/client";
import {
  FlashcardActivityTypeClient,
} from "../activities/FlashcardActivity/client/client";
import {
  MultipleChoiceActivityTypeClient,
} from "../activities/MultipleChoiceActivity/client/client";
import {
  NarrativeActivityTypeClient,
} from "../activities/NarrativeActivity/client";
import {
  RoleplayActivityTypeClient,
} from "../activities/RoleplayActivity/client";
import {
  SequenceActivityTypeClient,
} from "../activities/SequenceActivity/client/client";
import {
  ShortAnswerActivityTypeClient,
} from "../activities/ShortAnswerActivity/client/client";
import {
  SlideActivityTypeClient,
} from "../activities/SlideActivity/client/client";
import {
  SocraticActivityTypeClient,
} from "../activities/SocraticActivity/client";
import {
  TeachTheAIActivityTypeClient,
} from "../activities/TeachTheAIActivity/client";
import {
  TermMatchingActivityTypeClient,
} from "../activities/TermMatchingActivity/client/client";

export interface GetActivityTypeClientArgs {
    sb: SupabaseClient<Database>;
    activityType: string | null | undefined;
}

export async function getActivityTypeClient({ sb, activityType }: GetActivityTypeClientArgs): Promise<ValidActivityTypeClient<any, any> | undefined> {
    // TODO: in the future, we'll fetch our activity types from supabase.
    // For now, they are hardcoded.

    const activityTypeClientsHardcoded = [
        FillInTheBlankActivityTypeClient,
        MultipleChoiceActivityTypeClient,
        FlashcardActivityTypeClient,
        NarrativeActivityTypeClient,
        RoleplayActivityTypeClient,
        SequenceActivityTypeClient,
        SlideActivityTypeClient,
        TeachTheAIActivityTypeClient,
        ShortAnswerActivityTypeClient,
        SocraticActivityTypeClient,
        TermMatchingActivityTypeClient,
        ChooseTheBlankActivityTypeClient,
    ];

    return activityTypeClientsHardcoded.find((atc) => atc.type === activityType);
}