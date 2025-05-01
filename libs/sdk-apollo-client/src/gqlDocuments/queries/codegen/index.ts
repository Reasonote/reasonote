import { graphql } from "../../../codegen";

export const getAccessLevelPermissionFlatQueryDoc = graphql(/* GraphQL */ `
    query getAccessLevelPermissionFlat (
        $filter: AccessLevelPermissionFilter
        $orderBy: [AccessLevelPermissionOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        accessLevelPermissionCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...AccessLevelPermissionFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getActivityFlatQueryDoc = graphql(/* GraphQL */ `
    query getActivityFlat (
        $filter: ActivityFilter
        $orderBy: [ActivityOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        activityCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...ActivityFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getActivitySetFlatQueryDoc = graphql(/* GraphQL */ `
    query getActivitySetFlat (
        $filter: ActivitySetFilter
        $orderBy: [ActivitySetOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        activitySetCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...ActivitySetFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getActivitySetActivityFlatQueryDoc = graphql(/* GraphQL */ `
    query getActivitySetActivityFlat (
        $filter: ActivitySetActivityFilter
        $orderBy: [ActivitySetActivityOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        activitySetActivityCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...ActivitySetActivityFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getActivitySkillFlatQueryDoc = graphql(/* GraphQL */ `
    query getActivitySkillFlat (
        $filter: ActivitySkillFilter
        $orderBy: [ActivitySkillOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        activitySkillCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...ActivitySkillFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getAnalyzerFlatQueryDoc = graphql(/* GraphQL */ `
    query getAnalyzerFlat (
        $filter: AnalyzerFilter
        $orderBy: [AnalyzerOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        analyzerCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...AnalyzerFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getBlogPostFlatQueryDoc = graphql(/* GraphQL */ `
    query getBlogPostFlat (
        $filter: BlogPostFilter
        $orderBy: [BlogPostOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        blogPostCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...BlogPostFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getBotFlatQueryDoc = graphql(/* GraphQL */ `
    query getBotFlat (
        $filter: BotFilter
        $orderBy: [BotOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        botCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...BotFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getBotSetFlatQueryDoc = graphql(/* GraphQL */ `
    query getBotSetFlat (
        $filter: BotSetFilter
        $orderBy: [BotSetOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        botSetCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...BotSetFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getBotSetBotFlatQueryDoc = graphql(/* GraphQL */ `
    query getBotSetBotFlat (
        $filter: BotSetBotFilter
        $orderBy: [BotSetBotOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        botSetBotCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...BotSetBotFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getChapterFlatQueryDoc = graphql(/* GraphQL */ `
    query getChapterFlat (
        $filter: ChapterFilter
        $orderBy: [ChapterOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        chapterCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...ChapterFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getChatFlatQueryDoc = graphql(/* GraphQL */ `
    query getChatFlat (
        $filter: ChatFilter
        $orderBy: [ChatOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        chatCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...ChatFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getChatMessageFlatQueryDoc = graphql(/* GraphQL */ `
    query getChatMessageFlat (
        $filter: ChatMessageFilter
        $orderBy: [ChatMessageOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        chatMessageCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...ChatMessageFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getChromeExtensionEventFlatQueryDoc = graphql(/* GraphQL */ `
    query getChromeExtensionEventFlat (
        $filter: ChromeExtensionEventFilter
        $orderBy: [ChromeExtensionEventOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        chromeExtensionEventCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...ChromeExtensionEventFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getCourseFlatQueryDoc = graphql(/* GraphQL */ `
    query getCourseFlat (
        $filter: CourseFilter
        $orderBy: [CourseOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        courseCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...CourseFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getCourseLessonFlatQueryDoc = graphql(/* GraphQL */ `
    query getCourseLessonFlat (
        $filter: CourseLessonFilter
        $orderBy: [CourseLessonOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        courseLessonCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...CourseLessonFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getEmailSubscriptionFlatQueryDoc = graphql(/* GraphQL */ `
    query getEmailSubscriptionFlat (
        $filter: EmailSubscriptionFilter
        $orderBy: [EmailSubscriptionOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        emailSubscriptionCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...EmailSubscriptionFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getEntityFlatQueryDoc = graphql(/* GraphQL */ `
    query getEntityFlat (
        $filter: EntityFilter
        $orderBy: [EntityOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        entityCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...EntityFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getEntityTypeFlatQueryDoc = graphql(/* GraphQL */ `
    query getEntityTypeFlat (
        $filter: EntityTypeFilter
        $orderBy: [EntityTypeOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        entityTypeCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...EntityTypeFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getEntityTypeAccessLevelFlatQueryDoc = graphql(/* GraphQL */ `
    query getEntityTypeAccessLevelFlat (
        $filter: EntityTypeAccessLevelFilter
        $orderBy: [EntityTypeAccessLevelOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        entityTypeAccessLevelCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...EntityTypeAccessLevelFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getGoalFlatQueryDoc = graphql(/* GraphQL */ `
    query getGoalFlat (
        $filter: GoalFilter
        $orderBy: [GoalOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        goalCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...GoalFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getGroupFlatQueryDoc = graphql(/* GraphQL */ `
    query getGroupFlat (
        $filter: GroupFilter
        $orderBy: [GroupOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        groupCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...GroupFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getIntegrationFlatQueryDoc = graphql(/* GraphQL */ `
    query getIntegrationFlat (
        $filter: IntegrationFilter
        $orderBy: [IntegrationOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        integrationCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...IntegrationFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getIntegrationTokenFlatQueryDoc = graphql(/* GraphQL */ `
    query getIntegrationTokenFlat (
        $filter: IntegrationTokenFilter
        $orderBy: [IntegrationTokenOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        integrationTokenCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...IntegrationTokenFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getJournalFlatQueryDoc = graphql(/* GraphQL */ `
    query getJournalFlat (
        $filter: JournalFilter
        $orderBy: [JournalOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        journalCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...JournalFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getLessonFlatQueryDoc = graphql(/* GraphQL */ `
    query getLessonFlat (
        $filter: LessonFilter
        $orderBy: [LessonOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        lessonCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...LessonFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getLessonActivityFlatQueryDoc = graphql(/* GraphQL */ `
    query getLessonActivityFlat (
        $filter: LessonActivityFilter
        $orderBy: [LessonActivityOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        lessonActivityCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...LessonActivityFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getLessonSessionFlatQueryDoc = graphql(/* GraphQL */ `
    query getLessonSessionFlat (
        $filter: LessonSessionFilter
        $orderBy: [LessonSessionOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        lessonSessionCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...LessonSessionFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getMemauthFlatQueryDoc = graphql(/* GraphQL */ `
    query getMemauthFlat (
        $filter: MemauthFilter
        $orderBy: [MemauthOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        memauthCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...MemauthFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getMemberAuthorizationFlatQueryDoc = graphql(/* GraphQL */ `
    query getMemberAuthorizationFlat (
        $filter: MemberAuthorizationFilter
        $orderBy: [MemberAuthorizationOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        memberAuthorizationCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...MemberAuthorizationFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getNotificationSubscriptionFlatQueryDoc = graphql(/* GraphQL */ `
    query getNotificationSubscriptionFlat (
        $filter: NotificationSubscriptionFilter
        $orderBy: [NotificationSubscriptionOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        notificationSubscriptionCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...NotificationSubscriptionFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getOperationLogFlatQueryDoc = graphql(/* GraphQL */ `
    query getOperationLogFlat (
        $filter: OperationLogFilter
        $orderBy: [OperationLogOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        operationLogCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...OperationLogFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getPartialSkillFlatQueryDoc = graphql(/* GraphQL */ `
    query getPartialSkillFlat (
        $filter: PartialSkillFilter
        $orderBy: [PartialSkillOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        partialSkillCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...PartialSkillFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getPermissionFlatQueryDoc = graphql(/* GraphQL */ `
    query getPermissionFlat (
        $filter: PermissionFilter
        $orderBy: [PermissionOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        permissionCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...PermissionFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getPodcastFlatQueryDoc = graphql(/* GraphQL */ `
    query getPodcastFlat (
        $filter: PodcastFilter
        $orderBy: [PodcastOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        podcastCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...PodcastFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getPodcastAudioFlatQueryDoc = graphql(/* GraphQL */ `
    query getPodcastAudioFlat (
        $filter: PodcastAudioFilter
        $orderBy: [PodcastAudioOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        podcastAudioCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...PodcastAudioFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getPodcastLineFlatQueryDoc = graphql(/* GraphQL */ `
    query getPodcastLineFlat (
        $filter: PodcastLineFilter
        $orderBy: [PodcastLineOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        podcastLineCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...PodcastLineFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getPodcastQueueItemFlatQueryDoc = graphql(/* GraphQL */ `
    query getPodcastQueueItemFlat (
        $filter: PodcastQueueItemFilter
        $orderBy: [PodcastQueueItemOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        podcastQueueItemCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...PodcastQueueItemFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getPushNotificationSubscriptionFlatQueryDoc = graphql(/* GraphQL */ `
    query getPushNotificationSubscriptionFlat (
        $filter: PushNotificationSubscriptionFilter
        $orderBy: [PushNotificationSubscriptionOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        pushNotificationSubscriptionCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...PushNotificationSubscriptionFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getReferenceFlatQueryDoc = graphql(/* GraphQL */ `
    query getReferenceFlat (
        $filter: ReferenceFilter
        $orderBy: [ReferenceOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        referenceCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...ReferenceFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getResourceFlatQueryDoc = graphql(/* GraphQL */ `
    query getResourceFlat (
        $filter: ResourceFilter
        $orderBy: [ResourceOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        resourceCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...ResourceFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getRsnPageFlatQueryDoc = graphql(/* GraphQL */ `
    query getRsnPageFlat (
        $filter: RsnPageFilter
        $orderBy: [RsnPageOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        rsnPageCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...RsnPageFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getRsnPageVectorFlatQueryDoc = graphql(/* GraphQL */ `
    query getRsnPageVectorFlat (
        $filter: RsnPageVectorFilter
        $orderBy: [RsnPageVectorOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        rsnPageVectorCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...RsnPageVectorFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getRsnUserFlatQueryDoc = graphql(/* GraphQL */ `
    query getRsnUserFlat (
        $filter: RsnUserFilter
        $orderBy: [RsnUserOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        rsnUserCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...RsnUserFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getRsnUserSysdataFlatQueryDoc = graphql(/* GraphQL */ `
    query getRsnUserSysdataFlat (
        $filter: RsnUserSysdataFilter
        $orderBy: [RsnUserSysdataOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        rsnUserSysdataCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...RsnUserSysdataFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getRsnVecFlatQueryDoc = graphql(/* GraphQL */ `
    query getRsnVecFlat (
        $filter: RsnVecFilter
        $orderBy: [RsnVecOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        rsnVecCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...RsnVecFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getRsnVecConfigFlatQueryDoc = graphql(/* GraphQL */ `
    query getRsnVecConfigFlat (
        $filter: RsnVecConfigFilter
        $orderBy: [RsnVecConfigOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        rsnVecConfigCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...RsnVecConfigFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getRsnVecQueueFlatQueryDoc = graphql(/* GraphQL */ `
    query getRsnVecQueueFlat (
        $filter: RsnVecQueueFilter
        $orderBy: [RsnVecQueueOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        rsnVecQueueCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...RsnVecQueueFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getRsncoreTableAbbreviationsFlatQueryDoc = graphql(/* GraphQL */ `
    query getRsncoreTableAbbreviationsFlat (
        $filter: RsncoreTableAbbreviationsFilter
        $orderBy: [RsncoreTableAbbreviationsOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        rsncoreTableAbbreviationsCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...RsncoreTableAbbreviationsFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getSkillFlatQueryDoc = graphql(/* GraphQL */ `
    query getSkillFlat (
        $filter: SkillFilter
        $orderBy: [SkillOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        skillCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...SkillFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getSkillLinkFlatQueryDoc = graphql(/* GraphQL */ `
    query getSkillLinkFlat (
        $filter: SkillLinkFilter
        $orderBy: [SkillLinkOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        skillLinkCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...SkillLinkFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getSkillModuleFlatQueryDoc = graphql(/* GraphQL */ `
    query getSkillModuleFlat (
        $filter: SkillModuleFilter
        $orderBy: [SkillModuleOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        skillModuleCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...SkillModuleFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getSkillSetFlatQueryDoc = graphql(/* GraphQL */ `
    query getSkillSetFlat (
        $filter: SkillSetFilter
        $orderBy: [SkillSetOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        skillSetCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...SkillSetFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getSkillSetSkillFlatQueryDoc = graphql(/* GraphQL */ `
    query getSkillSetSkillFlat (
        $filter: SkillSetSkillFilter
        $orderBy: [SkillSetSkillOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        skillSetSkillCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...SkillSetSkillFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getSnipFlatQueryDoc = graphql(/* GraphQL */ `
    query getSnipFlat (
        $filter: SnipFilter
        $orderBy: [SnipOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        snipCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...SnipFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getStripeCustomersFlatQueryDoc = graphql(/* GraphQL */ `
    query getStripeCustomersFlat (
        $filter: StripeCustomersFilter
        $orderBy: [StripeCustomersOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        stripeCustomersCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...StripeCustomersFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getStripeProductsFlatQueryDoc = graphql(/* GraphQL */ `
    query getStripeProductsFlat (
        $filter: StripeProductsFilter
        $orderBy: [StripeProductsOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        stripeProductsCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...StripeProductsFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getStripeSubscriptionsFlatQueryDoc = graphql(/* GraphQL */ `
    query getStripeSubscriptionsFlat (
        $filter: StripeSubscriptionsFilter
        $orderBy: [StripeSubscriptionsOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        stripeSubscriptionsCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...StripeSubscriptionsFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getUserActivityFeedbackFlatQueryDoc = graphql(/* GraphQL */ `
    query getUserActivityFeedbackFlat (
        $filter: UserActivityFeedbackFilter
        $orderBy: [UserActivityFeedbackOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        userActivityFeedbackCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...UserActivityFeedbackFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getUserActivityResultFlatQueryDoc = graphql(/* GraphQL */ `
    query getUserActivityResultFlat (
        $filter: UserActivityResultFilter
        $orderBy: [UserActivityResultOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        userActivityResultCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...UserActivityResultFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getUserHistoryFlatQueryDoc = graphql(/* GraphQL */ `
    query getUserHistoryFlat (
        $filter: UserHistoryFilter
        $orderBy: [UserHistoryOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        userHistoryCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...UserHistoryFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getUserLessonResultFlatQueryDoc = graphql(/* GraphQL */ `
    query getUserLessonResultFlat (
        $filter: UserLessonResultFilter
        $orderBy: [UserLessonResultOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        userLessonResultCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...UserLessonResultFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getUserProfileFlatQueryDoc = graphql(/* GraphQL */ `
    query getUserProfileFlat (
        $filter: UserProfileFilter
        $orderBy: [UserProfileOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        userProfileCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...UserProfileFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getUserSettingFlatQueryDoc = graphql(/* GraphQL */ `
    query getUserSettingFlat (
        $filter: UserSettingFilter
        $orderBy: [UserSettingOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        userSettingCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...UserSettingFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getUserSkillFlatQueryDoc = graphql(/* GraphQL */ `
    query getUserSkillFlat (
        $filter: UserSkillFilter
        $orderBy: [UserSkillOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        userSkillCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...UserSkillFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getUserSkillSysdataFlatQueryDoc = graphql(/* GraphQL */ `
    query getUserSkillSysdataFlat (
        $filter: UserSkillSysdataFilter
        $orderBy: [UserSkillSysdataOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        userSkillSysdataCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...UserSkillSysdataFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getUserTourFlatQueryDoc = graphql(/* GraphQL */ `
    query getUserTourFlat (
        $filter: UserTourFilter
        $orderBy: [UserTourOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        userTourCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...UserTourFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getMemberAuthorizationFlatSlowQueryDoc = graphql(/* GraphQL */ `
    query getMemberAuthorizationFlatSlow (
        $filter: MemberAuthorizationFilter
        $orderBy: [MemberAuthorizationOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        memberAuthorizationCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            totalCount
            edges {
                node {
                    ...MemberAuthorizationFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getOperationLogFlatSlowQueryDoc = graphql(/* GraphQL */ `
    query getOperationLogFlatSlow (
        $filter: OperationLogFilter
        $orderBy: [OperationLogOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        operationLogCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            totalCount
            edges {
                node {
                    ...OperationLogFlatFrag
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getMemberAuthorizationFilteredTotalCountQueryDoc = graphql(/* GraphQL */ `
    query getMemberAuthorizationFilteredTotalCount (
        $filter: MemberAuthorizationFilter
    ) {
        memberAuthorizationCollection (
            filter: $filter
        ) {
            totalCount
        }
    }
`);

export const getOperationLogFilteredTotalCountQueryDoc = graphql(/* GraphQL */ `
    query getOperationLogFilteredTotalCount (
        $filter: OperationLogFilter
    ) {
        operationLogCollection (
            filter: $filter
        ) {
            totalCount
        }
    }
`);

export const getMemberAuthorizationIdsOnlyQueryDoc = graphql(/* GraphQL */ `
    query getMemberAuthorizationIdsOnly (
        $filter: MemberAuthorizationFilter
        $orderBy: [MemberAuthorizationOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        memberAuthorizationCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            totalCount
            edges {
                node {
                    id
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);

export const getOperationLogIdsOnlyQueryDoc = graphql(/* GraphQL */ `
    query getOperationLogIdsOnly (
        $filter: OperationLogFilter
        $orderBy: [OperationLogOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        operationLogCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            totalCount
            edges {
                node {
                    id
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);