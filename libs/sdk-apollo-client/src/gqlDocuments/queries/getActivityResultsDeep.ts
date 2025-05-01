import { graphql } from '../../codegen';

export const getActivityResultsDeep = graphql(/* GraphQL */ `
query getActivityResultsDeep($filter: UserActivityResultFilter, $orderBy: [UserActivityResultOrderBy!], $first: Int, $last: Int, $before: Cursor, $after: Cursor, $actSkillFilter: ActivitySkillFilter, $actSkillOrderBy: [ActivitySkillOrderBy!], $actSkillFirst: Int, $actSkillLast: Int, $actSkillBefore: Cursor, $actSkillAfter: Cursor) {
    userActivityResultCollection(filter: $filter, orderBy: $orderBy, first: $first, last: $last, before: $before, after: $after) {
      pageInfo {
        ...PageInfoFlatFrag
      }
      edges {
        node {
          ...UserActivityResultFlatFrag 
          activity {
            nodeId
            id
            name
            type
            typeConfig
            source
            metadata
            createdDate
            updatedDate
            createdBy
            updatedBy
            activitySkillCollection(filter: $actSkillFilter, orderBy: $actSkillOrderBy, first: $actSkillFirst, last: $actSkillLast, before: $actSkillBefore, after: $actSkillAfter) {
              edges {
                node {
                  nodeId
                  id
                  type
                  weight
                  metadata
                  createdDate
                  updatedDate
                  createdBy
                  updatedBy
                  skill {
                    nodeId
                    id
                    name
                    type
                    metadata
                    createdDate
                    updatedDate
                    createdBy
                    updatedBy
                    contextPage
                    description
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`);