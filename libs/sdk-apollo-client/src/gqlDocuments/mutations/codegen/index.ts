import { graphql } from "../../../codegen";

export const createAccessLevelPermissionFlatMutDoc = graphql(/* GraphQL */ `
    mutation createAccessLevelPermissionFlat($objects: [AccessLevelPermissionInsertInput!]!) {
        insertIntoAccessLevelPermissionCollection(objects: $objects) {
            affectedCount
            records {
                ...AccessLevelPermissionFlatFrag
            }
        }
    }
`);

export const createActivityFlatMutDoc = graphql(/* GraphQL */ `
    mutation createActivityFlat($objects: [ActivityInsertInput!]!) {
        insertIntoActivityCollection(objects: $objects) {
            affectedCount
            records {
                ...ActivityFlatFrag
            }
        }
    }
`);

export const createActivitySetFlatMutDoc = graphql(/* GraphQL */ `
    mutation createActivitySetFlat($objects: [ActivitySetInsertInput!]!) {
        insertIntoActivitySetCollection(objects: $objects) {
            affectedCount
            records {
                ...ActivitySetFlatFrag
            }
        }
    }
`);

export const createActivitySetActivityFlatMutDoc = graphql(/* GraphQL */ `
    mutation createActivitySetActivityFlat($objects: [ActivitySetActivityInsertInput!]!) {
        insertIntoActivitySetActivityCollection(objects: $objects) {
            affectedCount
            records {
                ...ActivitySetActivityFlatFrag
            }
        }
    }
`);

export const createActivitySkillFlatMutDoc = graphql(/* GraphQL */ `
    mutation createActivitySkillFlat($objects: [ActivitySkillInsertInput!]!) {
        insertIntoActivitySkillCollection(objects: $objects) {
            affectedCount
            records {
                ...ActivitySkillFlatFrag
            }
        }
    }
`);

export const createAnalyzerFlatMutDoc = graphql(/* GraphQL */ `
    mutation createAnalyzerFlat($objects: [AnalyzerInsertInput!]!) {
        insertIntoAnalyzerCollection(objects: $objects) {
            affectedCount
            records {
                ...AnalyzerFlatFrag
            }
        }
    }
`);

export const createBlogPostFlatMutDoc = graphql(/* GraphQL */ `
    mutation createBlogPostFlat($objects: [BlogPostInsertInput!]!) {
        insertIntoBlogPostCollection(objects: $objects) {
            affectedCount
            records {
                ...BlogPostFlatFrag
            }
        }
    }
`);

export const createBotFlatMutDoc = graphql(/* GraphQL */ `
    mutation createBotFlat($objects: [BotInsertInput!]!) {
        insertIntoBotCollection(objects: $objects) {
            affectedCount
            records {
                ...BotFlatFrag
            }
        }
    }
`);

export const createBotSetFlatMutDoc = graphql(/* GraphQL */ `
    mutation createBotSetFlat($objects: [BotSetInsertInput!]!) {
        insertIntoBotSetCollection(objects: $objects) {
            affectedCount
            records {
                ...BotSetFlatFrag
            }
        }
    }
`);

export const createBotSetBotFlatMutDoc = graphql(/* GraphQL */ `
    mutation createBotSetBotFlat($objects: [BotSetBotInsertInput!]!) {
        insertIntoBotSetBotCollection(objects: $objects) {
            affectedCount
            records {
                ...BotSetBotFlatFrag
            }
        }
    }
`);

export const createChapterFlatMutDoc = graphql(/* GraphQL */ `
    mutation createChapterFlat($objects: [ChapterInsertInput!]!) {
        insertIntoChapterCollection(objects: $objects) {
            affectedCount
            records {
                ...ChapterFlatFrag
            }
        }
    }
`);

export const createChatFlatMutDoc = graphql(/* GraphQL */ `
    mutation createChatFlat($objects: [ChatInsertInput!]!) {
        insertIntoChatCollection(objects: $objects) {
            affectedCount
            records {
                ...ChatFlatFrag
            }
        }
    }
`);

export const createChatMessageFlatMutDoc = graphql(/* GraphQL */ `
    mutation createChatMessageFlat($objects: [ChatMessageInsertInput!]!) {
        insertIntoChatMessageCollection(objects: $objects) {
            affectedCount
            records {
                ...ChatMessageFlatFrag
            }
        }
    }
`);

export const createChromeExtensionEventFlatMutDoc = graphql(/* GraphQL */ `
    mutation createChromeExtensionEventFlat($objects: [ChromeExtensionEventInsertInput!]!) {
        insertIntoChromeExtensionEventCollection(objects: $objects) {
            affectedCount
            records {
                ...ChromeExtensionEventFlatFrag
            }
        }
    }
`);

export const createCourseFlatMutDoc = graphql(/* GraphQL */ `
    mutation createCourseFlat($objects: [CourseInsertInput!]!) {
        insertIntoCourseCollection(objects: $objects) {
            affectedCount
            records {
                ...CourseFlatFrag
            }
        }
    }
`);

export const createCourseLessonFlatMutDoc = graphql(/* GraphQL */ `
    mutation createCourseLessonFlat($objects: [CourseLessonInsertInput!]!) {
        insertIntoCourseLessonCollection(objects: $objects) {
            affectedCount
            records {
                ...CourseLessonFlatFrag
            }
        }
    }
`);

export const createEmailSubscriptionFlatMutDoc = graphql(/* GraphQL */ `
    mutation createEmailSubscriptionFlat($objects: [EmailSubscriptionInsertInput!]!) {
        insertIntoEmailSubscriptionCollection(objects: $objects) {
            affectedCount
            records {
                ...EmailSubscriptionFlatFrag
            }
        }
    }
`);

export const createEntityFlatMutDoc = graphql(/* GraphQL */ `
    mutation createEntityFlat($objects: [EntityInsertInput!]!) {
        insertIntoEntityCollection(objects: $objects) {
            affectedCount
            records {
                ...EntityFlatFrag
            }
        }
    }
`);

export const createEntityTypeFlatMutDoc = graphql(/* GraphQL */ `
    mutation createEntityTypeFlat($objects: [EntityTypeInsertInput!]!) {
        insertIntoEntityTypeCollection(objects: $objects) {
            affectedCount
            records {
                ...EntityTypeFlatFrag
            }
        }
    }
`);

