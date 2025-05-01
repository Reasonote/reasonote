'use client'
import React, {useCallback} from "react";

import {isEmpty} from "lodash";
import {useRouter} from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useSearchParamHelper} from "@/clientOnly/hooks/useQueryParamHelper";
import {BaseCallout} from "@/components/cards/BaseCallout";
import {ModalContent} from "@/components/modals/ModalContent";
import FullCenter from "@/components/positioning/FullCenter";
import {useReactiveVar} from "@apollo/client";
import {Info} from "@mui/icons-material";
import {
  Button,
  Modal,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import FYPChooseIntentScreen
  from "./FYPChooseIntentScreen/FYPChooseIntentScreen";
import ForYouMain from "./FYPMain";
import {vFYPIntent} from "./FYPState";
import {FYPIntent} from "./FYPTypes";

function ForYouOnboaridingDialog({onPickASkill}: {onPickASkill: () => void}) {
    const [tab, setTab] = React.useState('welcome');
    const theme = useTheme();
    
    return <Stack>
            <Typography variant="h4" textAlign={'center'}>🎉 Welcome to Reasonote!</Typography>
            <Typography variant="caption" textAlign={'center'}>We're excited to help you learn.</Typography>
            <br/>
            <BaseCallout 
                icon={<Info/>}
                header={<Typography variant="h6">About This Page</Typography>}
                sx={{
                    paper: {
                        backgroundColor: theme.palette.info.dark,
                        padding: '20px'
                    }
                }}
            >
                <br/>
                <Typography variant="body1">The <b>"For You"</b> page is where you can quickly find skills that you want to practice.</Typography>
            </BaseCallout>
            <br/>

            <Typography variant="h6">To get Started, let's Select a Skill.</Typography>
            
            <br/>

            <Button 
                onClick={() => {
                    onPickASkill();
                }}
                variant="contained"
            >
                Choose a Skill
            </Button>
    </Stack>
}

export default function ForYouPage(){
    const {value: tourState, update: setTourState} = useSearchParamHelper('tour');
    const userIntent = useReactiveVar(vFYPIntent);
    const theme = useTheme();
    const isSmallDevice = useIsSmallDevice()
    const router = useRouter();

    const readyForMain = userIntent !== null && !isEmpty(userIntent.activitiesAllowed)

    const setUserIntent = useCallback((intent: FYPIntent | null) => {
      vFYPIntent(intent);
    }, []);

    return <>
        <FullCenter>
            <Stack
                direction="column"
                gap={1}
                sx={{
                    width: isSmallDevice ? "100vw" : theme.breakpoints.values["sm"],
                    height: isSmallDevice ? 'calc(~"100dvh - 56px");' : "fit-content",
                    alignContent: "center",
                    justifyContent: "center",
                    
                }}
                paddingX={'3px'}
            >
            {
                !readyForMain ? (
                    <FYPChooseIntentScreen onIntentChosen={(intent) => {
                        vFYPIntent(intent)
                    }}/>
                ) : (
                    <ForYouMain 
                        fypIntent={userIntent} 
                        setFYPIntent={setUserIntent}
                        onBack={() => {
                            if (userIntent?.type === 'review-pinned' && userIntent.pinned?.skillIdPath) {
                                vFYPIntent(null);
                                router.push(`/app/skills/${userIntent.pinned.skillIdPath[0]}`);
                            } else {
                                vFYPIntent(null);
                                router.push('/app');
                            }
                            vFYPIntent(null);
                        }}
                    />
                )
            }
            </Stack>
        </FullCenter>
        <Modal
            open={tourState === 'true'}
            onClose={() => {
                setTourState('pick-skill');
            }}
        >
            <ModalContent cardProps={{elevation: 10}}>
                <ForYouOnboaridingDialog onPickASkill={() => {
                    setTourState('pick-skill');
                }}/>
            </ModalContent>
        </Modal>
        {/* <ChatBubble /> */}
    </>
}