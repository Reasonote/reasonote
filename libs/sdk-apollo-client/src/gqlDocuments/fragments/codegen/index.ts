import { graphql } from "../../../codegen";

export const AccessLevelPermissionFlatFrag = graphql(/* GraphQL */ `
    fragment AccessLevelPermissionFlatFrag on AccessLevelPermission {
        accessLevel
        createdBy
        createdDate
        entityType
        permissionCode
        updatedBy
        updatedDate
    }
`);

export const AccessLevelPermissionDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment AccessLevelPermissionDeleteResponseFlatFrag on AccessLevelPermissionDeleteResponse {
        affectedCount
    }
`);

export const AccessLevelPermissionEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment AccessLevelPermissionEdgeFlatFrag on AccessLevelPermissionEdge {
        cursor
    }
`);

export const AccessLevelPermissionInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment AccessLevelPermissionInsertResponseFlatFrag on AccessLevelPermissionInsertResponse {
        affectedCount
    }
`);

export const AccessLevelPermissionUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment AccessLevelPermissionUpdateResponseFlatFrag on AccessLevelPermissionUpdateResponse {
        affectedCount
    }
`);

export const ActivityFlatFrag = graphql(/* GraphQL */ `
    fragment ActivityFlatFrag on Activity {
        createdBy
        createdDate
        genInstructions
        generatedForSkillPaths
        generatedForUser
        id
        metadata
        name
        source
        type
        typeConfig
        updatedBy
        updatedDate
    }
`);

export const ActivityDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ActivityDeleteResponseFlatFrag on ActivityDeleteResponse {
        affectedCount
    }
`);

export const ActivityEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment ActivityEdgeFlatFrag on ActivityEdge {
        cursor
    }
`);

export const ActivityInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ActivityInsertResponseFlatFrag on ActivityInsertResponse {
        affectedCount
    }
`);

export const ActivitySetFlatFrag = graphql(/* GraphQL */ `
    fragment ActivitySetFlatFrag on ActivitySet {
        createdBy
        createdDate
        description
        forUser
        id
        metadata
        name
        updatedBy
        updatedDate
    }
`);

export const ActivitySetActivityFlatFrag = graphql(/* GraphQL */ `
    fragment ActivitySetActivityFlatFrag on ActivitySetActivity {
        createdBy
        createdDate
        id
        metadata
        updatedBy
        updatedDate
    }
`);

export const ActivitySetActivityDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ActivitySetActivityDeleteResponseFlatFrag on ActivitySetActivityDeleteResponse {
        affectedCount
    }
`);

export const ActivitySetActivityEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment ActivitySetActivityEdgeFlatFrag on ActivitySetActivityEdge {
        cursor
    }
`);

export const ActivitySetActivityInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ActivitySetActivityInsertResponseFlatFrag on ActivitySetActivityInsertResponse {
        affectedCount
    }
`);

export const ActivitySetActivityUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ActivitySetActivityUpdateResponseFlatFrag on ActivitySetActivityUpdateResponse {
        affectedCount
    }
`);

export const ActivitySetDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ActivitySetDeleteResponseFlatFrag on ActivitySetDeleteResponse {
        affectedCount
    }
`);

export const ActivitySetEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment ActivitySetEdgeFlatFrag on ActivitySetEdge {
        cursor
    }
`);

export const ActivitySetInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ActivitySetInsertResponseFlatFrag on ActivitySetInsertResponse {
        affectedCount
    }
`);

export const ActivitySetUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ActivitySetUpdateResponseFlatFrag on ActivitySetUpdateResponse {
        affectedCount
    }
`);

export const ActivitySkillFlatFrag = graphql(/* GraphQL */ `
    fragment ActivitySkillFlatFrag on ActivitySkill {
        createdBy
        createdDate
        id
        metadata
        type
        updatedBy
        updatedDate
        weight
    }
`);

export const ActivitySkillDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ActivitySkillDeleteResponseFlatFrag on ActivitySkillDeleteResponse {
        affectedCount
    }
`);

export const ActivitySkillEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment ActivitySkillEdgeFlatFrag on ActivitySkillEdge {
        cursor
    }
`);

export const ActivitySkillInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ActivitySkillInsertResponseFlatFrag on ActivitySkillInsertResponse {
        affectedCount
    }
`);

export const ActivitySkillUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ActivitySkillUpdateResponseFlatFrag on ActivitySkillUpdateResponse {
        affectedCount
    }
`);

export const ActivityUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ActivityUpdateResponseFlatFrag on ActivityUpdateResponse {
        affectedCount
    }
`);

export const AnalyzerFlatFrag = graphql(/* GraphQL */ `
    fragment AnalyzerFlatFrag on Analyzer {
        aiJsonschema
        aiPrompt
        createdBy
        createdDate
        description
        id
        metadata
        name
        updatedBy
        updatedDate
    }
`);

export const AnalyzerDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment AnalyzerDeleteResponseFlatFrag on AnalyzerDeleteResponse {
        affectedCount
    }
`);

export const AnalyzerEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment AnalyzerEdgeFlatFrag on AnalyzerEdge {
        cursor
    }
`);

export const AnalyzerInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment AnalyzerInsertResponseFlatFrag on AnalyzerInsertResponse {
        affectedCount
    }
`);

export const AnalyzerUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment AnalyzerUpdateResponseFlatFrag on AnalyzerUpdateResponse {
        affectedCount
    }
`);

export const BlogPostFlatFrag = graphql(/* GraphQL */ `
    fragment BlogPostFlatFrag on BlogPost {
        content
        createdBy
        createdDate
        id
        isPublished
        shortDescription
        slug
        tags
        title
        updatedBy
        updatedDate
    }
`);

export const BlogPostDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment BlogPostDeleteResponseFlatFrag on BlogPostDeleteResponse {
        affectedCount
    }
`);

export const BlogPostEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment BlogPostEdgeFlatFrag on BlogPostEdge {
        cursor
    }
`);

export const BlogPostInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment BlogPostInsertResponseFlatFrag on BlogPostInsertResponse {
        affectedCount
    }
`);

export const BlogPostUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment BlogPostUpdateResponseFlatFrag on BlogPostUpdateResponse {
        affectedCount
    }
`);

export const BotFlatFrag = graphql(/* GraphQL */ `
    fragment BotFlatFrag on Bot {
        avatarEmoji
        avatarUrl
        createdBy
        createdDate
        description
        extras
        forkedFrom
        id
        isPublic
        name
        prompt
        updatedBy
        updatedDate
    }
`);

export const BotDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment BotDeleteResponseFlatFrag on BotDeleteResponse {
        affectedCount
    }
`);

export const BotEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment BotEdgeFlatFrag on BotEdge {
        cursor
    }
`);

export const BotInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment BotInsertResponseFlatFrag on BotInsertResponse {
        affectedCount
    }
`);

export const BotSetFlatFrag = graphql(/* GraphQL */ `
    fragment BotSetFlatFrag on BotSet {
        createdBy
        createdDate
        description
        forUser
        id
        metadata
        name
        updatedBy
        updatedDate
    }
`);

export const BotSetBotFlatFrag = graphql(/* GraphQL */ `
    fragment BotSetBotFlatFrag on BotSetBot {
        createdBy
        createdDate
        id
        metadata
        updatedBy
        updatedDate
    }