export const createEntityTypeAccessLevelFlatMutDoc = graphql(/* GraphQL */ `
    mutation createEntityTypeAccessLevelFlat($objects: [EntityTypeAccessLevelInsertInput!]!) {
        insertIntoEntityTypeAccessLevelCollection(objects: $objects) {
            affectedCount
            records {
                ...EntityTypeAccessLevelFlatFrag
            }
        }
    }
`);

export const createGoalFlatMutDoc = graphql(/* GraphQL */ `
    mutation createGoalFlat($objects: [GoalInsertInput!]!) {
        insertIntoGoalCollection(objects: $objects) {
            affectedCount
            records {
                ...GoalFlatFrag
            }
        }
    }
`);

export const createGroupFlatMutDoc = graphql(/* GraphQL */ `
    mutation createGroupFlat($objects: [GroupInsertInput!]!) {
        insertIntoGroupCollection(objects: $objects) {
            affectedCount
            records {
                ...GroupFlatFrag
            }
        }
    }
`);

export const createIntegrationFlatMutDoc = graphql(/* GraphQL */ `
    mutation createIntegrationFlat($objects: [IntegrationInsertInput!]!) {
        insertIntoIntegrationCollection(objects: $objects) {
            affectedCount
            records {
                ...IntegrationFlatFrag
            }
        }
    }
`);

export const createIntegrationTokenFlatMutDoc = graphql(/* GraphQL */ `
    mutation createIntegrationTokenFlat($objects: [IntegrationTokenInsertInput!]!) {
        insertIntoIntegrationTokenCollection(objects: $objects) {
            affectedCount
            records {
                ...IntegrationTokenFlatFrag
            }
        }
    }
`);

export const createJournalFlatMutDoc = graphql(/* GraphQL */ `
    mutation createJournalFlat($objects: [JournalInsertInput!]!) {
        insertIntoJournalCollection(objects: $objects) {
            affectedCount
            records {
                ...JournalFlatFrag
            }
        }
    }
`);

export const createLessonFlatMutDoc = graphql(/* GraphQL */ `
    mutation createLessonFlat($objects: [LessonInsertInput!]!) {
        insertIntoLessonCollection(objects: $objects) {
            affectedCount
            records {
                ...LessonFlatFrag
            }
        }
    }
`);

export const createLessonActivityFlatMutDoc = graphql(/* GraphQL */ `
    mutation createLessonActivityFlat($objects: [LessonActivityInsertInput!]!) {
        insertIntoLessonActivityCollection(objects: $objects) {
            affectedCount
            records {
                ...LessonActivityFlatFrag
            }
        }
    }
`);

export const createLessonSessionFlatMutDoc = graphql(/* GraphQL */ `
    mutation createLessonSessionFlat($objects: [LessonSessionInsertInput!]!) {
        insertIntoLessonSessionCollection(objects: $objects) {
            affectedCount
            records {
                ...LessonSessionFlatFrag
            }
        }
    }
`);

export const createMemauthFlatMutDoc = graphql(/* GraphQL */ `
    mutation createMemauthFlat($objects: [MemauthInsertInput!]!) {
        insertIntoMemauthCollection(objects: $objects) {
            affectedCount
            records {
                ...MemauthFlatFrag
            }
        }
    }
`);

export const createMemberAuthorizationFlatMutDoc = graphql(/* GraphQL */ `
    mutation createMemberAuthorizationFlat($objects: [MemberAuthorizationInsertInput!]!) {
        insertIntoMemberAuthorizationCollection(objects: $objects) {
            affectedCount
            records {
                ...MemberAuthorizationFlatFrag
            }
        }
    }
`);

export const createNotificationSubscriptionFlatMutDoc = graphql(/* GraphQL */ `
    mutation createNotificationSubscriptionFlat($objects: [NotificationSubscriptionInsertInput!]!) {
        insertIntoNotificationSubscriptionCollection(objects: $objects) {
            affectedCount
            records {
                ...NotificationSubscriptionFlatFrag
            }
        }
    }
`);

export const createOperationLogFlatMutDoc = graphql(/* GraphQL */ `
    mutation createOperationLogFlat($objects: [OperationLogInsertInput!]!) {
        insertIntoOperationLogCollection(objects: $objects) {
            affectedCount
            records {
                ...OperationLogFlatFrag
            }
        }
    }
`);

export const createPartialSkillFlatMutDoc = graphql(/* GraphQL */ `
    mutation createPartialSkillFlat($objects: [PartialSkillInsertInput!]!) {
        insertIntoPartialSkillCollection(objects: $objects) {
            affectedCount
            records {
                ...PartialSkillFlatFrag
            }
        }
    }
`);

export const createPermissionFlatMutDoc = graphql(/* GraphQL */ `
    mutation createPermissionFlat($objects: [PermissionInsertInput!]!) {
        insertIntoPermissionCollection(objects: $objects) {
            affectedCount
            records {
                ...PermissionFlatFrag
            }
        }
    }
`);

export const createPodcastFlatMutDoc = graphql(/* GraphQL */ `
    mutation createPodcastFlat($objects: [PodcastInsertInput!]!) {
        insertIntoPodcastCollection(objects: $objects) {
            affectedCount
            records {
                ...PodcastFlatFrag
            }
        }
    }
`);

export const createPodcastAudioFlatMutDoc = graphql(/* GraphQL */ `
    mutation createPodcastAudioFlat($objects: [PodcastAudioInsertInput!]!) {
        insertIntoPodcastAudioCollection(objects: $objects) {
            affectedCount
            records {
                ...PodcastAudioFlatFrag
            }
        }
    }
`);

export const createPodcastLineFlatMutDoc = graphql(/* GraphQL */ `
    mutation createPodcastLineFlat($objects: [PodcastLineInsertInput!]!) {
        insertIntoPodcastLineCollection(objects: $objects) {
            affectedCount
            records {
                ...PodcastLineFlatFrag
            }
        }
    }
`);

export const createPodcastQueueItemFlatMutDoc = graphql(/* GraphQL */ `
    mutation createPodcastQueueItemFlat($objects: [PodcastQueueItemInsertInput!]!) {
        insertIntoPodcastQueueItemCollection(objects: $objects) {
            affectedCount
            records {
                ...PodcastQueueItemFlatFrag
            }
        }
    }
`);

