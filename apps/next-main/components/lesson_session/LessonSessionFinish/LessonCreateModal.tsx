
// TODO: now, we want to create a lesson based on this skill.
// this encompasses two things:
// 1. Pop a modal to ask the user to add a "summary" of the lesson they'd like to study.
// 2. Create the lesson with the skill as the name, and the summary as the description.

import {useState} from "react";

import {useRsnClient} from "@/clientOnly/sdk/RsnClientContext";
import {BaseCallout} from "@/components/cards/BaseCallout";
import {SkillChip} from "@/components/chips/SkillChip/SkillChip";
import CenterPaperStack from "@/components/positioning/FullCenterPaperStack";
import {Txt} from "@/components/typography/Txt";

import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  AutoAwesome,
  Info,
  OpenInNew,
} from "@mui/icons-material";
import {
  Button,
  Divider,
  Modal,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import {Stack, useTheme} from "@mui/system";
import {useSkillFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";
import {
  useAsyncEffect,
  useAsyncMemo,
} from "@reasonote/lib-utils-frontend";

// 3. Navigate them to the `/lesson/${lessonId}/new_session` page.
export function LessonCreateModal({skillId, isShowing, onClose, onSubmit}: {skillId: string, isShowing: boolean, onClose: () => void, onSubmit: (submitArgs: {name: string, summary: string}) => void}){
    const theme = useTheme();
    const skill = useSkillFlatFragLoader(skillId);

    const rsn = useRsnClient();

    const [lessonName, setLessonName] = useState<string>('');
    const [lessonDetails, setLessonDetails] = useState<string>('');

    const skillContextStr = useAsyncMemo(async () => {
        const skillIdPath = skill.data?.generatedFromSkillPath ?? skill.data?.id ? [skill.data.id] : undefined;
            
        if (skillIdPath){
            const aiCtx = await rsn.skill.getSkillPathAiContext({ids: skillIdPath.filter(notEmpty)});

            if (aiCtx.data){
                setLessonDetails(`Learn about ${aiCtx.data}`);
            }

            return aiCtx;
        }
    }, [skill.data]);

    useAsyncEffect(async () => {
        const skillData = skill.data;
        if (skillData){
            setLessonName(skillData.name)
        }
    }, [skill.loading])

    return <Modal open={isShowing} onClose={onClose}>
        <CenterPaperStack>
            {
                skill.loading ? 
                    <Skeleton variant="rectangular" width="100%" height="100%" />
                    :
                    <Stack gap={2}>
                        <Stack gap={2}>
                            <Txt startIcon={<AutoAwesome/>} variant="h5">Learn Now</Txt>
                            <BaseCallout icon={<Info/>} backgroundColor={theme.palette.info.dark}  header={
                                <Stack direction={'row'} gap={3} alignItems={'center'}>
                                    <Typography variant="caption">Generate a lesson to learn about</Typography>
                                    <SkillChip topicOrId={skill.data?.name ?? ''} size="small" disableAddDelete disableModal disableLevelIndicator/>
                                </Stack>
                            }>
                                
                            </BaseCallout>
                        </Stack>
                        <Divider/>
                        <Stack gap={1}>
                            <Stack>
                                <TextField label={'Lesson Name'} value={lessonName} onChange={e => setLessonName(e.target.value)} placeholder={skill.data?.name} />
                            </Stack>
                            <Stack>
                                <TextField label={'Lesson Summary'} value={lessonDetails} onChange={e => setLessonDetails(e.target.value)} placeholder={`Learn about ${skillContextStr?.data ?? skill.data?.name}`} /> 
                            </Stack>
                        </Stack>
                        <Stack direction="row" gap={1} justifyContent={'space-between'} paddingX={'50px'}>
                            <Button onClick={onClose}>Cancel</Button>
                            <Button variant={'contained'} endIcon={<OpenInNew/>} onClick={() => {
                                const name = lessonName.trim().length > 0 ? lessonName : skill.data?.name;
                                const summary = lessonDetails.trim().length > 0 ? lessonDetails : skillContextStr || skill.data?.name ? `A lesson on ${skillContextStr?.data ?? skill.data?.name}` : '';
                                
                                if (!name || name.trim().length === 0 || summary.trim().length === 0){
                                    console.error('Name or summary is empty!!');
                                    return;
                                }

                                onSubmit({
                                    name,
                                    summary,
                                });
                                onClose();
                            }}>Create Lesson</Button>
                        </Stack>
                    </Stack>
            }
        </CenterPaperStack>
    </Modal>
}