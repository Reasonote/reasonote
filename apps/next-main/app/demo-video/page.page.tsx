"use client";
import {useState} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {useRouter} from "next/navigation";

import AppLayout from "@/app/layout.page";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import VoronoiBackground from "@/components/backgrounds/VoronoiBackground";
import {EducationalIcons} from "@/components/icons/EducationalIcons";

import TargetIcon from "@mui/icons-material/Grade";
import HistoryIcon from "@mui/icons-material/History";
import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Stack,
  useTheme,
} from "@mui/material";

enum ScreenState {
    INITIAL,           // Education is broken
    PRINCIPLES_TITLE,  // Show title first
    PERSONALIZED,      // First principle
    GOAL_DRIVEN,       // Second principle
    REVIEWED,          // Third principle
    BLACK_TRANSITION,  // Black screen
    REASONOTE,         // Reasonote logo
}

type DemoMode = "full" | "quick";

function PrincipleCards({ visibleUpTo }: { visibleUpTo: ScreenState }) {
    const theme = useTheme();
    const principles = [
        { state: ScreenState.PERSONALIZED, icon: PersonIcon, text: "Personalized" },
        { state: ScreenState.GOAL_DRIVEN, icon: TargetIcon, text: "Goal Driven" },
        { state: ScreenState.REVIEWED, icon: HistoryIcon, text: "Reviewed" }
    ];

    const isSmallDevice = useIsSmallDevice();

    return (
        <Stack spacing={4} alignItems="center">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
            >
                <Stack spacing={1} alignItems="center" sx={{ px: 2 }}>
                    <h2 style={{
                        color: theme.palette.text.primary,
                        fontSize: isSmallDevice ? '2.5rem' : '3.5rem',
                        margin: 0,
                        fontWeight: 500,
                        textAlign: 'center'
                    }}>
                        What Works
                    </h2>
                    <h3 style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: isSmallDevice ? '1.2rem' : '1.5rem',
                        margin: 0,
                        fontWeight: 400,
                        textAlign: 'center'
                    }}>
                        Based on the Research
                    </h3>
                </Stack>
            </motion.div>
            
            <Stack
                direction={isSmallDevice ? "column" : "row"}
                spacing={3}
                sx={{
                    maxWidth: '1200px',
                    width: '100%',
                    justifyContent: 'center',
                    px: 3
                }}
            >
                {principles.map((principle) => (
                    principle.state <= visibleUpTo && (
                        <motion.div
                            key={principle.text}
                            initial={{ opacity: 0, x: isSmallDevice ? 0 : -20, y: isSmallDevice ? -20 : 0 }}
                            animate={{ 
                                opacity: 1, 
                                x: 0,
                                y: 0
                            }}
                            exit={{ 
                                opacity: 0, 
                                x: isSmallDevice ? 0 : 20,
                                y: isSmallDevice ? 20 : 0
                            }}
                            transition={{ duration: 0.5 }}
                        >
                            <Stack
                                spacing={2}
                                alignItems="center"
                                sx={{
                                    backgroundColor: theme.palette.background.paper,
                                    backdropFilter: 'blur(10px)',
                                    padding: isSmallDevice ? '1.5rem' : '2rem',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    width: isSmallDevice ? '100%' : '280px',
                                }}
                            >
                                <principle.icon sx={{ 
                                    fontSize: isSmallDevice ? '3rem' : '4rem', 
                                    color: theme.palette.text.primary,
                                    opacity: 0.9
                                }} />
                                <h2 style={{
                                    color: theme.palette.text.primary,
                                    fontSize: isSmallDevice ? '1.5rem' : '2rem',
                                    margin: 0,
                                    fontWeight: 500,
                                    textAlign: 'center'
                                }}>
                                    {principle.text}
                                </h2>
                            </Stack>
                        </motion.div>
                    )
                ))}
            </Stack>
        </Stack>
    );
}

