"use client"
import {
  useCallback,
  useState,
} from "react";

import _ from "lodash";

import {
  InterestsGetGenericInterestListRoute,
} from "@/app/api/interests/get_generic_interest_list/routeSchema";
import {
  InterestsGetSpecificInterestListRoute,
} from "@/app/api/interests/get_specific_interest_list/routeSchema";
import {Btn} from "@/components/buttons/Btn";
import {ActivityIcon} from "@/components/icons/ActivityIcon";
import {SkillIcon} from "@/components/icons/SkillIcon";
import {Txt} from "@/components/typography/Txt";
import {
  ArrowBackIos,
  ArrowForwardIos,
  AutoAwesome,
  CheckBoxOutlineBlank,
  CheckBoxOutlined,
  LocalLibrary,
  Person,
} from "@mui/icons-material";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  Chip,
  Fade,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  useAsyncEffect,
  useAsyncMemo,
} from "@reasonote/lib-utils-frontend";

export function InterestCard({interest, selected, onClick}){
    return <Fade in={true} timeout={300}>
        <div>
        <Chip sx={{height: '40px', paddingX: '1px', borderRadius: '20px'}} size='medium' label={interest.name} avatar={<Avatar sx={{zoom: '1.2'}}>{interest.emoji ?? '⭐️'}</Avatar>} onClick={onClick} color={selected ? 'primary' : 'default'} />
        </div>
    </Fade>
}


export interface Interest {
    name: string;
    emoji?: string;
    type?: string;
}


export function CharacterInterestsTabContent({chosenInterests, setChosenInterests}: {
    chosenInterests: Interest[];
    setChosenInterests: (setter: (old: Interest[]) => Interest[]) => void;
}){
    const [suggestedCharacters, setSuggestedCharacters] = useState<Interest[]>([]);
    const [isSuggestingInterests, setIsSuggestingInterests] = useState(false);

    const characterInterestsSelected = chosenInterests.filter((int) =>  int.type === 'character');

    const expandList = useCallback(async () => {
        if(isSuggestingInterests){
            return;
        }
        try {
            setIsSuggestingInterests(true);

            const modelsToCall = ['fastest'] as const;
            // const tempsToUse = [0, .25, .5, .75, 1] as const;
            const tempsToUse = [1, 1, 1, 1, 1] as const;

            // Create combinations of models and temps
            const combinations = _.flatten(modelsToCall.map(model => tempsToUse.map(temp => ({model, temp}))));

            // Create N chunks of chosenInterests, where N is the number of combinations
            const chunkSize = Math.ceil(chosenInterests.length / combinations.length);
            const chosenInterestChunks = _.chunk(chosenInterests, chunkSize);

            await Promise.all(combinations.map(async ({model, temp}) => {
                const chunk = chosenInterestChunks.shift() ?? [];
                
                
            }));
        }
        catch (e){
            console.error(e);
        }
        finally {
            setIsSuggestingInterests(false);
        }
    }, [chosenInterests, suggestedCharacters, isSuggestingInterests]);

    useAsyncEffect(async () => {
        await expandList();
    }, []);

    return suggestedCharacters === undefined || suggestedCharacters === null || suggestedCharacters.length < 1 ?
        <Skeleton variant="rounded" height="100px" />
        :
        <>
            <Grid flex={'1 1 auto'} container gap={1} justifyContent={'center'} overflow={'auto'} height="fit-content">
                {suggestedCharacters.map(interest => {
                    return <Grid item key={`${interest.emoji}-${interest.name}`}>
                        <InterestCard
                            interest={interest}
                            selected={chosenInterests.map(({name}) => name).includes(interest.name)}
                            onClick={() => {
                                if (chosenInterests.map(({name}) => name).includes(interest.name)){
                                    setChosenInterests((old) => old.filter(x => x.name !== interest.name));
                                }
                                else {
                                    setChosenInterests((old) => [...old, interest]);
                                }
                            }}
                        />
                    </Grid>
                })}
                <Btn 
                    fullWidth
                    startIcon={<AutoAwesome/>}
                    onClick={() => {
                        expandList();
                    }}
                    // disabled={isSuggestingGoals}
                    isWorking={isSuggestingInterests}
                    workingChildren={'Suggesting Characters...'}
                >
                    Suggest More Characters
                </Btn>
            </Grid>
            <Stack flex={'0 0 auto'} gap={2}>
                {
                    characterInterestsSelected.length < 3 ?
                        <Stack alignItems={'center'}>
                            <Txt startIcon={<CheckBoxOutlineBlank/>} variant={'body1'} textAlign={'center'}>TODO: Select at least 3 characters.</Txt>
                        </Stack>
                        :
                        <Stack alignItems={'center'}>
                            <Txt startIcon={<CheckBoxOutlined color="primary"/>} variant={'body1'} textAlign={'center'}><span style={{textDecoration: 'line-through'}}>TODO: Select at least 3 characters.</span></Txt>
                        </Stack>
                }
            </Stack>
        </> 
        
}


