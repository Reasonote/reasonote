import {useSearchParamHelper} from "@/clientOnly/hooks/useQueryParamHelper";
import { useTheme } from "@mui/material";

import {ClientTour} from "./ClientTour";

export function AppTours(){
    const theme = useTheme();
    const {value: tourState, update: setTourState} = useSearchParamHelper('tour');
    // const url = window.location.pathname;
    // // If the url looks like this: /app/skills/[SKILL_ID]
    // // Get the skill id
    // const skillId = url.split('/').pop();
    // const skillRes = useSkillFlatFragLoader(skillId?.startsWith('skill_') ? skillId : null);
    // const skillName = skillRes.data ? skillRes.data.name : 'this Skill';

    const steps = 
        tourState === 'pick-skill' ? [
            {
                selector: '.fyp-choose-intent-screen-skill-card-group',
                content: 'Click on a skill.',
            }
        ]
        // :
        // tourState === 'pick-lesson' ? [
        //     {
        //         selector: '',
        //         content: <Stack padding={'10px'}>
        //             <Typography variant="body1">
        //                 Now we're making some lessons,<br/>
        //                 <i>just for you.</i>
        //             </Typography>
        //         </Stack>,
        //     },
        //     {
        //         selector: '.skill-lesson-generate-button',
        //         content: <Stack padding={'10px'}>
        //             <Typography variant="body1">You can also generate your own lessons for this skill, by clicking here.</Typography>
        //         </Stack>,
        //     },
        //     {
        //         selector: '',
        //         content: <Stack padding={'10px'}>
        //             <Typography variant="body2">😇 That's all for now!</Typography>
        //             <br/>
        //             <Typography variant={"body1"}>Try out one of your lessons!</Typography>
        //             <br/>
        //             <Button 
        //                 onClick={() => {
        //                     setTourState(null);
        //                 }}
        //                 variant="contained"
        //             >
        //                 👍 Got it!
        //             </Button>
        //         </Stack>,
        //     }
        // ]
        // :
        // tourState === 'skill-calibration' ? [
        //     {
        //         selector: '.skill-body',
        //         content: `Welcome to your homepage for ${skillName}!`,
        //     },
        //     {
        //         selector: '.skill-body',
        //         content: `This is where you can learn, practice, track your progress, and explore this skill.`,
        //     },
        //     {
        //         selector: '.skill-body',
        //         content: `To get started, let's learn some more about why you're interested in learning this skill, and what you already know.`,
        //     }
        // ]
        :
        [];
 
    return steps.length > 0
        ?
        <ClientTour
            steps={steps}
            isOpen={true}
            onRequestClose={() => {
                setTourState(null);
            }}
            accentColor={theme.palette.info.dark}
        />
        :
        null;
}