`);

export const BotSetBotDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment BotSetBotDeleteResponseFlatFrag on BotSetBotDeleteResponse {
        affectedCount
    }
`);

export const BotSetBotEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment BotSetBotEdgeFlatFrag on BotSetBotEdge {
        cursor
    }
`);

export const BotSetBotInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment BotSetBotInsertResponseFlatFrag on BotSetBotInsertResponse {
        affectedCount
    }
`);

export const BotSetBotUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment BotSetBotUpdateResponseFlatFrag on BotSetBotUpdateResponse {
        affectedCount
    }
`);

export const BotSetDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment BotSetDeleteResponseFlatFrag on BotSetDeleteResponse {
        affectedCount
    }
`);

export const BotSetEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment BotSetEdgeFlatFrag on BotSetEdge {
        cursor
    }
`);

export const BotSetInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment BotSetInsertResponseFlatFrag on BotSetInsertResponse {
        affectedCount
    }
`);

export const BotSetUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment BotSetUpdateResponseFlatFrag on BotSetUpdateResponse {
        affectedCount
    }
`);

export const BotUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment BotUpdateResponseFlatFrag on BotUpdateResponse {
        affectedCount
    }
`);

export const ChapterFlatFrag = graphql(/* GraphQL */ `
    fragment ChapterFlatFrag on Chapter {
        createdBy
        createdDate
        forUser
        icon
        id
        metadata
        name
        rootSkill
        rootSkillOrder
        rootSkillPath
        summary
        updatedBy
        updatedDate
    }
`);

export const ChapterDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ChapterDeleteResponseFlatFrag on ChapterDeleteResponse {
        affectedCount
    }
`);

export const ChapterEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment ChapterEdgeFlatFrag on ChapterEdge {
        cursor
    }
`);

export const ChapterInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ChapterInsertResponseFlatFrag on ChapterInsertResponse {
        affectedCount
    }
`);

export const ChapterUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ChapterUpdateResponseFlatFrag on ChapterUpdateResponse {
        affectedCount
    }
`);

export const ChatFlatFrag = graphql(/* GraphQL */ `
    fragment ChatFlatFrag on Chat {
        autoTitle
        createdBy
        createdDate
        id
        isPublic
        manualTitle
        topic
        updatedBy
        updatedDate
    }
`);

export const ChatDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ChatDeleteResponseFlatFrag on ChatDeleteResponse {
        affectedCount
    }
`);

export const ChatEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment ChatEdgeFlatFrag on ChatEdge {
        cursor
    }
`);

export const ChatInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ChatInsertResponseFlatFrag on ChatInsertResponse {
        affectedCount
    }
`);

export const ChatMessageFlatFrag = graphql(/* GraphQL */ `
    fragment ChatMessageFlatFrag on ChatMessage {
        body
        botId
        chatId
        contextData
        contextId
        contextType
        createdBy
        createdByBot
        createdDate
        functionCall
        id
        role
        updatedBy
        updatedDate
    }
`);

export const ChatMessageDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ChatMessageDeleteResponseFlatFrag on ChatMessageDeleteResponse {
        affectedCount
    }
`);

export const ChatMessageEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment ChatMessageEdgeFlatFrag on ChatMessageEdge {
        cursor
    }
`);

export const ChatMessageInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ChatMessageInsertResponseFlatFrag on ChatMessageInsertResponse {
        affectedCount
    }
`);

export const ChatMessageUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ChatMessageUpdateResponseFlatFrag on ChatMessageUpdateResponse {
        affectedCount
    }
`);

export const ChatUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ChatUpdateResponseFlatFrag on ChatUpdateResponse {
        affectedCount
    }
`);

export const ChromeExtensionEventFlatFrag = graphql(/* GraphQL */ `
    fragment ChromeExtensionEventFlatFrag on ChromeExtensionEvent {
        createdBy
        createdDate
        eventType
        id
        metadata
        pageTitle
        rsnUserId
        siteUrl
        updatedBy
        updatedDate
        viewedAt
    }
`);

export const ChromeExtensionEventDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ChromeExtensionEventDeleteResponseFlatFrag on ChromeExtensionEventDeleteResponse {
        affectedCount
    }
`);

export const ChromeExtensionEventEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment ChromeExtensionEventEdgeFlatFrag on ChromeExtensionEventEdge {
        cursor
    }
`);

export const ChromeExtensionEventInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ChromeExtensionEventInsertResponseFlatFrag on ChromeExtensionEventInsertResponse {
        affectedCount
    }
`);

export const ChromeExtensionEventUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ChromeExtensionEventUpdateResponseFlatFrag on ChromeExtensionEventUpdateResponse {
        affectedCount
    }
`);

export const CourseFlatFrag = graphql(/* GraphQL */ `
    fragment CourseFlatFrag on Course {
        coverImageUrl
        createdBy
        createdDate
        description
        forUser
        id
        name
        rootSkill
        updatedBy
        updatedDate
    }
`);

export const CourseDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment CourseDeleteResponseFlatFrag on CourseDeleteResponse {
        affectedCount
    }
`);

export const CourseEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment CourseEdgeFlatFrag on CourseEdge {
        cursor
    }
`);

export const CourseInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment CourseInsertResponseFlatFrag on CourseInsertResponse {
        affectedCount
    }
`);

export const CourseLessonFlatFrag = graphql(/* GraphQL */ `
    fragment CourseLessonFlatFrag on CourseLesson {
        createdBy
        createdDate
        id
        orderIndex
        updatedBy
        updatedDate
    }
`);

export const CourseLessonDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment CourseLessonDeleteResponseFlatFrag on CourseLessonDeleteResponse {
        affectedCount
    }
`);

export const CourseLessonEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment CourseLessonEdgeFlatFrag on CourseLessonEdge {
        cursor
    }
`);

export const CourseLessonInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment CourseLessonInsertResponseFlatFrag on CourseLessonInsertResponse {
        affectedCount
    }
`);

export const CourseLessonUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment CourseLessonUpdateResponseFlatFrag on CourseLessonUpdateResponse {
        affectedCount
    }
`);

export const CourseUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment CourseUpdateResponseFlatFrag on CourseUpdateResponse {
        affectedCount
    }
`);

export const EmailSubscriptionFlatFrag = graphql(/* GraphQL */ `
    fragment EmailSubscriptionFlatFrag on EmailSubscription {
        accountUpdates
        createdBy
        createdDate
        edtechUpdates
        id
        newsletter
        productUpdates
        resendSynced
        rsnUserId
        updatedBy
        updatedDate
    }
`);

export const EmailSubscriptionDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment EmailSubscriptionDeleteResponseFlatFrag on EmailSubscriptionDeleteResponse {
        affectedCount
    }
`);

export const EmailSubscriptionEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment EmailSubscriptionEdgeFlatFrag on EmailSubscriptionEdge {
        cursor
    }
`);

export const EmailSubscriptionInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment EmailSubscriptionInsertResponseFlatFrag on EmailSubscriptionInsertResponse {
        affectedCount
    }
`);

export const EmailSubscriptionUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment EmailSubscriptionUpdateResponseFlatFrag on EmailSubscriptionUpdateResponse {
        affectedCount
    }
`);

export const EntityFlatFrag = graphql(/* GraphQL */ `
    fragment EntityFlatFrag on Entity {
        createdBy
        createdDate
        eData
        eName
        eType
        id
        updatedBy
        updatedDate
    }
`);

