import { graphql } from '../../codegen';

export const getActivitySkillWithResults = graphql(/* GraphQL */ `
query getActivitySkillWithResults($first: Int, $last: Int, $before: Cursor, $after: Cursor, $filter: ActivitySkillFilter, $orderBy: ActivitySkillOrderBy, $userActivityResultCollectionFilter: UserActivityResultFilter) {
    activitySkillCollection(first: $first, last: $last, before: $before, after: $after, filter: $filter) {
      edges {
        node {
          skill {
            id
            name
            description
          }
          activity {
            ...ActivityFlatFrag
            userActivityResultCollection(filter: $userActivityResultCollectionFilter) {
              edges {
                node {
                  ...UserActivityResultFlatFrag
                  activity {
                    id
                    type
                  }
                }
              },
              pageInfo {
                ...PageInfoFlatFrag
              }
            }
          }
        }
      }
      pageInfo {
        ...PageInfoFlatFrag
      }
    }
  }
`);