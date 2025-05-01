import React from "react";

import _ from "lodash";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  useSkillScores,
  UseSkillScoresReturnType,
} from "@/clientOnly/hooks/useSkillScores";
import {useSkillSimpleTree} from "@/clientOnly/hooks/useSkillSimpleTree";
import {useUserSkillLevel} from "@/clientOnly/hooks/useUserSkillLevel";
import {
  ActivityCountChip,
} from "@/components/activity/components/ActivityCountChip";
import {SkillChip} from "@/components/chips/SkillChip/SkillChip";
import {SkillIcon} from "@/components/icons/SkillIcon";
import {StreakIcon} from "@/components/icons/StreakIcon";
import {
  SkillLessonCreateModalDefault,
} from "@/components/lesson/SkillLessonCreateModalDefault";
import {ScoreChip} from "@/components/scores/ScoreChip";
import {useSkillStreak} from "@/components/skill/Streak/useSkillStreak";
import {Txt} from "@/components/typography/Txt";

import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  Info,
  OpenInNew,
  Star,
} from "@mui/icons-material";
import {
  Card,
  CardProps,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {PieChart} from "@mui/x-charts";

export interface SkillIdOverviewTabContentProps {
    skillId: string;
    switchTab?: (tab: string) => void;
}

function ExtremaCard({order, skillScore, cardProps, rightAction}: {order: number, skillScore: UseSkillScoresReturnType[number], cardProps?: CardProps, rightAction?: React.ReactNode}) {
    const mainTextSize = order == 1 ? 'body1' : order === 2 ? 'body2' : 'caption';
    const elevation = order == 1 ? 15 : 5;
    const scoreColor = skillScore.average_normalized_score_upstream > .8 ? 'success' : skillScore.average_normalized_score_upstream > .6 ? 'warning' : 'error';



    return <Card elevation={elevation} {...cardProps}>
        <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'} gap={1}>
            <Stack direction={'column'} gap={1}>
                <SkillChip size="small" topicOrId={skillScore.skill_id} disableAddDelete disableLevelIndicator disableModal/>
                {/* <Txt variant="caption">{skillScore.activity_result_count_upstream} Activities</Txt> */}
                <Stack direction={'row'} gap={1}>
                    <Tooltip title={`${skillScore.activity_result_count_upstream} Activity Results Found`}>
                        <ActivityCountChip count={skillScore.activity_result_count_upstream}/> 
                    </Tooltip>
                    <ScoreChip score={skillScore.average_normalized_score_upstream}/>
                </Stack>
            </Stack>
            {
                rightAction ? rightAction : null
            }
        </Stack>
    </Card>
}


export function TopXCard({order, skillScore}: {order: number, skillScore: UseSkillScoresReturnType[number]}) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    return <>
        <ExtremaCard order={order} skillScore={skillScore}
            //  cardProps={{sx: {backgroundColor: theme.palette.success.dark}}}
            rightAction={
                <IconButton onClick={() => {
                    setIsModalOpen(true);
                }}>
                    <OpenInNew/>
                </IconButton>
            }
        /> 
        <SkillLessonCreateModalDefault
            fullSkillIdPath={skillScore.path_to}
            showing={isModalOpen}
            setShowing={setIsModalOpen}
        />
    </>
}

export function BottomXCard({order, rootSkillId, skillScore}: {order, rootSkillId: string, skillScore: UseSkillScoresReturnType[number]}) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    return <>
        <ExtremaCard order={order} skillScore={skillScore}
            //  cardProps={{sx: {backgroundColor: theme.palette.warning.dark}}}
            rightAction={
                <IconButton onClick={() => {
                    setIsModalOpen(true);
                }}>
                    <OpenInNew/>
                </IconButton>
            }
        />
        <SkillLessonCreateModalDefault
            fullSkillIdPath={[rootSkillId, ...skillScore.path_to]}
            showing={isModalOpen}
            setShowing={setIsModalOpen}
        />
     </>
}

export function StreakCard({skillId}: {skillId: string}) {
    const theme = useTheme();
    const {data: streakCount} = useSkillStreak(skillId);
    const hasStreak = streakCount && streakCount > 0;
    const color = streakCount && streakCount > 0 ? 'warning' : 'gray';
    const isSmallDevice = useIsSmallDevice();

    return <Card elevation={5} sx={{width: '100%'}}>
        <Stack>
            <Typography variant={isSmallDevice ? 'h6' : 'h5'} textAlign={'center'}>Streak</Typography>
            <Stack alignContent={'center'} alignItems={'center'} justifyContent={'center'} justifyItems={'center'} width={'100%'} height={"fit-content"} direction={'row'}>
                <StreakIcon color={color as any} sx={{zoom: isSmallDevice ? 2 : 3}}/>
                <Typography sx={{color: theme.palette[color].main}} variant={'h4'}>{streakCount ?? '?'}</Typography>
            </Stack>
            {
                hasStreak ? 
                    <Typography variant={isSmallDevice ? 'body2' : 'body1'} textAlign={'center'} fontStyle={'italic'} sx={{color: theme.palette[color].main}}>Nice work! Keep it up 🔥</Typography>
                    :
                    <Typography variant="caption" textAlign={'center'} fontStyle={'italic'}>Practice to start a new streak!</Typography>
            }
        </Stack>
    </Card>   
}