export const EntityDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment EntityDeleteResponseFlatFrag on EntityDeleteResponse {
        affectedCount
    }
`);

export const EntityEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment EntityEdgeFlatFrag on EntityEdge {
        cursor
    }
`);

export const EntityInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment EntityInsertResponseFlatFrag on EntityInsertResponse {
        affectedCount
    }
`);

export const EntityTypeFlatFrag = graphql(/* GraphQL */ `
    fragment EntityTypeFlatFrag on EntityType {
        abbreviation
        createdBy
        createdDate
        entityType
        updatedBy
        updatedDate
    }
`);

export const EntityTypeAccessLevelFlatFrag = graphql(/* GraphQL */ `
    fragment EntityTypeAccessLevelFlatFrag on EntityTypeAccessLevel {
        accessLevel
        createdBy
        createdDate
        updatedBy
        updatedDate
    }
`);

export const EntityTypeAccessLevelDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment EntityTypeAccessLevelDeleteResponseFlatFrag on EntityTypeAccessLevelDeleteResponse {
        affectedCount
    }
`);

export const EntityTypeAccessLevelEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment EntityTypeAccessLevelEdgeFlatFrag on EntityTypeAccessLevelEdge {
        cursor
    }
`);

export const EntityTypeAccessLevelInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment EntityTypeAccessLevelInsertResponseFlatFrag on EntityTypeAccessLevelInsertResponse {
        affectedCount
    }
`);

export const EntityTypeAccessLevelUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment EntityTypeAccessLevelUpdateResponseFlatFrag on EntityTypeAccessLevelUpdateResponse {
        affectedCount
    }
`);

export const EntityTypeDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment EntityTypeDeleteResponseFlatFrag on EntityTypeDeleteResponse {
        affectedCount
    }
`);

export const EntityTypeEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment EntityTypeEdgeFlatFrag on EntityTypeEdge {
        cursor
    }
`);

export const EntityTypeInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment EntityTypeInsertResponseFlatFrag on EntityTypeInsertResponse {
        affectedCount
    }
`);

export const EntityTypeUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment EntityTypeUpdateResponseFlatFrag on EntityTypeUpdateResponse {
        affectedCount
    }
`);

export const EntityUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment EntityUpdateResponseFlatFrag on EntityUpdateResponse {
        affectedCount
    }
`);

export const GoalFlatFrag = graphql(/* GraphQL */ `
    fragment GoalFlatFrag on Goal {
        completedDate
        createdBy
        createdDate
        dueDate
        id
        isCompleted
        metadata
        name
        type
        updatedBy
        updatedDate
    }
`);

export const GoalDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment GoalDeleteResponseFlatFrag on GoalDeleteResponse {
        affectedCount
    }
`);

export const GoalEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment GoalEdgeFlatFrag on GoalEdge {
        cursor
    }
`);

export const GoalInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment GoalInsertResponseFlatFrag on GoalInsertResponse {
        affectedCount
    }
`);

export const GoalUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment GoalUpdateResponseFlatFrag on GoalUpdateResponse {
        affectedCount
    }
`);

export const GroupFlatFrag = graphql(/* GraphQL */ `
    fragment GroupFlatFrag on Group {
        groupName
        id
    }
`);

export const GroupDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment GroupDeleteResponseFlatFrag on GroupDeleteResponse {
        affectedCount
    }
`);

export const GroupEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment GroupEdgeFlatFrag on GroupEdge {
        cursor
    }
`);

export const GroupInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment GroupInsertResponseFlatFrag on GroupInsertResponse {
        affectedCount
    }
`);

export const GroupUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment GroupUpdateResponseFlatFrag on GroupUpdateResponse {
        affectedCount
    }
`);

export const IntegrationFlatFrag = graphql(/* GraphQL */ `
    fragment IntegrationFlatFrag on Integration {
        createdBy
        createdDate
        forUser
        id
        lastSynced
        metadata
        type
        updatedBy
        updatedDate
    }
`);

export const IntegrationDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment IntegrationDeleteResponseFlatFrag on IntegrationDeleteResponse {
        affectedCount
    }
`);

export const IntegrationEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment IntegrationEdgeFlatFrag on IntegrationEdge {
        cursor
    }
`);

export const IntegrationInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment IntegrationInsertResponseFlatFrag on IntegrationInsertResponse {
        affectedCount
    }
`);

export const IntegrationTokenFlatFrag = graphql(/* GraphQL */ `
    fragment IntegrationTokenFlatFrag on IntegrationToken {
        createdBy
        createdDate
        id
        integrationId
        metadata
        token
        updatedBy
        updatedDate
    }
`);

export const IntegrationTokenDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment IntegrationTokenDeleteResponseFlatFrag on IntegrationTokenDeleteResponse {
        affectedCount
    }
`);

export const IntegrationTokenEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment IntegrationTokenEdgeFlatFrag on IntegrationTokenEdge {
        cursor
    }
`);

export const IntegrationTokenInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment IntegrationTokenInsertResponseFlatFrag on IntegrationTokenInsertResponse {
        affectedCount
    }
`);

export const IntegrationTokenUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment IntegrationTokenUpdateResponseFlatFrag on IntegrationTokenUpdateResponse {
        affectedCount
    }
`);

export const IntegrationUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment IntegrationUpdateResponseFlatFrag on IntegrationUpdateResponse {
        affectedCount
    }
`);

export const JournalFlatFrag = graphql(/* GraphQL */ `
    fragment JournalFlatFrag on Journal {
        createdBy
        createdDate
        id
        metadata
        name
        updatedBy
        updatedDate
    }
`);

export const JournalDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment JournalDeleteResponseFlatFrag on JournalDeleteResponse {
        affectedCount
    }
`);

export const JournalEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment JournalEdgeFlatFrag on JournalEdge {
        cursor
    }
`);

export const JournalInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment JournalInsertResponseFlatFrag on JournalInsertResponse {
        affectedCount
    }
`);

export const JournalUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment JournalUpdateResponseFlatFrag on JournalUpdateResponse {
        affectedCount
    }
`);

export const LessonFlatFrag = graphql(/* GraphQL */ `
    fragment LessonFlatFrag on Lesson {
        chapterOrder
        createdBy
        createdDate
        forUser
        icon
        id
        lessonType
        metadata
        name
        rootSkill
        rootSkillPath
        snipIds
        summary
        updatedBy
        updatedDate
    }
`);

export const LessonActivityFlatFrag = graphql(/* GraphQL */ `
    fragment LessonActivityFlatFrag on LessonActivity {
        createdBy
        createdDate
        id
        metadata
        position
        updatedBy
        updatedDate
    }
`);

export const LessonActivityDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment LessonActivityDeleteResponseFlatFrag on LessonActivityDeleteResponse {
        affectedCount
    }
`);

export const LessonActivityEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment LessonActivityEdgeFlatFrag on LessonActivityEdge {
        cursor
    }
`);

export const LessonActivityInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment LessonActivityInsertResponseFlatFrag on LessonActivityInsertResponse {
        affectedCount
    }
`);

export const LessonActivityUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment LessonActivityUpdateResponseFlatFrag on LessonActivityUpdateResponse {
        affectedCount
    }
`);

