import { graphql } from '../../codegen';

export const getChapterDeep = graphql(/* GraphQL */ `
    query getChaptersDeep($filter: ChapterFilter, $orderBy: [ChapterOrderBy!], $first: Int, $last: Int, $before: Cursor, $after: Cursor) {
        chapterCollection(filter: $filter, orderBy: $orderBy, first: $first, last: $last, before: $before, after: $after) {
            pageInfo {
                ...PageInfoFlatFrag
            }
            edges {
                node {
                    ...ChapterFlatFrag
                    lessonCollection {
                        pageInfo {
                            ...PageInfoFlatFrag
                        }
                        edges {
                            node {
                                ...LessonFlatFrag
                                lessonActivityCollection {
                                    edges {
                                        node {
                                            ...LessonActivityFlatFrag
                                            activity {
                                                ...ActivityFlatFrag
                                                userActivityResultCollection {
                                                    edges {
                                                        node {
                                                            ...UserActivityResultFlatFrag
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                rsnUser {
                                    ...RsnUserFlatFrag
                                }
                            }
                        }
                    }
                    rsnUser {
                        ...RsnUserFlatFrag
                    }
                }
            }
        }
    }
`);