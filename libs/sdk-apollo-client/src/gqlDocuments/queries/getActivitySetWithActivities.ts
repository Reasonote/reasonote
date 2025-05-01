import { graphql } from '../../codegen';

export const getActivitySetForUserQueryDoc = graphql(/* GraphQL */ `
    query getActivitySetWithActivities (
        $filter: ActivitySetFilter
        $orderBy: [ActivitySetOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
        $filterActivity: ActivitySetActivityFilter
        $orderByActivity: [ActivitySetActivityOrderBy!]
        $firstActivity: Int
        $afterActivity: Cursor
        $lastActivity: Int
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
                    activitySetActivityCollection(
                        filter: $filterActivity
                        orderBy: $orderByActivity
                        first: $firstActivity
                        after: $afterActivity
                        last: $lastActivity
                    )
                    {
                        edges {
                            node {
                                ...ActivitySetActivityFlatFrag
                                activity {
                                    ...ActivityFlatFrag
                                }
                            }
                        }
                        pageInfo {
                            ...PageInfoFlatFrag
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