export const LessonDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment LessonDeleteResponseFlatFrag on LessonDeleteResponse {
        affectedCount
    }
`);

export const LessonEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment LessonEdgeFlatFrag on LessonEdge {
        cursor
    }
`);

export const LessonInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment LessonInsertResponseFlatFrag on LessonInsertResponse {
        affectedCount
    }
`);

export const LessonSessionFlatFrag = graphql(/* GraphQL */ `
    fragment LessonSessionFlatFrag on LessonSession {
        createdBy
        createdDate
        id
        metadata
        updatedBy
        updatedDate
        user
    }
`);

export const LessonSessionDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment LessonSessionDeleteResponseFlatFrag on LessonSessionDeleteResponse {
        affectedCount
    }
`);

export const LessonSessionEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment LessonSessionEdgeFlatFrag on LessonSessionEdge {
        cursor
    }
`);

export const LessonSessionInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment LessonSessionInsertResponseFlatFrag on LessonSessionInsertResponse {
        affectedCount
    }
`);

export const LessonSessionUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment LessonSessionUpdateResponseFlatFrag on LessonSessionUpdateResponse {
        affectedCount
    }
`);

export const LessonUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment LessonUpdateResponseFlatFrag on LessonUpdateResponse {
        affectedCount
    }
`);

export const MemauthFlatFrag = graphql(/* GraphQL */ `
    fragment MemauthFlatFrag on Memauth {
        accessLevel
        createdBy
        createdDate
        id
        isPublic
        principalBotId
        principalGroupId
        principalId
        principalType
        principalUserId
        resourceEntityId
        resourceEntityType
        updatedBy
        updatedDate
    }
`);

export const MemauthDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment MemauthDeleteResponseFlatFrag on MemauthDeleteResponse {
        affectedCount
    }
`);

export const MemauthEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment MemauthEdgeFlatFrag on MemauthEdge {
        cursor
    }
`);

export const MemauthInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment MemauthInsertResponseFlatFrag on MemauthInsertResponse {
        affectedCount
    }
`);

export const MemauthUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment MemauthUpdateResponseFlatFrag on MemauthUpdateResponse {
        affectedCount
    }
`);

export const MemberAuthorizationFlatFrag = graphql(/* GraphQL */ `
    fragment MemberAuthorizationFlatFrag on MemberAuthorization {
        accessLevel
        agentId
        agentType
        botId
        createdBy
        createdDate
        grantedBotId
        grantedChatId
        grantedEntityId
        grantedEntityType
        grantedGroupId
        groupId
        id
        isBaseAccessLevel
        updatedBy
        updatedDate
        userId
    }
`);

export const MemberAuthorizationConnectionFlatFrag = graphql(/* GraphQL */ `
    fragment MemberAuthorizationConnectionFlatFrag on MemberAuthorizationConnection {
        totalCount
    }
`);

export const MemberAuthorizationDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment MemberAuthorizationDeleteResponseFlatFrag on MemberAuthorizationDeleteResponse {
        affectedCount
    }
`);

export const MemberAuthorizationEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment MemberAuthorizationEdgeFlatFrag on MemberAuthorizationEdge {
        cursor
    }
`);

export const MemberAuthorizationInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment MemberAuthorizationInsertResponseFlatFrag on MemberAuthorizationInsertResponse {
        affectedCount
    }
`);

export const MemberAuthorizationUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment MemberAuthorizationUpdateResponseFlatFrag on MemberAuthorizationUpdateResponse {
        affectedCount
    }
`);

export const MutationFlatFrag = graphql(/* GraphQL */ `
    fragment MutationFlatFrag on Mutation {
        anonKey
        baseUrl
        cleanup
        createRsnUserFromToken
        currentUserHasPassword
        currtest
        dbPrivs
        envName
        httpResetCurlopt
        inTodo
        isAdmin
        numFailed
        popFromPodcastQueue
        reasonoteAppUrl
        tablePrivs
        throwIfNotLocal
        todo
    }
`);

export const NotificationSubscriptionFlatFrag = graphql(/* GraphQL */ `
    fragment NotificationSubscriptionFlatFrag on NotificationSubscription {
        createdBy
        createdDate
        dailyStreak
        id
        rsnUserId
        updatedBy
        updatedDate
    }
`);

export const NotificationSubscriptionDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment NotificationSubscriptionDeleteResponseFlatFrag on NotificationSubscriptionDeleteResponse {
        affectedCount
    }
`);

export const NotificationSubscriptionEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment NotificationSubscriptionEdgeFlatFrag on NotificationSubscriptionEdge {
        cursor
    }
`);

export const NotificationSubscriptionInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment NotificationSubscriptionInsertResponseFlatFrag on NotificationSubscriptionInsertResponse {
        affectedCount
    }
`);

export const NotificationSubscriptionUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment NotificationSubscriptionUpdateResponseFlatFrag on NotificationSubscriptionUpdateResponse {
        affectedCount
    }
`);

export const OperationLogFlatFrag = graphql(/* GraphQL */ `
    fragment OperationLogFlatFrag on OperationLog {
        entityId
        eventDate
        id
        jsonbDiff
        operationLevel
        operationType
        operationWhen
        processStatus
        processedDate
        rsnUserId
        tableName
        triggerName
    }
`);

export const OperationLogConnectionFlatFrag = graphql(/* GraphQL */ `
    fragment OperationLogConnectionFlatFrag on OperationLogConnection {
        totalCount
    }
`);

export const OperationLogDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment OperationLogDeleteResponseFlatFrag on OperationLogDeleteResponse {
        affectedCount
    }
`);

export const OperationLogEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment OperationLogEdgeFlatFrag on OperationLogEdge {
        cursor
    }
`);

export const OperationLogInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment OperationLogInsertResponseFlatFrag on OperationLogInsertResponse {
        affectedCount
    }
`);

export const OperationLogUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment OperationLogUpdateResponseFlatFrag on OperationLogUpdateResponse {
        affectedCount
    }
`);

export const PageInfoFlatFrag = graphql(/* GraphQL */ `
    fragment PageInfoFlatFrag on PageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
    }
`);

export const PartialSkillFlatFrag = graphql(/* GraphQL */ `
    fragment PartialSkillFlatFrag on PartialSkill {
        createdBy
        createdDate
        emoji
        goals
        id
        pages
        skillDescription
        skillId
        skillName
        updatedBy
        updatedDate
        userInput
        userLevel
    }
`);

export const PartialSkillDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PartialSkillDeleteResponseFlatFrag on PartialSkillDeleteResponse {
        affectedCount
    }
`);

export const PartialSkillEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment PartialSkillEdgeFlatFrag on PartialSkillEdge {
        cursor
    }
`);

export const PartialSkillInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PartialSkillInsertResponseFlatFrag on PartialSkillInsertResponse {
        affectedCount
    }
`);

export const PartialSkillUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PartialSkillUpdateResponseFlatFrag on PartialSkillUpdateResponse {
        affectedCount
    }
`);

export const PermissionFlatFrag = graphql(/* GraphQL */ `
    fragment PermissionFlatFrag on Permission {
        createdBy
        createdDate
        description
        permissionCode
        updatedBy
        updatedDate
    }
`);

export const PermissionDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PermissionDeleteResponseFlatFrag on PermissionDeleteResponse {
        affectedCount
    }
