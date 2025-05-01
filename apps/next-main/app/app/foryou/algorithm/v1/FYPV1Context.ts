import {rsnUserIdVar} from "@/clientOnly/state/userVars";
import {ActivityType} from "@reasonote/core";
import {ApolloClient} from "@apollo/client";
import {createSimpleLogger} from "@lukebechtel/lab-ts-utils";
import {Database} from "@reasonote/lib-sdk";
import {
  GetActivityFeedbackDocument,
  GetActivityResultsDeepDocument,
  GetRsnUserFlatDocument,
  GetSkillUserSkillDocument,
  GetUserSettingFlatDocument,
  GetUserSkillFlatDocument,
  OrderByDirection,
  ResultOf,
  Skill,
} from "@reasonote/lib-sdk-apollo-client";
import {SupabaseClient} from "@supabase/supabase-js";

import {
  ActivityWithSkillStack,
  FYPPinnedItems,
} from "../../FYPTypes";
import {
  generateFYPActivity,
  generateFYPActivityResult,
} from "../generateFYPActivityTypes";

interface TraversalConstructorArgs {
    ac: ApolloClient<any>;
    userId: string;
    sb: SupabaseClient<Database>;
    token: string;
    pinned?: FYPPinnedItems | null;
    activityQueue: ActivityWithSkillStack[];
    allowedActivityTypes: ActivityType[];
    numToGen: number;
    skillData: Skill[];
    onActivityComplete?: (activity: generateFYPActivity) => void;
}

/**
 * This represents things that are shared for the ENTIRETY
 * of a FYPV1Generation / Traversal run.
 * 
 * It is a collection of helpers for the somewhat complex tasks of the algorithm.
 */
export class FYPV1Context {
    recentActivityResultsResult: ResultOf<typeof GetActivityResultsDeepDocument> | undefined;
    activityFeedbackResultsResult: ResultOf<typeof GetActivityFeedbackDocument> | undefined;
    userSkillsResult: ResultOf<typeof GetUserSkillFlatDocument> | undefined;
    userResult: ResultOf<typeof GetRsnUserFlatDocument> | undefined;
    userSettingsResult: ResultOf<typeof GetUserSettingFlatDocument> | undefined;

    returnedActivities: generateFYPActivityResult = [];

    logger = createSimpleLogger({prefix: {type: 'simpleString', simpleString: 'FYPV1Context'}});

    activityCompleteCb = (activity: generateFYPActivity) => {
      this.onActivityComplete && this.onActivityComplete(activity);
      this.returnedActivities.push(activity);
    }

    constructor(readonly constructorArgs: TraversalConstructorArgs){}

    prefetchData = async ({ac}: {ac: ApolloClient<any>}) => {
        const [recentActivityResultsRes, activityFeedbackResults, userSkillsRes, userObjRes, userSettingsRes] = await Promise.all([
            ac.query({
                query: GetActivityResultsDeepDocument,
                variables: {
                    filter: {
                        user: {
                            eq: rsnUserIdVar(),
                        }
                    },
                    orderBy: {
                        createdDate: OrderByDirection.DescNullsLast,
                    },
                    // TODO: Increase this number
                    first: 1000,
                },
                fetchPolicy: "network-only"
            }),
            ac.query({
                query: GetActivityFeedbackDocument,
                variables: {
                    filter: {
                        createdBy: {
                            eq: this.userId,
                        }
                    },
                    orderBy: {
                        createdDate: OrderByDirection.DescNullsLast,
                    },
                }
            }),
            ac.query({
                query: GetUserSkillFlatDocument,
                variables: {
                    filter: {
                        rsnUser: {
                            eq: this.userId,
                        }
                    },
                    orderBy: {
                        createdDate: OrderByDirection.DescNullsLast,
                    },
                }
            }),
            ac.query({
                query: GetRsnUserFlatDocument,
                variables: {
                    filter: {
                        id: {
                            eq: this.userId,
                        }
                    }
                }
            }),
            ac.query({
                query: GetUserSettingFlatDocument,
                variables: {
                    filter: {
                        rsnUser: {
                            eq: this.userId,
                        }
                    }
                }
            })
        ])

        this.recentActivityResultsResult = recentActivityResultsRes.data;
        this.activityFeedbackResultsResult = activityFeedbackResults.data;
        this.userSkillsResult = userSkillsRes.data;
        this.userResult = userObjRes.data;
        this.userSettingsResult = userSettingsRes.data;
    }

    getSkillUserSkill = async (skillId: string) => {
        return (await this.ac.query({
            query: GetSkillUserSkillDocument,
            variables: {
                filter: {
                    id: {
                        eq: skillId,
                    },
                },
            },
            fetchPolicy: 'network-only',
        }))?.data.skillCollection?.edges?.[0]?.node?.userSkillCollection?.edges?.[0]?.node;
    }

    getUserAttestedSkillLevel = async (skillId: string) => {
        const userSkill = await this.getSkillUserSkill(skillId);

        const attestedLevel = userSkill?.selfAssignedLevel;

        return attestedLevel;
    }


    get givenName() {
        return this.userResult?.rsnUserCollection?.edges?.[0]?.node?.givenName;
    }

    get familyName() {
        return this.userResult?.rsnUserCollection?.edges?.[0]?.node?.familyName;
    }

    get userSettings() {
        return this.userSettingsResult?.userSettingCollection?.edges?.[0]?.node;
    }

    get recentActivityResults() {
        return this.recentActivityResultsResult?.userActivityResultCollection?.edges?.map((edge) => {
            return edge?.node;
        }) ?? [];
    }

    get activityFeedbackResults() {
        return this.activityFeedbackResultsResult?.userActivityFeedbackCollection?.edges?.map((edge) => {
            return edge?.node;
        }) ?? [];
    }

    get pinnedSkillPathIds() {
        return this.pinned?.skillIdPath && this.pinned.skillIdPath.length > 0 ? this.pinned.skillIdPath : undefined;
    }

    get sb() {
        return this.constructorArgs.sb;
    }

    get ac() {
        return this.constructorArgs.ac;
    }

    get userId() {
        return this.constructorArgs.userId;
    }

    get token() {
        return this.constructorArgs.token;
    }

    get pinned() {
        return this.constructorArgs.pinned;
    }

    get activityQueue() {
        return this.constructorArgs.activityQueue;
    }

    get pinnedSkillId(){
        return this.pinnedSkillPathIds?.[this.pinnedSkillPathIds.length - 1];
    }

    get pinnedSkillParentIds(){
        return this.pinnedSkillPathIds?.slice(0, this.pinnedSkillPathIds.length - 1);
    }

    get pinnedSkillParentNames(){
        return this.pinnedSkillParentIds?.map((id) => this.skillData.find((x) => x.id === id)?.name);
    }

    get pinnedSkillName(){
        return this.skillData.find((x) => x.id === this.pinnedSkillId)?.name;
    }

    get allowedActivityTypes() {
        return this.constructorArgs.allowedActivityTypes;
    }

    get numToGen() {
        return this.constructorArgs.numToGen;
    }

    get skillData() {
        return this.constructorArgs.skillData;
    }

    get onActivityComplete() {
        return this.constructorArgs.onActivityComplete;
    }
}