export const createPushNotificationSubscriptionFlatMutDoc = graphql(/* GraphQL */ `
    mutation createPushNotificationSubscriptionFlat($objects: [PushNotificationSubscriptionInsertInput!]!) {
        insertIntoPushNotificationSubscriptionCollection(objects: $objects) {
            affectedCount
            records {
                ...PushNotificationSubscriptionFlatFrag
            }
        }
    }
`);

export const createReferenceFlatMutDoc = graphql(/* GraphQL */ `
    mutation createReferenceFlat($objects: [ReferenceInsertInput!]!) {
        insertIntoReferenceCollection(objects: $objects) {
            affectedCount
            records {
                ...ReferenceFlatFrag
            }
        }
    }
`);

export const createResourceFlatMutDoc = graphql(/* GraphQL */ `
    mutation createResourceFlat($objects: [ResourceInsertInput!]!) {
        insertIntoResourceCollection(objects: $objects) {
            affectedCount
            records {
                ...ResourceFlatFrag
            }
        }
    }
`);

export const createRsnPageFlatMutDoc = graphql(/* GraphQL */ `
    mutation createRsnPageFlat($objects: [RsnPageInsertInput!]!) {
        insertIntoRsnPageCollection(objects: $objects) {
            affectedCount
            records {
                ...RsnPageFlatFrag
            }
        }
    }
`);

export const createRsnPageVectorFlatMutDoc = graphql(/* GraphQL */ `
    mutation createRsnPageVectorFlat($objects: [RsnPageVectorInsertInput!]!) {
        insertIntoRsnPageVectorCollection(objects: $objects) {
            affectedCount
            records {
                ...RsnPageVectorFlatFrag
            }
        }
    }
`);

export const createRsnUserFlatMutDoc = graphql(/* GraphQL */ `
    mutation createRsnUserFlat($objects: [RsnUserInsertInput!]!) {
        insertIntoRsnUserCollection(objects: $objects) {
            affectedCount
            records {
                ...RsnUserFlatFrag
            }
        }
    }
`);

export const createRsnUserSysdataFlatMutDoc = graphql(/* GraphQL */ `
    mutation createRsnUserSysdataFlat($objects: [RsnUserSysdataInsertInput!]!) {
        insertIntoRsnUserSysdataCollection(objects: $objects) {
            affectedCount
            records {
                ...RsnUserSysdataFlatFrag
            }
        }
    }
`);

export const createRsnVecFlatMutDoc = graphql(/* GraphQL */ `
    mutation createRsnVecFlat($objects: [RsnVecInsertInput!]!) {
        insertIntoRsnVecCollection(objects: $objects) {
            affectedCount
            records {
                ...RsnVecFlatFrag
            }
        }
    }
`);

export const createRsnVecConfigFlatMutDoc = graphql(/* GraphQL */ `
    mutation createRsnVecConfigFlat($objects: [RsnVecConfigInsertInput!]!) {
        insertIntoRsnVecConfigCollection(objects: $objects) {
            affectedCount
            records {
                ...RsnVecConfigFlatFrag
            }
        }
    }
`);

export const createRsnVecQueueFlatMutDoc = graphql(/* GraphQL */ `
    mutation createRsnVecQueueFlat($objects: [RsnVecQueueInsertInput!]!) {
        insertIntoRsnVecQueueCollection(objects: $objects) {
            affectedCount
            records {
                ...RsnVecQueueFlatFrag
            }
        }
    }
`);

export const createRsncoreTableAbbreviationsFlatMutDoc = graphql(/* GraphQL */ `
    mutation createRsncoreTableAbbreviationsFlat($objects: [RsncoreTableAbbreviationsInsertInput!]!) {
        insertIntoRsncoreTableAbbreviationsCollection(objects: $objects) {
            affectedCount
            records {
                ...RsncoreTableAbbreviationsFlatFrag
            }
        }
    }
`);

export const createSkillFlatMutDoc = graphql(/* GraphQL */ `
    mutation createSkillFlat($objects: [SkillInsertInput!]!) {
        insertIntoSkillCollection(objects: $objects) {
            affectedCount
            records {
                ...SkillFlatFrag
            }
        }
    }
`);

export const createSkillLinkFlatMutDoc = graphql(/* GraphQL */ `
    mutation createSkillLinkFlat($objects: [SkillLinkInsertInput!]!) {
        insertIntoSkillLinkCollection(objects: $objects) {
            affectedCount
            records {
                ...SkillLinkFlatFrag
            }
        }
    }
`);

export const createSkillModuleFlatMutDoc = graphql(/* GraphQL */ `
    mutation createSkillModuleFlat($objects: [SkillModuleInsertInput!]!) {
        insertIntoSkillModuleCollection(objects: $objects) {
            affectedCount
            records {
                ...SkillModuleFlatFrag
            }
        }
    }
`);

export const createSkillSetFlatMutDoc = graphql(/* GraphQL */ `
    mutation createSkillSetFlat($objects: [SkillSetInsertInput!]!) {
        insertIntoSkillSetCollection(objects: $objects) {
            affectedCount
            records {
                ...SkillSetFlatFrag
            }
        }
    }
`);

export const createSkillSetSkillFlatMutDoc = graphql(/* GraphQL */ `
    mutation createSkillSetSkillFlat($objects: [SkillSetSkillInsertInput!]!) {
        insertIntoSkillSetSkillCollection(objects: $objects) {
            affectedCount
            records {
                ...SkillSetSkillFlatFrag
            }
        }
    }
`);

export const createSnipFlatMutDoc = graphql(/* GraphQL */ `
    mutation createSnipFlat($objects: [SnipInsertInput!]!) {
        insertIntoSnipCollection(objects: $objects) {
            affectedCount
            records {
                ...SnipFlatFrag
            }
        }
    }
`);

export const createStripeCustomersFlatMutDoc = graphql(/* GraphQL */ `
    mutation createStripeCustomersFlat($objects: [StripeCustomersInsertInput!]!) {
        insertIntoStripeCustomersCollection(objects: $objects) {
            affectedCount
            records {
                ...StripeCustomersFlatFrag
            }
        }
    }
`);

