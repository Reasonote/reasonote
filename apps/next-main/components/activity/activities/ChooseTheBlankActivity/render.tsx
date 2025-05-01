import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {
  Button,
  Chip,
  ChipProps,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  ChooseTheBlankActivityConfig,
  ChooseTheBlankResult,
  ChooseTheBlankSubmitResult,
} from "@reasonote/activity-definitions";
import {ActivityResultSkippedBase} from "@reasonote/core";

import {ActivityComponent} from "../ActivityComponent";

const MotionChip = motion(forwardRef<HTMLDivElement, ChipProps>((props, ref) => (
  <Chip ref={ref} {...props} />
)));

export interface WordChoice {
  id: string;
  word: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export const ChooseTheBlankActivity: ActivityComponent<
  ChooseTheBlankActivityConfig, 
  { userAnswers: string[] },
  ChooseTheBlankResult | ActivityResultSkippedBase
> = ({
  config,
  callbacks,
}) => {
  const [filledBlanks, setFilledBlanks] = useState<(WordChoice | null)[]>(
    new Array(config.hiddenWords.length).fill(null)
  );
  const [availableWords, setAvailableWords] = useState<WordChoice[]>(() => {
    const words = config.wordChoices.map((word, index) => ({
      id: `word-${index}-${word}`,
      word: word
    }));
    return shuffleArray(words);
  });

  const [gradingState, setGradingState] = useState<"waiting" | "grading" | "graded" | "error">("waiting");
  const [gradePerBlank, setGradePerBlank] = useState<number[]>(new Array(config.hiddenWords.length).fill(0));
  const [gradingError, setGradingError] = useState<string | null>(null);

  const isSmallDevice = useIsSmallDevice()
  const theme = useTheme();
  const handleBlankClick = (index: number) => {
    if (gradingState === "graded" || gradingState === "grading") return;

    const adjustedIndex = index - 1; // Convert from 1-based to 0-based index
    if (filledBlanks[adjustedIndex] !== null) {
      const wordChoice = filledBlanks[adjustedIndex]!;
      const newFilledBlanks = [...filledBlanks];
      newFilledBlanks[adjustedIndex] = null;
      setFilledBlanks(newFilledBlanks);
      setAvailableWords([...availableWords, wordChoice]);
    }
  };

  const handleWordClick = (wordChoice: WordChoice) => {
    if (gradingState === "graded" || gradingState === "grading") return;

    const firstEmptyIndex = filledBlanks.findIndex(blank => blank === null);
    if (firstEmptyIndex !== -1) {
      const newFilledBlanks = [...filledBlanks];
      newFilledBlanks[firstEmptyIndex] = wordChoice;
      setFilledBlanks(newFilledBlanks);
      setAvailableWords(availableWords.filter(w => w.id !== wordChoice.id));
    }
  };

  function blankout() {
    const text = config.text;
    const matches = text.matchAll(/<span id="hidden-word-(\d+)">(.*?)<\/span>/g);

    function spanWrapper(text: string, color: string = theme.palette.info.dark, size: string = 'medium') {
      const isInteractive = gradingState !== "graded" && gradingState !== "grading";
      return `<span style="font-weight:bold;color:${color};font-size:${size};text-decoration:underline;${isInteractive ? 'cursor:pointer;' : ''}" ${isInteractive ? `data-blank-index="${text.split(':')[0]}"` : ''}>${text}</span>`
    }

    let blankedOut = text;

    for (const match of matches) {
      const index = parseInt(match[1]);
      const hiddenWord = match[2]?.trim();

      if (gradingState !== "graded") {
        const blankFill = !filledBlanks?.[index - 1] ?
          `\\\_`.repeat(hiddenWord.length) :
          filledBlanks[index - 1]?.word;

        blankedOut = blankedOut.replace(match[0], spanWrapper(`${index}:\\\_${blankFill}`));
      } else {
        const userAnswer = filledBlanks[index - 1]?.word;
        const isCorrect = gradePerBlank[index - 1] === 100;
        const isPartiallyCorrect = gradePerBlank[index - 1] > 0;
        blankedOut = blankedOut.replace(
          match[0],
          spanWrapper(
            userAnswer === hiddenWord ? `${userAnswer}` : `${userAnswer} → ${hiddenWord}`,
            isCorrect ? theme.palette.success.main : isPartiallyCorrect ? theme.palette.warning.main : theme.palette.error.main,
            'large'
          )
        );
      }
    }

    return blankedOut;
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (gradingState === "graded" || gradingState === "grading") return;

      const target = e.target as HTMLElement;
      const blankElement = target.closest('[data-blank-index]');
      if (blankElement instanceof HTMLElement) {
        const index = parseInt(blankElement.getAttribute('data-blank-index')!);
        handleBlankClick(index);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [filledBlanks, gradingState]);

  const gradeAnswer = useCallback(async () => {
    setGradingState("grading");
    setGradingError(null);

    try {
      const userAnswers = filledBlanks.map(b => b?.word ?? '');
      
      // Use the onSubmission callback instead of directly calling the grader
      const gradeResult = await callbacks?.onSubmission?.({userAnswers});
      
      if (!gradeResult) {
        throw new Error("No grade result returned");
      }
      
      // Set the grade per blank for UI display
      if (gradeResult.submitResult) {
        const submitResult = gradeResult.submitResult as ChooseTheBlankSubmitResult;
        if (submitResult.details.gradePerBlank) {
          const grades = submitResult.details.gradePerBlank.map(item => item.grade0To100);
          setGradePerBlank(grades);
        }
      }
      
      setGradingState("graded");
    } catch (error) {
      console.error("Grading failed:", error);
      setGradingError(error instanceof Error ? error.message : "An unknown error occurred while grading");
      setGradingState("error");
    }
  }, [filledBlanks, callbacks]);

  const blankedOut = useMemo(() => blankout(), [config, filledBlanks, gradingState]);

  return (
    <Paper sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <Stack
        padding={isSmallDevice ? 1.5 : 2}
        gap={isSmallDevice ? 0.5 : 2}
        sx={{
          maxHeight: '70vh',
          height: '100%',
          overflowY: 'auto',
          paddingBottom: gradingState === "waiting" ? '80px' : '16px' // Add padding for fixed button
        }}
      >
        <div style={{ minHeight: '80px' }}>
          <MuiMarkdownDefault>
            {blankedOut}
          </MuiMarkdownDefault>
        </div>

        <Divider />

        {(gradingState !== "graded" || !isSmallDevice) && (
          <>
            <Typography variant="subtitle1">Available Words:</Typography>
            <Stack direction="row" gap={isSmallDevice ? 0.5 : 1} flexWrap="wrap">
              <AnimatePresence mode="popLayout">
                {availableWords.map(word => (
                  <MotionChip
                    key={word.id}
                    label={word.word}
                    onClick={() => handleWordClick(word)}
                    disabled={gradingState === "graded" || gradingState === "grading"}
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                      mass: 1
                    }}
                  />
                ))}
              </AnimatePresence>
            </Stack>
          </>
        )}

        {gradingState === "grading" && (
          <Stack>
            <Typography>Grading...</Typography>
            <LinearProgress />
          </Stack>
        )}

        {gradingState === "error" && (
          <Stack gap={2}>
            <Typography color="error">
              Unable to grade your answer. Please try again.
            </Typography>
            {gradingError && (
              <Typography variant="body2" color="error">
                Error: {gradingError}
              </Typography>
            )}
            <Button
              onClick={() => {
                setGradingState("waiting");
                setGradingError(null);
              }}
              variant="contained"
              color="primary"
            >
              Try Again
            </Button>
          </Stack>
        )}
      </Stack>

      {/* Fixed position button container */}
      {gradingState === "waiting" && (
        <Stack
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: isSmallDevice ? 1 : 2,
            backgroundColor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            alignItems: 'center'
          }}
        >
          <Button
            onClick={gradeAnswer}
            disabled={filledBlanks.some(blank => blank === null)}
            variant="contained"
            color="primary"
          >
            Submit
          </Button>
        </Stack>
      )}
    </Paper>
  );
};
