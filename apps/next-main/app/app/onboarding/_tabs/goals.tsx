import {
  useCallback,
  useState,
} from "react";

import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {Btn} from "@/components/buttons/Btn";
import {SimpleSelectableCard} from "@/components/cards/SimpleSelectableCard";
import {SkillIcon} from "@/components/icons/SkillIcon";
import {TxtFieldWithAction} from "@/components/textFields/TxtFieldWithAction";
import {
  AddCircle,
  ArrowBackIos,
  ArrowForwardIos,
  AutoAwesome,
  Delete,
} from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  Fade,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {Interest} from "./interests";
import {
  SkillsTabContent,
  SkillStub,
} from "./skills";

export interface Goal {
    name: string;
    emoji?: string;
    type?: string;
}

export interface GoalsTabContentProps {
    selectedGoals: Goal[];
    setSelectedGoals: (setter: (old: Goal[]) => Goal[]) => void;
    interests: Interest[];
    selectedSkills: SkillStub[];
    setSelectedSkills: (setter: (old: SkillStub[]) => SkillStub[]) => void;
    onNext?: () => void;
    onBack?: () => void;
}

export function GoalsTabContent({selectedGoals, setSelectedGoals, interests}: GoalsTabContentProps){
    const [suggestedGoals, setSuggestedGoals] = useState<Goal[]>([]);
    const [userAddedGoals, setUserAddedGoals] = useState<Goal[]>([]);
    const [isSuggestingGoals, setIsSuggestingGoals] = useState<boolean>(false);

    const suggestGoals = useCallback(async () => {
        if (isSuggestingGoals){
            return;
        }
        try {
            setIsSuggestingGoals(true);
            const resp = await oneShotAIClient({
                systemMessage: `
                <YOUR_ROLE>
                You are responsible for suggesting more goals to the user.
    
                You should not output duplicate goals.
    
                All goals should look like
                "I want to..."
                or 
                "I'd like to ..."
    
                </YOUR_ROLE>
                `,
                functionName: 'output_suggested_goals',
                functionDescription: 'Suggest goals to the user based on their interests and existing goals.',
                functionParameters: z.object({
                    suggestedNewGoals: z.array(z.object({
                        name: z.string().describe('The name of the goal to suggest, starting with "I want to" or "I\'d like to"'),
                        emoji: z.string().describe('The emoji to use for the goal'),
                    })),
                }),
                otherMessages: [
                    {
                        role: 'user',
                        content: `
                        <ABOUT_ME>
                            <MY_INTERESTS>
                                ${interests.filter((i) => i.type !== 'character').map((i) => `- ${i.emoji ?? ''} ${i.name}`).join('\n')}
                            </MY_INTERESTS>
                            <MY_CHARACTERS>
                                ${interests.filter((i) => i.type === 'character').map((g) => `- ${g.emoji ?? ''} ${g.name}`).join('\n')}
                            </MY_CHARACTERS>
                            <MY_GOALS_SO_FAR>
                                ${userAddedGoals.map((g) => `- ${g.emoji ?? ''} ${g.name}`).join('\n')}
                            </MY_GOALS>
                        </ABOUT_ME>
                        `
                    },
                    {
                        role: 'assistant',
                        content: `
                        <SUGGESTED_GOALS>
                            ${suggestedGoals.map((g) => `- ${g.emoji ?? ''} ${g.name}`).join('\n')}
                        </SUGGESTED_GOALS>
                        `
                    },
                    {
                        role: 'user',
                        content: `
                        Can you suggest more please?
                        `
                    }
                ]
            })

            const suggestedNewGoals = resp.data?.suggestedNewGoals;

            if (suggestedNewGoals){
                setSuggestedGoals((old) => [...old, ...suggestedNewGoals]);
            }
            else {
                console.error('No suggested goals');
            }
        }
        catch{

        }
        finally {
            setIsSuggestingGoals(false);
        }


    }, [userAddedGoals, suggestedGoals, interests, isSuggestingGoals]);

    useAsyncEffect(async () => {
        if (suggestedGoals.length < 1){
            await suggestGoals();
        }
    }, []);


    const allGoals = [...suggestedGoals, ...userAddedGoals];
    const [isTyping, setIsTyping] = useState<boolean>(false);

    return <>
        <Stack flex="0 0 auto">
            <Typography  variant={'h5'} textAlign={'center'} width={'100%'}>Your Goals</Typography>
            <Typography variant={'body1'} textAlign={'center'} width={'100%'}>Select some goals that you'd like to work towards.</Typography>
        </Stack>
        <Grid flex={'1 1 auto'} container gap={1} justifyContent={'start'} overflow={'auto'} height="fit-content">
            {
                allGoals.map((g) => {
                    return <Grid item key={g.name} xs={11.75} height={'fit-content'}>
                        <SimpleSelectableCard
                            title={`${g.emoji ?? ''} ${g.name}`.trim()}
                            selected={selectedGoals.map((g) => g.name).includes(g.name)} 
                            onClick={() => {
                                if(selectedGoals.map((g) => g.name).includes(g.name)){
                                    setSelectedGoals((old) => old.filter((goal) => goal.name !== g.name));
                                } else {
                                    setSelectedGoals((old) => [...old, g]);
                                }
                            }}
                            slotProps={{
                                cardActionArea: {
                                    sx: {padding: '5px', borderRadius: '5px'},
                                },
                                cardProps: {
                                    sx: {padding: '0px', borderRadius: '5px'},
                                }
                            }}
                            endItem={
                                <IconButton
                                    onClick={(ev) => {
                                        ev.stopPropagation();
                                        setSuggestedGoals((old) => old.filter((goal) => goal.name !== g.name));
                                        setUserAddedGoals((old) => old.filter((goal) => goal.name !== g.name));
                                        setSelectedGoals((old) => old.filter((goal) => goal.name !== g.name));
                                    }}
                                >
                                    <Delete/>
                                </IconButton>
                            }          
                        />
                    </Grid>
                })
            }
            <Btn 
                fullWidth
                startIcon={<AutoAwesome/>}
                onClick={() => {
                    suggestGoals();
                }}
                // disabled={isSuggestingGoals}
                isWorking={isSuggestingGoals}
                workingChildren={'Suggesting Goals...'}
            >
                Suggest Some Goals For Me
            </Btn>
        </Grid>
        <Stack flex={'0 0 auto'} gap={1} justifyContent={'center'} width={'100%'}>
            <Typography 
                variant={'body2'}
                width={'100%'}
                sx={{opacity: isTyping ? 1 : 0}}
                fontStyle={'italic'}
            >TIP: Goals can be <i>anything</i>, but make sure they're things you really want to do.</Typography>
            <TxtFieldWithAction 
                stackProps={{width:'100%'}}
                fullWidth
                enterTriggersAction
                actionClearsText
                onSelect={() => {
                    setIsTyping(true);
                }}
                onBlur={() => {
                    setIsTyping(false);
                
                }}
                label={'Add your own goal'}
                placeholder="I want to..."
                onAction={(v) => {
                    setUserAddedGoals((old) => [...old, {name: v}]);
                    setSelectedGoals((old) => [...old, {name: v}]);
                }}
                actionIcon={<AddCircle/>}
            />
        </Stack>
    </>
}

