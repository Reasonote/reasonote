import React, {useEffect} from "react";

import _ from "lodash";

import FractalTreeLoading from "@/components/icons/FractalTreeLoading";
import {
  Chat,
  QuestionMarkOutlined,
  ThumbDown,
  ThumbUp,
} from "@mui/icons-material";
import {
  Badge,
  Button,
  Card,
  Grow,
  LinearProgress,
  LinearProgressProps,
  Stack,
  StackProps,
  Typography,
  TypographyProps,
  useTheme,
} from "@mui/material";

export function GetLoadingTip({stackProps}: {stackProps?: StackProps}) {
    const tips = [
        // () => {
        //     return <Stack>
        //         <Stack gap={1}>
        //             <Typography variant="body1">
        //                 Tip: <b><i>Want more?</i> Click:</b>
        //             </Typography>
        //             <Stack direction={'row'}>
        //                 <KeyboardDoubleArrowDown style={{verticalAlign: 'center'}}/>
        //                 <b>Dig Deeper</b>
        //             </Stack> 
        //             <Typography variant="body1">
        //                 after an activity is done to show related skills, a detailed score breakdown, and more.
        //             </Typography>
        //         </Stack>
        //     </Stack>
        // },
        () => {
            return <Stack gap={2}>
                <Typography>Tip: <b><i>Feeling stuck?</i> Try clicking the:</b> </Typography>
                <Stack width={'fit-content'}>
                    <Badge badgeContent={<QuestionMarkOutlined fontSize="small"/>}>
                        <Chat />
                    </Badge>
                </Stack>
                <Typography>button on the bottom of the screen to get help on hard activities.</Typography>
            </Stack>
        },
        () => {
            return <Stack gap={2}>
                <Typography>Tip: <b><i>How are we doing?</i> Try clicking the:</b> </Typography>
                <Stack direction={'row'} gap={2}>
                    <Stack width={'fit-content'}>
                        <ThumbUp />
                    </Stack>
                    <Typography>
                        &
                    </Typography>
                    <Stack width={'fit-content'}>
                        <ThumbDown />
                    </Stack>
                </Stack>
                <Typography>buttons on the bottom of the screen to give us feedback.</Typography>
            </Stack> 
        },
        () => {
            return <Stack gap={2}>
            <Typography>Tip: <b><i>Need a new line?</i></b><br/>When chatting, pressing <b><i>Shift + Enter/Return</i></b> will create a new line in a chat window</Typography>
        </Stack>  
        }
    ]

    const [curTipIndex, setCurTipIndex] = React.useState(Math.floor(Math.random() * tips.length))
    const [shownTips, setShownTips] = React.useState<Set<number>>(new Set([curTipIndex]))
    const [lastIndex, setLastIndex] = React.useState<number>(curTipIndex)
    
    useEffect(() => {
        // We need to make sure shownTips is up to date.
        setShownTips((shownTips) => {
            const newShownTips = new Set(shownTips)
            newShownTips.add(curTipIndex)
            return newShownTips
        })

        setLastIndex(curTipIndex)
    }, [curTipIndex])

    const nextTip = () => {
        if (shownTips.size === tips.length) {
            // Clear both
            setShownTips(new Set())
            setCurTipIndex(Math.floor(Math.random() * tips.length))
        }
        else {
            let nextIndex = curTipIndex

            // Edge case
            if (tips.length === 1){
                return
            }

            while(shownTips.has(nextIndex) || nextIndex === lastIndex) {
                nextIndex = Math.floor(Math.random() * tips.length)
            }
            setCurTipIndex(nextIndex)
        }
    }

    return <Stack alignItems={'center'} gap={2} {...stackProps}>
        {tips[curTipIndex]()}
        <div>
            <Button 
                size="small"
                onClick={() => {
                    nextTip()
                }}
            >
                Next Tip
            </Button>
        </div>
    </Stack>
}


export function ActivityLoadingComponent({
    loadingText,
    stackOverrides,
    typographyOverrides,
    progressOverrides,
    variant,
  }: {
    loadingText?: string;
    stackOverrides?: Partial<StackProps>;
    typographyOverrides?: Partial<TypographyProps>;
    variant?: 'tips' | 'tree';
    progressOverrides?: Partial<LinearProgressProps>;
  }) {

    const theme = useTheme()
    const [showingTips, setShowingTips] = React.useState<boolean>(false)

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setShowingTips(true)
        }, 2000)

        return () => {
            clearTimeout(timeout)
        }
    }, [])

    return (
      <Stack width={'100%'} {...stackOverrides}>
        {
            variant === 'tips' ? (
                <>
                        <Typography variant="h5" {...typographyOverrides}>
                            {loadingText ?? "Loading..."}
                        </Typography>
                    <LinearProgress {...progressOverrides} />
                    <Card elevation={1} sx={{padding: '40px'}}>
                        {
                            <Grow in={showingTips} timeout={1000}>
                                <div>
                                    <GetLoadingTip stackProps={{
                                        visibility: showingTips ? 'visible' : 'hidden',
                                    }}/>
                                </div>
                            </Grow>
                        }
                    </Card>
                </>
            ) : (
                <Stack alignItems={'center'} justifyContent={'center'}>
                    <FractalTreeLoading  
                        style={{
                            width: 150,
                            height: 150,
                        }}
                        growthSpeed={250.0}
                        color={theme.palette.primary.main}
                    />
                    <Typography 
                        variant="h5" 
                        {...typographyOverrides} 
                        sx={{
                            pb: 5,
                            background: `linear-gradient(
                                90deg, 
                                ${theme.palette.grey[500]} 0%, 
                                ${theme.palette.grey[500]} 45%, 
                                ${theme.palette.common.white} 50%, 
                                ${theme.palette.grey[500]} 55%, 
                                ${theme.palette.grey[500]} 100%
                            )`,
                            backgroundSize: '200% auto',
                            animation: 'flow 2s linear infinite',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            '@keyframes flow': {
                                '0%': {
                                    backgroundPosition: '100% center',
                                },
                                '100%': {
                                    backgroundPosition: '-100% center',
                                },
                            },
                        }}
                    >
                        {loadingText ?? "Loading..."}
                    </Typography>
                </Stack>
            )
        }
      </Stack>
    );
  }