export function SpecificInterestsTabContent({chosenInterests, setChosenInterests}: {
    chosenInterests: Interest[];
    setChosenInterests: (setter: (old: Interest[]) => Interest[]) => void;
}){
    const [specificInterests, setSpecificInterests] = useState<Interest[]>([]);
    const [isSuggestingInterests, setIsSuggestingInterests] = useState(false);

    const specificInterestsSelected = chosenInterests.filter((int) =>  int.type === 'specific');

    const expandList = useCallback(async () => {
        if(isSuggestingInterests){
            return;
        }
        try {
            setIsSuggestingInterests(true);
            const modelsToCall = ['fastest'] as const;
            const tempsToUse = [0, .25, .5, .75, 1] as const;

            // Create combinations of models and temps
            const combinations = _.flatten(modelsToCall.map(model => tempsToUse.map(temp => ({model, temp}))));

            await Promise.all(combinations.map(async ({model, temp}) => {
                const resp = await InterestsGetSpecificInterestListRoute.call({
                    fullListOfInterests: specificInterests,
                    userSelectedInterests: _.uniqBy([
                        ...chosenInterests,
                    ], ({name}) => name.toLowerCase().trim()),
                    driverConfig: {
                        type: 'openai',
                        config: {
                            model: model,
                            temperature: temp,
                        }
                    }
                });

                if (!resp.success){
                    return null;
                }
                else {
                    // If the interest is already in our chosen interests, don't add it
                    const newInterestsFiltered = resp.data.interests
                        .filter((int) => !chosenInterests.map(({name}) => name).includes(int.name))
                        .map((int) => ({...int, type: 'specific'}));


                    // Now, add the specific interests to the list, uniqifying by name
                    setSpecificInterests((old) => _.uniqBy([...old, ...newInterestsFiltered], ({name}) => name.toLowerCase().trim()));
                }
            }));
        }
        catch (e){
            console.error(e);
        }
        finally {
            setIsSuggestingInterests(false);
        }
    }, [chosenInterests, specificInterests, isSuggestingInterests]);

    useAsyncEffect(async () => {
        await expandList();
    }, []);

    return <>
        <Grid flex={'1 1 auto'} container gap={1} justifyContent={'center'} overflow={'auto'} height="fit-content">
            {
                specificInterests.length < 1 ?
                    _.range(0, 10).map((i) => {
                        return <Grid item key={i}>
                            <Skeleton variant="rounded">
                                <InterestCard interest={{name: 'Loading...'}} selected={false} onClick={() => {}} />
                            </Skeleton>
                        </Grid>
                    })
                    :
                    <>
                        {
                            specificInterests.map(interest => {
                                return <Grid item key={`${interest.emoji}-${interest.name}`}>
                                    <InterestCard
                                        interest={interest}
                                        selected={chosenInterests.map(({name}) => name).includes(interest.name)}
                                        onClick={() => {
                                            if (chosenInterests.map(({name}) => name).includes(interest.name)){
                                                setChosenInterests((old) => old.filter(x => x.name !== interest.name));
                                            }
                                            else {
                                                setChosenInterests((old) => [...old, interest]);
                                            }
                                        }}
                                    />
                                </Grid>
                            })
                        }
                        <Btn 
                            fullWidth
                            startIcon={<AutoAwesome/>}
                            onClick={() => {
                                expandList();
                            }}
                            // disabled={isSuggestingGoals}
                            isWorking={isSuggestingInterests}
                            workingChildren={'Suggesting Interests...'}
                        >
                            Suggest More Interests 
                        </Btn>
                    </>
                    

            }
        </Grid>
        <Stack flex={'0 0 auto'} gap={2}>
            {
                specificInterestsSelected.length < 3 ?
                    <Stack alignItems={'center'}>
                        <Txt startIcon={<CheckBoxOutlineBlank/>} variant={'body1'} textAlign={'center'}>TODO: Select at least 3 specific interests.</Txt>
                    </Stack>
                    :
                    <Stack alignItems={'center'}>
                        <Txt startIcon={<CheckBoxOutlined color="primary"/>} variant={'body1'} textAlign={'center'}><span style={{textDecoration: 'line-through'}}>TODO: Select at least 3 specific interests.</span></Txt>
                    </Stack>
            }
        </Stack>
    </>
}