`);

export const PermissionEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment PermissionEdgeFlatFrag on PermissionEdge {
        cursor
    }
`);

export const PermissionInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PermissionInsertResponseFlatFrag on PermissionInsertResponse {
        affectedCount
    }
`);

export const PermissionUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PermissionUpdateResponseFlatFrag on PermissionUpdateResponse {
        affectedCount
    }
`);

export const PodcastFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastFlatFrag on Podcast {
        createdBy
        createdDate
        forSkillPath
        forUser
        id
        isSharedVersion
        metadata
        originalPodcastId
        outline
        podcastType
        specialInstructions
        title
        topic
        transcript
        updatedBy
        updatedDate
    }
`);

export const PodcastAudioFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastAudioFlatFrag on PodcastAudio {
        audioFile
        createdBy
        createdDate
        id
        podcastLineId
        speed
        updatedBy
        updatedDate
    }
`);

export const PodcastAudioDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastAudioDeleteResponseFlatFrag on PodcastAudioDeleteResponse {
        affectedCount
    }
`);

export const PodcastAudioEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastAudioEdgeFlatFrag on PodcastAudioEdge {
        cursor
    }
`);

export const PodcastAudioInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastAudioInsertResponseFlatFrag on PodcastAudioInsertResponse {
        affectedCount
    }
`);

export const PodcastAudioUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastAudioUpdateResponseFlatFrag on PodcastAudioUpdateResponse {
        affectedCount
    }
`);

export const PodcastDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastDeleteResponseFlatFrag on PodcastDeleteResponse {
        affectedCount
    }
`);

export const PodcastEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastEdgeFlatFrag on PodcastEdge {
        cursor
    }
`);

export const PodcastInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastInsertResponseFlatFrag on PodcastInsertResponse {
        affectedCount
    }
`);

export const PodcastLineFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastLineFlatFrag on PodcastLine {
        createdBy
        createdDate
        dialogue
        digDeeperTopics
        id
        lineNumber
        podcastId
        speaker
        updatedBy
        updatedDate
    }
`);

export const PodcastLineDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastLineDeleteResponseFlatFrag on PodcastLineDeleteResponse {
        affectedCount
    }
`);

export const PodcastLineEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastLineEdgeFlatFrag on PodcastLineEdge {
        cursor
    }
`);

export const PodcastLineInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastLineInsertResponseFlatFrag on PodcastLineInsertResponse {
        affectedCount
    }
`);

export const PodcastLineUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastLineUpdateResponseFlatFrag on PodcastLineUpdateResponse {
        affectedCount
    }
`);

export const PodcastQueueItemFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastQueueItemFlatFrag on PodcastQueueItem {
        createdAt
        forUser
        id
        podcastId
        position
    }
`);

export const PodcastQueueItemDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastQueueItemDeleteResponseFlatFrag on PodcastQueueItemDeleteResponse {
        affectedCount
    }
`);

export const PodcastQueueItemEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastQueueItemEdgeFlatFrag on PodcastQueueItemEdge {
        cursor
    }
`);

export const PodcastQueueItemInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastQueueItemInsertResponseFlatFrag on PodcastQueueItemInsertResponse {
        affectedCount
    }
`);

export const PodcastQueueItemUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastQueueItemUpdateResponseFlatFrag on PodcastQueueItemUpdateResponse {
        affectedCount
    }
`);

export const PodcastUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PodcastUpdateResponseFlatFrag on PodcastUpdateResponse {
        affectedCount
    }
`);

export const PushNotificationSubscriptionFlatFrag = graphql(/* GraphQL */ `
    fragment PushNotificationSubscriptionFlatFrag on PushNotificationSubscription {
        auth
        createdBy
        createdDate
        endpoint
        id
        lastUsedDate
        p256dh
        rsnUserId
        updatedBy
        updatedDate
        userAgent
    }
`);

export const PushNotificationSubscriptionDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PushNotificationSubscriptionDeleteResponseFlatFrag on PushNotificationSubscriptionDeleteResponse {
        affectedCount
    }
`);

export const PushNotificationSubscriptionEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment PushNotificationSubscriptionEdgeFlatFrag on PushNotificationSubscriptionEdge {
        cursor
    }
`);

export const PushNotificationSubscriptionInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PushNotificationSubscriptionInsertResponseFlatFrag on PushNotificationSubscriptionInsertResponse {
        affectedCount
    }
`);

export const PushNotificationSubscriptionUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment PushNotificationSubscriptionUpdateResponseFlatFrag on PushNotificationSubscriptionUpdateResponse {
        affectedCount
    }
`);

export const QueryFlatFrag = graphql(/* GraphQL */ `
    fragment QueryFlatFrag on Query {
        currentRsnUserId
        isVerbose
        osName
        pgVersion
        pgVersionNum
        pgtapVersion
        rsnSystemUserAuthId
        rsnSystemUserId
    }
`);

export const ReferenceFlatFrag = graphql(/* GraphQL */ `
    fragment ReferenceFlatFrag on Reference {
        createdBy
        createdDate
        id
        isExact
        rawContent
        refId
        rsnVecId
        updatedBy
        updatedDate
    }
`);

export const ReferenceDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ReferenceDeleteResponseFlatFrag on ReferenceDeleteResponse {
        affectedCount
    }
`);

export const ReferenceEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment ReferenceEdgeFlatFrag on ReferenceEdge {
        cursor
    }
`);

export const ReferenceInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ReferenceInsertResponseFlatFrag on ReferenceInsertResponse {
        affectedCount
    }
`);

export const ReferenceUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ReferenceUpdateResponseFlatFrag on ReferenceUpdateResponse {
        affectedCount
    }
`);

export const ResourceFlatFrag = graphql(/* GraphQL */ `
    fragment ResourceFlatFrag on Resource {
        childPageId
        childSnipId
        createdBy
        createdDate
        id
        metadata
        parentCourseId
        parentPodcastId
        parentSkillId
        updatedBy
        updatedDate
    }
`);

export const ResourceDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ResourceDeleteResponseFlatFrag on ResourceDeleteResponse {
        affectedCount
    }
`);

export const ResourceEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment ResourceEdgeFlatFrag on ResourceEdge {
        cursor
    }
`);

export const ResourceInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ResourceInsertResponseFlatFrag on ResourceInsertResponse {
        affectedCount
    }
`);

export const ResourceUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment ResourceUpdateResponseFlatFrag on ResourceUpdateResponse {
        affectedCount
    }
`);

export const RsnPageFlatFrag = graphql(/* GraphQL */ `
    fragment RsnPageFlatFrag on RsnPage {
        body
        bodyLength
        bodySha256
        createdBy
        createdDate
        description
        fileType
        id
        metadata
        name
        originalFilename
        parent
        storagePath
        updatedBy
        updatedDate
    }
`);

export const RsnPageDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnPageDeleteResponseFlatFrag on RsnPageDeleteResponse {
        affectedCount
    }
`);

export const RsnPageEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment RsnPageEdgeFlatFrag on RsnPageEdge {
        cursor
    }
`);

export const RsnPageInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnPageInsertResponseFlatFrag on RsnPageInsertResponse {
        affectedCount
    }
`);

export const RsnPageUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnPageUpdateResponseFlatFrag on RsnPageUpdateResponse {
        affectedCount
    }
`);

