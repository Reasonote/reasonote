"use client"
import {
  useCallback,
  useState,
} from "react";

import {useRouter} from "next/navigation";

import {
  AddtoUserBotSetRoute,
} from "@/app/api/bot/add_to_user_bot_set/routeSchema";
import {
  OnboardingCompleteRoute,
} from "@/app/api/onboarding/complete/routeSchema";
import {
  AddtoUserSkillSetRoute,
} from "@/app/api/skills/add_to_user_skill_set/routeSchema";
import {useIsDebugMode} from "@/clientOnly/hooks/useIsDebugMode";
import {useSearchParamHelper} from "@/clientOnly/hooks/useQueryParamHelper";
import {DebugOnlyCard} from "@/components/debug/DebugOnlyCard";
import {MainMobileLayout} from "@/components/positioning/MainMobileLayout";
import MobileContentHeader
  from "@/components/positioning/mobile/MobileContentHeader";
import MobileContentMain
  from "@/components/positioning/mobile/MobileContentMain";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {CustomTabPanel} from "@/components/tabs/CustomTab";
import {Txt} from "@/components/typography/Txt";
import {typedUuidV4} from "@lukebechtel/lab-ts-utils";
import {
  ArrowBackIos,
  ArrowForwardIos,
} from "@mui/icons-material";
import {
  Button,
  Grid,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";

import {useUserFeelings} from "../profile/useUserFeelings";
import {GoalsTabContentWrapper} from "./_tabs/goals";
import {
  InterestCard,
  InterestsTabContent,
} from "./_tabs/interests";
import {WelcomeTabContent} from "./_tabs/welcome";

const orderedTabs = [
    {
        value: 'welcome',
        label: 'Welcome',
        sections: [
            {
                value: 'greeting',
                headerText: '👋 Welcome to Reasonote!',
            }
        ]
    },
    {
        value: 'interests',
        label: 'Interests',
    },
    {
        value: 'goals',
        label: 'Goals',
    },
    {
        value: 'finish',
        label: 'Finish',
    },
]

export default function OnboardingPage(){
    const isDebug = useIsDebugMode();
    const {
        value: currentTabValue,
        update: setCurrentTabValue,
    } = useSearchParamHelper('tab', 'welcome');
    const router = useRouter();

    const [selectedInterests, setSelectedInterests] = useState<{name: string, emoji?: string, type?: string}[]>([]);
    const [selectedGoals, setSelectedGoals] = useState<{name: string, emoji?: string, type?: string}[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<{name: string, emoji?: string}[]>([]);

    const {
        updater
    } = useUserFeelings();
    const {sb} = useSupabase();

    const onNext = useCallback(async () => {
        const currentIndex = orderedTabs.findIndex(({value}) => value === currentTabValue);
        if(currentIndex < orderedTabs.length - 1){
            setCurrentTabValue(orderedTabs[currentIndex + 1].value);
        }
        else {
            const addBots = async() => {  
                const bots = selectedInterests.filter((i) => i.type === 'character');
                
                const {data, error} = await sb.from('bot')
                    .insert(bots.map((b) => ({
                        name: b.name,
                        avatar_emoji: b.emoji,
                    })))
                    .select('*');
        
                
                if (!data){
                    return;
                }
                
                const addUserResp = await AddtoUserBotSetRoute.call({
                    addIds: data.map((d) => d.id)
                })
        
                if (addUserResp.error){
                    console.error('Error adding bot to user bot set:', addUserResp.error);
                }
            }

            // We're done!
            // Now, we create all the skills, goals, and interests.
            await Promise.all([
                AddtoUserSkillSetRoute.call({
                    addSkills: selectedSkills,
                }),
                updater(
                    (cur) => [
                        ...(cur ?? []),
                        ...selectedInterests.map((f) => ({
                            id: typedUuidV4('subject'),
                            feeling: 'likes',
                            subject_name: f.name,
                            subject_type: f.type === 'character' ? 'character' : 'interest',
                        }))
                    ]
                ),
                addBots()
            ]);

            await OnboardingCompleteRoute.call({});

            // Don't use router, but set url directly because we need to refresh the page
            // await router.push('/app/foryou?tour=true')
            window.location.href = '/app/foryou?tour=true';
        }
    }, [currentTabValue]);

    const onBack = useCallback(() => {
        const currentIndex = orderedTabs.findIndex(({value}) => value === currentTabValue);
        if(currentIndex > 0){
            setCurrentTabValue(orderedTabs[currentIndex - 1].value);
        }
    }, [currentTabValue]);

    const resolvedTabValue = currentTabValue ?? 'welcome';
    
    return <MainMobileLayout>
        <MobileContentHeader disableBreadcrumb>
            <DebugOnlyCard>
                <Button onClick={() => {
                    setSelectedGoals([]);
                    setSelectedInterests([]);
                    setSelectedSkills([]);
                    setCurrentTabValue('welcome');
                }}>
                    Reset
                </Button>
                <Button onClick={() => {
                    setSelectedGoals([
                        {
                            name: 'I want to start a Learning Management System Company'
                        },
                        {
                            name: 'I want to master Neural Networks'
                        },
                        {
                            name: 'I want to learn how to talk to people better'
                        }
                    ]);

                    setSelectedInterests([
                        {
                            name: 'Startups'
                        },
                        {
                            name: 'Technology',
                        },
                        {
                            name: 'Books',
                        },
                        {
                            name: 'Fantasy Literature'
                        },
                        {
                            name: 'Dungeons and Dragons',
                        },
                        {
                            name: 'Gandalf',
                            type: 'character',
                            emoji: '🧙'
                        }
                    ]);

                    setSelectedSkills([
                        {
                            name: 'Python',
                            emoji: '🐍'
                        },
                        {
                            name: 'Entrepreneurship',
                            emoji: '💼'
                        },
                        {
                            name: 'Public Speaking',
                            emoji: '🗣️'
                        }
                    ]);
                }}>
                    Seed Data
                </Button>
                <Button onClick={() => {
                    setCurrentTabValue('finish');
                }}>
                    Skip to Finish
                </Button>
                <Txt>Number of Goals: {selectedGoals.length}</Txt>
                <Txt>Number of Interests: {selectedInterests.length}</Txt>
                <Txt>Number of Skills: {selectedSkills.length}</Txt>
            </DebugOnlyCard>
            <Stack alignItems={'center'} justifyContent={'center'} gap={2} width={'100%'}>
                <Typography variant={'h5'}>Welcome to Reasonote!</Typography>
                <Stepper activeStep={orderedTabs.findIndex(({value}) => value === currentTabValue)} alternativeLabel sx={{width: '100%'}}>
                    {orderedTabs.map(({label}) => (
                        <Step key={label}>
                            <StepLabel>
                                {label}
                                
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Stack>
        </MobileContentHeader>
        <MobileContentMain>
            <Stack alignItems={'center'} justifyContent={'center'} gap={2}>
                <CustomTabPanel currentValue={resolvedTabValue} value={'welcome'} boxProps={{overflow: 'auto', width: '100%'}} divProps={{style: {width: '100%'}}}>
                    <WelcomeTabContent onNext={() => {setCurrentTabValue('interests')}}/>
                </CustomTabPanel>
                <CustomTabPanel currentValue={resolvedTabValue} value={'interests'} boxProps={{overflow: 'auto', width: '100%'}} divProps={{style: {width: '100%'}}}>
                    <InterestsTabContent 
                        onNext={() => {
                            onNext();
                        }}
                        selectedInterests={selectedInterests}
                        setSelectedInterests={setSelectedInterests}
                    />
                </CustomTabPanel>
                <CustomTabPanel currentValue={resolvedTabValue} value={'goals'} boxProps={{overflow: 'auto', width: '100%'}} divProps={{style: {width: '100%'}}}>
                    <Stack maxHeight={'80vh'} padding={'10px'} gap={2} width="100%">
                        <GoalsTabContentWrapper
                            selectedGoals={selectedGoals}
                            setSelectedGoals={setSelectedGoals}
                            interests={selectedInterests}
                            selectedSkills={selectedSkills}
                            setSelectedSkills={setSelectedSkills}
                            onBack={onBack}
                            onNext={onNext}
                        />            
                    </Stack>
                </CustomTabPanel>
                <CustomTabPanel currentValue={resolvedTabValue} value={'finish'} boxProps={{overflow: 'auto', width: '100%'}} divProps={{style: {width: '100%'}}}>
                    <Stack maxHeight={'80vh'} padding={'10px'} gap={2} width="100%">
                        <Typography variant={'h5'} textAlign={'center'} width={'100%'}>Looks Good To Me!</Typography>
                        <Typography variant={'body1'} textAlign={'center'} width={'100%'}>You're all set up and ready to go. Enjoy your Reasonote experience!</Typography>
                        <Stack flex={'1 1 auto'} overflow={'auto'} gap={1} height={'100%'}>
                            <Typography variant={'h6'} textAlign={'center'} width={'100%'}>Your Interests</Typography>
                            <Grid container gap={1} justifyContent={'start'} height="fit-content">
                                {
                                    selectedInterests.filter((i) => i.type !== 'character').map((i) => {
                                        return <Grid item><InterestCard interest={i} selected={false} onClick={() => {}}/></Grid>
                                    })
                                }
                            </Grid>
                            <Typography variant={'h6'} textAlign={'center'} width={'100%'}>Your Characters</Typography>
                            <Grid container gap={1} justifyContent={'start'} height="fit-content">
                                {
                                    selectedInterests.filter((i) => i.type === 'character').map((i) => {
                                        return <Grid item><InterestCard interest={i} selected={false} onClick={() => {}}/></Grid>
                                    })
                                }
                            </Grid>
                            <Typography variant={'h6'} textAlign={'center'} width={'100%'}>Your Goals</Typography>
                            <Grid container gap={1} justifyContent={'start'} height="fit-content">
                                {
                                    selectedGoals.map((g) => {
                                        return <Grid item><InterestCard interest={g} selected={false} onClick={() => {}}/></Grid>
                                    })
                                }
                            </Grid>
                            <Typography variant={'h6'} textAlign={'center'} width={'100%'}>Your Skills</Typography>
                            <Grid container gap={1} justifyContent={'start'} height="fit-content">
                                {
                                    selectedSkills.map((s) => {
                                        return <Grid item><InterestCard interest={s} selected={false} onClick={() => {}}/></Grid>
                                    })
                                }
                            </Grid>
                        </Stack>
                        <Stack flex={'0 0 auto'} direction={'row'} alignItems={'end'} justifyContent={'space-between'} gap={2}>
                            <Button
                                size="large"
                                onClick={() => {
                                    onBack();
                                }}
                                startIcon={<ArrowBackIos fontSize="small"/>}
                            >
                                Back
                            </Button>
                            <Button
                                size="large"
                                onClick={() => {
                                    onNext();
                                }}
                                variant={'contained'}
                                endIcon={<ArrowForwardIos fontSize="small"/>}
                            >
                                Next
                            </Button>
                        </Stack>            
                    </Stack>
                </CustomTabPanel>
            </Stack>
        </MobileContentMain>
    </MainMobileLayout>
}