export function GenericInterestsTabContent({onNext, selectedInterests, setSelectedInterests, interests}: {
    onNext: () => void;
    selectedInterests: Interest[];
    setSelectedInterests: SetterFunction<Interest[]>;
    interests: Interest[];
}){
    if (interests === undefined){
        return <Skeleton variant="rounded" height="100px" />
    }
    return <Grid flex={'1 1 auto'} container gap={1} justifyContent={'center'} overflow={'auto'} height="fit-content">
            {interests.map(interest => {
                return <Grid item key={`${interest.emoji}-${interest.name}`}>
                    <InterestCard
                        interest={interest}
                        selected={selectedInterests.map(({name}) => name).includes(interest.name)}
                        onClick={() => {
                            if (selectedInterests.map(({name}) => name).includes(interest.name)){
                                setSelectedInterests((old) => old.filter(x => x.name !== interest.name));
                            }
                            else {
                                setSelectedInterests((old) => [...old, interest]);
                            }
                        }}
                    />
                </Grid>
            })}
        </Grid>
}

export type SetterFunction<T> = (setter: (old: T) => T) => void;

export interface InterestsTabContentProps {
    onNext: (interests: Interest[]) => void;
    selectedInterests: Interest[];
    setSelectedInterests: SetterFunction<Interest[]>;
}


const subscreensInOrder = [
    {
        value: 'intro',
        header: <Stack>
            <Typography variant={'h5'} textAlign={'center'}>What Are You Interested In?</Typography>
        </Stack>,
    },
    {
        value: 'generic',
        header: <Stack>
            <Typography variant={'h5'} textAlign={'center'}>What Are You Interested In?</Typography>
            <Typography variant={"caption"} textAlign={'center'}>Reasonote uses this to customize your experience.</Typography>
        </Stack>
    },
    {
        value: 'specific',
        header: <Stack>
            <Typography variant={'h5'} textAlign={'center'}>Let's Get a Little More Specific...</Typography>
            <Typography variant={"caption"} textAlign={'center'}>Based on what we know so far, we think you might like these things. Are we right?</Typography>
        </Stack>
    },
    {
        value: 'characters',
        header: <Stack>
            <Typography variant={'h5'} textAlign={'center'}>Build Your Team</Typography>
            <Typography variant={"body2"} textAlign={'center'}>Reasonote helps you learn by connecting you with interesting people <br/>from our world, and others.</Typography>
        </Stack>
    },
]

