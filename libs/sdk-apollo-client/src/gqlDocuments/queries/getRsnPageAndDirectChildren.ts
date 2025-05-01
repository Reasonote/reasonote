import { graphql } from '../../codegen';

export const getRsnPageAndDirectChildrenFlatQueryDoc = graphql(/* GraphQL */ `
    query getRsnPageAndDirectChildren (
        $filter: RsnPageFilter
        $orderBy: [RsnPageOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        rsnPageCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...RsnPageFlatFrag
                    rsnPageCollection {
                        edges {
                            node {
                                ...RsnPageFlatFrag
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