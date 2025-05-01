import {useRouter} from "next/navigation";

import {useSearchParamHelper} from "@/clientOnly/hooks/useQueryParamHelper";
import {useReactiveVar} from "@apollo/client";
import {
  Fade,
  Stack,
  useTheme,
} from "@mui/material";

import FYPHeaderContainer from "../FYPHeader/FYPHeader";
import {vFYPIntent} from "../FYPState";
import {
  FYPIntent,
  FYPIntentActivitiesAllowed,
} from "../FYPTypes";
import FYPChooseIntentActivityScreen from "./FYPChooseIntentActivityScreen";
import FYPChooseIntentSkillScreen from "./FYPChooseIntentSkillScreen";

export interface FYPChooseIntentScreenProps {
    onIntentChosen: (intent: FYPIntent) => void;    
}


/**
 * This screen is the first screen that the user sees when they go to the FYP page.
 * 
 * It will show a list of clickable cards, with titles:
 * - Try 
 */
export default function FYPChooseIntentScreen({onIntentChosen}: FYPChooseIntentScreenProps) {
    const theme = useTheme();
    const userIntent = useReactiveVar(vFYPIntent);
    const router = useRouter();
    const {value: tourState} = useSearchParamHelper('tour');

    const onSkillChosen = (intent: FYPIntent) => {
        if (intent.type === 'review-pinned'){
            // TODO: only taking root-most, for now
            const skillId = intent.pinned.skillIdPath[0];

            if (!skillId) {
                console.error('No skillId found in skillIdPath');
                return;
            }

            router.push(`/app/skills/${skillId}?tab=learn`);
        }
        else {
            vFYPIntent(intent);
        }
    }

    const onLessonChosen = (intent: FYPIntent) => {
        vFYPIntent(intent);
    }

    const onActivityTypeChosen = (activitiesAllowed: FYPIntentActivitiesAllowed) => {
        const existingFYPIntent = vFYPIntent();

        if (!existingFYPIntent) {
            return;
        }

        vFYPIntent({
            ...existingFYPIntent,
            activitiesAllowed
        });
    }

    const setIntent = (intent: FYPIntent) => {
        vFYPIntent(intent);
    }

    const showSkillScreen = userIntent === null;
    const pinnedIntent = userIntent?.type === 'review-pinned' ? userIntent : null;


    return <Fade in={true} timeout={theme.transitions.duration.standard}>
        <Stack direction="column" gap={2} maxHeight={'90vh'} marginBottom={'45px'}>
            <Stack>
                {
                    <FYPHeaderContainer
                        intent={userIntent}
                        setIntent={setIntent}
                        onBack={() => {
                            if (userIntent?.type === 'review-pinned'){
                                const skillId = userIntent.pinned.skillIdPath[0];
                                router.push(`/app/skills/${skillId}?tab=learn`);
                            }
                            else {
                                router.push('/app');
                            }
                        }}
                        currentActivity={null}
                        settingsDisabled    
                    /> 
                }
            </Stack>
            {showSkillScreen ? 
                <FYPChooseIntentSkillScreen onIntentChosen={onSkillChosen} />
                :
                <FYPChooseIntentActivityScreen onActivityTypeChosen={onActivityTypeChosen} />
            }
        </Stack>
    </Fade>
}