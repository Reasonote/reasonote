import {useUserSkills} from "@/clientOnly/hooks/useUserSkills";
import {
  NarrativeActivityTypeClient,
} from "@/components/activity/activities/NarrativeActivity/client";
import {
  ActivityTypeIndicatorChip,
} from "@/components/activity/ActivityTypeIndicator";
import {CurUserAvatar} from "@/components/users/profile/CurUserAvatar";

import {
  Abc,
  School,
  TheaterComedy,
} from "@mui/icons-material";
import {
  Divider,
  Fade,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import {FYPIntentActivitiesAllowed} from "../FYPTypes";
import {FYPChooseIntentScreenCard} from "./FYPChooseIntentScreenCard";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

interface FYPChooseIntentActivityScreenProps {
    onActivityTypeChosen: (activitiesAllowed: FYPIntentActivitiesAllowed) => void;
}

export function FYPChooseIntentActivityTypeChip({activityType}: {activityType: string}){
    const isSmallDevice = useIsSmallDevice();

    return <ActivityTypeIndicatorChip 
        chipProps={{
            color: 'primary',
            size: isSmallDevice ? 'small' : 'medium'
        }}
        typographyProps={{
            fontSize: isSmallDevice ? 'small' : 'medium',
            sx: {
                fontSize: isSmallDevice ? 'small' : 'medium',
            }
        }}
        iconProps={{
            fontSize: isSmallDevice ? 'small' : 'medium',
        }}
        activityType={activityType}/>
}

export function FYPchooseIntentActivityTypeList({activityTypes}: {activityTypes: string[]}){
    return <Grid container gap={1} gridAutoFlow={'row'}>
        {activityTypes.map((activityType) => {
            return <Grid item><FYPChooseIntentActivityTypeChip activityType={activityType}/></Grid>
        })}
    </Grid>
}

export default function FYPChooseIntentActivityScreen({onActivityTypeChosen}: FYPChooseIntentActivityScreenProps){
    const theme = useTheme();
    const userSkills = useUserSkills();

    return <Stack gap={2}>
        {<Fade in={true} timeout={theme.transitions.duration.standard}><Typography color="#FFFFFF" textAlign={'center'}>How do you want to learn? 🌱 </Typography></Fade>}
        <Fade in={true} timeout={theme.transitions.duration.complex}>
        <Stack gap={2}>
        <FYPChooseIntentScreenCard
            title="For You"
            avatar={<CurUserAvatar/>}
            subtitle="We'll choose the activities that we think fit you best."
            onClick={() => {
                onActivityTypeChosen({
                    type: 'allowAll'
                })
            }}
            cardProps={{
                elevation: 20,
                //@ts-ignore
                'data-testid': 'fyp-choose-intent-screen-card-for-you',
                sx: {
                    backgroundColor: theme.palette.gray.dark,
                    '&:hover': {
                        backgroundColor: theme.palette.primary.main,
                    },
                    transition: "background-color 0.5s ease"
                }
                // sx: {backgroundColor: theme.palette.primary.main}}
            }}
        />

        <Divider />

        <Typography variant="body1" color="#FFF" textAlign={'center'}> Or choose your own blend of activities...</Typography>
        <FYPChooseIntentScreenCard
            title="Basic Blend"
            avatar={<Abc/>}
            subtitle={
                <Stack gap={1} direction={'column'}>
                    <Typography variant="body2">A normal selection of common learning activities.</Typography>
                    <FYPchooseIntentActivityTypeList activityTypes={['flashcard', 'multiple-choice', 'fill-in-the-blank']}/>
                </Stack>
            }
            onClick={() => {
                onActivityTypeChosen({
                    type: 'allowOnly',
                    allowedActivityTypes: ['flashcard', 'multiple-choice', 'fill-in-the-blank']
                })
            }}
            cardProps={{
                elevation: 20,
                //@ts-ignore
                'data-testid': 'fyp-choose-intent-screen-card-basic',
                sx: {
                    backgroundColor: theme.palette.gray.dark,
                    '&:hover': {
                        backgroundColor: theme.palette.primary.main,
                    },
                    transition: "background-color 0.5s ease"
                }
                // sx: {backgroundColor: theme.palette.primary.main}}
            }}
        />
        <FYPChooseIntentScreenCard
            title="Roleplay Blend"
            avatar={<TheaterComedy/>}
            subtitle={<Stack gap={1} direction={'column'}>
                <Typography variant="body2">A selection of activities that involve roleplay.</Typography>
                <FYPchooseIntentActivityTypeList activityTypes={['teach-the-ai', 'roleplay']}/>
            </Stack>}
            onClick={() => {
                onActivityTypeChosen({
                    type: 'allowOnly',
                    allowedActivityTypes: ['teach-the-ai', 'roleplay']
                })
            }}
            cardProps={{
                elevation: 20,
                //@ts-ignore
                'data-testid': 'fyp-choose-intent-screen-card-roleplay',
                sx: {
                    backgroundColor: theme.palette.gray.dark,
                    '&:hover': {
                        backgroundColor: theme.palette.primary.main,
                    },
                    transition: "background-color 0.5s ease"
                }
                // sx: {backgroundColor: theme.palette.primary.main}}
            }}
        />
        <FYPChooseIntentScreenCard
            title="Teach the AI"
            avatar={<School/>}
            subtitle={
                <Stack gap={1} direction={'column'}>
                    <Typography variant="body2"><i>"The best way to learn is to teach" - Anonymous</i></Typography>
                    <FYPchooseIntentActivityTypeList activityTypes={['teach-the-ai']}/>
                </Stack>
            }
            onClick={() => {
                onActivityTypeChosen({
                    type: 'allowOnly',
                    allowedActivityTypes: ['teach-the-ai']
                })
            }}
            cardProps={{
                elevation: 20,
                //@ts-ignore
                'data-testid': 'fyp-choose-intent-screen-card-teach-the-ai',
                sx: {
                    backgroundColor: theme.palette.gray.dark,
                    '&:hover': {
                        backgroundColor: theme.palette.primary.main,
                    },
                    transition: "background-color 0.5s ease"
                }
                // sx: {backgroundColor: theme.palette.primary.main}}
            }}
        />
        {/* <FYPChooseIntentScreenCard
            title="Narrative"
            avatar={<NarrativeActivityTypeClient.renderTypeIcon/>}
            subtitle={
                <Stack gap={1} direction={'column'}>
                    <Typography variant="body2"><i>"A story, always a story" - Anonymous</i></Typography>
                    <FYPchooseIntentActivityTypeList activityTypes={['narrative']}/>
                </Stack>
            }
            onClick={() => {
                onActivityTypeChosen({
                    type: 'allowOnly',
                    allowedActivityTypes: ['narrative']
                })
            }}
            cardProps={{
                elevation: 20,
                //@ts-ignore
                'data-testid': 'fyp-choose-intent-screen-card-narrative',
                sx: {
                    backgroundColor: theme.palette.gray.dark,
                    '&:hover': {
                        backgroundColor: theme.palette.primary.main,
                    },
                    transition: "background-color 0.5s ease"
                }
                // sx: {backgroundColor: theme.palette.primary.main}}
            }}
        /> */}
        </Stack>
    </Fade>
    </Stack>
}