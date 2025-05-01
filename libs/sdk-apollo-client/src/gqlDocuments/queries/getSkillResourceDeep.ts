import { graphql } from '../../codegen';

export const getResourceDeepQueryDoc = graphql(/* GraphQL */ `
query getResourceDeep (
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
                parentPodcast {
                    ...PodcastFlatFrag
                }
                parentSkill {
                    ...SkillFlatFrag
                }
                childSnip {
                    ...SnipFlatFrag
                }
                childPage {
                    ...RsnPageFlatFrag
                }
            }
        }
        pageInfo {
            ...PageInfoFlatFrag
        }
    }
}
`);