export const createStripeProductsFlatMutDoc = graphql(/* GraphQL */ `
    mutation createStripeProductsFlat($objects: [StripeProductsInsertInput!]!) {
        insertIntoStripeProductsCollection(objects: $objects) {
            affectedCount
            records {
                ...StripeProductsFlatFrag
            }
        }
    }
`);

export const createStripeSubscriptionsFlatMutDoc = graphql(/* GraphQL */ `
    mutation createStripeSubscriptionsFlat($objects: [StripeSubscriptionsInsertInput!]!) {
        insertIntoStripeSubscriptionsCollection(objects: $objects) {
            affectedCount
            records {
                ...StripeSubscriptionsFlatFrag
            }
        }
    }
`);

export const createUserActivityFeedbackFlatMutDoc = graphql(/* GraphQL */ `
    mutation createUserActivityFeedbackFlat($objects: [UserActivityFeedbackInsertInput!]!) {
        insertIntoUserActivityFeedbackCollection(objects: $objects) {
            affectedCount
            records {
                ...UserActivityFeedbackFlatFrag
            }
        }
    }
`);

export const createUserActivityResultFlatMutDoc = graphql(/* GraphQL */ `
    mutation createUserActivityResultFlat($objects: [UserActivityResultInsertInput!]!) {
        insertIntoUserActivityResultCollection(objects: $objects) {
            affectedCount
            records {
                ...UserActivityResultFlatFrag
            }
        }
    }
`);

export const createUserHistoryFlatMutDoc = graphql(/* GraphQL */ `
    mutation createUserHistoryFlat($objects: [UserHistoryInsertInput!]!) {
        insertIntoUserHistoryCollection(objects: $objects) {
            affectedCount
            records {
                ...UserHistoryFlatFrag
            }
        }
    }
`);

export const createUserLessonResultFlatMutDoc = graphql(/* GraphQL */ `
    mutation createUserLessonResultFlat($objects: [UserLessonResultInsertInput!]!) {
        insertIntoUserLessonResultCollection(objects: $objects) {
            affectedCount
            records {
                ...UserLessonResultFlatFrag
            }
        }
    }
`);

export const createUserProfileFlatMutDoc = graphql(/* GraphQL */ `
    mutation createUserProfileFlat($objects: [UserProfileInsertInput!]!) {
        insertIntoUserProfileCollection(objects: $objects) {
            affectedCount
            records {
                ...UserProfileFlatFrag
            }
        }
    }
`);

export const createUserSettingFlatMutDoc = graphql(/* GraphQL */ `
    mutation createUserSettingFlat($objects: [UserSettingInsertInput!]!) {
        insertIntoUserSettingCollection(objects: $objects) {
            affectedCount
            records {
                ...UserSettingFlatFrag
            }
        }
    }
`);

export const createUserSkillFlatMutDoc = graphql(/* GraphQL */ `
    mutation createUserSkillFlat($objects: [UserSkillInsertInput!]!) {
        insertIntoUserSkillCollection(objects: $objects) {
            affectedCount
            records {
                ...UserSkillFlatFrag
            }
        }
    }
`);

export const createUserSkillSysdataFlatMutDoc = graphql(/* GraphQL */ `
    mutation createUserSkillSysdataFlat($objects: [UserSkillSysdataInsertInput!]!) {
        insertIntoUserSkillSysdataCollection(objects: $objects) {
            affectedCount
            records {
                ...UserSkillSysdataFlatFrag
            }
        }
    }
`);

export const createUserTourFlatMutDoc = graphql(/* GraphQL */ `
    mutation createUserTourFlat($objects: [UserTourInsertInput!]!) {
        insertIntoUserTourCollection(objects: $objects) {
            affectedCount
            records {
                ...UserTourFlatFrag
            }
        }
    }
`);

export const updateAccessLevelPermissionFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateAccessLevelPermissionFlat($set: AccessLevelPermissionUpdateInput!, $filter: AccessLevelPermissionFilter, $atMost: Int!) {
        updateAccessLevelPermissionCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...AccessLevelPermissionFlatFrag
            }
        }
    }
`);

export const updateActivityFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateActivityFlat($set: ActivityUpdateInput!, $filter: ActivityFilter, $atMost: Int!) {
        updateActivityCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...ActivityFlatFrag
            }
        }
    }
`);

export const updateActivitySetFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateActivitySetFlat($set: ActivitySetUpdateInput!, $filter: ActivitySetFilter, $atMost: Int!) {
        updateActivitySetCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...ActivitySetFlatFrag
            }
        }
    }
`);

export const updateActivitySetActivityFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateActivitySetActivityFlat($set: ActivitySetActivityUpdateInput!, $filter: ActivitySetActivityFilter, $atMost: Int!) {
        updateActivitySetActivityCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...ActivitySetActivityFlatFrag
            }
        }
    }
`);

export const updateActivitySkillFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateActivitySkillFlat($set: ActivitySkillUpdateInput!, $filter: ActivitySkillFilter, $atMost: Int!) {
        updateActivitySkillCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...ActivitySkillFlatFrag
            }
        }
    }
`);

export const updateAnalyzerFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateAnalyzerFlat($set: AnalyzerUpdateInput!, $filter: AnalyzerFilter, $atMost: Int!) {
        updateAnalyzerCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...AnalyzerFlatFrag
            }
        }
    }
`);

export const updateBlogPostFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateBlogPostFlat($set: BlogPostUpdateInput!, $filter: BlogPostFilter, $atMost: Int!) {
        updateBlogPostCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...BlogPostFlatFrag
            }
        }
    }
`);

export const updateBotFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateBotFlat($set: BotUpdateInput!, $filter: BotFilter, $atMost: Int!) {
        updateBotCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...BotFlatFrag
            }
        }
    }
`);

export const updateBotSetFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateBotSetFlat($set: BotSetUpdateInput!, $filter: BotSetFilter, $atMost: Int!) {
        updateBotSetCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...BotSetFlatFrag
            }
        }
    }
`);

export const updateBotSetBotFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateBotSetBotFlat($set: BotSetBotUpdateInput!, $filter: BotSetBotFilter, $atMost: Int!) {
        updateBotSetBotCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...BotSetBotFlatFrag
            }
        }
    }
`);

