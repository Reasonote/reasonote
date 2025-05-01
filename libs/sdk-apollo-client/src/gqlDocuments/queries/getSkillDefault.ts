import { graphql } from '../../codegen';

export const getSkillDefaultQueryDoc = graphql(/* GraphQL */ `
    query getSkillDefault (
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
                    upstreamOf {
                        edges {
                            node {
                                ...SkillLinkFlatFrag
                                downstream {
                                    
                                     ...SkillFlatFrag
                                        
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