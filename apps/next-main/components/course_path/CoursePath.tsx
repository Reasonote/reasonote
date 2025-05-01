import _ from "lodash";

import {updateUserSkill} from "@/clientOnly/functions/updateUserSkill";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {
  useApolloClient,
  useQuery,
} from "@apollo/client";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  Skeleton,
  Stack,
} from "@mui/material";
import {
  FilterIs,
  getUserSkillFlatQueryDoc,
  OrderByDirection,
  updateChapterFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {
  getChapterDeep,
} from "@reasonote/lib-sdk-apollo-client/src/gqlDocuments/queries/getChapterDeep";

import {ChapterSelectButtons} from "./ChapterSelectButtons";
import {CourseChapter} from "./CourseChapter";
import {CoursePathFirstLesson} from "./CoursePathSelfAssessment";

export function CoursePath({skillIdPath}: {skillIdPath: string[]}){
    const userId = useRsnUserId();
    const ac = useApolloClient();

    const skillId = skillIdPath[skillIdPath.length - 1];   


    // We need to see if the user has completed a self-assessment for this skill


    const userSkillRes = useQuery(getUserSkillFlatQueryDoc, {
        variables: {
            filter: {
                rsnUser: {
                    eq: userId
                },
                skill: {
                    eq: skillId
                }
            },
            first: 1
        },
        fetchPolicy: 'network-only'
    })

    const currentChapterId = userSkillRes.data?.userSkillCollection?.edges[0]?.node?.currentChapter;

    const allChapterRes = useQuery(
        getChapterDeep,
        {
            variables: {
                filter: {
                    rootSkill: {
                        eq: skillId
                    },
                    rootSkillOrder: {
                        is: FilterIs.NotNull
                    },
                    forUser: {
                        eq: userId
                    }
                },
                orderBy: {
                    createdDate: OrderByDirection.AscNullsLast
                },
                first: 100
            }
        }
    );
    
    const allChapters = allChapterRes.data?.chapterCollection?.edges?.map((edge) => edge.node);
    const currentChapter = allChapterRes.data?.chapterCollection?.edges.find((edge) => edge.node.id === currentChapterId)?.node;
    const lastChapter = allChapters?.[allChapters.length - 1]?.id;
    const hasCompletedSelfAssessment = notEmpty(userSkillRes.data?.userSkillCollection?.edges[0]?.node?.selfAssignedLevel)

    return <>
        {
            userSkillRes.loading || allChapterRes.loading ?
                <Skeleton variant="rounded" height={400} width={'100%'} />
                :
                !hasCompletedSelfAssessment ?
                    <CoursePathFirstLesson skillIdPath={skillIdPath} />
                    :
                    allChapters && allChapters.length > 0 ?
                        <>
                            <CoursePathFirstLesson skillIdPath={skillIdPath} /> 
                            {
                                allChapterRes.data?.chapterCollection?.edges.map((edge, idx) => {
                                    const chapter = edge.node;

                                    return <CourseChapter 
                                        skillIdPath={skillIdPath} 
                                        chapter={chapter}
                                         key={`chapter-${chapter.id}`} 
                                         isCurrentChapter={currentChapter?.id === chapter.id} 
                                         lessonTreeOffsetCount={idx === 0 ? 1 : idx * 5} 
                                    />
                                })
                            } 
                            <ChapterSelectButtons 
                                key={`chapter-select-buttons-${lastChapter}`}
                                skillIdPath={skillIdPath}
                                onChapterSelect={async (chapterId) => {
                                    await updateUserSkill(ac, {
                                        rsnUser: {
                                            eq: userId
                                        },
                                        skill: {
                                            eq: skillId
                                        }
                                    }, {
                                        rsnUser: userId ?? '',
                                        skill: skillId ?? '',
                                        currentChapter: chapterId
                                    });

                                    const lastChapterOrder = _.max(allChapters?.map((c) => c.rootSkillOrder) ?? []) ?? 0;

                                    await ac.mutate({
                                        mutation: updateChapterFlatMutDoc,
                                        variables: {
                                            filter: {
                                                id: {
                                                    eq: chapterId
                                                }
                                            },
                                            set: {
                                                rootSkillOrder: lastChapterOrder + 1
                                            },
                                            atMost: 1
                                        }
                                    });

                                    userSkillRes.refetch();
                                    allChapterRes.refetch();
                                }}
                            />
                        </>
                        :
                        <Stack gap={2}>
                            <CoursePathFirstLesson skillIdPath={skillIdPath} /> 

                            <ChapterSelectButtons 
                                skillIdPath={skillIdPath}
                                expandButtonOverrides={{variant: 'contained'}}
                                buttonTextOverride="Choose Your First Chapter"

                                onChapterSelect={async (chapterId) => {
                                    await updateUserSkill(ac, {
                                        rsnUser: {
                                            eq: userId
                                        },
                                        skill: {
                                            eq: skillId
                                        }
                                    }, {
                                        rsnUser: userId ?? '',
                                        skill: skillId ?? '',
                                        currentChapter: chapterId
                                    });

                                    const lastChapterOrder = _.max(allChapters?.map((c) => c.rootSkillOrder) ?? []) ?? 0;

                                    await ac.mutate({
                                        mutation: updateChapterFlatMutDoc,
                                        variables: {
                                            filter: {
                                                id: {
                                                    eq: chapterId
                                                }
                                            },
                                            set: {
                                                rootSkillOrder: lastChapterOrder + 1
                                            },
                                            atMost: 1
                                        }
                                    });

                                    userSkillRes.refetch();
                                    allChapterRes.refetch();
                                }}
                            />
                        </Stack>
        }
    </>
}