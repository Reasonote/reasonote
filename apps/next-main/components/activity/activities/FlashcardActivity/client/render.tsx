import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {motion} from "framer-motion";

import {vAIPageContext} from "@/components/chat/ChatBubble";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {Txt} from "@/components/typography/Txt";
import {trimLines} from "@lukebechtel/lab-ts-utils";
import {Visibility} from "@mui/icons-material";
import {
  Button,
  Card,
  Divider,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  FlashcardActivityConfig,
  FlashcardActivityConfigSchema,
  FlashcardResult,
  FlashcardSubmitRequest,
} from "@reasonote/activity-definitions";

import {ActivityComponent} from "../../ActivityComponent";

export const FlashcardActivity: ActivityComponent<
  FlashcardActivityConfig,
  FlashcardSubmitRequest,
  FlashcardResult
> = ({
  config,
  callbacks,
  ai,
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const isSmallDevice = useMediaQuery('(max-width: 600px)');

  const flashcard = config;
  const { flashcardBack, flashcardFront } = flashcard;
  const [buttonChosen, setButtonChosen] = useState<"bad" | "ok" | "great" | null>(null);

  useEffect(() => {
    if (showAnswer) {
      vAIPageContext(
        trimLines(`
                The user has just shown the answer to the following flashcard:

                \`\`\`json
                <JSON>
                \`\`\`
            `).replace("<JSON>", JSON.stringify(flashcard, null, 2))
      );
    } else {
      vAIPageContext(
        trimLines(`
                The user is looking at the following flashcard: 

                \`\`\`json
                <JSON>
                \`\`\`

                They have NOT SEEN THE ANSWER YET.

                DO NOT TELL THEM THE ANSWER -- you should only help them understand the question and think it through.
            `).replace("<JSON>", JSON.stringify(flashcard, null, 2))
      );
    }
  }, [showAnswer, flashcard]);
  

  const onComplete = useCallback((whichButton: "bad" | "ok" | "great") => {
    if (!buttonChosen) {
      setButtonChosen(whichButton);
    
      // Create submission request
      const submission: FlashcardSubmitRequest = {
        attestedLevel: whichButton === "bad" ? "BAD" : whichButton === "ok" ? "OK" : "GREAT",
      };
      
      // Send submission to server for grading
      if (callbacks?.onSubmission) {
        callbacks.onSubmission(submission) 
      }
    }
  }, [buttonChosen, callbacks]);

  // Do this to make sure we have a valid format
  const parsedFlashcard = FlashcardActivityConfigSchema.safeParse(flashcard);
  if (!parsedFlashcard.success) {
    return (
      <Paper sx={{width: '100%'}}>
        <Stack padding={2} gap={2}>
          <MuiMarkdownDefault>Error: Invalid flashcard.</MuiMarkdownDefault>
          <div>
            <pre>{JSON.stringify(parsedFlashcard.error, null, 2)}</pre>
          </div>
          <Button
            onClick={() => {
              // Create submission request for error case
              const submission: FlashcardSubmitRequest = {
                attestedLevel: "OK"
              };
              
              // Send submission to server for grading
              if (callbacks?.onSubmission) {
                callbacks.onSubmission(submission)
              }
            }}
          >
            Next
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{width: '100%'}}>
      <Stack padding={2} gap={2}>
        <div style={{zoom: isSmallDevice ? 1.05 : 1.25}}>
          <MuiMarkdownDefault>{flashcardFront}</MuiMarkdownDefault>
        </div>
        
        {showAnswer ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Stack gap={2}>
              <Card 
                elevation={5} 
                sx={{
                  padding: isSmallDevice ? 1 : 3,
                  zoom: isSmallDevice ? 1.1 : 1.5,
                  transform: 'translateY(0)',
                  backgroundColor: 'background.paper',
                }}
              >
                <MuiMarkdownDefault>
                  {flashcardBack}
                </MuiMarkdownDefault>
              </Card>
            
              <Divider/>
              <Stack gap={2}>
                <Typography textAlign={'center'} variant="body1"
                color="text.secondary"
                
                >How was that?</Typography>
                <Stack
                  direction="row"
                  alignContent={"center"}
                  justifyContent={"center"}
                  alignItems={"center"}
                  justifyItems={"center"}
                  gap={5}
                >
                  <Button
                    variant={buttonChosen === "bad" ? "contained" : "outlined"}
                    onClick={() => onComplete("bad")}
                    color="error"
                    sx={{
                      width: '120px',
                      borderWidth: '3px',
                      borderRadius: '10px',
                      '&:hover': {
                        borderWidth: '4px',
                      }
                    }}
                  >
                    <b>Tough</b>
                  </Button>
                  <Button
                    variant={buttonChosen === "ok" ? "contained" : "outlined"}
                    color="warning"
                    onClick={() => onComplete("ok")}
                    sx={{
                      width: '120px',
                      borderWidth: '3px',
                      borderRadius: '10px',
                      '&:hover': {
                        borderWidth: '4px',
                      }
                    }}
                  >
                    <b>Okay</b>
                  </Button>
                  <Button
                    variant={buttonChosen === "great" ? "contained" : "outlined"}
                    color="success"
                    onClick={() => onComplete("great")}
                    sx={{
                      width: '120px',
                      borderWidth: '3px',
                      borderRadius: '10px',
                      '&:hover': {
                        borderWidth: '4px',
                      }
                    }}
                  >
                    <b>Easy</b>
                  </Button>
                </Stack> 
              </Stack>
            </Stack>
          </motion.div>
        ) : (
          <Card
            onClick={() => setShowAnswer(true)}
            sx={{
              padding: 3,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              backgroundColor: 'background.paper',
              opacity: 0.7,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
                opacity: 0.9,
              },
            }}
            elevation={5}
          >
            <Txt 
              variant="body1" 
              color="text.secondary" 
              align="center"
              startIcon={<Visibility/>}
              stackOverrides={{
                alignItems: 'center',
                justifyItems: 'center',
                alignContent: 'center',
                justifyContent: 'center',
              }} 
            >
              Click to reveal answer
            </Txt>
          </Card>
        )}
      </Stack>
    </Paper>
  );
}
