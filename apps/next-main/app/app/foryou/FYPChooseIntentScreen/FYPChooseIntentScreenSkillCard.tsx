import {
  GetSubskillsDirectRoute,
} from "@/app/api/skills/get_subskills_direct/routeSchema";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useToken} from "@/clientOnly/hooks/useToken";
import {SkillFullIcon} from "@/components/skill/SkillAvatar";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {useApolloClient} from "@apollo/client";
import {
  CardProps,
  Stack,
  Typography,
} from "@mui/material";
import {Skill} from "@reasonote/lib-sdk-apollo-client";
import {useAsyncMemo} from "@reasonote/lib-utils-frontend";

import {FYPIntent} from "../FYPTypes";
import {FYPChooseIntentScreenCard} from "./FYPChooseIntentScreenCard";

export interface FYPChooseIntentScreenSkillCardProps {
    skill: Partial<Skill>;
    onIntentChosen: (intent: FYPIntent) => void;
    cardProps?: CardProps;
}

export function FYPChooseIntentScreenSkillCard({skill, onIntentChosen, cardProps}: FYPChooseIntentScreenSkillCardProps){
    const {supabase: sb} = useSupabase();
    const userId = useRsnUserId();
    const {token} = useToken();
    const ac = useApolloClient();

    const subskills = useAsyncMemo(async () => {
        if (skill.id && userId && token){
            const subskillsDirectResult = (await GetSubskillsDirectRoute.call({
                skill: {
                    id: skill.id
                },
            }));

            return subskillsDirectResult.data;
        }
    }, [skill.id, userId, token]);

    return <FYPChooseIntentScreenCard
        variant="v0"
        title={<Stack justifyContent={'space-between'} alignItems={'center'} direction={'row'} gap={1} width={'100%'}>
            <Typography variant="h6">{skill.name}</Typography>
            {/* {skill.id ? <SkillStreakChip skillId={skill.id} noStreakColor="gray" noStreakLabel={"No Streak"}/> : null} */}
        </Stack>}
        // subtitle={<Stack gap={1}>
        //     {skill.description && skill.description.trim().length > 0 && <Typography>{skill.description}</Typography>}
        //     <Typography fontStyle={'italic'} variant="caption">{subskills?.slice(0,5).map((subsk) => {
        //         return subsk.skill_name
        //     }).join(', ')}</Typography>
        // </Stack>}
        avatar={<SkillFullIcon skillId={skill.id ?? ''} />}
        onClick={() => {
            if (skill.id){
                onIntentChosen({
                    type: 'review-pinned',
                    pinned: {
                    skillIdPath: [skill.id]
                }})
            }
            else {
                console.error("Skill has no id")
                onIntentChosen({type: 'review-all'})
            }
        }}
        cardProps={{
            ...cardProps,
        }}
    />
}