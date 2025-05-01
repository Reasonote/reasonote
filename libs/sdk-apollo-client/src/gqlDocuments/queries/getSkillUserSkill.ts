import { graphql } from '../../codegen';

export const getSkillUserSkillQueryDoc = graphql(/* GraphQL */ `
    query getSkillUserSkill (
        $filter: SkillFilter
        $orderBy: [SkillOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
    ) {
        skillCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...SkillFlatFrag
                    userSkillCollection {
                        edges {
                            node {
                                ...UserSkillFlatFrag
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