export const RsnPageVectorFlatFrag = graphql(/* GraphQL */ `
    fragment RsnPageVectorFlatFrag on RsnPageVector {
        createdBy
        createdDate
        embedding
        id
        rawContent
        rsnPageId
        rsnPageOffset
        updatedBy
        updatedDate
    }
`);

export const RsnPageVectorDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnPageVectorDeleteResponseFlatFrag on RsnPageVectorDeleteResponse {
        affectedCount
    }
`);

export const RsnPageVectorEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment RsnPageVectorEdgeFlatFrag on RsnPageVectorEdge {
        cursor
    }
`);

export const RsnPageVectorInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnPageVectorInsertResponseFlatFrag on RsnPageVectorInsertResponse {
        affectedCount
    }
`);

export const RsnPageVectorUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnPageVectorUpdateResponseFlatFrag on RsnPageVectorUpdateResponse {
        affectedCount
    }
`);

export const RsnUserFlatFrag = graphql(/* GraphQL */ `
    fragment RsnUserFlatFrag on RsnUser {
        authEmail
        authId
        familyName
        firstLoginDate
        givenName
        id
        lastLoginDate
        role
        timezone
        username
    }
`);

export const RsnUserDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnUserDeleteResponseFlatFrag on RsnUserDeleteResponse {
        affectedCount
    }
`);

export const RsnUserEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment RsnUserEdgeFlatFrag on RsnUserEdge {
        cursor
    }
`);

export const RsnUserInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnUserInsertResponseFlatFrag on RsnUserInsertResponse {
        affectedCount
    }
`);

export const RsnUserSysdataFlatFrag = graphql(/* GraphQL */ `
    fragment RsnUserSysdataFlatFrag on RsnUserSysdata {
        authEmail
        authId
        dailyXpGoalCelebrationTime
        extraLicenseInfo
        hasOnboarded
        id
        rsnUserId
    }
`);

export const RsnUserSysdataDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnUserSysdataDeleteResponseFlatFrag on RsnUserSysdataDeleteResponse {
        affectedCount
    }
`);

export const RsnUserSysdataEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment RsnUserSysdataEdgeFlatFrag on RsnUserSysdataEdge {
        cursor
    }
`);

export const RsnUserSysdataInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnUserSysdataInsertResponseFlatFrag on RsnUserSysdataInsertResponse {
        affectedCount
    }
`);

export const RsnUserSysdataUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnUserSysdataUpdateResponseFlatFrag on RsnUserSysdataUpdateResponse {
        affectedCount
    }
`);

export const RsnUserUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnUserUpdateResponseFlatFrag on RsnUserUpdateResponse {
        affectedCount
    }
`);

export const RsnVecFlatFrag = graphql(/* GraphQL */ `
    fragment RsnVecFlatFrag on RsnVec {
        colname
        colpath
        colpathStr
        contentOffset
        createdBy
        createdDate
        embedding
        embeddingOpenaiTextEmbedding3Small
        id
        rawContent
        refId
        tablename
        updatedBy
        updatedDate
    }
`);

export const RsnVecConfigFlatFrag = graphql(/* GraphQL */ `
    fragment RsnVecConfigFlatFrag on RsnVecConfig {
        colname
        colpath
        id
        tablename
    }
`);

export const RsnVecConfigDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnVecConfigDeleteResponseFlatFrag on RsnVecConfigDeleteResponse {
        affectedCount
    }
`);

export const RsnVecConfigEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment RsnVecConfigEdgeFlatFrag on RsnVecConfigEdge {
        cursor
    }
`);

export const RsnVecConfigInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnVecConfigInsertResponseFlatFrag on RsnVecConfigInsertResponse {
        affectedCount
    }
`);

export const RsnVecConfigUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnVecConfigUpdateResponseFlatFrag on RsnVecConfigUpdateResponse {
        affectedCount
    }
`);

export const RsnVecDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnVecDeleteResponseFlatFrag on RsnVecDeleteResponse {
        affectedCount
    }
`);

export const RsnVecEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment RsnVecEdgeFlatFrag on RsnVecEdge {
        cursor
    }
`);

export const RsnVecInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnVecInsertResponseFlatFrag on RsnVecInsertResponse {
        affectedCount
    }
`);

export const RsnVecQueueFlatFrag = graphql(/* GraphQL */ `
    fragment RsnVecQueueFlatFrag on RsnVecQueue {
        colname
        colpath
        colpathStr
        createdBy
        createdDate
        id
        refId
        tablename
        updatedBy
        updatedDate
    }
`);

export const RsnVecQueueDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnVecQueueDeleteResponseFlatFrag on RsnVecQueueDeleteResponse {
        affectedCount
    }
`);

export const RsnVecQueueEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment RsnVecQueueEdgeFlatFrag on RsnVecQueueEdge {
        cursor
    }
`);

export const RsnVecQueueInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnVecQueueInsertResponseFlatFrag on RsnVecQueueInsertResponse {
        affectedCount
    }
`);

export const RsnVecQueueUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnVecQueueUpdateResponseFlatFrag on RsnVecQueueUpdateResponse {
        affectedCount
    }
`);

export const RsnVecUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsnVecUpdateResponseFlatFrag on RsnVecUpdateResponse {
        affectedCount
    }
`);

export const RsncoreTableAbbreviationsFlatFrag = graphql(/* GraphQL */ `
    fragment RsncoreTableAbbreviationsFlatFrag on RsncoreTableAbbreviations {
        abbreviation
        id
        tablename
    }
`);

export const RsncoreTableAbbreviationsDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsncoreTableAbbreviationsDeleteResponseFlatFrag on RsncoreTableAbbreviationsDeleteResponse {
        affectedCount
    }
`);

export const RsncoreTableAbbreviationsEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment RsncoreTableAbbreviationsEdgeFlatFrag on RsncoreTableAbbreviationsEdge {
        cursor
    }
`);

export const RsncoreTableAbbreviationsInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsncoreTableAbbreviationsInsertResponseFlatFrag on RsncoreTableAbbreviationsInsertResponse {
        affectedCount
    }
`);

export const RsncoreTableAbbreviationsUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment RsncoreTableAbbreviationsUpdateResponseFlatFrag on RsncoreTableAbbreviationsUpdateResponse {
        affectedCount
    }
`);

export const SkillFlatFrag = graphql(/* GraphQL */ `
    fragment SkillFlatFrag on Skill {
        colorinfo
        contextPage
        createdBy
        createdDate
        description
        domain
        emoji
        forUser
        generatedFromSkillPath
        id
        metadata
        name
        nameAndDescription
        processingState
        referenceIds
        rootSkillId
        rsnVecIds
        type
        updatedBy
        updatedDate
    }
`);

export const SkillDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SkillDeleteResponseFlatFrag on SkillDeleteResponse {
        affectedCount
    }
`);

export const SkillEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment SkillEdgeFlatFrag on SkillEdge {
        cursor
    }
`);

export const SkillInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SkillInsertResponseFlatFrag on SkillInsertResponse {
        affectedCount
    }
`);

export const SkillLinkFlatFrag = graphql(/* GraphQL */ `
    fragment SkillLinkFlatFrag on SkillLink {
        createdBy
        createdDate
        downstreamSkill
        id
        metadata
        type
        updatedBy
        updatedDate
        upstreamSkill
        weight
    }
`);

export const SkillLinkDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SkillLinkDeleteResponseFlatFrag on SkillLinkDeleteResponse {
        affectedCount
    }
`);

