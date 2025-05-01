import {
  useCallback,
  useEffect,
  useState,
} from "react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {vAIPageContext} from "@/components/chat/ChatBubble";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {trimLines} from "@lukebechtel/lab-ts-utils";
import {
  Button,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  ShortAnswerActivityConfig,
  ShortAnswerResult,
  ShortAnswerSubmitRequest,
  ShortAnswerSubmitResult,
} from "@reasonote/activity-definitions";

import {ActivityComponent} from "../../ActivityComponent";

export const ShortAnswerActivity: ActivityComponent<
  ShortAnswerActivityConfig,
  ShortAnswerSubmitRequest,
  ShortAnswerResult
> = ({
  config,
  callbacks,
  ai,
}) => {
    const theme = useTheme();
    const isSmallDevice = useIsSmallDevice();
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState<string>("");
    const [gradingState, setGradingState] = useState<
      "waiting" | "grading" | "graded"
    >("waiting");

    const [grade, setGrade] = useState<number | null>(null);
    const [explanation, setExplanation] = useState<string | null>(null);

    useEffect(() => {
      if (gradingState === "graded") {
        vAIPageContext(
          trimLines(`
                The user has just received their grade for a short answer exercise.

                # Question
                \`\`\`json
                <JSON>
                \`\`\`

                # User Answer
                \`\`\`json
                <USER_ANSWER>
                \`\`\`

                # Grade
                \`\`\`json
                <GRADE>
                \`\`\`
            `)
            .replace("<JSON>", JSON.stringify(config, null, 2))
            .replace("<USER_ANSWER>", JSON.stringify(userAnswer, null, 2))
            .replace("<GRADE>", JSON.stringify({ grade, explanation }, null, 2))
        );
      } else {
        vAIPageContext(
          trimLines(`
                The user is trying to answer the following short answer exercise. 

                # Question
                \`\`\`json
                <JSON>
                \`\`\`

                # User Answer (So Far)
                \`\`\`json
                <USER_ANSWER>
                \`\`\`

                They have NOT SEEN THE ANSWER YET.

                DO NOT TELL THEM THE ANSWER -- you should only help them understand the question and think it through.
                `)
            .replace("<JSON>", JSON.stringify(config, null, 2))
            .replace("<USER_ANSWERS>", JSON.stringify(userAnswer, null, 2))
        );
      }
    }, [showAnswer, config]);

    const gradeAnswer = useCallback(async () => {
      setGradingState("grading");

      try {
        // Use server-side grading if available
        if (callbacks?.onSubmission) {
          const submitRequest: ShortAnswerSubmitRequest = {
            userAnswer: userAnswer
          };

          const result = await callbacks.onSubmission(submitRequest);

          const submitResult = result.submitResult as ShortAnswerSubmitResult;

          setGradingState("graded");
          setGrade(submitResult.score ?? 0);
          setExplanation(submitResult.details.explanation);

          return;
        }
        else {
          throw new Error("No onSubmission callback provided");
        }
      } catch (error) {
        console.error("Error grading answer:", error);
        setGradingState("waiting");
      }
    }, [userAnswer, callbacks, config]);

    const handleSkip = useCallback(() => {
      callbacks?.onSkip?.({})
    }, [callbacks, config]);

    return (
      <Paper sx={{ width: '100%', height: '100%', position: 'relative' }}>
        <Stack
          padding={2}
          gap={2}
          sx={{
            maxHeight: '70vh',
            height: '100%',
            overflowY: 'scroll',
            paddingBottom: callbacks?.hideSkipButton ? '0px' : gradingState === "waiting" ? '80px' : '16px',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.divider,
              borderRadius: '4px',
            },
          }}
        >
          <MuiMarkdownDefault
            overrides={{
              h1: {
                component: Typography,
                props: {
                  variant: "h5",
                },
              },
            }}
          >
            {config.questionText}
          </MuiMarkdownDefault>

          <TextField
            size="small"
            disabled={gradingState === "graded" || gradingState === "grading"}
            label={"Your Answer"}
            value={userAnswer}
            multiline
            minRows={3}
            maxRows={6}
            inputProps={{
              maxLength: 1023
            }}
            aria-autocomplete={"none"}
            onChange={(e) => {
              setUserAnswer(e.target.value);
            }}
          />

          {userAnswer.length >= 511 && userAnswer.length < 1023 && (
            <Typography
              variant="caption"
              color="warning.main"
              sx={{ fontStyle: 'italic' }}
            >
              Tip: Concise answers often demonstrate better understanding.
            </Typography>
          )}

          {userAnswer.length >= 1023 && (
            <Typography
              variant="caption"
              color="error.main"
              sx={{ fontStyle: 'italic' }}
            >
              Maximum length limit reached! You need to be more concise.
            </Typography>
          )}

          {gradingState === "grading" && (
            <Stack>
              <Typography>Grading...</Typography>
              <LinearProgress />
            </Stack>
          )}
        </Stack>

        {gradingState === "waiting" && !callbacks?.hideSkipButton && (
          <Stack
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: isSmallDevice ? 1 : 2,
              backgroundColor: 'background.paper',
            }}
          >
            <Stack
              direction="row"
              spacing={5}
              justifyContent="center"
              width="100%"
            >
              <Button
                variant="text"
                color="inherit"
                onClick={handleSkip}
                sx={{ opacity: 0.7, textTransform: 'none' }}
              >
                Skip
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => gradeAnswer()}
                disabled={!userAnswer.trim()}
                sx={{ fontWeight: !userAnswer.trim() ? 'normal' : 'bold', textTransform: 'none' }}
              >
                Grade
              </Button>
            </Stack>
          </Stack>
        )}
      </Paper>
    );
  }
