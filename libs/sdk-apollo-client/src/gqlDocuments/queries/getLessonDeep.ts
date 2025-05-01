import { graphql } from '../../codegen';

export const getLessonDeep = graphql(/* GraphQL */ `
    query getLessonsDeep($filter: LessonFilter, $orderBy: [LessonOrderBy!], $first: Int, $last: Int, $before: Cursor, $after: Cursor) {
        lessonCollection(filter: $filter, orderBy: $orderBy, first: $first, last: $last, before: $before, after: $after) {
            pageInfo {
                ...PageInfoFlatFrag
            }
            edges {
                node {
                    ...LessonFlatFrag
                    lessonActivityCollection {
                        edges {
                            node {
                                ...LessonActivityFlatFrag
                                activity {
                                    ...ActivityFlatFrag
                                    userActivityResultCollection {
                                        edges {
                                            node {
                                                ...UserActivityResultFlatFrag
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    rsnUser {
                        ...RsnUserFlatFrag
                    }
                }
            }
        }
    }
`);