export function ScoreCard({skillData}) {
    const isSmallDevice = useIsSmallDevice();

    const hasActivities = skillData.data ? skillData.data.activity_result_count_upstream > 0 : undefined;
    const percentCorrect = skillData.data && hasActivities ? skillData.data.average_normalized_score_upstream * 100 : undefined;
    const percentIncorrect = notEmpty(percentCorrect) ? (100 - percentCorrect) : undefined;

    return <Card elevation={5}>
        <Stack gap={1}>
            <Typography variant ={isSmallDevice ? 'h6' : 'h5'} textAlign={"center"}>Score</Typography>
            {
                notEmpty(skillData) && notEmpty(percentCorrect) && notEmpty(percentIncorrect) ? 
                    <div style={{position: 'relative'}}>
                        <div style={{display: isSmallDevice ? 'flex' : undefined, alignItems: isSmallDevice ? 'center' : undefined}}>
                            <PieChart
                                // sx={{ height: '100%', width: '100%' }}
                                series={[
                                    {
                                        data: [
                                            { id: 0, value: Number.parseFloat(percentCorrect.toFixed(1)), label: '% Correct', color: 'teal' },
                                            { id: 1, value: Number.parseFloat(percentIncorrect.toFixed(1)), label: '% Incorrect', color: '#942C16' },
                                        ],
                                        // innerRadius: 20,
                                        // outerRadius: 40,
                                        // paddingAngle: 5,
                                        // cornerRadius: 5,
                                        // cx: 110,
                                        innerRadius: isSmallDevice ? 10 : 20,
                                        outerRadius: isSmallDevice ? 25 : 40,
                                        paddingAngle: 5,
                                        cornerRadius: 5,
                                        cx: isSmallDevice ? 20 : 110,
                                        // cy: 70,
                                    },
                                ]}
                                slotProps={{
                                    legend: {
                                        hidden: true,
                                    }
                                    
                                }}
                                width={isSmallDevice ? 50 : 500}
                                height={isSmallDevice ? 50 : 100}
                                // sx={{padding: '1px'}}
                            />
                        </div>
                    </div>
                    
                :
                <Typography width={'100%'} variant="caption" textAlign={"center"} fontStyle={'italic'}>Practice to get a score!</Typography>
            }
        </Stack>
    </Card>
}

export function SkillIdOverviewTabContent(props: SkillIdOverviewTabContentProps) {
    const {skillId, switchTab} = props;
    const scoreData = useUserSkillLevel({topicOrId: skillId});

    const skillScores = useSkillScores({topicOrId: skillId});
    
    const skillData = useSkillSimpleTree({topicOrId: skillId});

    const isSmallDevice = useIsSmallDevice();

    return <Stack gap={2} width={'100%'}>
        <Grid container gap={1} justifyContent={'center'} width={'100%'}>
            <Grid item xs={5.5}>
                <ScoreCard skillData={skillData}/>
            </Grid>
            <Grid item xs={5.5}>
                <StreakCard skillId={skillId}/>
            </Grid>
        </Grid>

        {/* <Divider/> */}
        <Stack sx={{width: '100%'}}>

            <Card elevation={5}>
                <Grid container>
                {
                    (skillScores.data && skillScores.data.filter((sk) => sk.activity_result_count_upstream > 0).length > 6) ? 
                        <>
                            <Grid item xs={isSmallDevice ? 12 : 6} padding={'5px'}>
                                <Stack gap={1}>
                                    <Txt startIcon={<SkillIcon/>}>Your Hardest 3 Subskills</Txt>    
                                    <Stack gap={1}>
                                        {
                                            skillScores.data && skillScores.data.length > 0 ?
                                                _.orderBy(
                                                    skillScores.data.filter((sk) => sk.activity_result_count_upstream > 0),
                                                    (sk) => sk.average_normalized_score_upstream
                                                )
                                                .slice(0, 3)
                                                .map((sk, idx) => {
                                                    return <BottomXCard skillScore={sk} rootSkillId={skillId} order={idx + 1}/>
                                                })
                                                :
                                                null
                                        }
                                    </Stack>
                                </Stack>
                            </Grid>
                            <Grid item xs={isSmallDevice ? 12 : 6} padding={'5px'}>
                                <Stack gap={1}>
                                    <Txt startIcon={<Star/>}>Your Top 3 Subskills</Txt>
                                    <Stack gap={1}>
                                        {
                                            skillScores.data && skillScores.data.length > 0 ?
                                                _.orderBy(
                                                    skillScores.data.filter((sk) => sk.activity_result_count_upstream > 0),
                                                    (sk) => sk.average_normalized_score_upstream
                                                )
                                                .reverse()
                                                .slice(0, 3)
                                                .map((sk, idx) => {
                                                    return <TopXCard skillScore={sk} order={idx + 1}/>
                                                })
                                                :
                                                null
                                        }
                                    </Stack>
                                </Stack>
                            </Grid>
                        </>
                        :
                        <Stack width={'100%'} alignItems={'center'} justifyContent={'center'} padding={'10px'}>
                            <Txt startIcon={<Info fontSize="small"/>} variant="body1" fontStyle="italic" textAlign={'center'}>Practice to get statistics!</Txt>
                        </Stack>

                }

                </Grid>
            </Card>
        </Stack>
    </Stack>
  }