export const updateChapterFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateChapterFlat($set: ChapterUpdateInput!, $filter: ChapterFilter, $atMost: Int!) {
        updateChapterCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...ChapterFlatFrag
            }
        }
    }
`);

export const updateChatFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateChatFlat($set: ChatUpdateInput!, $filter: ChatFilter, $atMost: Int!) {
        updateChatCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...ChatFlatFrag
            }
        }
    }
`);

export const updateChatMessageFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateChatMessageFlat($set: ChatMessageUpdateInput!, $filter: ChatMessageFilter, $atMost: Int!) {
        updateChatMessageCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...ChatMessageFlatFrag
            }
        }
    }
`);

export const updateChromeExtensionEventFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateChromeExtensionEventFlat($set: ChromeExtensionEventUpdateInput!, $filter: ChromeExtensionEventFilter, $atMost: Int!) {
        updateChromeExtensionEventCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...ChromeExtensionEventFlatFrag
            }
        }
    }
`);

export const updateCourseFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateCourseFlat($set: CourseUpdateInput!, $filter: CourseFilter, $atMost: Int!) {
        updateCourseCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...CourseFlatFrag
            }
        }
    }
`);

export const updateCourseLessonFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateCourseLessonFlat($set: CourseLessonUpdateInput!, $filter: CourseLessonFilter, $atMost: Int!) {
        updateCourseLessonCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...CourseLessonFlatFrag
            }
        }
    }
`);

export const updateEmailSubscriptionFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateEmailSubscriptionFlat($set: EmailSubscriptionUpdateInput!, $filter: EmailSubscriptionFilter, $atMost: Int!) {
        updateEmailSubscriptionCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...EmailSubscriptionFlatFrag
            }
        }
    }
`);

export const updateEntityFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateEntityFlat($set: EntityUpdateInput!, $filter: EntityFilter, $atMost: Int!) {
        updateEntityCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...EntityFlatFrag
            }
        }
    }
`);

export const updateEntityTypeFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateEntityTypeFlat($set: EntityTypeUpdateInput!, $filter: EntityTypeFilter, $atMost: Int!) {
        updateEntityTypeCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...EntityTypeFlatFrag
            }
        }
    }
`);

export const updateEntityTypeAccessLevelFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateEntityTypeAccessLevelFlat($set: EntityTypeAccessLevelUpdateInput!, $filter: EntityTypeAccessLevelFilter, $atMost: Int!) {
        updateEntityTypeAccessLevelCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...EntityTypeAccessLevelFlatFrag
            }
        }
    }
`);

export const updateGoalFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateGoalFlat($set: GoalUpdateInput!, $filter: GoalFilter, $atMost: Int!) {
        updateGoalCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...GoalFlatFrag
            }
        }
    }
`);

export const updateGroupFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateGroupFlat($set: GroupUpdateInput!, $filter: GroupFilter, $atMost: Int!) {
        updateGroupCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...GroupFlatFrag
            }
        }
    }
`);

export const updateIntegrationFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateIntegrationFlat($set: IntegrationUpdateInput!, $filter: IntegrationFilter, $atMost: Int!) {
        updateIntegrationCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...IntegrationFlatFrag
            }
        }
    }
`);

export const updateIntegrationTokenFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateIntegrationTokenFlat($set: IntegrationTokenUpdateInput!, $filter: IntegrationTokenFilter, $atMost: Int!) {
        updateIntegrationTokenCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...IntegrationTokenFlatFrag
            }
        }
    }
`);

export const updateJournalFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateJournalFlat($set: JournalUpdateInput!, $filter: JournalFilter, $atMost: Int!) {
        updateJournalCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...JournalFlatFrag
            }
        }
    }
`);

export const updateLessonFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateLessonFlat($set: LessonUpdateInput!, $filter: LessonFilter, $atMost: Int!) {
        updateLessonCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...LessonFlatFrag
            }
        }
    }
`);

export const updateLessonActivityFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateLessonActivityFlat($set: LessonActivityUpdateInput!, $filter: LessonActivityFilter, $atMost: Int!) {
        updateLessonActivityCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...LessonActivityFlatFrag
            }
        }
    }
`);

export const updateLessonSessionFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateLessonSessionFlat($set: LessonSessionUpdateInput!, $filter: LessonSessionFilter, $atMost: Int!) {
        updateLessonSessionCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...LessonSessionFlatFrag
            }
        }
    }
`);

export const updateMemauthFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateMemauthFlat($set: MemauthUpdateInput!, $filter: MemauthFilter, $atMost: Int!) {
        updateMemauthCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...MemauthFlatFrag
            }
        }
    }
`);

export const updateMemberAuthorizationFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateMemberAuthorizationFlat($set: MemberAuthorizationUpdateInput!, $filter: MemberAuthorizationFilter, $atMost: Int!) {
        updateMemberAuthorizationCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...MemberAuthorizationFlatFrag
            }
        }
    }
`);

export const updateNotificationSubscriptionFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateNotificationSubscriptionFlat($set: NotificationSubscriptionUpdateInput!, $filter: NotificationSubscriptionFilter, $atMost: Int!) {
        updateNotificationSubscriptionCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...NotificationSubscriptionFlatFrag
            }
        }
    }
`);

export const updateOperationLogFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateOperationLogFlat($set: OperationLogUpdateInput!, $filter: OperationLogFilter, $atMost: Int!) {
        updateOperationLogCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...OperationLogFlatFrag
            }
        }
    }
`);

export const updatePartialSkillFlatMutDoc = graphql(/* GraphQL */ `
    mutation updatePartialSkillFlat($set: PartialSkillUpdateInput!, $filter: PartialSkillFilter, $atMost: Int!) {
        updatePartialSkillCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...PartialSkillFlatFrag
            }
        }
    }
`);

export const updatePermissionFlatMutDoc = graphql(/* GraphQL */ `
    mutation updatePermissionFlat($set: PermissionUpdateInput!, $filter: PermissionFilter, $atMost: Int!) {
        updatePermissionCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...PermissionFlatFrag
            }
        }
    }
`);

export const updatePodcastFlatMutDoc = graphql(/* GraphQL */ `
    mutation updatePodcastFlat($set: PodcastUpdateInput!, $filter: PodcastFilter, $atMost: Int!) {
        updatePodcastCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...PodcastFlatFrag
            }
        }
    }
`);

