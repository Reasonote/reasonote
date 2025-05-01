import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {vAIPageContext} from "@/components/chat/ChatBubble";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {trimLines} from "@lukebechtel/lab-ts-utils";
import {
  Check,
  Close,
  Flaky,
} from "@mui/icons-material";
import {
  Button,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  FillInTheBlankActivityConfig,
  FillInTheBlankResult,
  FillInTheBlankResultGraded,
} from "@reasonote/activity-definitions";
import {ActivityResultSkippedBase} from "@reasonote/core";

import {ActivityComponent} from "../ActivityComponent";

// Local implementation of the function that was previously in the server directory
function v0_0_1GetHiddenWords(data: FillInTheBlankActivityConfig): string[] {  
  const text = data.text;

  // Use regex to find span elements with an id of "hidden-word-<index>"
  // Also should grab until the last </span> tag.
  const matches = text.matchAll(/<span id="hidden-word-(\d+)">(.*?)<\/span>/g);

  return Array.from(matches).map((match) => match[2]);
}

export const FillInTheBlankActivity: ActivityComponent<FillInTheBlankActivityConfig, {userAnswers: string[]}, FillInTheBlankResult | ActivityResultSkippedBase> = ({
  config,
  callbacks,
}) => {
  const theme = useTheme();
  const isSmallDevice = useIsSmallDevice();
  const [showAnswer, setShowAnswer] = useState(false);

  const hiddenWords = config.version === "0.0.0" ? config.hiddenWords : v0_0_1GetHiddenWords(config);

  const [userAnswers, setUserAnswers] = useState<string[]>(
    hiddenWords.map(() => "")
  );

  const [gradingState, setGradingState] = useState<
    "waiting" | "grading" | "graded"
  >("waiting");

  const [grade, setGrade] = useState<number | null>(null);
  const [gradePerWord, setGradePerWord] = useState<{hiddenWord: string, grade0To100: number}[] | null>(null);

  useEffect(() => {
    if (gradingState === "graded") {
      vAIPageContext(
        trimLines(`
                The user has just received their grade for a fill in the blank exercise.

                # Question
                \`\`\`json
                <JSON>
                \`\`\`

                # User Answers
                \`\`\`json
                <USER_ANSWERS>
                \`\`\`

                # Grade
                \`\`\`json
                <GRADE>
                \`\`\`
            `)
          .replace("<JSON>", JSON.stringify(config, null, 2))
          .replace("<USER_ANSWERS>", JSON.stringify(userAnswers, null, 2))
          .replace("<GRADE>", JSON.stringify({ grade }, null, 2))
      );
    } else {
      vAIPageContext(
        trimLines(`
                The user is trying to answer the following fill in the blank exercise. 

                # Question
                \`\`\`json
                <JSON>
                \`\`\`

                # User Answers (So Far)
                \`\`\`json
                <USER_ANSWERS>
                \`\`\`

                They have NOT SEEN THE ANSWER YET.

                DO NOT TELL THEM THE ANSWER -- you should only help them understand the question and think it through.
                `)
          .replace("<JSON>", JSON.stringify(config, null, 2))
          .replace("<USER_ANSWERS>", JSON.stringify(userAnswers, null, 2))
      );
    }
  }, [showAnswer, config]);

  const gradeAnswer = useCallback(async () => {
    setGradingState("grading");

    const gradeResult = await callbacks?.onSubmission?.({userAnswers}) as FillInTheBlankResultGraded;

    const newGradePerWord = gradeResult?.submitResult?.details?.gradePerWord ?? null;

    setGrade(gradeResult?.grade0to100 ?? null);
    setGradePerWord(newGradePerWord);

    setGradingState("graded");

  }, [userAnswers]);

  function v0_0_0Blankout(){
    return config.text.split(" ").map((word) => {
      // Now, If this is a Term marker, then we should replace it with the user's answer for this term.
      const match = word.match(/<\|TERM_(\d+)\|>/);
      if (match) {
        const index = parseInt(match[1]);
  
        const currentUserAnswer = userAnswers[index];
  
        if (currentUserAnswer.trim().length === 0) {
          return `(${index + 1})\\\_\\\_\\\_\\\_\\\_\\\_\\\_\\\_\\\_`;
        } else {
          return `${userAnswers[index]}`;
        }
      } else {
        return word;
      }
    }).join();
  }
  
  /**
   * In v0.0.1, we have to find any <span> elements which have an id of "hidden-word-<index>" and replace them with the user's answer.
   */
  function v0_0_1Blankout(){
    if (config.version !== '0.0.1') {
      console.error(`Invalid version: ${config.version}`)
      return config.text;
    } 
    
    const text = config.text;

    // Use regex to find span elements with an id of "hidden-word-<index>"
    // Also should grab until the last </span> tag.
    const matches = text.matchAll(/<span id="hidden-word-(\d+)">(.*?)<\/span>/g);

    function spanWrapper(text: string, color: string = theme.palette.info.dark, size: string = 'medium'){
      return `<span style="font-weight:bold;color:${color};font-size:${size};text-decoration:underline;">${text}</span>`
    }
    
    // now, we have to replace each match with the user's answer.
    let blankedOut = text;

    for (const match of matches) {
      const index = parseInt(match[1]);
      const hiddenWord = match[2];
      const userAnswer = userAnswers[index - 1];

      if (grade === null){
        var blankFill = !userAnswer || userAnswer.trim().length === 0 ?
          `\\\_`.repeat(hiddenWord.length) :
          userAnswer

        blankedOut = blankedOut.replace(match[0], spanWrapper(`${index}:\\\_${blankFill}`));
      }
      else {
        // We have a grade, let's fill in the right answers and color accordingly.
        blankedOut = blankedOut.replace(match[0], spanWrapper(hiddenWord, theme.palette.success.main, 'large'));
      }
    }

    return blankedOut;
  }

  const blankedOut = useMemo(() => {
    return config.version === '0.0.0' ? v0_0_0Blankout() : v0_0_1Blankout();
  }, [config, userAnswers, grade]);

  return (
    <Paper sx={{width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column'}}>
      <Stack 
        sx={{
          flex: 1,
          overflowY: 'auto',
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
        {/* Question Section */}
        <Stack 
          sx={{
            padding: 2,
            paddingBottom: 1,
          }}
        >
          <MuiMarkdownDefault
            overrides={{
              h1: {
                component: Typography,
                props: {
                  variant: "h5",
                  sx: { mb: 1 }
                },
              },
            }}
          >
            {blankedOut}
          </MuiMarkdownDefault>
        </Stack>

        {/* Divider */}
        <Stack 
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            mx: 2,  // Margin left and right to match padding
          }}
        />

        {/* Answers Section */}
        <Stack 
          spacing={1}
          sx={{
            padding: 2,
            paddingBottom: '16px',
          }}
        >
          <Typography variant="body1"><b>Your Answers</b></Typography>
          {userAnswers.map((word, idx) => (
            <TextField
              key={idx}
              size="small"
              disabled={gradingState === "graded" || gradingState === "grading"}
              inputProps={{
                maxLength: 255
              }}
              InputProps={{
                startAdornment: (
                  gradingState === "graded" && gradePerWord ?
                    <InputAdornment position="start">
                      {gradePerWord[idx].grade0To100 === 100 ? 
                          <Check color={"success"}/> 
                          : 
                          (
                            gradePerWord[idx].grade0To100 < 65 ? 
                              <Close color={'error'}/>
                              :
                              <Flaky color={'warning'}/>
                          )
                      }
                    </InputAdornment>
                    :
                    null
                ),
              }}
              label={"Answer " + (idx + 1)}
              value={word}
              aria-autocomplete={"none"}
              onChange={(e) => {
                const newUserAnswers = [...userAnswers];
                newUserAnswers[idx] = e.target.value;
                setUserAnswers(newUserAnswers);
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1
                }
              }}
            />
          ))}

          {gradingState === "grading" && (
            <Stack spacing={1}>
              <Typography>Grading...</Typography>
              <LinearProgress />
            </Stack>
          )}
        </Stack>
      </Stack>

      {/* Grade Button */}
      {gradingState === "waiting" && (
        <Stack
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            padding: isSmallDevice ? 1 : 2,
            backgroundColor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => gradeAnswer()}
            sx={{ minWidth: 120 }}
          >
            Grade
          </Button>
        </Stack>
      )}
    </Paper>
  );
}
