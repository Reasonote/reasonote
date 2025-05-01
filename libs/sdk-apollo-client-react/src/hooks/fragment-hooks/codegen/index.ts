import { createFragmentDataLoaders } from "../../generic-hooks/fragmentDataLoader/createFragmentDataLoaders";

import { ActivityFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getActivityFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: ActivityFlatFragLoader, useFragLoader: useActivityFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Activity",
        fragmentDoc: ActivityFlatFrag,
        fragmentName: "ActivityFlatFrag",
        batchQuery: getActivityFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.activityCollection?.pageInfo,
        },
    });

import { ActivitySetFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getActivitySetFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: ActivitySetFlatFragLoader, useFragLoader: useActivitySetFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "ActivitySet",
        fragmentDoc: ActivitySetFlatFrag,
        fragmentName: "ActivitySetFlatFrag",
        batchQuery: getActivitySetFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.activitySetCollection?.pageInfo,
        },
    });

import { ActivitySetActivityFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getActivitySetActivityFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: ActivitySetActivityFlatFragLoader, useFragLoader: useActivitySetActivityFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "ActivitySetActivity",
        fragmentDoc: ActivitySetActivityFlatFrag,
        fragmentName: "ActivitySetActivityFlatFrag",
        batchQuery: getActivitySetActivityFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.activitySetActivityCollection?.pageInfo,
        },
    });

import { ActivitySkillFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getActivitySkillFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: ActivitySkillFlatFragLoader, useFragLoader: useActivitySkillFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "ActivitySkill",
        fragmentDoc: ActivitySkillFlatFrag,
        fragmentName: "ActivitySkillFlatFrag",
        batchQuery: getActivitySkillFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.activitySkillCollection?.pageInfo,
        },
    });

import { AnalyzerFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getAnalyzerFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: AnalyzerFlatFragLoader, useFragLoader: useAnalyzerFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Analyzer",
        fragmentDoc: AnalyzerFlatFrag,
        fragmentName: "AnalyzerFlatFrag",
        batchQuery: getAnalyzerFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.analyzerCollection?.pageInfo,
        },
    });

import { BlogPostFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getBlogPostFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: BlogPostFlatFragLoader, useFragLoader: useBlogPostFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "BlogPost",
        fragmentDoc: BlogPostFlatFrag,
        fragmentName: "BlogPostFlatFrag",
        batchQuery: getBlogPostFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.blogPostCollection?.pageInfo,
        },
    });

import { BotFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getBotFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: BotFlatFragLoader, useFragLoader: useBotFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Bot",
        fragmentDoc: BotFlatFrag,
        fragmentName: "BotFlatFrag",
        batchQuery: getBotFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.botCollection?.pageInfo,
        },
    });

import { BotSetFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getBotSetFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: BotSetFlatFragLoader, useFragLoader: useBotSetFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "BotSet",
        fragmentDoc: BotSetFlatFrag,
        fragmentName: "BotSetFlatFrag",
        batchQuery: getBotSetFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.botSetCollection?.pageInfo,
        },
    });

import { BotSetBotFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getBotSetBotFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: BotSetBotFlatFragLoader, useFragLoader: useBotSetBotFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "BotSetBot",
        fragmentDoc: BotSetBotFlatFrag,
        fragmentName: "BotSetBotFlatFrag",
        batchQuery: getBotSetBotFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.botSetBotCollection?.pageInfo,
        },
    });

import { ChapterFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getChapterFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: ChapterFlatFragLoader, useFragLoader: useChapterFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Chapter",
        fragmentDoc: ChapterFlatFrag,
        fragmentName: "ChapterFlatFrag",
        batchQuery: getChapterFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.chapterCollection?.pageInfo,
        },
    });

import { ChatFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getChatFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: ChatFlatFragLoader, useFragLoader: useChatFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Chat",
        fragmentDoc: ChatFlatFrag,
        fragmentName: "ChatFlatFrag",
        batchQuery: getChatFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.chatCollection?.pageInfo,
        },
    });

import { ChatMessageFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getChatMessageFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: ChatMessageFlatFragLoader, useFragLoader: useChatMessageFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "ChatMessage",
        fragmentDoc: ChatMessageFlatFrag,
        fragmentName: "ChatMessageFlatFrag",
        batchQuery: getChatMessageFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.chatMessageCollection?.pageInfo,
        },
    });

import { ChromeExtensionEventFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getChromeExtensionEventFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: ChromeExtensionEventFlatFragLoader, useFragLoader: useChromeExtensionEventFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "ChromeExtensionEvent",
        fragmentDoc: ChromeExtensionEventFlatFrag,
        fragmentName: "ChromeExtensionEventFlatFrag",
        batchQuery: getChromeExtensionEventFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.chromeExtensionEventCollection?.pageInfo,
        },
    });

import { CourseFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getCourseFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: CourseFlatFragLoader, useFragLoader: useCourseFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Course",
        fragmentDoc: CourseFlatFrag,
        fragmentName: "CourseFlatFrag",
        batchQuery: getCourseFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.courseCollection?.pageInfo,
        },
    });

import { CourseLessonFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getCourseLessonFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: CourseLessonFlatFragLoader, useFragLoader: useCourseLessonFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "CourseLesson",
        fragmentDoc: CourseLessonFlatFrag,
        fragmentName: "CourseLessonFlatFrag",
        batchQuery: getCourseLessonFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.courseLessonCollection?.pageInfo,
        },
    });

import { EmailSubscriptionFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getEmailSubscriptionFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: EmailSubscriptionFlatFragLoader, useFragLoader: useEmailSubscriptionFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "EmailSubscription",
        fragmentDoc: EmailSubscriptionFlatFrag,
        fragmentName: "EmailSubscriptionFlatFrag",
        batchQuery: getEmailSubscriptionFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.emailSubscriptionCollection?.pageInfo,
        },
    });

import { EntityFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getEntityFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: EntityFlatFragLoader, useFragLoader: useEntityFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Entity",
        fragmentDoc: EntityFlatFrag,
        fragmentName: "EntityFlatFrag",
        batchQuery: getEntityFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.entityCollection?.pageInfo,
        },
    });

import { GoalFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getGoalFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: GoalFlatFragLoader, useFragLoader: useGoalFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Goal",
        fragmentDoc: GoalFlatFrag,
        fragmentName: "GoalFlatFrag",
        batchQuery: getGoalFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.goalCollection?.pageInfo,
        },
    });

import { GroupFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getGroupFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: GroupFlatFragLoader, useFragLoader: useGroupFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Group",
        fragmentDoc: GroupFlatFrag,
        fragmentName: "GroupFlatFrag",
        batchQuery: getGroupFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.groupCollection?.pageInfo,
        },
    });

import { IntegrationFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getIntegrationFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: IntegrationFlatFragLoader, useFragLoader: useIntegrationFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Integration",
        fragmentDoc: IntegrationFlatFrag,
        fragmentName: "IntegrationFlatFrag",
        batchQuery: getIntegrationFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.integrationCollection?.pageInfo,
        },
    });

import { IntegrationTokenFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getIntegrationTokenFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: IntegrationTokenFlatFragLoader, useFragLoader: useIntegrationTokenFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "IntegrationToken",
        fragmentDoc: IntegrationTokenFlatFrag,
        fragmentName: "IntegrationTokenFlatFrag",
        batchQuery: getIntegrationTokenFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.integrationTokenCollection?.pageInfo,
        },
    });

import { JournalFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getJournalFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: JournalFlatFragLoader, useFragLoader: useJournalFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Journal",
        fragmentDoc: JournalFlatFrag,
        fragmentName: "JournalFlatFrag",
        batchQuery: getJournalFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.journalCollection?.pageInfo,
        },
    });

import { LessonFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getLessonFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: LessonFlatFragLoader, useFragLoader: useLessonFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Lesson",
        fragmentDoc: LessonFlatFrag,
        fragmentName: "LessonFlatFrag",
        batchQuery: getLessonFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.lessonCollection?.pageInfo,
        },
    });

import { LessonActivityFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getLessonActivityFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: LessonActivityFlatFragLoader, useFragLoader: useLessonActivityFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "LessonActivity",
        fragmentDoc: LessonActivityFlatFrag,
        fragmentName: "LessonActivityFlatFrag",
        batchQuery: getLessonActivityFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.lessonActivityCollection?.pageInfo,
        },
    });

import { LessonSessionFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getLessonSessionFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: LessonSessionFlatFragLoader, useFragLoader: useLessonSessionFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "LessonSession",
        fragmentDoc: LessonSessionFlatFrag,
        fragmentName: "LessonSessionFlatFrag",
        batchQuery: getLessonSessionFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.lessonSessionCollection?.pageInfo,
        },
    });

import { MemauthFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getMemauthFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: MemauthFlatFragLoader, useFragLoader: useMemauthFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Memauth",
        fragmentDoc: MemauthFlatFrag,
        fragmentName: "MemauthFlatFrag",
        batchQuery: getMemauthFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.memauthCollection?.pageInfo,
        },
    });

import { MemberAuthorizationFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getMemberAuthorizationFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: MemberAuthorizationFlatFragLoader, useFragLoader: useMemberAuthorizationFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "MemberAuthorization",
        fragmentDoc: MemberAuthorizationFlatFrag,
        fragmentName: "MemberAuthorizationFlatFrag",
        batchQuery: getMemberAuthorizationFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.memberAuthorizationCollection?.pageInfo,
        },
    });

import { NotificationSubscriptionFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getNotificationSubscriptionFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: NotificationSubscriptionFlatFragLoader, useFragLoader: useNotificationSubscriptionFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "NotificationSubscription",
        fragmentDoc: NotificationSubscriptionFlatFrag,
        fragmentName: "NotificationSubscriptionFlatFrag",
        batchQuery: getNotificationSubscriptionFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.notificationSubscriptionCollection?.pageInfo,
        },
    });

import { OperationLogFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getOperationLogFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: OperationLogFlatFragLoader, useFragLoader: useOperationLogFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "OperationLog",
        fragmentDoc: OperationLogFlatFrag,
        fragmentName: "OperationLogFlatFrag",
        batchQuery: getOperationLogFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.operationLogCollection?.pageInfo,
        },
    });

import { PartialSkillFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getPartialSkillFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: PartialSkillFlatFragLoader, useFragLoader: usePartialSkillFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "PartialSkill",
        fragmentDoc: PartialSkillFlatFrag,
        fragmentName: "PartialSkillFlatFrag",
        batchQuery: getPartialSkillFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.partialSkillCollection?.pageInfo,
        },
    });

import { PodcastFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getPodcastFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: PodcastFlatFragLoader, useFragLoader: usePodcastFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Podcast",
        fragmentDoc: PodcastFlatFrag,
        fragmentName: "PodcastFlatFrag",
        batchQuery: getPodcastFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.podcastCollection?.pageInfo,
        },
    });

import { PodcastAudioFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getPodcastAudioFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: PodcastAudioFlatFragLoader, useFragLoader: usePodcastAudioFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "PodcastAudio",
        fragmentDoc: PodcastAudioFlatFrag,
        fragmentName: "PodcastAudioFlatFrag",
        batchQuery: getPodcastAudioFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.podcastAudioCollection?.pageInfo,
        },
    });

import { PodcastLineFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getPodcastLineFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: PodcastLineFlatFragLoader, useFragLoader: usePodcastLineFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "PodcastLine",
        fragmentDoc: PodcastLineFlatFrag,
        fragmentName: "PodcastLineFlatFrag",
        batchQuery: getPodcastLineFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.podcastLineCollection?.pageInfo,
        },
    });

import { PodcastQueueItemFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getPodcastQueueItemFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: PodcastQueueItemFlatFragLoader, useFragLoader: usePodcastQueueItemFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "PodcastQueueItem",
        fragmentDoc: PodcastQueueItemFlatFrag,
        fragmentName: "PodcastQueueItemFlatFrag",
        batchQuery: getPodcastQueueItemFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.podcastQueueItemCollection?.pageInfo,
        },
    });

import { PushNotificationSubscriptionFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getPushNotificationSubscriptionFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: PushNotificationSubscriptionFlatFragLoader, useFragLoader: usePushNotificationSubscriptionFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "PushNotificationSubscription",
        fragmentDoc: PushNotificationSubscriptionFlatFrag,
        fragmentName: "PushNotificationSubscriptionFlatFrag",
        batchQuery: getPushNotificationSubscriptionFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.pushNotificationSubscriptionCollection?.pageInfo,
        },
    });

import { ReferenceFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getReferenceFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: ReferenceFlatFragLoader, useFragLoader: useReferenceFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Reference",
        fragmentDoc: ReferenceFlatFrag,
        fragmentName: "ReferenceFlatFrag",
        batchQuery: getReferenceFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.referenceCollection?.pageInfo,
        },
    });

import { ResourceFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getResourceFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: ResourceFlatFragLoader, useFragLoader: useResourceFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Resource",
        fragmentDoc: ResourceFlatFrag,
        fragmentName: "ResourceFlatFrag",
        batchQuery: getResourceFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.resourceCollection?.pageInfo,
        },
    });

import { RsnPageFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getRsnPageFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: RsnPageFlatFragLoader, useFragLoader: useRsnPageFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "RsnPage",
        fragmentDoc: RsnPageFlatFrag,
        fragmentName: "RsnPageFlatFrag",
        batchQuery: getRsnPageFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.rsnPageCollection?.pageInfo,
        },
    });

import { RsnPageVectorFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getRsnPageVectorFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: RsnPageVectorFlatFragLoader, useFragLoader: useRsnPageVectorFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "RsnPageVector",
        fragmentDoc: RsnPageVectorFlatFrag,
        fragmentName: "RsnPageVectorFlatFrag",
        batchQuery: getRsnPageVectorFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.rsnPageVectorCollection?.pageInfo,
        },
    });

import { RsnUserFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getRsnUserFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: RsnUserFlatFragLoader, useFragLoader: useRsnUserFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "RsnUser",
        fragmentDoc: RsnUserFlatFrag,
        fragmentName: "RsnUserFlatFrag",
        batchQuery: getRsnUserFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.rsnUserCollection?.pageInfo,
        },
    });

import { RsnUserSysdataFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getRsnUserSysdataFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: RsnUserSysdataFlatFragLoader, useFragLoader: useRsnUserSysdataFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "RsnUserSysdata",
        fragmentDoc: RsnUserSysdataFlatFrag,
        fragmentName: "RsnUserSysdataFlatFrag",
        batchQuery: getRsnUserSysdataFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.rsnUserSysdataCollection?.pageInfo,
        },
    });

import { RsnVecFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getRsnVecFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: RsnVecFlatFragLoader, useFragLoader: useRsnVecFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "RsnVec",
        fragmentDoc: RsnVecFlatFrag,
        fragmentName: "RsnVecFlatFrag",
        batchQuery: getRsnVecFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.rsnVecCollection?.pageInfo,
        },
    });

import { RsnVecConfigFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getRsnVecConfigFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: RsnVecConfigFlatFragLoader, useFragLoader: useRsnVecConfigFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "RsnVecConfig",
        fragmentDoc: RsnVecConfigFlatFrag,
        fragmentName: "RsnVecConfigFlatFrag",
        batchQuery: getRsnVecConfigFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.rsnVecConfigCollection?.pageInfo,
        },
    });

import { RsnVecQueueFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getRsnVecQueueFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: RsnVecQueueFlatFragLoader, useFragLoader: useRsnVecQueueFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "RsnVecQueue",
        fragmentDoc: RsnVecQueueFlatFrag,
        fragmentName: "RsnVecQueueFlatFrag",
        batchQuery: getRsnVecQueueFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.rsnVecQueueCollection?.pageInfo,
        },
    });

import { RsncoreTableAbbreviationsFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getRsncoreTableAbbreviationsFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: RsncoreTableAbbreviationsFlatFragLoader, useFragLoader: useRsncoreTableAbbreviationsFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "RsncoreTableAbbreviations",
        fragmentDoc: RsncoreTableAbbreviationsFlatFrag,
        fragmentName: "RsncoreTableAbbreviationsFlatFrag",
        batchQuery: getRsncoreTableAbbreviationsFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.rsncoreTableAbbreviationsCollection?.pageInfo,
        },
    });

import { SkillFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getSkillFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: SkillFlatFragLoader, useFragLoader: useSkillFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Skill",
        fragmentDoc: SkillFlatFrag,
        fragmentName: "SkillFlatFrag",
        batchQuery: getSkillFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.skillCollection?.pageInfo,
        },
    });

import { SkillLinkFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getSkillLinkFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: SkillLinkFlatFragLoader, useFragLoader: useSkillLinkFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "SkillLink",
        fragmentDoc: SkillLinkFlatFrag,
        fragmentName: "SkillLinkFlatFrag",
        batchQuery: getSkillLinkFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.skillLinkCollection?.pageInfo,
        },
    });

import { SkillModuleFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getSkillModuleFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: SkillModuleFlatFragLoader, useFragLoader: useSkillModuleFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "SkillModule",
        fragmentDoc: SkillModuleFlatFrag,
        fragmentName: "SkillModuleFlatFrag",
        batchQuery: getSkillModuleFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.skillModuleCollection?.pageInfo,
        },
    });

import { SkillSetFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getSkillSetFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: SkillSetFlatFragLoader, useFragLoader: useSkillSetFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "SkillSet",
        fragmentDoc: SkillSetFlatFrag,
        fragmentName: "SkillSetFlatFrag",
        batchQuery: getSkillSetFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.skillSetCollection?.pageInfo,
        },
    });

import { SkillSetSkillFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getSkillSetSkillFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: SkillSetSkillFlatFragLoader, useFragLoader: useSkillSetSkillFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "SkillSetSkill",
        fragmentDoc: SkillSetSkillFlatFrag,
        fragmentName: "SkillSetSkillFlatFrag",
        batchQuery: getSkillSetSkillFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.skillSetSkillCollection?.pageInfo,
        },
    });

import { SnipFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getSnipFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: SnipFlatFragLoader, useFragLoader: useSnipFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "Snip",
        fragmentDoc: SnipFlatFrag,
        fragmentName: "SnipFlatFrag",
        batchQuery: getSnipFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.snipCollection?.pageInfo,
        },
    });

import { StripeCustomersFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getStripeCustomersFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: StripeCustomersFlatFragLoader, useFragLoader: useStripeCustomersFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "StripeCustomers",
        fragmentDoc: StripeCustomersFlatFrag,
        fragmentName: "StripeCustomersFlatFrag",
        batchQuery: getStripeCustomersFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.stripeCustomersCollection?.pageInfo,
        },
    });

import { StripeProductsFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getStripeProductsFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: StripeProductsFlatFragLoader, useFragLoader: useStripeProductsFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "StripeProducts",
        fragmentDoc: StripeProductsFlatFrag,
        fragmentName: "StripeProductsFlatFrag",
        batchQuery: getStripeProductsFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.stripeProductsCollection?.pageInfo,
        },
    });

import { StripeSubscriptionsFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getStripeSubscriptionsFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: StripeSubscriptionsFlatFragLoader, useFragLoader: useStripeSubscriptionsFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "StripeSubscriptions",
        fragmentDoc: StripeSubscriptionsFlatFrag,
        fragmentName: "StripeSubscriptionsFlatFrag",
        batchQuery: getStripeSubscriptionsFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.stripeSubscriptionsCollection?.pageInfo,
        },
    });

import { UserActivityFeedbackFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getUserActivityFeedbackFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: UserActivityFeedbackFlatFragLoader, useFragLoader: useUserActivityFeedbackFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "UserActivityFeedback",
        fragmentDoc: UserActivityFeedbackFlatFrag,
        fragmentName: "UserActivityFeedbackFlatFrag",
        batchQuery: getUserActivityFeedbackFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.userActivityFeedbackCollection?.pageInfo,
        },
    });

import { UserActivityResultFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getUserActivityResultFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: UserActivityResultFlatFragLoader, useFragLoader: useUserActivityResultFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "UserActivityResult",
        fragmentDoc: UserActivityResultFlatFrag,
        fragmentName: "UserActivityResultFlatFrag",
        batchQuery: getUserActivityResultFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.userActivityResultCollection?.pageInfo,
        },
    });

import { UserHistoryFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getUserHistoryFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: UserHistoryFlatFragLoader, useFragLoader: useUserHistoryFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "UserHistory",
        fragmentDoc: UserHistoryFlatFrag,
        fragmentName: "UserHistoryFlatFrag",
        batchQuery: getUserHistoryFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.userHistoryCollection?.pageInfo,
        },
    });

import { UserLessonResultFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getUserLessonResultFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: UserLessonResultFlatFragLoader, useFragLoader: useUserLessonResultFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "UserLessonResult",
        fragmentDoc: UserLessonResultFlatFrag,
        fragmentName: "UserLessonResultFlatFrag",
        batchQuery: getUserLessonResultFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.userLessonResultCollection?.pageInfo,
        },
    });

import { UserProfileFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getUserProfileFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: UserProfileFlatFragLoader, useFragLoader: useUserProfileFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "UserProfile",
        fragmentDoc: UserProfileFlatFrag,
        fragmentName: "UserProfileFlatFrag",
        batchQuery: getUserProfileFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.userProfileCollection?.pageInfo,
        },
    });

import { UserSettingFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getUserSettingFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: UserSettingFlatFragLoader, useFragLoader: useUserSettingFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "UserSetting",
        fragmentDoc: UserSettingFlatFrag,
        fragmentName: "UserSettingFlatFrag",
        batchQuery: getUserSettingFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.userSettingCollection?.pageInfo,
        },
    });

import { UserSkillFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getUserSkillFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: UserSkillFlatFragLoader, useFragLoader: useUserSkillFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "UserSkill",
        fragmentDoc: UserSkillFlatFrag,
        fragmentName: "UserSkillFlatFrag",
        batchQuery: getUserSkillFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.userSkillCollection?.pageInfo,
        },
    });

import { UserSkillSysdataFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getUserSkillSysdataFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: UserSkillSysdataFlatFragLoader, useFragLoader: useUserSkillSysdataFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "UserSkillSysdata",
        fragmentDoc: UserSkillSysdataFlatFrag,
        fragmentName: "UserSkillSysdataFlatFrag",
        batchQuery: getUserSkillSysdataFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.userSkillSysdataCollection?.pageInfo,
        },
    });

import { UserTourFlatFrag } from "@reasonote/lib-sdk-apollo-client";
import { getUserTourFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
export const { FragLoader: UserTourFlatFragLoader, useFragLoader: useUserTourFlatFragLoader } =
    createFragmentDataLoaders({
        entityCachePrefix: "UserTour",
        fragmentDoc: UserTourFlatFrag,
        fragmentName: "UserTourFlatFrag",
        batchQuery: getUserTourFlatQueryDoc,
        createBatchVarsForKeys: (ids: any) => {
            return {
                filter: {
                    id: { in: ids },
                },
            };
        },
        queryManyPagesOpts: {
            queryManyType: "relay",
            getRelayPageInfo: (data) => data?.userTourCollection?.pageInfo,
        },
    });