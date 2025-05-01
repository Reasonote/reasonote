import { graphql } from '../../codegen';

export const getSkillSetForUserQueryDoc = graphql(/* GraphQL */ `
    query getSkillSetWithSkills (
        $filter: SkillSetFilter
        $orderBy: [SkillSetOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
        $filterSkillSetSkill: SkillSetSkillFilter
        $afterSkillSetSkill: Cursor
        $beforeSkillSetSkill: Cursor
        $lastSkillSetSkill: Int
        $firstSkillSetSkill: Int
        $orderBySkillSetSkill: [SkillSetSkillOrderBy!]
    ) {
        skillSetCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...SkillSetFlatFrag
                    skillSetSkillCollection (
                        filter: $filterSkillSetSkill
                        orderBy: $orderBySkillSetSkill
                        first: $firstSkillSetSkill
                        after: $afterSkillSetSkill
                        last: $lastSkillSetSkill
                        before: $beforeSkillSetSkill
                    ) {
                        edges {
                            node {
                                ...SkillSetSkillFlatFrag
                                skill {
                                    ...SkillFlatFrag
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