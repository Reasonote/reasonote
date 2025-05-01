import {useState} from "react";

import {ActionCard} from "@/app/app/activities/new/page.page";
import {
  AutoAwesome,
  Build,
} from "@mui/icons-material";
import {
  Modal,
  Stack,
  Typography,
} from "@mui/material";

import {LessonIcon} from "../icons/LessonIcon";
import {ModalContent} from "../modals/ModalContent";
import {Txt} from "../typography/Txt";
import {CreateLessonModalBodyDumb} from "./CreateLessonModalBody";

export interface CreateLessonModalDumbProps {
    isOpen: boolean;
    onCreate: (args: {name: string, details: string, sourceText: string}) => void;
    onSuggestLessons: () => void;
    onCancel: () => void;
    optionsAvailable?: ('automatic' | 'prompted')[];
}

export function CreateLessonModalDumb({isOpen, onSuggestLessons, onCreate, onCancel, optionsAvailable}: CreateLessonModalDumbProps){
    const [screenShowing, setScreenShowing] = useState<'choose' | 'prompted'>('choose');

    return <Modal 
        open={isOpen} 
        onClose={() => {
            onCancel();
            setScreenShowing('choose');
        }}
    >
        <ModalContent>
            <Stack  justifyContent={'center'} alignContent={'center'}>
                <Stack gap={1} minWidth={'300px'} width={"500px"}>
                    <Txt startIcon={<LessonIcon/>} variant="h6">Generate Lessons</Txt>
                    
                    {
                        screenShowing === 'choose' ? <Stack gap={1}>
                            <ActionCard 
                                cardProps={{elevation: 10}}
                                onClick={() => {
                                    setScreenShowing('prompted');
                                }}>
                                <Stack gap={1}>
                                    <Txt startIcon={<Build />} variant="h5">Custom Lesson</Txt>
                                    <Typography variant="body1">Generate a new lesson from prompts.</Typography>
                                </Stack>
                            </ActionCard>
                            <ActionCard 
                                cardProps={{elevation: 10}}
                                onClick={() => {
                                    onSuggestLessons();
                                }}>
                                <Stack gap={1}>
                                    <Txt startIcon={<AutoAwesome/>} variant="h5">Suggest Lessons</Txt>
                                    <Typography variant="body1">We'll Generate Some Lessons Just for You.</Typography>
                                </Stack>
                            </ActionCard>
                        </Stack>
                        :
                        <Stack width={'100%'}>
                            <CreateLessonModalBodyDumb
                                stackProps={{
                                    gap: 2,
                                    width: '100%'
                                }}
                                onCreate={(args) => {
                                    onCreate(args);
                                    setScreenShowing('choose');
                                }}
                            />
                        </Stack>
                    }
                </Stack>
            </Stack>
        </ModalContent>
    </Modal>
}