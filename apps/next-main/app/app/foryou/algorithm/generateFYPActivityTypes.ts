import _ from "lodash";

import {ActivityType} from "@reasonote/core";
import {ApolloClient} from "@apollo/client";
import {Database} from "@reasonote/lib-sdk";
import {
  ActivityFlatFragFragment,
  Skill,
} from "@reasonote/lib-sdk-apollo-client";
import {SupabaseClient} from "@supabase/supabase-js";

import {
  ActivityWithSkillStack,
  FYPPinnedItems,
} from "../FYPTypes";

export interface generateFYPActivityProps {
    ac: ApolloClient<any>;
    sb: SupabaseClient<Database>;
    algorithm: "v0" | "v1";
    userId: string;
    token: string;
    pinned?: FYPPinnedItems | null;
    activityQueue: ActivityWithSkillStack[];
    allowedActivityTypes: ActivityType[];
    numToGen: number;
    skillData: Skill[];
    onActivityComplete?: (activity: generateFYPActivity) => void;
}

export type SkillOrStub = {
  id?: string;
  name: string;
};

export type generateFYPActivity = {
  activity: ActivityFlatFragFragment,
  skillIdStack: string[],
};

export type generateFYPActivityResult = generateFYPActivity[]