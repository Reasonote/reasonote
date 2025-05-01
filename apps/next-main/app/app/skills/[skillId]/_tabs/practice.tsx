"use client"
import React from "react";

import _ from "lodash";
import {useRouter} from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useSkillScores} from "@/clientOnly/hooks/useSkillScores";
import {useSkillSimpleTree} from "@/clientOnly/hooks/useSkillSimpleTree";
import MissedActivityIcon from "@/components/icons/MissedActivityIcon";
import SavedActivityIcon from "@/components/icons/SavedActivityIcon";
import {SkillIcon} from "@/components/icons/SkillIcon";
import {Txt} from "@/components/typography/Txt";
import {useQuery} from "@apollo/client";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  Air,
  BarChart,
  Info,
  Star,
} from "@mui/icons-material";
import {
  Button,
  ButtonProps,
  Card,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  GetActivitySkillWithResultsDocument,
} from "@reasonote/lib-sdk-apollo-client";

import {
  BottomXCard,
  ScoreCard,
  StreakCard,
  TopXCard,
} from "./overview";

export interface SkillIdDiveTabContentProps {
    skillId: string;
}

interface BigActionButton extends ButtonProps {
    leftIcon: React.ReactNode;
    disabled?: boolean;
}

const BigActionButton: React.FC<BigActionButton> = ({children, onClick, leftIcon, disabled, sx, ...props}) => {
    return <Button
        onClick={onClick}
        disabled={disabled}
        sx={{
            padding: '20px',
            height: '100px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textTransform: 'none',
            ...sx,
        }}
        fullWidth
        {...props}
    >
        <Stack direction="row" alignItems="center" gap={1}>
            {leftIcon}
            <Stack width="fit-content">
                {children}
            </Stack>
        </Stack>
    </Button>
}

interface SmallActionButtonProps extends ButtonProps {
  leftIcon: React.ReactNode;
  disabled?: boolean;
}

export const SmallActionButton: React.FC<SmallActionButtonProps> = ({ children, onClick, leftIcon, disabled, sx, ...props }) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      sx={{
        padding: '10px',
        minHeight: '80px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textTransform: 'none',
        ...sx,
      }}
      {...props}
    >
      <Stack direction="row" alignItems="center" gap={1}>
        {leftIcon}
        <Stack width="fit-content">
          {children}
        </Stack>
      </Stack>
    </Button>
  );
};

export function SkillIdPracticeContent({skillId}: SkillIdDiveTabContentProps) {
    const theme = useTheme();
    const skillScores = useSkillScores({topicOrId: skillId});
    
    const skillData = useSkillSimpleTree({topicOrId: skillId});

    const isSmallDevice = useIsSmallDevice();


    const router = useRouter();
    const userId = useRsnUserId();


    const activitySkill = useQuery(GetActivitySkillWithResultsDocument, {
        variables: {
            filter: {
                createdBy: {
                    eq: userId,
                },
                skill: {
                    in: [skillId],
                },
            },
            first: 5,
        },
        fetchPolicy: "network-only",
    });

    const actSkillEdges = activitySkill.data?.activitySkillCollection?.edges;

    // Buttons are disabled if we are loading lessons or lesson results
    // OR if we don't have any lesson results yet.
    const buttonsDisabled = activitySkill.loading || (notEmpty(actSkillEdges) && actSkillEdges.length < 2);

    return <Stack gap={1} width={'100%'}>
        <Stack flex="0 0 auto" gap={2} width={'100%'} height={'100%'}>
            <Txt startIcon={<BarChart/>} variant="h6" justifyContent={'center'} textAlign={'center'} stackOverrides={{alignContent: 'center', justifyContent: 'center'}}>Stats</Txt> 
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

            <Stack gap={.5} height={'100%'} justifyItems={'center'} justifyContent={'center'} alignContent={'center'}>
                <Txt startIcon={<SkillIcon/>} variant="h6" justifyContent={'center'} textAlign={'center'} stackOverrides={{alignContent: 'center', justifyContent: 'center'}}>Practice</Txt>
                <Grid container justifyContent={'center'} justifyItems={'center'} alignItems={'center'}>
                    {/* <Grid item xs={2.75} height={'100%'}>
                        <SmallActionCard onClick={() => {}} leftIcon={<Build fontSize="small"/>}>
                            Custom Session
                        </SmallActionCard>
                    </Grid> */}
                    
                    <Grid item xs={6} padding="5px">
                        <SmallActionButton
                            disabled={buttonsDisabled}
                            onClick={() => {
                                router.push(`/app/practice?skillId=${skillId}&type=missed`);
                            }}
                            leftIcon={<MissedActivityIcon fontSize="small"/>}
                            // sx={{ background: theme.palette.info.dark }}
                            color={'error'}
                            variant={'contained'}
                            fullWidth
                        >
                            <Typography variant="body1">Missed Activities</Typography>
                            <Typography variant="body2">Practice activities you missed</Typography>
                        </SmallActionButton>
                    </Grid>
                    <Grid item xs={6} padding="5px">

                        <SmallActionButton
                            disabled={buttonsDisabled}
                            onClick={() => {
                                router.push(`/app/practice?skillId=${skillId}&type=saved`);
                            }}
                            leftIcon={<SavedActivityIcon fontSize="small"/>}
                            // sx={{ background: theme.palette.info.dark }}
                            color={'info'}
                            variant={'contained'}
                            fullWidth
                        >
                            <Typography variant="body1">Saved Activities</Typography>
                            <Typography variant="body2">Practice activities you saved</Typography>
                        </SmallActionButton>
                    </Grid>
                    <Grid item xs={12} padding="5px">
                        <SmallActionButton
                            disabled={buttonsDisabled}
                            onClick={() => {
                                router.push(`/app/practice/practice?skillIdPath=${encodeURIComponent(JSON.stringify([skillId]))}`);
                            }}
                            leftIcon={<Air fontSize="large" />}
                            fullWidth
                            color={'purple'}
                            variant="contained"
                        >
                            <Txt startIcon={<Air fontSize="large"/>} variant="h6" color={theme.palette.text.primary}>Practice</Txt>   
                            <Typography variant="body2" color={theme.palette.text.primary}>We'll create and show activities customized to you</Typography>
                        </SmallActionButton>
                    </Grid>
                </Grid>
            </Stack>
        </Stack> 
        {/* <Stack flex={"1 1 auto"} overflow={'auto'}>
            <SkillDiveScreen 
                skillIdPath={[skillId]}
                onLessonChosen={(l) => {
                    router.push(`/app/lessons/${l.id}/new_session`)
                }}
            />
        </Stack> */}
    </Stack>
}