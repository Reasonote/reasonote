import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {
  CheckBoxOutlined,
  Dangerous,
} from "@mui/icons-material";
import {
  Card,
  Divider,
  Grid,
  Paper,
  Stack,
  useTheme,
} from "@mui/material";
import {
  MultipleChoiceActivityConfig,
  MultipleChoiceResult,
} from "@reasonote/activity-definitions";

interface MultipleChoiceExerciseProps {
      config: MultipleChoiceActivityConfig;
      callbacks?: {
        onComplete?: (result: MultipleChoiceResult) => void;
      };
}


export function MultipleChoiceActivityPreviewWithAnswers({
    config,
    callbacks,
}: MultipleChoiceExerciseProps) {
    const isSmallDevice = useIsSmallDevice()
    const theme = useTheme();
    return (
        <Paper sx={{width: '100%'}}>
        <Stack padding={2} gap={4} alignItems={'center'} justifyItems={'center'}>
            <MuiMarkdownDefault>
            {config.question}
            </MuiMarkdownDefault>
            <Grid container spacing={2}>
            {config.answerChoices.map((answerChoice) => {
                const icon = answerChoice.isCorrect ? 
                    <CheckBoxOutlined />
                    :
                    <Dangerous/>;
            
                
                const thisIsTheCorrectAnswer = answerChoice.isCorrect;
                const shouldBeFaded = !thisIsTheCorrectAnswer;

                const bgColor = thisIsTheCorrectAnswer
                    ? 
                    theme.palette.success.dark

                    : undefined;

                return (
                <Grid item sx={{width: isSmallDevice ? '100%' : '50%'}}>
                    <Card
                        elevation={shouldBeFaded ? 4 : 10}
                        // sx={{
                        //     '&:hover': {
                        //     // Add zoom
                        //     transform: 'scale(1.03)',
                        //     // Add highlight contrast effect
                        //     filter: 'brightness(1.2)',
                        //     },
                        //     // Add zoom transition
                        //     transition: 'transform .2s',
                        //     cursor: "pointer",
                        //     backgroundColor: bgColor,
                        //     padding: '10px',
                        // }}
                    >
                    <Stack direction='row' gap={2}>
                        <div>
                        {icon}
                        </div>
                        <MuiMarkdownDefault>
                        {answerChoice}
                        </MuiMarkdownDefault>
                    </Stack>
                    </Card>
                </Grid>
                );
            })}
            </Grid>
            <Divider/>
            {/* {
            !userAnswer ?
                <Button 
                sx={{visibility: !userTentativeAnswer ? 'hidden' : 'unset'}}
                disabled={!userTentativeAnswer}
                startIcon={<Checklist/>}
                variant={'contained'}
                onClick={() => {
                setUserAnswer(userTentativeAnswer)
                
                }}>
                Done
                </Button>
                :
                null
            } */}
        </Stack>
        </Paper>
    );
}