function BeforePageContent() {
    const theme = useTheme();
    const scale = 1;
    const [currentScreen, setCurrentScreen] = useState<ScreenState>(ScreenState.INITIAL);
    const router = useRouter();
    const isSmallDevice = true; // useIsSmallDevice();

    const searchParams = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.search : ''
    );
    const demoMode: DemoMode = searchParams.get('mode') === 'quick' ? 'quick' : 'full';

    const handleClick = () => {
        switch (currentScreen) {
            case ScreenState.INITIAL:
                if (demoMode === "quick") {
                    setCurrentScreen(ScreenState.BLACK_TRANSITION);
                } else {
                    setCurrentScreen(ScreenState.PRINCIPLES_TITLE);
                }
                break;
            case ScreenState.PRINCIPLES_TITLE:
                setCurrentScreen(ScreenState.PERSONALIZED);
                break;
            case ScreenState.PERSONALIZED:
                setCurrentScreen(ScreenState.GOAL_DRIVEN);
                break;
            case ScreenState.GOAL_DRIVEN:
                setCurrentScreen(ScreenState.REVIEWED);
                break;
            case ScreenState.REVIEWED:
                setCurrentScreen(ScreenState.BLACK_TRANSITION);
                break;
            case ScreenState.BLACK_TRANSITION:
                setCurrentScreen(ScreenState.REASONOTE);
                break;
            case ScreenState.REASONOTE:
                window.location.href = '/';
                break;
        }
    };

    const showRedNetwork = currentScreen === ScreenState.INITIAL;
    const showGreenNetwork = currentScreen === ScreenState.REASONOTE;

    return (
        <div
            style={{ height: '100dvh', width: '100vw', position: 'relative', cursor: 'pointer' }}
            onClick={handleClick}
        >
            {/* Background layer */}
            <motion.div
                animate={{
                    backgroundColor: (currentScreen === ScreenState.BLACK_TRANSITION || 
                                    currentScreen === ScreenState.REASONOTE || 
                                    currentScreen === ScreenState.PERSONALIZED ||
                                    currentScreen === ScreenState.GOAL_DRIVEN ||
                                    currentScreen === ScreenState.REVIEWED) 
                        ? 'rgba(0, 0, 0, 0.95)' 
                        : 'transparent'
                }}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100dvh',
                    pointerEvents: 'none',
                }}>
                {/* Red Network */}
                <motion.div
                    initial={{ opacity: showRedNetwork ? 1 : 0 }}
                    animate={{
                        opacity: showRedNetwork ? 1 : 0,
                        transition: { duration: 0.3 }
                    }}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                >
                    <VoronoiBackground
                        baseColor="rgba(200, 200, 200, 0.3)"
                        pulseColor={theme.palette.error.dark}
                        NodeComponents={EducationalIcons.map((Icon) => (() =>
                            <Avatar sx={{
                                backgroundColor: 'error.dark',
                                opacity: 0.5
                            }}>
                                <Icon fontSize="medium" color="rgba(50, 50, 50, 1.0)" />
                            </Avatar>)
                        )}
                        backgroundColor="transparent"
                        scalingFactor={6 * scale}
                        smallScreenScalingFactor={10 * scale}
                        smallScreenCutoffPx={550}
                    />
                </motion.div>

                {/* Green Network */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: showGreenNetwork ? 1 : 0,
                        transition: { duration: 0.3 }
                    }}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                >
                    <VoronoiBackground
                        baseColor="rgba(200, 200, 200, 0.3)"
                        pulseColor={theme.palette.success.main}
                        NodeComponents={EducationalIcons.map((Icon) => (() =>
                            <Avatar sx={{
                                backgroundColor: 'success.main',
                                opacity: 0.5
                            }}>
                                <Icon fontSize="medium" color="rgba(50, 50, 50, 1.0)" />
                            </Avatar>)
                        )}
                        backgroundColor="transparent"
                        scalingFactor={6 * scale}
                        smallScreenScalingFactor={10 * scale}
                        smallScreenCutoffPx={550}
                    />
                </motion.div>
            </motion.div>

            {/* Centered content layer */}
            <Stack
                alignItems="center"
                justifyContent="center"
                sx={{
                    position: 'relative',
                    height: '100%',
                    width: '100%',
                    textAlign: 'center',
                    px: 3
                }}
            >
                <AnimatePresence mode="wait">
                    {currentScreen === ScreenState.INITIAL && (
                        <motion.div
                            key="broken-text"
                            exit={{
                                opacity: 0,
                                y: -20,
                                filter: "blur(10px)",
                                transition: { duration: 0.5 }
                            }}
                        >
                            <motion.h1
                                style={{
                                    fontSize: isSmallDevice ? '4rem' : '5rem',
                                    fontWeight: 'bold',
                                    color: theme.palette.error.main,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    marginBottom: '1rem',
                                    margin: 0
                                }}
                            >
                                Education is Broken
                            </motion.h1>
                            <motion.h4
                                style={{
                                    color: theme.palette.text.secondary,
                                    maxWidth: '800px',
                                    fontSize: isSmallDevice ? '1.5rem' : '2rem',
                                    margin: 0
                                }}
                            >
                                It's time for a change
                            </motion.h4>
                        </motion.div>
                    )}

                    {(currentScreen >= ScreenState.PRINCIPLES_TITLE &&
                      currentScreen <= ScreenState.REVIEWED) && (
                        <PrincipleCards visibleUpTo={currentScreen} />
                    )}

                    {currentScreen === ScreenState.REASONOTE && (
                        <motion.div
                            key="favicon"
                            initial={{
                                opacity: 0,
                                y: 50
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                    duration: 0.6,
                                    ease: "easeOut",
                                    delay: 0.3
                                }
                            }}
                        >
                            <Stack spacing={isSmallDevice ? 3 : 2} alignItems="center">
                                <motion.img
                                    src="/static/images/Reasonote-Icon-1.png"
                                    alt="Favicon"
                                    style={{
                                        width: isSmallDevice ? "33vw" : "200px",
                                        height: isSmallDevice ? "33vw" : "200px",
                                        display: "block",
                                        objectFit: "contain",
                                        borderRadius: "1.5rem",
                                        border: isSmallDevice ? '1px solid rgba(255, 255, 255, 0.5)' : '2px solid rgba(255, 255, 255, 0.5)',
                                    }}
                                    initial={{ scale: 0.8 }}
                                    animate={{
                                        scale: 1,
                                        transition: {
                                            duration: 0.6,
                                            ease: "easeOut",
                                            delay: 0.3
                                        }
                                    }}
                                />
                                <Stack spacing={1} alignItems="center">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ 
                                            opacity: 1, 
                                            y: 0,
                                            transition: {
                                                duration: 0.6,
                                                ease: "easeOut",
                                                delay: 0.6
                                            }
                                        }}
                                    >
                                        <h1 style={{
                                            color: theme.palette.text.primary,
                                            fontSize: isSmallDevice ? '3.5rem' : '3rem',
                                            margin: 0,
                                            fontWeight: 500,
                                        }}>
                                            Reasonote
                                        </h1>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ 
                                            opacity: 1, 
                                            y: 0,
                                            transition: {
                                                duration: 0.6,
                                                ease: "easeOut",
                                                delay: 0.8
                                            }
                                        }}
                                    >
                                        <h2 style={{
                                            color: theme.palette.text.primary,
                                            fontSize: isSmallDevice ? '1.8rem' : '1.5rem',
                                            margin: 0,
                                            fontWeight: 400,
                                        }}>
                                            Learn Anything.
                                        </h2>
                                    </motion.div>
                                </Stack>
                            </Stack>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Stack>
        </div>
    );
}

export default function BeforePage() {
    return <AppLayout>
        <BeforePageContent />
    </AppLayout>
}