export const updatePodcastAudioFlatMutDoc = graphql(/* GraphQL */ `
    mutation updatePodcastAudioFlat($set: PodcastAudioUpdateInput!, $filter: PodcastAudioFilter, $atMost: Int!) {
        updatePodcastAudioCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...PodcastAudioFlatFrag
            }
        }
    }
`);

export const updatePodcastLineFlatMutDoc = graphql(/* GraphQL */ `
    mutation updatePodcastLineFlat($set: PodcastLineUpdateInput!, $filter: PodcastLineFilter, $atMost: Int!) {
        updatePodcastLineCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...PodcastLineFlatFrag
            }
        }
    }
`);

export const updatePodcastQueueItemFlatMutDoc = graphql(/* GraphQL */ `
    mutation updatePodcastQueueItemFlat($set: PodcastQueueItemUpdateInput!, $filter: PodcastQueueItemFilter, $atMost: Int!) {
        updatePodcastQueueItemCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...PodcastQueueItemFlatFrag
            }
        }
    }
`);

export const updatePushNotificationSubscriptionFlatMutDoc = graphql(/* GraphQL */ `
    mutation updatePushNotificationSubscriptionFlat($set: PushNotificationSubscriptionUpdateInput!, $filter: PushNotificationSubscriptionFilter, $atMost: Int!) {
        updatePushNotificationSubscriptionCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...PushNotificationSubscriptionFlatFrag
            }
        }
    }
`);

export const updateReferenceFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateReferenceFlat($set: ReferenceUpdateInput!, $filter: ReferenceFilter, $atMost: Int!) {
        updateReferenceCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...ReferenceFlatFrag
            }
        }
    }
`);

export const updateResourceFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateResourceFlat($set: ResourceUpdateInput!, $filter: ResourceFilter, $atMost: Int!) {
        updateResourceCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...ResourceFlatFrag
            }
        }
    }
`);

export const updateRsnPageFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateRsnPageFlat($set: RsnPageUpdateInput!, $filter: RsnPageFilter, $atMost: Int!) {
        updateRsnPageCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...RsnPageFlatFrag
            }
        }
    }
`);

export const updateRsnPageVectorFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateRsnPageVectorFlat($set: RsnPageVectorUpdateInput!, $filter: RsnPageVectorFilter, $atMost: Int!) {
        updateRsnPageVectorCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...RsnPageVectorFlatFrag
            }
        }
    }
`);

export const updateRsnUserFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateRsnUserFlat($set: RsnUserUpdateInput!, $filter: RsnUserFilter, $atMost: Int!) {
        updateRsnUserCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...RsnUserFlatFrag
            }
        }
    }
`);

export const updateRsnUserSysdataFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateRsnUserSysdataFlat($set: RsnUserSysdataUpdateInput!, $filter: RsnUserSysdataFilter, $atMost: Int!) {
        updateRsnUserSysdataCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...RsnUserSysdataFlatFrag
            }
        }
    }
`);

export const updateRsnVecFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateRsnVecFlat($set: RsnVecUpdateInput!, $filter: RsnVecFilter, $atMost: Int!) {
        updateRsnVecCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...RsnVecFlatFrag
            }
        }
    }
`);

export const updateRsnVecConfigFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateRsnVecConfigFlat($set: RsnVecConfigUpdateInput!, $filter: RsnVecConfigFilter, $atMost: Int!) {
        updateRsnVecConfigCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...RsnVecConfigFlatFrag
            }
        }
    }
`);

export const updateRsnVecQueueFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateRsnVecQueueFlat($set: RsnVecQueueUpdateInput!, $filter: RsnVecQueueFilter, $atMost: Int!) {
        updateRsnVecQueueCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...RsnVecQueueFlatFrag
            }
        }
    }
`);

export const updateRsncoreTableAbbreviationsFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateRsncoreTableAbbreviationsFlat($set: RsncoreTableAbbreviationsUpdateInput!, $filter: RsncoreTableAbbreviationsFilter, $atMost: Int!) {
        updateRsncoreTableAbbreviationsCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...RsncoreTableAbbreviationsFlatFrag
            }
        }
    }
`);

export const updateSkillFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateSkillFlat($set: SkillUpdateInput!, $filter: SkillFilter, $atMost: Int!) {
        updateSkillCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...SkillFlatFrag
            }
        }
    }
`);

export const updateSkillLinkFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateSkillLinkFlat($set: SkillLinkUpdateInput!, $filter: SkillLinkFilter, $atMost: Int!) {
        updateSkillLinkCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...SkillLinkFlatFrag
            }
        }
    }
`);

export const updateSkillModuleFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateSkillModuleFlat($set: SkillModuleUpdateInput!, $filter: SkillModuleFilter, $atMost: Int!) {
        updateSkillModuleCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...SkillModuleFlatFrag
            }
        }
    }
`);

export const updateSkillSetFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateSkillSetFlat($set: SkillSetUpdateInput!, $filter: SkillSetFilter, $atMost: Int!) {
        updateSkillSetCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...SkillSetFlatFrag
            }
        }
    }
`);

export const updateSkillSetSkillFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateSkillSetSkillFlat($set: SkillSetSkillUpdateInput!, $filter: SkillSetSkillFilter, $atMost: Int!) {
        updateSkillSetSkillCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...SkillSetSkillFlatFrag
            }
        }
    }
`);

export const updateSnipFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateSnipFlat($set: SnipUpdateInput!, $filter: SnipFilter, $atMost: Int!) {
        updateSnipCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...SnipFlatFrag
            }
        }
    }
`);

export const updateStripeCustomersFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateStripeCustomersFlat($set: StripeCustomersUpdateInput!, $filter: StripeCustomersFilter, $atMost: Int!) {
        updateStripeCustomersCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...StripeCustomersFlatFrag
            }
        }
    }
`);

export const updateStripeProductsFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateStripeProductsFlat($set: StripeProductsUpdateInput!, $filter: StripeProductsFilter, $atMost: Int!) {
        updateStripeProductsCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...StripeProductsFlatFrag
            }
        }
    }
`);

export const updateStripeSubscriptionsFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateStripeSubscriptionsFlat($set: StripeSubscriptionsUpdateInput!, $filter: StripeSubscriptionsFilter, $atMost: Int!) {
        updateStripeSubscriptionsCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...StripeSubscriptionsFlatFrag
            }
        }
    }
`);

export const updateUserActivityFeedbackFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateUserActivityFeedbackFlat($set: UserActivityFeedbackUpdateInput!, $filter: UserActivityFeedbackFilter, $atMost: Int!) {
        updateUserActivityFeedbackCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...UserActivityFeedbackFlatFrag
            }
        }
    }
`);

export const updateUserActivityResultFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateUserActivityResultFlat($set: UserActivityResultUpdateInput!, $filter: UserActivityResultFilter, $atMost: Int!) {
        updateUserActivityResultCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...UserActivityResultFlatFrag
            }
        }
    }
`);

export const updateUserHistoryFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateUserHistoryFlat($set: UserHistoryUpdateInput!, $filter: UserHistoryFilter, $atMost: Int!) {
        updateUserHistoryCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...UserHistoryFlatFrag
            }
        }
    }
`);

export const updateUserLessonResultFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateUserLessonResultFlat($set: UserLessonResultUpdateInput!, $filter: UserLessonResultFilter, $atMost: Int!) {
        updateUserLessonResultCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...UserLessonResultFlatFrag
            }
        }
    }
`);

export const updateUserProfileFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateUserProfileFlat($set: UserProfileUpdateInput!, $filter: UserProfileFilter, $atMost: Int!) {
        updateUserProfileCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...UserProfileFlatFrag
            }
        }
    }
`);

export const updateUserSettingFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateUserSettingFlat($set: UserSettingUpdateInput!, $filter: UserSettingFilter, $atMost: Int!) {
        updateUserSettingCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...UserSettingFlatFrag
            }
        }
    }
`);

export const updateUserSkillFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateUserSkillFlat($set: UserSkillUpdateInput!, $filter: UserSkillFilter, $atMost: Int!) {
        updateUserSkillCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...UserSkillFlatFrag
            }
        }
    }
`);

export const updateUserSkillSysdataFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateUserSkillSysdataFlat($set: UserSkillSysdataUpdateInput!, $filter: UserSkillSysdataFilter, $atMost: Int!) {
        updateUserSkillSysdataCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...UserSkillSysdataFlatFrag
            }
        }
    }
`);

export const updateUserTourFlatMutDoc = graphql(/* GraphQL */ `
    mutation updateUserTourFlat($set: UserTourUpdateInput!, $filter: UserTourFilter, $atMost: Int!) {
        updateUserTourCollection(set: $set, filter: $filter, atMost: $atMost) {
            affectedCount
            records {
                ...UserTourFlatFrag
            }
        }
    }
