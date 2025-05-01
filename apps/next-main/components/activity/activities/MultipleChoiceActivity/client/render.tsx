import {
  useEffect,
  useMemo,
  useState,
} from "react";

import _ from "lodash";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {AnswerChoice} from "@/components/activity/components/AnswerChoice";
import {vAIPageContext} from "@/components/chat/ChatBubble";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {trimLines} from "@lukebechtel/lab-ts-utils";
import {
  Button,
  Grid,
  Paper,
  Stack,
} from "@mui/material";
import {
  MultipleChoiceActivityConfig,
  MultipleChoiceActivityTypeDefinition,
  MultipleChoiceResult,
  MultipleChoiceSubmitRequest,
} from "@reasonote/activity-definitions";

import {ActivityComponent} from "../../ActivityComponent";

export const MultipleChoiceActivity: ActivityComponent<
  MultipleChoiceActivityConfig, 
  MultipleChoiceSubmitRequest,
  MultipleChoiceResult
> = ({
  config,
  callbacks,
}) => {
    // Convert config to v1.0.0 if it's not already
    const configV1 = useMemo(() => 
        MultipleChoiceActivityTypeDefinition.convertConfigToV1_0_0(config),
        [config]
    );
    
    const [userTentativeAnswer, setUserTentativeAnswer] = useState<string | null>(null); // This is the answer that the user has selected, but not yet submitted.
    const [userAnswer, setUserAnswer] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const isSmallDevice = useIsSmallDevice()

    const orderedAnswers = useMemo(
        () => configV1?.answerChoices ? _.shuffle(configV1.answerChoices) : [],
        [configV1?.answerChoices ? JSON.stringify(configV1.answerChoices) : '[]']
    );

    useEffect(() => {
        if (userAnswer) {
            vAIPageContext(
                trimLines(`
                        The user has just completed the following multiple choice question:
                        ${JSON.stringify(configV1, null, 2)}

                        The user answered ${
                        isCorrect ? "correctly" : "incorrectly"
                        }: 
                        '''
                        ${userAnswer}
                        '''
                    `)
            );
        } else {
            vAIPageContext(
                trimLines(`
                        The user is seeking help with the following multiple choice question:
                        ${JSON.stringify(configV1, null, 2)}

                        The user has not yet answered the question.

                        You SHOULD NOT answer the question for them, but help them think through it.
                    `)
            );
        }
    }, [userAnswer, isCorrect]);

    useEffect(() => {
        if (userAnswer){
            const submitRequest: MultipleChoiceSubmitRequest = {
                userAnswer: userAnswer
            };
            
            if (callbacks?.onSubmission) {
                // Use server-side grading
                callbacks.onSubmission(submitRequest)
                    .then(submitResult => {
                        // Use optional chaining to safely access properties
                        const isCorrectResult = (submitResult as any)?.details?.isCorrect;
                        setIsCorrect(isCorrectResult); 
                    })
                    .catch(error => {
                        console.error("Error submitting multiple choice activity:", error);
                    });
            } else {
                throw new Error("No onSubmission callback provided");
            }
        }
    }, [userAnswer]);

    return (
        <Paper sx={{width: '100%', height: '100%', position: 'relative'}}>
            {/* Main scrollable content */}
            <Stack 
                padding={2} 
                gap={isSmallDevice ? 1.5 : 4} 
                alignItems={'center'} 
                justifyItems={'center'}
                sx={{
                    maxHeight: '70vh',
                    height: '100%',
                    overflowY: 'auto',
                    paddingBottom: !userAnswer ? '80px' : '16px' // Add padding at bottom to prevent content being hidden behind button
                }}
            >
                <div style={{zoom: isSmallDevice ? 1 : 1.2}}>
                    <MuiMarkdownDefault>
                    {`<b>${configV1.question}</b>`}
                    </MuiMarkdownDefault>
                </div>
                <Grid container spacing={isSmallDevice ? 1 : 2}>
                    {orderedAnswers?.map((answerChoice) => {
                        const answerText = answerChoice.text;
                        const isCorrectAnswer = answerChoice.isCorrect;
                        
                        return (
                            <AnswerChoice
                                key={answerText}
                                answerChoice={answerText}
                                isCorrectAnswer={isCorrectAnswer}
                                isUserAnswer={userAnswer === answerText}
                                isSelected={userTentativeAnswer === answerText}
                                answersSubmitted={!!userAnswer}
                                onSelectChange={(selected) => {
                                    if (selected) {
                                        setUserTentativeAnswer(answerText);
                                    } else {
                                        setUserTentativeAnswer(null);
                                    }
                                }}
                                isSmallDevice={isSmallDevice}
                                boldStyle={true}
                            />
                        );
                    })}
                </Grid>
            </Stack>

            {/* Fixed position button container */}
            {!userAnswer && (
                <Stack
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: 2,
                        backgroundColor: 'background.paper',
                        borderTop: 1,
                        borderColor: 'divider',
                    }}
                    direction="row"
                    justifyContent="center"
                >
                    <Button
                        variant="contained"
                        disabled={!userTentativeAnswer}
                        onClick={() => {
                            if (userTentativeAnswer) {
                                setUserAnswer(userTentativeAnswer);
                            }
                        }}
                        sx={{
                            width: isSmallDevice ? '100%' : 'auto',
                        }}
                    >
                        Submit
                    </Button>
                </Stack>
            )}
        </Paper>
    );
};