export const SkillLinkEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment SkillLinkEdgeFlatFrag on SkillLinkEdge {
        cursor
    }
`);

export const SkillLinkInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SkillLinkInsertResponseFlatFrag on SkillLinkInsertResponse {
        affectedCount
    }
`);

export const SkillLinkUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SkillLinkUpdateResponseFlatFrag on SkillLinkUpdateResponse {
        affectedCount
    }
`);

export const SkillModuleFlatFrag = graphql(/* GraphQL */ `
    fragment SkillModuleFlatFrag on SkillModule {
        childrenIds
        createdBy
        createdDate
        id
        name
        position
        rootSkillId
        updatedBy
        updatedDate
    }
`);

export const SkillModuleDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SkillModuleDeleteResponseFlatFrag on SkillModuleDeleteResponse {
        affectedCount
    }
`);

export const SkillModuleEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment SkillModuleEdgeFlatFrag on SkillModuleEdge {
        cursor
    }
`);

export const SkillModuleInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SkillModuleInsertResponseFlatFrag on SkillModuleInsertResponse {
        affectedCount
    }
`);

export const SkillModuleUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SkillModuleUpdateResponseFlatFrag on SkillModuleUpdateResponse {
        affectedCount
    }
`);

export const SkillSetFlatFrag = graphql(/* GraphQL */ `
    fragment SkillSetFlatFrag on SkillSet {
        createdBy
        createdDate
        description
        forUser
        id
        metadata
        name
        updatedBy
        updatedDate
    }
`);

export const SkillSetDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SkillSetDeleteResponseFlatFrag on SkillSetDeleteResponse {
        affectedCount
    }
`);

export const SkillSetEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment SkillSetEdgeFlatFrag on SkillSetEdge {
        cursor
    }
`);

export const SkillSetInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SkillSetInsertResponseFlatFrag on SkillSetInsertResponse {
        affectedCount
    }
`);

export const SkillSetSkillFlatFrag = graphql(/* GraphQL */ `
    fragment SkillSetSkillFlatFrag on SkillSetSkill {
        createdBy
        createdDate
        id
        metadata
        updatedBy
        updatedDate
    }
`);

export const SkillSetSkillDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SkillSetSkillDeleteResponseFlatFrag on SkillSetSkillDeleteResponse {
        affectedCount
    }
`);

export const SkillSetSkillEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment SkillSetSkillEdgeFlatFrag on SkillSetSkillEdge {
        cursor
    }
`);

export const SkillSetSkillInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SkillSetSkillInsertResponseFlatFrag on SkillSetSkillInsertResponse {
        affectedCount
    }
`);

export const SkillSetSkillUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SkillSetSkillUpdateResponseFlatFrag on SkillSetSkillUpdateResponse {
        affectedCount
    }
`);

export const SkillSetUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SkillSetUpdateResponseFlatFrag on SkillSetUpdateResponse {
        affectedCount
    }
`);

export const SkillUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SkillUpdateResponseFlatFrag on SkillUpdateResponse {
        affectedCount
    }
`);

export const SnipFlatFrag = graphql(/* GraphQL */ `
    fragment SnipFlatFrag on Snip {
        autoLastUpdatedDate
        autoParamUpdateAttempts
        autoParamUpdateState
        autoSummary
        autoTags
        autoTitle
        createdBy
        createdDate
        extractionError
        extractionInfo
        extractionState
        id
        metadata
        name
        owner
        pageId
        rootSkill
        sourceIntegration
        sourceUniqId
        sourceUrl
        textContent
        type
        updatedBy
        updatedDate
    }
`);

export const SnipDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SnipDeleteResponseFlatFrag on SnipDeleteResponse {
        affectedCount
    }
`);

export const SnipEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment SnipEdgeFlatFrag on SnipEdge {
        cursor
    }
`);

export const SnipInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SnipInsertResponseFlatFrag on SnipInsertResponse {
        affectedCount
    }
`);

export const SnipUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment SnipUpdateResponseFlatFrag on SnipUpdateResponse {
        affectedCount
    }
`);

export const StripeCustomersFlatFrag = graphql(/* GraphQL */ `
    fragment StripeCustomersFlatFrag on StripeCustomers {
        attrs
        created
        description
        email
        id
        name
    }
`);

export const StripeCustomersDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment StripeCustomersDeleteResponseFlatFrag on StripeCustomersDeleteResponse {
        affectedCount
    }
`);

export const StripeCustomersEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment StripeCustomersEdgeFlatFrag on StripeCustomersEdge {
        cursor
    }
`);

export const StripeCustomersInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment StripeCustomersInsertResponseFlatFrag on StripeCustomersInsertResponse {
        affectedCount
    }
`);

export const StripeCustomersUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment StripeCustomersUpdateResponseFlatFrag on StripeCustomersUpdateResponse {
        affectedCount
    }
`);

export const StripeProductsFlatFrag = graphql(/* GraphQL */ `
    fragment StripeProductsFlatFrag on StripeProducts {
        active
        attrs
        created
        defaultPrice
        description
        id
        name
        updated
    }
`);

export const StripeProductsDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment StripeProductsDeleteResponseFlatFrag on StripeProductsDeleteResponse {
        affectedCount
    }
`);

export const StripeProductsEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment StripeProductsEdgeFlatFrag on StripeProductsEdge {
        cursor
    }
`);

export const StripeProductsInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment StripeProductsInsertResponseFlatFrag on StripeProductsInsertResponse {
        affectedCount
    }
`);

export const StripeProductsUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment StripeProductsUpdateResponseFlatFrag on StripeProductsUpdateResponse {
        affectedCount
    }
`);

export const StripeSubscriptionsFlatFrag = graphql(/* GraphQL */ `
    fragment StripeSubscriptionsFlatFrag on StripeSubscriptions {
        attrs
        canceledAt
        cancellationReason
        currency
        currentPeriodEnd
        currentPeriodStart
        customer
        id
        items
        status
        stripeProductId
    }
`);

export const StripeSubscriptionsDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment StripeSubscriptionsDeleteResponseFlatFrag on StripeSubscriptionsDeleteResponse {
        affectedCount
    }
`);

export const StripeSubscriptionsEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment StripeSubscriptionsEdgeFlatFrag on StripeSubscriptionsEdge {
        cursor
    }
`);

export const StripeSubscriptionsInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment StripeSubscriptionsInsertResponseFlatFrag on StripeSubscriptionsInsertResponse {
        affectedCount
    }
`);

export const StripeSubscriptionsUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment StripeSubscriptionsUpdateResponseFlatFrag on StripeSubscriptionsUpdateResponse {
        affectedCount
    }
`);

export const UserActivityFeedbackFlatFrag = graphql(/* GraphQL */ `
    fragment UserActivityFeedbackFlatFrag on UserActivityFeedback {
        createdBy
        createdDate
        description
        id
        metadata
        tags
        updatedBy
        updatedDate
        value
    }
`);

export const UserActivityFeedbackDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserActivityFeedbackDeleteResponseFlatFrag on UserActivityFeedbackDeleteResponse {
        affectedCount
    }
`);

export const UserActivityFeedbackEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment UserActivityFeedbackEdgeFlatFrag on UserActivityFeedbackEdge {
        cursor
    }
`);

