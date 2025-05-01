import { graphql } from '../../codegen';

export const getLessonSessionDeep = graphql(/* GraphQL */ `
query getLessonSessionDeep($filter: LessonSessionFilter, $orderBy: [LessonSessionOrderBy!], $first: Int, $last: Int, $before: Cursor, $after: Cursor) {
    lessonSessionCollection(filter: $filter, orderBy: $orderBy, first: $first, last: $last, before: $before, after: $after) {
      pageInfo {
        ...PageInfoFlatFrag
      }
      edges {
        node {
          ...LessonSessionFlatFrag
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