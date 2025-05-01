import {
  useCallback,
  useMemo,
  useState,
} from "react";

import _ from "lodash";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {BaseCallout} from "@/components/cards/BaseCallout";
import {
  Chat,
  CheckBox,
  CheckBoxOutlineBlank,
  QuestionMark,
} from "@mui/icons-material";
import {
  Avatar,
  Badge,
  Button,
  Fade,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import {
  RoleplayActivityConfig,
  RoleplayResult,
  RoleplaySubmitRequest,
} from "@reasonote/activity-definitions";

import {CharacterDisplay} from "../../../components/CharacterDisplay";
import {
  EphemeralChat,
  EphemeralChatMessage,
  EphMessageWithCharacterInfo,
} from "../../../components/EphemeralChat";
import {GoalDisplay} from "../../../components/GoalDisplay";
import {SettingDisplay} from "../../../components/SettingDisplay";
import {
  ActivityComponent,
  ActivityComponentCallbacks,
} from "../../ActivityComponent";
import {RoleplayActivityTypeClient} from "./";
import {CheckIfObjectivesCompleted} from "./checkIfObjectivesCompleted";
import {performRoleplay} from "./performRoleplay";

export const RoleplayActivity: ActivityComponent<
  RoleplayActivityConfig,
  RoleplaySubmitRequest,
  RoleplayResult
> = (args) => {
  const [showingIntro, setShowingIntro] = useState(true);

  //  TODO: paper needed here?
  return <Paper sx={{ width: '100%' }}>
    {
      showingIntro ?
        <RoleplayActivityIntroScreen config={args.config} callbacks={args.callbacks} onReady={() => setShowingIntro(false)} />
        :
        <RoleplayActivityMain
          config={args.config}
          callbacks={args.callbacks}
          ai={args.ai}
        />
    }
  </Paper>
}


export const RoleplayActivityMain: ActivityComponent<
  RoleplayActivityConfig,
  RoleplaySubmitRequest,
  RoleplayResult
> = ({
  config,
  callbacks,
  ai,
}) => {
    const [gradingState, setGradingState] = useState<
      "waiting" | "grading" | "graded" | "error"
    >("waiting");
    const [gradingError, setGradingError] = useState<string | null>(null);

    const theme = useTheme();
    const isSmallDevice = useIsSmallDevice();

    const [grade, setGrade] = useState<number | null>(null);
    const [gradePerWord, setGradePerWord] = useState<{ hiddenWord: string, grade0To100: number }[] | null>(null);
    const [messages, setMessages] = useState<EphMessageWithCharacterInfo[]>([]);
    const [isResponding, setIsResponding] = useState(false);
    const [completedObjectiveNames, setCompletedObjectiveNames] = useState<string[]>([]);

    const allObjectivesCompleted = useMemo(() => config?.userCharacter?.objectives?.every((obj) => {
      return completedObjectiveNames.includes(obj.objectiveName);
    }), [completedObjectiveNames, config.userCharacter.objectives]);

    const noObjectivesCompleted = completedObjectiveNames.length === 0;
    const someObjectivesCompleted = completedObjectiveNames.length > 0;
    const mostObjectivesCompleted = completedObjectiveNames.length > config.userCharacter.objectives.length / 2;

    // useEffect(() => {
    //   // TODO:
    //   // if (gradingState === "graded") {
    //   //   vAIPageContext(
    //   //     trimLines(`
    //   //             The user has just received their grade for a fill in the blank exercise.

    //   //             # Question
    //   //             \`\`\`json
    //   //             <JSON>
    //   //             \`\`\`

    //   //             # User Answers
    //   //             \`\`\`json
    //   //             <USER_ANSWERS>
    //   //             \`\`\`

    //   //             # Grade
    //   //             \`\`\`json
    //   //             <GRADE>
    //   //             \`\`\`
    //   //         `)
    //   //       .replace("<JSON>", JSON.stringify(data, null, 2))
    //   //       .replace("<USER_ANSWERS>", JSON.stringify(userAnswers, null, 2))
    //   //       .replace("<GRADE>", JSON.stringify({ grade, explanation }, null, 2))
    //   //   );
    //   // } else {
    //   //   vAIPageContext(
    //   //     trimLines(`
    //   //             The user is trying to answer the following fill in the blank exercise. 

    //   //             # Question
    //   //             \`\`\`json
    //   //             <JSON>
    //   //             \`\`\`

    //   //             # User Answers (So Far)
    //   //             \`\`\`json
    //   //             <USER_ANSWERS>
    //   //             \`\`\`

    //   //             They have NOT SEEN THE ANSWER YET.

    //   //             DO NOT TELL THEM THE ANSWER -- you should only help them understand the question and think it through.
    //   //             `)
    //   //       .replace("<JSON>", JSON.stringify(data, null, 2))
    //   //       .replace("<USER_ANSWERS>", JSON.stringify(userAnswers, null, 2))
    //   //   );
    //   // }
    // }, [showAnswer, data]);

    const checkForCompletedObjectives = useCallback(async () => {
      // TODO: ask the AI if our objectives are completed
      const checkResult = await CheckIfObjectivesCompleted({
        messages: messages,
        config: config
      });

      const checkData = checkResult.data;

      if (!checkData) {
        console.log(`No check data from CheckIfObjectivesCompleted`);
      }

      checkData?.result.objectivesCompleted?.forEach((objCompl) => {
        setCompletedObjectiveNames((names) => _.uniq([...names, objCompl.objectiveName]));
      })
    }, [messages, completedObjectiveNames]);

    const sendMessage = useCallback(
      async (message: EphemeralChatMessage) => {
        const newMessage: EphMessageWithCharacterInfo = {
          ...message,
          characterName: "User",
        };
        setMessages((msgs) => [...msgs, newMessage]);

        setIsResponding(true);
        const resp = await performRoleplay({
          messages: [...messages, newMessage],
          config: config
        });

        setIsResponding(false);

        if (!resp) {
          console.error(`No response data from performRoleplay`);
          return;
        }

        const character = config.characters.find((char) => char.public.name === resp.characterToSpeak);


        setMessages((msgs) => [
          ...msgs,
          {
            role: "assistant",
            content: resp.messageContent,
            characterName: resp.characterToSpeak,
            characterIcon: character?.public.emoji ? character?.public.emoji : undefined,
          },
        ]);

        if (messages.length > 2 && !allObjectivesCompleted) {
          await checkForCompletedObjectives();
        }
      },
      [messages, allObjectivesCompleted]
    );

    const gradeAnswer = useCallback(async () => {
      try {
        setGradingState("grading");

        // Use the onSubmission callback instead of directly calling the grader
        const gradeResult = await callbacks?.onSubmission?.({ messages });

        if (!gradeResult) {
          throw new Error("No grade result returned");
        }

        setGradingState("graded");
      } catch (error) {
        console.error("Grading failed:", error);
        setGradingError(error instanceof Error ? error.message : "An unknown error occurred while grading");
        setGradingState("error");
      }
    }, [messages, callbacks]);

    const [tab, setTab] = useState<'chat' | 'objectives' | 'characters'>('chat');

    return (
      <Stack padding={2} gap={2}>
        <Typography variant="h5">
          {config.setting.name}
        </Typography>
        <Typography variant="caption">
          {config.setting.description}
        </Typography>

        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab icon={<Chat />} label="Chat" value="chat" />
          <Tab icon={
            <Badge badgeContent={`${completedObjectiveNames.length}/${config.userCharacter.objectives.length}`} color={
              noObjectivesCompleted ? 'error' :
                someObjectivesCompleted ? 'warning' :
                  mostObjectivesCompleted ? 'info' : 'success'
            }>
              <CheckBox />
            </Badge>
          } label={`Objectives`} value="objectives" />
          <Tab icon={<RoleplayActivityTypeClient.renderTypeIcon />} label="Characters" value="characters" />
        </Tabs>

        {
          tab !== 'objectives' ? null : config?.userCharacter?.objectives?.map((objective) => {
            const itemIsCompleted = completedObjectiveNames.includes(objective.objectiveName);

            return <Grid container gridAutoFlow={'row'} gap={.5} key={objective.objectiveName}>
              <Grid item xs={.5}>
                {
                  completedObjectiveNames.includes(objective.objectiveName) ?
                    <CheckBox color={"primary"} />
                    :
                    <CheckBoxOutlineBlank />
                }
              </Grid>
              <Grid item xs={11}>
                <Stack>
                  <Typography variant="body1">
                    <span style={{ textDecoration: itemIsCompleted ? 'line-through' : undefined }}>{objective.objectiveName}</span>
                  </Typography>
                  <Typography variant="caption">
                    {objective.objectiveDescription}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          })
        }

        {
          tab === 'characters' ?
            <Stack>
              {
                config.characters.map((char) => {
                  return <Grid container gridAutoFlow={'row'} gap={.5} key={char.public.name}>
                    <Grid item xs={1}>
                      <Avatar>
                        {char.public?.emoji && char.public.emoji.length < 10 ? char.public.emoji : ''}
                      </Avatar>
                    </Grid>
                    <Grid item xs={9}>
                      <Stack>
                        <Typography variant="body1">
                          {char.public.name}
                        </Typography>
                        <Typography variant="caption">
                          {char.public.description}
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                })
              }
            </Stack>
            :
            null
        }

        {
          tab === 'chat' ?
            <EphemeralChat
              messages={messages}
              onSend={(message) => {
                sendMessage(message);
              }}
              stackProps={{
                sx: {
                  height: isSmallDevice ? '40dvh' : '50dvh'
                }
              }}
              isResponding={isResponding}
              emptyChatInfoBubble={
                <BaseCallout
                  icon={<QuestionMark />}
                  header={<Typography variant="h6">Roleplay Chat</Typography>}
                  backgroundColor={theme.palette.gray.dark}
                  sx={{ paper: { padding: '10px' } }}
                >
                  <i>Send a Message to Start the Roleplay</i>
                </BaseCallout>
              }
            />
            :
            null
        }



        <Button onClick={() => gradeAnswer()} variant={allObjectivesCompleted ? 'contained' : 'outlined'}>
          I'm Done - Grade Me
        </Button>
        {
          gradingState === 'grading' && (
            <Stack>
              <Typography variant="caption">
                Grading...
              </Typography>
              <LinearProgress />
            </Stack>
          )
        }
        {
          gradingState === 'error' && gradingError && (
            <Stack>
              <Typography variant="caption" color="error">
                Error: {gradingError}
              </Typography>
            </Stack>
          )
        }
      </Stack>
    );
  }


export function RoleplayActivityIntroScreen({ config, callbacks, onReady }: {
  config: RoleplayActivityConfig,
  callbacks?: ActivityComponentCallbacks<{ messages: EphMessageWithCharacterInfo[] }, RoleplayResult>,
  onReady: () => void
}) {
  const onSkip = useCallback(() => {
    callbacks?.onSkip?.({})
  }, [callbacks, config]);

  return (
    <Stack padding={2} gap={2}>
      <SettingDisplay
        name={config.setting.name}
        emoji={config.setting.emoji ?? '🌎'}
        description={config.setting.description}
      />
      <CharacterDisplay characters={config.characters.map(char => ({
        name: char.public.name,
        emoji: char.public.emoji,
        description: char.public.description
      }))} />

      <GoalDisplay goals={config.userCharacter.objectives} />

      {callbacks?.hideSkipButton ? null : (
        <Fade in={true} timeout={2000}>
          <Stack gap={2}>
            <Button onClick={() => onSkip()} variant='outlined'>
              Skip
            </Button>
            <Button onClick={() => onReady()} variant="contained" sx={{ fontWeight: 'bold' }}>
              Start Roleplay
            </Button>
          </Stack>
        </Fade>
      )
      }
    </Stack>
  );
}