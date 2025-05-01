import { graphql } from '../../codegen';

export const getSkillUpstreamDeepQueryDoc = graphql(/* GraphQL */ `
    query getSkillUpstreamDeep (
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
                    downstreamOf {
                        edges {
                            node {
                                ...SkillLinkFlatFrag
                                upstream {
                                    ...SkillFlatFrag
                                    downstreamOf {
                                        edges {
                                            node {
                                                ...SkillLinkFlatFrag
                                                upstream {
                                                    ...SkillFlatFrag
                                                    downstreamOf {
                                                        edges {
                                                            node {
                                                                ...SkillLinkFlatFrag
                                                                upstream {
                                                                    ...SkillFlatFrag
                                                                    downstreamOf {
                                                                        edges {
                                                                            node {
                                                                                ...SkillLinkFlatFrag
                                                                                upstream {
                                                                                    ...SkillFlatFrag
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
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