`);

export const deleteActivityFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteActivityFlat($atMost: Int!, $filter: ActivityFilter) {
        deleteFromActivityCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteActivitySetFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteActivitySetFlat($atMost: Int!, $filter: ActivitySetFilter) {
        deleteFromActivitySetCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteActivitySetActivityFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteActivitySetActivityFlat($atMost: Int!, $filter: ActivitySetActivityFilter) {
        deleteFromActivitySetActivityCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteActivitySkillFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteActivitySkillFlat($atMost: Int!, $filter: ActivitySkillFilter) {
        deleteFromActivitySkillCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteAnalyzerFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteAnalyzerFlat($atMost: Int!, $filter: AnalyzerFilter) {
        deleteFromAnalyzerCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteBlogPostFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteBlogPostFlat($atMost: Int!, $filter: BlogPostFilter) {
        deleteFromBlogPostCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteBotFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteBotFlat($atMost: Int!, $filter: BotFilter) {
        deleteFromBotCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteBotSetFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteBotSetFlat($atMost: Int!, $filter: BotSetFilter) {
        deleteFromBotSetCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteBotSetBotFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteBotSetBotFlat($atMost: Int!, $filter: BotSetBotFilter) {
        deleteFromBotSetBotCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteChapterFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteChapterFlat($atMost: Int!, $filter: ChapterFilter) {
        deleteFromChapterCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteChatFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteChatFlat($atMost: Int!, $filter: ChatFilter) {
        deleteFromChatCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteChatMessageFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteChatMessageFlat($atMost: Int!, $filter: ChatMessageFilter) {
        deleteFromChatMessageCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteChromeExtensionEventFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteChromeExtensionEventFlat($atMost: Int!, $filter: ChromeExtensionEventFilter) {
        deleteFromChromeExtensionEventCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteCourseFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteCourseFlat($atMost: Int!, $filter: CourseFilter) {
        deleteFromCourseCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteCourseLessonFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteCourseLessonFlat($atMost: Int!, $filter: CourseLessonFilter) {
        deleteFromCourseLessonCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteEmailSubscriptionFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteEmailSubscriptionFlat($atMost: Int!, $filter: EmailSubscriptionFilter) {
        deleteFromEmailSubscriptionCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteEntityFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteEntityFlat($atMost: Int!, $filter: EntityFilter) {
        deleteFromEntityCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteGoalFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteGoalFlat($atMost: Int!, $filter: GoalFilter) {
        deleteFromGoalCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteGroupFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteGroupFlat($atMost: Int!, $filter: GroupFilter) {
        deleteFromGroupCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteIntegrationFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteIntegrationFlat($atMost: Int!, $filter: IntegrationFilter) {
        deleteFromIntegrationCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteIntegrationTokenFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteIntegrationTokenFlat($atMost: Int!, $filter: IntegrationTokenFilter) {
        deleteFromIntegrationTokenCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteJournalFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteJournalFlat($atMost: Int!, $filter: JournalFilter) {
        deleteFromJournalCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteLessonFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteLessonFlat($atMost: Int!, $filter: LessonFilter) {
        deleteFromLessonCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteLessonActivityFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteLessonActivityFlat($atMost: Int!, $filter: LessonActivityFilter) {
        deleteFromLessonActivityCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteLessonSessionFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteLessonSessionFlat($atMost: Int!, $filter: LessonSessionFilter) {
        deleteFromLessonSessionCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteMemauthFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteMemauthFlat($atMost: Int!, $filter: MemauthFilter) {
        deleteFromMemauthCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteMemberAuthorizationFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteMemberAuthorizationFlat($atMost: Int!, $filter: MemberAuthorizationFilter) {
        deleteFromMemberAuthorizationCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteNotificationSubscriptionFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteNotificationSubscriptionFlat($atMost: Int!, $filter: NotificationSubscriptionFilter) {
        deleteFromNotificationSubscriptionCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteOperationLogFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteOperationLogFlat($atMost: Int!, $filter: OperationLogFilter) {
        deleteFromOperationLogCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deletePartialSkillFlatMutDoc = graphql(/* GraphQL */ `
    mutation deletePartialSkillFlat($atMost: Int!, $filter: PartialSkillFilter) {
        deleteFromPartialSkillCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deletePodcastFlatMutDoc = graphql(/* GraphQL */ `
    mutation deletePodcastFlat($atMost: Int!, $filter: PodcastFilter) {
        deleteFromPodcastCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deletePodcastAudioFlatMutDoc = graphql(/* GraphQL */ `
    mutation deletePodcastAudioFlat($atMost: Int!, $filter: PodcastAudioFilter) {
        deleteFromPodcastAudioCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deletePodcastLineFlatMutDoc = graphql(/* GraphQL */ `
    mutation deletePodcastLineFlat($atMost: Int!, $filter: PodcastLineFilter) {
        deleteFromPodcastLineCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deletePodcastQueueItemFlatMutDoc = graphql(/* GraphQL */ `
    mutation deletePodcastQueueItemFlat($atMost: Int!, $filter: PodcastQueueItemFilter) {
        deleteFromPodcastQueueItemCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deletePushNotificationSubscriptionFlatMutDoc = graphql(/* GraphQL */ `
    mutation deletePushNotificationSubscriptionFlat($atMost: Int!, $filter: PushNotificationSubscriptionFilter) {
        deleteFromPushNotificationSubscriptionCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteReferenceFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteReferenceFlat($atMost: Int!, $filter: ReferenceFilter) {
        deleteFromReferenceCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteResourceFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteResourceFlat($atMost: Int!, $filter: ResourceFilter) {
        deleteFromResourceCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteRsnPageFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteRsnPageFlat($atMost: Int!, $filter: RsnPageFilter) {
        deleteFromRsnPageCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteRsnPageVectorFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteRsnPageVectorFlat($atMost: Int!, $filter: RsnPageVectorFilter) {
        deleteFromRsnPageVectorCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteRsnUserFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteRsnUserFlat($atMost: Int!, $filter: RsnUserFilter) {
        deleteFromRsnUserCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteRsnUserSysdataFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteRsnUserSysdataFlat($atMost: Int!, $filter: RsnUserSysdataFilter) {
        deleteFromRsnUserSysdataCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteRsnVecFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteRsnVecFlat($atMost: Int!, $filter: RsnVecFilter) {
        deleteFromRsnVecCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteRsnVecConfigFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteRsnVecConfigFlat($atMost: Int!, $filter: RsnVecConfigFilter) {
        deleteFromRsnVecConfigCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteRsnVecQueueFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteRsnVecQueueFlat($atMost: Int!, $filter: RsnVecQueueFilter) {
        deleteFromRsnVecQueueCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteRsncoreTableAbbreviationsFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteRsncoreTableAbbreviationsFlat($atMost: Int!, $filter: RsncoreTableAbbreviationsFilter) {
        deleteFromRsncoreTableAbbreviationsCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteSkillFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteSkillFlat($atMost: Int!, $filter: SkillFilter) {
        deleteFromSkillCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteSkillLinkFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteSkillLinkFlat($atMost: Int!, $filter: SkillLinkFilter) {
        deleteFromSkillLinkCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteSkillModuleFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteSkillModuleFlat($atMost: Int!, $filter: SkillModuleFilter) {
        deleteFromSkillModuleCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteSkillSetFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteSkillSetFlat($atMost: Int!, $filter: SkillSetFilter) {
        deleteFromSkillSetCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteSkillSetSkillFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteSkillSetSkillFlat($atMost: Int!, $filter: SkillSetSkillFilter) {
        deleteFromSkillSetSkillCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteSnipFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteSnipFlat($atMost: Int!, $filter: SnipFilter) {
        deleteFromSnipCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteStripeCustomersFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteStripeCustomersFlat($atMost: Int!, $filter: StripeCustomersFilter) {
        deleteFromStripeCustomersCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteStripeProductsFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteStripeProductsFlat($atMost: Int!, $filter: StripeProductsFilter) {
        deleteFromStripeProductsCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteStripeSubscriptionsFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteStripeSubscriptionsFlat($atMost: Int!, $filter: StripeSubscriptionsFilter) {
        deleteFromStripeSubscriptionsCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteUserActivityFeedbackFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteUserActivityFeedbackFlat($atMost: Int!, $filter: UserActivityFeedbackFilter) {
        deleteFromUserActivityFeedbackCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteUserActivityResultFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteUserActivityResultFlat($atMost: Int!, $filter: UserActivityResultFilter) {
        deleteFromUserActivityResultCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteUserHistoryFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteUserHistoryFlat($atMost: Int!, $filter: UserHistoryFilter) {
        deleteFromUserHistoryCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteUserLessonResultFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteUserLessonResultFlat($atMost: Int!, $filter: UserLessonResultFilter) {
        deleteFromUserLessonResultCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteUserProfileFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteUserProfileFlat($atMost: Int!, $filter: UserProfileFilter) {
        deleteFromUserProfileCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteUserSettingFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteUserSettingFlat($atMost: Int!, $filter: UserSettingFilter) {
        deleteFromUserSettingCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteUserSkillFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteUserSkillFlat($atMost: Int!, $filter: UserSkillFilter) {
        deleteFromUserSkillCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteUserSkillSysdataFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteUserSkillSysdataFlat($atMost: Int!, $filter: UserSkillSysdataFilter) {
        deleteFromUserSkillSysdataCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);

export const deleteUserTourFlatMutDoc = graphql(/* GraphQL */ `
    mutation deleteUserTourFlat($atMost: Int!, $filter: UserTourFilter) {
        deleteFromUserTourCollection(atMost: $atMost, filter: $filter) {
            affectedCount
            records {
                __typename
                id
            }
        }
    }
`);