export function IntroTabContent(props: GoalsTabContentProps){
    return <Stack justifyContent={'center'} height={'60vh'} gap={2}>
        <Fade in={true} timeout={100}>
            <Card elevation={20}>
                <CardContent>
                    <Fade in={true} timeout={100}>
                        <Typography variant={'h5'}>⭐️ Goals In Reasonote</Typography>
                    </Fade>
                    <br/>
                    <Fade in={true} timeout={200}>
                        <Typography variant={'body1'}>Ok, we know a little about about who you are now;</Typography>
                    </Fade>
                    <br/>
                    <Fade in={true} timeout={300}>
                        <Typography variant={'body1'}>...but we also care about <b><i>who you want to become.</i></b></Typography>
                    </Fade>
                    <br/>
                    <Fade in={true} timeout={400}>
                        <div>
                            <Typography variant={'h6'}>Next, We'll ask you a few questions about your goals.</Typography>
                            <br/>
                            <Typography variant={"h6"}>...then we'll use those to help you generate some <Typography><SkillIcon fontSize="inherit"/> <b>Skills</b></Typography></Typography>
                        </div>
                    </Fade>
                </CardContent>
            </Card>
        </Fade>
    </Stack>
}

export function GoalsTabContentWrapper(props: GoalsTabContentProps){
    const [substage, setSubstage] = useState<'intro' | 'goals' | 'skills'>('intro');

    return <>
        {
            substage === 'intro' ? 
                <IntroTabContent {...props}/>
                :
                substage === 'goals' ? 
                <GoalsTabContent {...props}/>
                :
                <SkillsTabContent selectedSkills={props.selectedSkills} setSelectedSkills={props.setSelectedSkills} interests={props.interests} goals={
                    props.selectedGoals
                }/>  
        }
        <Stack flex={'0 0 auto'} direction={'row'} alignItems={'end'} justifyContent={'space-between'} gap={2}>
            <Button
                size="large"
                onClick={() => {
                    if (substage === 'intro'){
                        props.onBack?.();
                    }
                    else if (substage === 'goals'){
                        setSubstage('intro');
                    } else {
                        setSubstage('goals');
                    }
                }}
                startIcon={<ArrowBackIos fontSize="small"/>}
            >
                Back
            </Button>
            <Button
                size="large"
                onClick={() => {
                    if (substage === 'intro'){
                        setSubstage('goals');
                    }
                    else if (substage === 'goals'){
                        setSubstage('skills');
                    } else {
                        props.onNext?.();
                    }
                }}
                variant={'contained'}
                endIcon={<ArrowForwardIos fontSize="small"/>}
            >
                Next
            </Button>
        </Stack>
    </>
}