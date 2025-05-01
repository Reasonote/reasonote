import { graphql } from '../../codegen';

export const getActivityFeedbackDoc = graphql(/* GraphQL */ `
query getActivityFeedback($filter: UserActivityFeedbackFilter, $orderBy: [UserActivityFeedbackOrderBy!], $first: Int, $last: Int, $before: Cursor, $after: Cursor) {
    userActivityFeedbackCollection(filter: $filter, orderBy: $orderBy, first: $first, last: $last, before: $before, after: $after) {
        edges {
        node {
            nodeId
                id
                value
                description
                metadata
                createdDate
                updatedDate
                createdBy
                updatedBy
                activity {
                    nodeId
                    id
                }
            }
        }
    }
}
`);