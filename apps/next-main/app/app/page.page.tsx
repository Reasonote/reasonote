"use client";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {motion} from "framer-motion";
import _lodash from "lodash";
import {
  ChevronDown,
  FileText,
} from "lucide-react";
import {useRouter} from "next/navigation";
import posthog from "posthog-js";

import {useDurationsMs} from "@/clientOnly/hooks/useDuration";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {Txt} from "@/components/typography/Txt";
import {TypingTxt} from "@/components/typography/TypingTxt";
import {
  Alert,
  Button,
  Card,
  Chip,
  CircularProgress,
  Snackbar,
  Stack,
  useTheme,
} from "@mui/material";

import VoronoiBackgroundDefault
  from "../../components/backgrounds/VoronoiBackgroundDefault";
import {Footer} from "../../components/footer/Footer";
import {HomeMainSkillCreatorV2} from "../HomeMainSkillCreatorV2";
import {HomepageContinueLearning} from "../HomepageContinueLearning";

const AnimatedLearnMore = () => {
  const durationsMs = useDurationsMs();
  const theme = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{
        opacity: 1,
        y: [-2, 2, -2], // Creates a gentle floating effect
      }}
      transition={{
        opacity: { duration: 1.5, delay: 1.5 },
        y: {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          repeatType: "reverse"
        }
      }}
    >
      <Button
        onClick={() => {
          document.querySelector('#multiple-ways-to-learn')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }}
        sx={{
          textTransform: 'none',
        }}
        variant="contained"
        endIcon={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1.5 }}

          >
            <ChevronDown
              size={24}
              className="animate-draw-in-1s"
              color={theme.palette.text.primary}
            />
          </motion.div>
        }
      >
        <Txt sx={{ color: theme.palette.text.primary }} fontStyle={'bold'} fontWeight={'bold'}>Learn More</Txt>
      </Button>
    </motion.div>
  );
};

export default function Page() {
  const theme = useTheme();
  const isSmallDevice = useIsSmallDevice();
  const router = useRouter();

  const { rsnUser, userStatus, hasLoggedIn } = useRsnUser();

  useEffect(() => {
    posthog.capture('home_page_viewed', {
      user_status: userStatus,
    }, {
      send_instantly: true,
    });
  }, [userStatus]);

  const inputRef = useRef<HTMLInputElement>(null);

  const scrollableRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500); // Wait for the scroll to complete before focusing
    }
  }, []);

  const durationsMs = useDurationsMs();

  const [processingState, setProcessingState] = useState<{
    isProcessing: boolean;
    type: "text" | "document";
    input?: string;
    fileNames?: string[];
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [isPopperOpen, setIsPopperOpen] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
      <VoronoiBackgroundDefault />
      {processingState?.isProcessing ? (
        <Stack
          sx={{
            width: '100%',
            height: '100dvh',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <Card
            sx={{
              width: isSmallDevice ? 'calc(100vw - 32px)' : '600px',
              padding: 4,
              backgroundColor: theme.palette.background.paper,
              borderRadius: '16px',
              border: `2px solid ${theme.palette.primary.main}`,
              boxShadow: theme.shadows[4],
            }}
          >
            <Stack spacing={4} alignItems="center">
              <CircularProgress size={60} color="primary" />
              <Stack spacing={2} alignItems="center">
                <Txt variant="h5" color="primary">
                  Creating your course...
                </Txt>
                {processingState.type === "text" && processingState.input && (
                  <Txt
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      textAlign: 'center',
                      fontStyle: 'italic',
                      maxWidth: '100%',
                      wordBreak: 'break-word',
                      backgroundColor: theme.palette.background.default,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: `1px solid ${theme.palette.divider}`,
                      '& span': {
                        opacity: 0.8
                      }
                    }}
                  >
                    "{processingState.input}"
                  </Txt>
                )}
                {processingState.type === "document" && processingState.fileNames && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" sx={{ gap: 1 }}>
                    {processingState.fileNames.map((fileName, index) => (
                      <Chip
                        key={index}
                        icon={<FileText size={16} />}
                        label={fileName}
                        variant="outlined"
                        sx={{
                          backgroundColor: theme.palette.background.default,
                          borderColor: theme.palette.divider,
                          '& .MuiChip-label': {
                            maxWidth: '160px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          },
                          '& .MuiChip-icon': {
                            color: theme.palette.text.secondary,
                            marginLeft: '8px',
                          }
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Card>
        </Stack>
      ) : (
        <div
          ref={scrollableRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            overflowY: 'auto',
            backdropFilter: 'blur(1px)',
          }}
        >
          <>
            <Stack sx={{
              width: '100%',
              height: isSmallDevice ? 'calc(100dvh - 64px)' : '100%',
              alignItems: 'center',
              transition: 'all 0.3s ease-in-out'
            }}>
              <Stack
                alignItems="center"
                justifyContent={isSmallDevice && isPopperOpen ? 'flex-start' : 'center'}
                spacing={2}
                width={'100%'}
                height={'100%'}
                padding={isSmallDevice ? 1 : 5}
              >
                {
                  <Card sx={{
                    width: isSmallDevice ? 'calc(100vw - 32px)' : '90%',
                    minWidth: '320px',
                    maxWidth: '800px',
                    background: theme.palette.background.paper,
                    border: `2px solid ${theme.palette.text.primary}`,
                    borderRadius: '10px',
                    boxShadow: theme.shadows[4],
                    overflow: 'auto',
                    p: 2
                  }}>

                    <Stack width={'100%'} color="text.secondary" gap={isSmallDevice ? 1 : 2}>
                      {
                        hasLoggedIn ? (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: durationsMs.short }}
                          >
                            <TypingTxt variant="h5">
                              Welcome back{rsnUser?.data?.givenName ? `, ${rsnUser?.data?.givenName}` : ''}! 👋
                            </TypingTxt>
                          </motion.div>
                        ) : (
                          <Txt variant={'h5'} color="text.secondary" sx={{ mb: isSmallDevice ? 0 : undefined }}>
                            Reasonote
                          </Txt>
                        )
                      }

                      {/* <HomeMainSkillCreator
                          inputRef={inputRef}
                          onProcessingStateChange={setProcessingState}
                          onError={setError}
                          onPopperOpen={setIsPopperOpen}
                        /> */}

                      <HomeMainSkillCreatorV2
                        onProcessingStateChange={setProcessingState}
                        onError={setError}
                      />

                      <HomepageContinueLearning
                        handleSkillClick={
                          (skillId: string) => {
                            posthog.capture("continue_learning_skill_clicked", {
                              rsn_user_id: rsnUser?.data?.id,
                              skill_id: skillId,
                            }, {
                              send_instantly: true,
                            });
                            router.push(`/app/skills/${skillId}`);
                          }
                        }
                      />
                    </Stack>

                  </Card>
                }
              </Stack>
            </Stack>
            <Footer />
          </>

          {/* Error Snackbar */}
          <Snackbar
            open={!!error}
            autoHideDuration={5000}
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              onClose={() => setError(null)}
              severity="error"
              variant="filled"
            >
              {error}
            </Alert>
          </Snackbar>
        </div>
      )}
    </div>
  );
}
