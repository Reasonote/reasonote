import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import _ from "lodash";
import {useRouter} from "next/navigation";

import {
  FillSubskillTreeRoute,
} from "@/app/api/skills/fill_subskill_tree/routeSchema";
import {useSkillTree} from "@/clientOnly/hooks/useSkillTree";
import {useToken} from "@/clientOnly/hooks/useToken";
import {SkillChipProps} from "@/components/chips/SkillChip/SkillChip";
import {
  LessonCreateModal,
} from "@/components/lesson_session/LessonSessionFinish/LessonCreateModal";
import {useApolloClient} from "@apollo/client";
import {
  isTypedUuidV4,
  notEmpty,
} from "@lukebechtel/lab-ts-utils";
import {Stack} from "@mui/material";
import {
  ActivityType,
  LessonSkillTreeActivityGenerateSkill,
  SkillTree,
  SkillTreeNode,
} from "@reasonote/core";
import {
  createLessonFlatMutDoc,
  deleteSkillFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";

import {
  SkillTreeGraphV2,
  SkillTreeGraphV2ExtraProps,
} from "./SkillTreeGraphV2/Graph";
import {SkillTreeV2List} from "./SkillTreeV2List";

export interface SkillTreeV2Props {
    skillId?: string;
    skillTreeData?: SkillTree;
    lessonId?: string;
    refreshCount?: number;
    emptyState?: any;
    createActivitiesForSkill?: (props: {
        skill: LessonSkillTreeActivityGenerateSkill,
        activityType: ActivityType
    }) => any;
    createSlidesForSkill?: (props: {
        skill: LessonSkillTreeActivityGenerateSkill,
    }) => any;
    newLessonCreated?: (lessonId: string) => any;
    /**
     * If the depth of the tree is greater than this number, this will show "Show More"
     */
    hideAfterDepth?: number;

    /**
     * If set, the maximum depth to expand the tree to.
     */
    maxDepth?: number;

    /**
     * If set, show the number of activities for each skill.
     */
    showActivityCount?: boolean | ((n: SkillTreeNode) => boolean) | undefined;

    disableDelete?: boolean;

    disableAddSkills?: boolean;

    /**
     * If set, show the score for each skill.
     */
    showScore?: boolean | ((n: SkillTreeNode) => boolean) | undefined;

    /**
     * If set, allows overriding any props on individual SkillChipProps
     */
    skillChipProps?: boolean | ((n: SkillTreeNode) => SkillChipProps) | undefined;

    /**
     * If set, show the create lesson button for each skill.
     */
    showCreateLesson?: boolean | ((n: SkillTreeNode) => boolean) | undefined;

    /**
     * If set, show the skill tree as a graph instead of a tree.
     */
    variant?: 'list' | 'graph';

    graphExtraProps?: SkillTreeGraphV2ExtraProps;

    onPodcastOverride?: (skillId: string) => void;
    onCreateLessonOverride?: (skillId: string) => void;

    containerRef?: React.RefObject<HTMLDivElement>;
    
    /**
     * Optional React elements to be displayed in the right side of the graph header
     */
    rightHeaderExtras?: React.ReactNode;
}

export function SkillTreeV2RootNode({ lessonId, skillId, refreshCount, refetch, createActivitiesForSkill, createSlidesForSkill, hideAfterDepth, maxDepth, skillTreeData, ...rest }: SkillTreeV2Props & { skillTreeData: SkillTree, refetch?: () => void }) {
    const { token } = useToken();
    const ac = useApolloClient();
    const router = useRouter();
    const [newLessonSkill, setNewLessonSkill] = useState<{ skillId: string, skillIdPath: string[] } | null>(null);
    const [generatingSubskillsIds, setGeneratingSubskillsIds] = useState<string[]>([]);

    const isId = isTypedUuidV4(skillId);

    // Whenever the refreshCount goes up, refetch the skill tree
    useEffect(() => {
        console.log('refreshing skill tree')
        refetch?.();
    }, [refreshCount]);

    const expandTree = useCallback(async (skillId: string, parentSkillIds?: string[], maxDepth?: number) => {
        try {
            if (generatingSubskillsIds.includes(skillId)) {
                console.warn('Already generating subskills for skill', skillId)
                return;
            }

            setGeneratingSubskillsIds((old) => _.uniq([...old, skillId]));

            if (!skillId || !isId) {
                return;
            }

            await FillSubskillTreeRoute.call({
                skill: {
                    id: skillId,
                    parentSkillIds
                },
                maxDepth,
            }, {
                headers: {
                    Authorization: token ?? ''
                }
            })

            refetch?.();
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setGeneratingSubskillsIds((old) => old.filter((id) => id !== skillId));
        }
    }, [token, refetch, isId, generatingSubskillsIds])

    const deleteSkill = useCallback(async (deletingSkillId) => {
        try {
            console.log('deleting skill', deletingSkillId)
            await ac.mutate({
                mutation: deleteSkillFlatMutDoc,
                variables: {
                    filter: {
                        id: {
                            eq: deletingSkillId
                        }
                    },
                    atMost: 1
                }
            })

            refetch?.();
        }
        catch (e) {
            console.error(e);
        }
        finally {
            // setIsExpandingTree(false);
        }
    }, [refetch])

    const skillTreeNode = skillTreeData;

    // The first node shoudl be the root, always.
    const rootNode = skillTreeNode.skills.find(s => s.id === skillId);

    if (!rootNode) {
        console.error('No root node found!')
        return null;
    }

    return skillTreeNode ?
        <Stack>
            <SkillTreeV2List
                tree={skillTreeData}
                node={rootNode}
                indent={0}
                generateSubskills={(skillId, parentSkillIds) => {
                    expandTree(skillId, parentSkillIds, maxDepth)
                }}
                key={rootNode.id}
                generatingSubskillsIds={generatingSubskillsIds}
                deleteSkill={deleteSkill}
                createActivitiesForSkill={createActivitiesForSkill}
                createSlidesForSkill={createSlidesForSkill}
                hideAfterDepth={hideAfterDepth}
                createLesson={(skillId, parentSkillIds) => {
                    setNewLessonSkill({
                        skillId,
                        skillIdPath: parentSkillIds ?? []
                    })
                }}
                {...rest}
            />

            {
                newLessonSkill && <LessonCreateModal
                    skillId={newLessonSkill.skillId}
                    onSubmit={async ({ name, summary }) => {
                        const fullSkillPath = _.uniq([...(newLessonSkill?.skillIdPath ?? []), skillId]).filter(notEmpty);

                        if (!fullSkillPath || fullSkillPath.length === 0) {
                            console.error(`Failed to create lesson! No skill path!`)
                            return;
                        }

                        // Create the lesson
                        const lessonCreateRes = await ac.mutate({
                            mutation: createLessonFlatMutDoc,
                            variables: {
                                objects: [
                                    {
                                        name,
                                        summary,
                                        // Same root skill.
                                        rootSkill: fullSkillPath[0],
                                        // The path is the original rootSkillPath, plus the new skill.
                                        rootSkillPath: fullSkillPath,
                                    }
                                ]
                            }
                        })

                        // Get its id...
                        const newLessonId = lessonCreateRes.data?.insertIntoLessonCollection?.records[0]?.id;
                        if (!newLessonId) {
                            console.error(`Failed to create lesson!`)
                            return;
                        }

                        // Now we go to the new session page.
                        router.push(`/app/lessons/${newLessonId}/new_session`)
                    }}
                    isShowing={true}
                    onClose={() => {
                        setNewLessonSkill(null);
                    }}
                />
            }
        </Stack>
        :
        null
}

export function SkillTreeV2({ variant = 'list', containerRef, ...props }: SkillTreeV2Props) {
    let { data: skillTreeData, refetch, error } = useSkillTree({ id: props.skillId ?? '' });
    const [dimensions, setDimensions] = useState({ width: '500px', height: '500px' });
    const defaultRef = useRef<HTMLDivElement>(null);
    const actualRef = containerRef || defaultRef;

    useEffect(() => {
        if (!actualRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                setDimensions({
                    width: `${entry.contentRect.width}px`,
                    height: `${entry.contentRect.height}px`,
                });
            }
        });

        resizeObserver.observe(actualRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [actualRef]);
    

    if (!skillTreeData) {
        skillTreeData = props.skillTreeData;
    }

    if (!skillTreeData) {
        console.warn('No skill tree data found!')
        return null;
    }



    if (!skillTreeData || skillTreeData.skills.length === 0 && props.emptyState) {
        return props.emptyState ?? null;
    }

    if (variant === 'graph') {
        return (
            <div ref={actualRef} style={{ width: '100%', height: '100%' }}>
                <SkillTreeGraphV2
                    {...props}
                    rootSkillId={props.skillId ?? ''}
                    skillTreeData={skillTreeData}
                    width={parseInt(dimensions.width)}
                    height={parseInt(dimensions.height)}
                    refetch={refetch}
                    rightHeaderExtras={props.rightHeaderExtras}
                    {...props.graphExtraProps}
                />
            </div>
        );
    }

    // return null;

    return (
        <Stack width={'100%'} ref={actualRef}>
            <SkillTreeV2RootNode {...props} skillTreeData={skillTreeData} refetch={refetch} />
        </Stack>
    );
}
