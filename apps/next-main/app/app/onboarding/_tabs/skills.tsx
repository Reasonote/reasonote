import {
  useCallback,
  useState,
} from "react";

import _ from "lodash";
import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {SimpleSelectableCard} from "@/components/cards/SimpleSelectableCard";
import {TxtFieldWithAction} from "@/components/textFields/TxtFieldWithAction";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  AddCircle,
  AutoAwesome,
} from "@mui/icons-material";
import {
  Button,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {Goal} from "./goals";

export interface SkillStub {
    name: string;
    emoji?: string;
    type?: string;
}

export interface SkillsTabContentProps {
    selectedSkills: SkillStub[];
    setSelectedSkills: (setter: (old: SkillStub[]) => SkillStub[]) => void;
    interests: SkillStub[];
    goals: Goal[];
}

export function SkillsTabContent({selectedSkills, setSelectedSkills, interests, goals}: SkillsTabContentProps){
    const [suggestedSkills, setSuggestedSkills] = useState<SkillStub[]>([]);
    const [userAddedSkills, setUserAddedSkills] = useState<SkillStub[]>([]);
    const isSmallDevice = useIsSmallDevice();
    const [isSuggesting, setIsSuggesting] = useState<boolean>(false);

    const expandList = useCallback(async () => {
        setIsSuggesting(true);
        try {    
            const modelsToCall = ['gpt-4o-mini'] as const;
            const tempsToUse = [0, .25, .5, .75, 1] as const;

            // Create combinations of models and temps
            const combinations = _.flatten(modelsToCall.map(model => tempsToUse.map(temp => ({model, temp}))));

            await Promise.all(combinations.map(async ({model, temp}) => {
                const resp = await oneShotAIClient({
                    systemMessage: `
                    # Your Role
                    You are responsible for figuring out what skills a user may want to practice, given some information about them.
                    
                    The user will give you their generic interests, their goals, and your aim is to narrow down to a list of skills that they may want to practice based on their interests and goals.
                    
                    You should add NEW items to the FULL_SKILL_LIST, which is a list of all possible interests that the user could have.

                    FINAL NOTES:
                    - Remember, no duplicates
                    - A person is not a skill -- people are included in interests simply because they may add information about what a person may want to practice.
        
                    `,
                    functionName: 'output_skills',
                    functionDescription: 'Outputs your list of skills the user could practice.',
                    functionParameters: z.object({
                        skills: z.array(z.object({emoji: z.string(), name: z.string()})).describe("The list of skills that the user could have."),
                    }),
                    otherMessages: [
                        {
                            role: 'user' as const,
                            content: `
                            <ABOUT_ME>
                                <MY_CHOSEN_GOALS>
                                ${JSON.stringify(goals)}
                                </MY_CHOSEN_GOALS>
                                <MY_CHOSEN_INTERESTS>
                                ${JSON.stringify(interests)}
                                </MY_CHOSEN_INTERESTS>
                                <MY_CHOSEN_SKILLS>
                                ${JSON.stringify(selectedSkills)}
                                </MY_CHOSEN_SKILLS>
                            </ABOUT_ME>
                            `
                        },
                        ...(suggestedSkills.length > 0 ? 
                                [
                                    {
                                        role: 'assistant' as const, 
                                        content: [{
                                            type: 'tool-call' as const,
                                            toolCallId: '1',
                                            toolName: 'output_skills',
                                            args: JSON.stringify({
                                                skills: suggestedSkills
                                            })
                                        }]
                                    },
                                    {
                                        role: 'user' as const,
                                        content: `
                                        Please suggest more!
                                        `
                                    }
                                ]
                                : 
                                []
                        ),
                        {
                            role: 'system' as const,
                            content: `
                            - REMEMBER: DO NOT ADD DUPLICATES TO THE LIST, ONLY ADD NEW SKILLS THAT THE USER MAY WANT TO PRACTICE.
                            `
                        }
                    ].filter(notEmpty),
                    driverConfig: {
                        type: 'openai',
                        config: {
                            model: model,
                            temperature: temp,
                        }
                    }
                })

                if (!resp.success){
                    return null;
                }
                else {
                    // Now, add the specific interests to the list, uniqifying by name
                    setSuggestedSkills((old) => _.uniqBy([...old, ...resp.data.skills], ({name}) => name.toLowerCase().trim()));
                }
            }));
        }
        catch (err: any){
            console.error(err);
        }
        finally {
            setIsSuggesting(false);
        }
    }, [setSuggestedSkills, suggestedSkills, interests, goals, selectedSkills]);


    useAsyncEffect(async () => { 
        await expandList();
    }, []);

    const allSkills = [...suggestedSkills, ...userAddedSkills];

    return <>
        <Stack flex="0 0 auto">
            <Typography  variant={'h5'} textAlign={'center'} width={'100%'}>Your Skills</Typography>
            <Typography variant={'caption'} textAlign={'center'} width={'100%'}>To achieve your goals, Reasonote helps you learn Skills.</Typography>
            <Typography variant={'body1'} textAlign={'center'} width={'100%'}>Select the skills you want to practice below.</Typography>
        </Stack>
        <Grid flex={'1 1 auto'} container gap={1} justifyContent={'start'} overflow={'auto'} height="fit-content">
            {
                allSkills.length < 1 ? 
                    <Skeleton variant="rounded" width="100%" height="100px"/>
                    : allSkills.map((g) => {
                    return <Grid item key={g.name} xs={11.75} height={'fit-content'}>
                        <SimpleSelectableCard title={`${g.emoji ?? ''} ${g.name}`.trim()} selected={selectedSkills.map((g) => g.name).includes(g.name)} 
                            onClick={() => {
                                if(selectedSkills.map((g) => g.name).includes(g.name)){
                                    setSelectedSkills((old) => old.filter((goal) => goal.name !== g.name));
                                } else {
                                    setSelectedSkills((old) => [...old, g]);
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
                        />
                    </Grid>
                })
            }
        </Grid>
        <Stack flex={'0 0 auto'} gap={1} justifyContent={'center'} width={'100%'}>
            <Button 
                fullWidth
                startIcon={<AutoAwesome/>}
                onClick={() => {
                    expandList();
                }}
                disabled={isSuggesting}
            >
                Suggest Some Skills For Me
            </Button>
            <TxtFieldWithAction 
                stackProps={{width:'100%'}}
                fullWidth
                enterTriggersAction
                actionClearsText
                label={'Add your own Skill'}
                placeholder="My New Skill..."
                onAction={(v) => {
                    setUserAddedSkills((old) => [...old, {name: v}]);
                    setSelectedSkills((old) => [...old, {name: v}]);
                }}
                actionIcon={<AddCircle/>}
            />
        </Stack>
    </>
}