export function InterestsTabContent({onNext, selectedInterests, setSelectedInterests}: InterestsTabContentProps){
    const [screenShowing, setScreenShowing] = useState('intro');
    
    const interests = useAsyncMemo(async () => {
        const resp = await InterestsGetGenericInterestListRoute.call({})

        if (!resp.success){
            return [{
                emoji: '❌',
                name: 'Error loading interests',
            }];
        }
        else {
            return _.uniqBy(resp.data.interests, ({name}) => name);
        }
    }, []);

    const onBack = useCallback(() => {
        const currentSubscreenIdx = subscreensInOrder.findIndex(({value}) => value === screenShowing);

        if (currentSubscreenIdx === 0){
            // Do nothing
        }
        else {
            setScreenShowing(subscreensInOrder[currentSubscreenIdx - 1].value);
        }
    }, [screenShowing, selectedInterests, onNext]);

    const onNextCb = useCallback(() => {
        // if (screenShowing === 'generic'){
        //     setScreenShowing('specific');
        // }
        // else if (screenShowing === 'specific'){
        //     setScreenShowing('characters');
        // }
        // else if (screenShowing === 'characters'){
        //     onNext(selectedInterests);
        // }
        const currentSubscreenIdx = subscreensInOrder.findIndex(({value}) => value === screenShowing);

        if (currentSubscreenIdx === subscreensInOrder.length - 1){
            onNext(selectedInterests);
        }
        else {
            setScreenShowing(subscreensInOrder[currentSubscreenIdx + 1].value);
        }
    }, [selectedInterests, onNext, screenShowing]);

    const subscreen = subscreensInOrder.find(({value}) => value === screenShowing);

    /**
     * 
     * <Typography variant={'h5'} textAlign={'center'}>Let's Get a Little More Specific...</Typography>
     *         <Stack>
            <Typography variant={'h5'} textAlign={'center'}>What Are You Interested In?</Typography>
            <Typography variant={"caption"} textAlign={'center'}>Reasonote uses this to customize your experience.</Typography>
        </Stack>
     * 
     */

    return <Stack maxHeight={'80vh'} padding={'10px'} width={"100%"} gap={2}>
        {subscreen?.header}
        {
            interests === undefined ? 'Loading...'
                :
                    screenShowing === 'intro' ? 
                        <Stack justifyContent={'center'} height={'60vh'} gap={2}>
                            <Fade in={true} timeout={300}>
                                <Card elevation={20}>
                                    <CardContent>
                                        <Fade in={true} timeout={500}>
                                            <Typography variant={'h5'}>⭐️ Interests In Reasonote</Typography>
                                        </Fade>
                                        <br/>
                                        <Fade in={true} timeout={800}>
                                            <Typography variant={'body1'}>In Reasonote, <b><i>everything</i> is adjusted to fit your unique interests and preferences.</b></Typography>
                                        </Fade>
                                        <br/>
                                        <Fade in={true} timeout={1000}>
                                        <Typography variant={'body1'}>We use your interests to generate:</Typography>
                                        </Fade>
                                        <br/>
                                        <Fade in={true} timeout={{
                                            appear: 1000,
                                            enter: 1000
                                        }}>
                                        <Stack paddingLeft={'30px'} gap={1}>
                                            <Typography><SkillIcon fontSize="inherit"/> <b>Skills</b> to target</Typography>
                                            <Typography><ActivityIcon fontSize="inherit"/> <b>Activities</b> to practice</Typography>
                                            <Typography><LocalLibrary fontSize="inherit"/> <b>Lessons</b> to learn through</Typography>
                                            <Typography><Person fontSize="inherit"/> <b>Characters</b> to talk to</Typography>
                                        </Stack>
                                        </Fade>
                                        
                                    </CardContent>
                                </Card>
                            </Fade>
                        </Stack>
                        :
                    screenShowing === 'generic' ? 
                        <GenericInterestsTabContent 
                            onNext={() => {setScreenShowing('specific')}} 
                            selectedInterests={selectedInterests} 
                            setSelectedInterests={setSelectedInterests} 
                            interests={interests} 
                        />
                        :
                        screenShowing === 'specific' ?
                            <SpecificInterestsTabContent
                                chosenInterests={selectedInterests}
                                setChosenInterests={setSelectedInterests}
                            />
                            :
                            <CharacterInterestsTabContent
                                chosenInterests={selectedInterests}
                                setChosenInterests={setSelectedInterests}
                            />
        }
        {/* The bottom confirm button should never shrink */}
        <Stack flex={'0 0 auto'} gap={2}>
            {
                subscreen?.value === 'generic' ?
                    selectedInterests.length < 3 ? 
                        <Stack alignItems={'center'}>
                            <Txt startIcon={<CheckBoxOutlineBlank/>} variant={'body1'} textAlign={'center'}>TODO: Select at least 3 interests.</Txt>
                        </Stack>
                        :
                        <Stack alignItems={'center'}>
                            <Txt startIcon={<CheckBoxOutlined color="primary"/>} variant={'body1'} textAlign={'center'}><span style={{textDecoration: 'line-through'}}>TODO: Select at least 3 interests.</span></Txt>
                        </Stack>
                    : 
                    null
            }
            <Stack direction={'row'} gap={2} justifyContent={'space-between'}>
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
                        onNextCb();
                    }}
                    variant={'contained'}
                    endIcon={<ArrowForwardIos fontSize="small"/>}
                    disabled={
                        subscreen?.value === 'generic' ?
                            selectedInterests.length < 3
                            :
                            false
                    }
                >
                    Next
                </Button>
            </Stack>
        </Stack>
    </Stack>
}