export const UserActivityFeedbackInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserActivityFeedbackInsertResponseFlatFrag on UserActivityFeedbackInsertResponse {
        affectedCount
    }
`);

export const UserActivityFeedbackUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserActivityFeedbackUpdateResponseFlatFrag on UserActivityFeedbackUpdateResponse {
        affectedCount
    }
`);

export const UserActivityResultFlatFrag = graphql(/* GraphQL */ `
    fragment UserActivityResultFlatFrag on UserActivityResult {
        createdBy
        createdDate
        id
        lessonSessionId
        metadata
        resultData
        score
        scoreNormalized
        skipReason
        skipped
        submitResult
        updatedBy
        updatedDate
        user
    }
`);

export const UserActivityResultDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserActivityResultDeleteResponseFlatFrag on UserActivityResultDeleteResponse {
        affectedCount
    }
`);

export const UserActivityResultEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment UserActivityResultEdgeFlatFrag on UserActivityResultEdge {
        cursor
    }
`);

export const UserActivityResultInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserActivityResultInsertResponseFlatFrag on UserActivityResultInsertResponse {
        affectedCount
    }
`);

export const UserActivityResultUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserActivityResultUpdateResponseFlatFrag on UserActivityResultUpdateResponse {
        affectedCount
    }
`);

export const UserHistoryFlatFrag = graphql(/* GraphQL */ `
    fragment UserHistoryFlatFrag on UserHistory {
        courseId
        createdBy
        createdDate
        id
        podcastId
        rsnUserId
        skillIdVisited
        updatedBy
        updatedDate
    }
`);

export const UserHistoryDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserHistoryDeleteResponseFlatFrag on UserHistoryDeleteResponse {
        affectedCount
    }
`);

export const UserHistoryEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment UserHistoryEdgeFlatFrag on UserHistoryEdge {
        cursor
    }
`);

export const UserHistoryInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserHistoryInsertResponseFlatFrag on UserHistoryInsertResponse {
        affectedCount
    }
`);

export const UserHistoryUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserHistoryUpdateResponseFlatFrag on UserHistoryUpdateResponse {
        affectedCount
    }
`);

export const UserLessonResultFlatFrag = graphql(/* GraphQL */ `
    fragment UserLessonResultFlatFrag on UserLessonResult {
        createdBy
        createdDate
        id
        metadata
        updatedBy
        updatedDate
        user
    }
`);

export const UserLessonResultDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserLessonResultDeleteResponseFlatFrag on UserLessonResultDeleteResponse {
        affectedCount
    }
`);

export const UserLessonResultEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment UserLessonResultEdgeFlatFrag on UserLessonResultEdge {
        cursor
    }
`);

export const UserLessonResultInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserLessonResultInsertResponseFlatFrag on UserLessonResultInsertResponse {
        affectedCount
    }
`);

export const UserLessonResultUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserLessonResultUpdateResponseFlatFrag on UserLessonResultUpdateResponse {
        affectedCount
    }
`);

export const UserProfileFlatFrag = graphql(/* GraphQL */ `
    fragment UserProfileFlatFrag on UserProfile {
        badges
        bio
        createdBy
        createdDate
        displayName
        id
        pinnedItems
        profileImageUrl
        rsnUserId
        showActivityGraph
        updatedBy
        updatedDate
        username
    }
`);

export const UserProfileDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserProfileDeleteResponseFlatFrag on UserProfileDeleteResponse {
        affectedCount
    }
`);

export const UserProfileEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment UserProfileEdgeFlatFrag on UserProfileEdge {
        cursor
    }
`);

export const UserProfileInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserProfileInsertResponseFlatFrag on UserProfileInsertResponse {
        affectedCount
    }
`);

export const UserProfileUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserProfileUpdateResponseFlatFrag on UserProfileUpdateResponse {
        affectedCount
    }
`);

export const UserSettingFlatFrag = graphql(/* GraphQL */ `
    fragment UserSettingFlatFrag on UserSetting {
        aiAboutMe
        aiInstructions
        createdBy
        createdDate
        dailyXpGoal
        feelings
        id
        metadata
        podcastPlaybackSpeed
        temporaryDailyXpGoal
        temporaryDailyXpGoalSetDatetime
        uiTheme
        updatedBy
        updatedDate
    }
`);

export const UserSettingDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserSettingDeleteResponseFlatFrag on UserSettingDeleteResponse {
        affectedCount
    }
`);

export const UserSettingEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment UserSettingEdgeFlatFrag on UserSettingEdge {
        cursor
    }
`);

export const UserSettingInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserSettingInsertResponseFlatFrag on UserSettingInsertResponse {
        affectedCount
    }
`);

export const UserSettingUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserSettingUpdateResponseFlatFrag on UserSettingUpdateResponse {
        affectedCount
    }
`);

export const UserSkillFlatFrag = graphql(/* GraphQL */ `
    fragment UserSkillFlatFrag on UserSkill {
        createdBy
        createdDate
        currentChapter
        id
        interestReasons
        metadata
        selfAssignedLevel
        specifics
        updatedBy
        updatedDate
    }
`);

export const UserSkillDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserSkillDeleteResponseFlatFrag on UserSkillDeleteResponse {
        affectedCount
    }
`);

export const UserSkillEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment UserSkillEdgeFlatFrag on UserSkillEdge {
        cursor
    }
`);

export const UserSkillInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserSkillInsertResponseFlatFrag on UserSkillInsertResponse {
        affectedCount
    }
`);

export const UserSkillSysdataFlatFrag = graphql(/* GraphQL */ `
    fragment UserSkillSysdataFlatFrag on UserSkillSysdata {
        dailyXp
        highestLevelShown
        id
        lastDailyReset
        practiceScore
        totalXp
    }
`);

export const UserSkillSysdataDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserSkillSysdataDeleteResponseFlatFrag on UserSkillSysdataDeleteResponse {
        affectedCount
    }
`);

export const UserSkillSysdataEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment UserSkillSysdataEdgeFlatFrag on UserSkillSysdataEdge {
        cursor
    }
`);

export const UserSkillSysdataInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserSkillSysdataInsertResponseFlatFrag on UserSkillSysdataInsertResponse {
        affectedCount
    }
`);

export const UserSkillSysdataUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserSkillSysdataUpdateResponseFlatFrag on UserSkillSysdataUpdateResponse {
        affectedCount
    }
`);

export const UserSkillUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserSkillUpdateResponseFlatFrag on UserSkillUpdateResponse {
        affectedCount
    }
`);

export const UserTourFlatFrag = graphql(/* GraphQL */ `
    fragment UserTourFlatFrag on UserTour {
        createdBy
        createdDate
        id
        metadata
        tourName
        tourState
        tourStatus
        updatedBy
        updatedDate
        user
    }
`);

export const UserTourDeleteResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserTourDeleteResponseFlatFrag on UserTourDeleteResponse {
        affectedCount
    }
`);

export const UserTourEdgeFlatFrag = graphql(/* GraphQL */ `
    fragment UserTourEdgeFlatFrag on UserTourEdge {
        cursor
    }
`);

export const UserTourInsertResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserTourInsertResponseFlatFrag on UserTourInsertResponse {
        affectedCount
    }
`);

export const UserTourUpdateResponseFlatFrag = graphql(/* GraphQL */ `
    fragment UserTourUpdateResponseFlatFrag on UserTourUpdateResponse {
        affectedCount
    }
`);