import { graphql } from '../../codegen';

export const getUserLessonResultsDeep = graphql(/* GraphQL */ `
query getUserLessonResultsDeep($filter: UserLessonResultFilter, $orderBy: [UserLessonResultOrderBy!], $first: Int, $last: Int, $before: Cursor, $after: Cursor) {
    userLessonResultCollection(filter: $filter, orderBy: $orderBy, first: $first, last: $last, before: $before, after: $after) {
      pageInfo {
        ...PageInfoFlatFrag
      }
      edges {
        node {
          ...UserLessonResultFlatFrag
          lesson {
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
          }
          rsnUser {
            ...RsnUserFlatFrag
          }
        }
      }
    }
  }
`);