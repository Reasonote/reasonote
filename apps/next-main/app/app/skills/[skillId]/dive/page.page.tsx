"use client"
import {useState} from "react";

import _ from "lodash";
import {useRouter} from "next/navigation";

import {useIsDebugMode} from "@/clientOnly/hooks/useIsDebugMode";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRouteParams} from "@/clientOnly/hooks/useRouteParams";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useUserTour} from "@/clientOnly/hooks/useUserTourState";
import {SkillChip} from "@/components/chips/SkillChip/SkillChip";
import {CoursePath} from "@/components/course_path/CoursePath";
import {NotFoundPage} from "@/components/navigation/NotFound";
import MobileContent from "@/components/positioning/mobile/MobileContent";
import MobileContentHeader
  from "@/components/positioning/mobile/MobileContentHeader";
import MobileContentMain
  from "@/components/positioning/mobile/MobileContentMain";
import {SkillStreakChip} from "@/components/skill/Streak/SkillStreakChip";
import {useApolloClient} from "@apollo/client";
import {ArrowBackIos} from "@mui/icons-material";
import {
  Button,
  IconButton,
  Stack,
} from "@mui/material";
import {LessonConfig} from "@reasonote/core";
import {deleteLessonFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";
import {useSkillFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

export interface SkillDiveScreenProps {
    skillIdPath: string[];
    onLessonChosen: (intent: LessonConfig) => void;
}

const MIN_NUM_LESSONS = 2;
  
export function SkillDiveScreen({skillIdPath}: SkillDiveScreenProps) {
    const isDebugMode = useIsDebugMode();
    const [lessons, setLessons] = useState<LessonConfig[]>([]);
    const [lessonInitGen, setLessonInitGen] = useState<boolean>(false);
    const [newLessonState, setNewLessonState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [newLessonModalOpen, setNewLessonModalOpen] = useState<boolean>(false);
    const [lessonTourState, setLessonTourState] = useState<'hidden' | 'showing' | 'dismissed'>('hidden');

    const ac = useApolloClient();
    const userId = useRsnUserId();

    const skillId = skillIdPath[skillIdPath.length - 1];

    const skillName = useSkillFlatFragLoader(skillId)?.data?.name;

    const userTourRes = useUserTour('skill-dive');

    // TODO: then we organize into small lessons.
    return <Stack gap={1} padding={'10px'} width={'100%'}>
        {/* <ClientTour
            steps={[
                {
                    selector: '',
                    content: <Stack padding={'10px'}>
                        <Typography variant="body1">
                            This is your new course on <br/>
                            <b>"{skillName}"</b>
                            <br/>
                            We're making it <i>just for you.</i>
                        </Typography>
                    </Stack>,
                },
                {
                    selector: '.lesson-tree-item-fab-starter-lesson',
                    content: <Stack padding={'10px'}>
                        <Typography variant="body2">We're building you a personalized assessment for your new skill <b>"{skillName}"</b>.</Typography>
                        <br/>
                        <Txt variant={'body2'}>Click this button to get started!</Txt>
                    </Stack>,
                }
            ]}
            // isOpen={true}
            isOpen={userTourRes.notFound || userTourRes.data?.tourStatus === UserTourStatus.InProgress}
            onRequestClose={() => {
                userTourRes.update({
                    tourStatus: UserTourStatus.Completed
                });
                setLessonTourState('dismissed');
            }}
            accentColor={theme.palette.info.dark}
        /> */}

        {
            isDebugMode ? 
                <Stack sx={{backgroundColor: 'yellow'}}>
                    <Button onClick={async () => {
                        setLessons([]);

                        // Also, delete all lessons with appropriate rootSkillId
                        await ac.mutate({
                            mutation: deleteLessonFlatMutDoc,
                            variables: {
                                filter: {
                                    rootSkill: {
                                        eq: skillIdPath[skillIdPath.length - 1]
                                    }
                                },
                                atMost: 20
                            }
                        });
                    }}>
                        Clear All Lessons
                    </Button>
                    {/* <Typography variant="body1">Skill ID: {skillId}</Typography> */}
                </Stack>
                :
                null
        }
        <CoursePath skillIdPath={skillIdPath}/>
        
        {/* <ActionCard 
            cardProps={{
                className: 'skill-lesson-generate-button'
            }}
        onClick={() => {
            setNewLessonModalOpen(true);
        }}>
            <Stack direction={'row'} gap={1} alignItems={'center'} justifyContent={'center'} >
                <AutoAwesomeAddIcon/>
                <Typography variant="h5">Generate More Lessons</Typography>
            </Stack>
            
        </ActionCard> */}

        {/* <CreateLessonModalDumb
            isOpen={newLessonModalOpen}
            onCreate={async (args: {name: string, details: string, sourceText: string}) => {
                setNewLessonModalOpen(false);

                var snipId: string | undefined = undefined;
                if (args.sourceText.trim().length > 0){
                    const snipRes = await ac.mutate({
                        mutation: createSnipFlatMutDoc,
                        variables: {
                            objects: [
                                {
                                    name: `${args.name} - Source Text`,
                                    type: 'text',
                                    textContent: args.sourceText,
                                    owner: userId
                                }
                            ]
                        }
                    });

                    snipId = snipRes.data?.insertIntoSnipCollection?.records?.[0]?.id;
                }


                await ac.mutate({
                    mutation: createLessonFlatMutDoc,
                    variables: {
                        objects: [
                            {
                                name: args.name,
                                summary: args.details,
                                rootSkill: skillIdPath[skillIdPath.length - 1],
                                snipIds: snipId ? [snipId] : []
                            }
                        ]
                    }
                });

                lessonResultRes.refetch();
                lessonRes.refetch();
            }}
            onCancel={function (): void {
                setNewLessonModalOpen(false);
            }} 
            onSuggestLessons={() => {
                setNewLessonModalOpen(false);
                getMoreLessons();
            }}
        /> */}
    </Stack>
}

export default function SkillsSkillIdDivePage({params}: any) {
    
    const skillId = useRouteParams(params, 'skillId');
    const skillRes = useSkillFlatFragLoader(skillId); 
    const router = useRouter();
    const isSmallDevice = useIsSmallDevice();

    const onPreviousPage = () => {
        router.push(`/app/foryou`)
    }

    if (!skillId){
        return <NotFoundPage /> 
    }


    return <MobileContent>
        <MobileContentHeader disableBreadcrumb>
            <Stack direction={'row'} justifyContent={'space-between'}>
                {
                    isSmallDevice ?
                        <Stack direction={'row'} alignItems={'center'} gap={1}>
                            <IconButton onClick={() => {
                                onPreviousPage();
                            }}>
                                <ArrowBackIos />
                            </IconButton>
                            <SkillChip topicOrId={skillId} disableAddDelete disableLevelIndicator disableModal/>
                        </Stack>
                        :
                        <Stack direction={'row'} alignItems={'center'} gap={1}>
                            <IconButton onClick={() => {
                                onPreviousPage();
                            }}>
                                <ArrowBackIos />
                            </IconButton>
                            <SkillChip topicOrId={skillId} disableAddDelete disableLevelIndicator disableModal/>
                        </Stack>
                }
                <Stack>
                    <SkillStreakChip skillId={skillId}/> 
                </Stack>
            </Stack>
        </MobileContentHeader>
        <MobileContentMain>
            <SkillDiveScreen 
                skillIdPath={[skillId]}
                onLessonChosen={(l) => {
                    router.push(`/app/lessons/${l.id}/new_session`)
                }}
            />
        </MobileContentMain>        
    </MobileContent>
}