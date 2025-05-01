import { graphql } from '../../codegen';

export const getUserHistoryDeepQueryDoc = graphql(/* GraphQL */ `
    query getUserHistoryDeep (
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
                    skill {
                        ...SkillFlatFrag
                    }
                    podcast {
                        ...PodcastFlatFrag
                    }
                    course {
                        ...CourseFlatFrag
                    }
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);