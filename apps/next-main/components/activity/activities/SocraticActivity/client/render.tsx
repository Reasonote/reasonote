import {
  useCallback,
  useEffect,
  useState,
} from "react";

import _ from "lodash";
import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {CurUserAvatar} from "@/components/users/profile/CurUserAvatar";
import {
  Chat,
  CheckBox,
  CheckBoxOutlineBlank,
} from "@mui/icons-material";
import {
  Button,
  Fade,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  SocraticActivityConfig,
  SocraticResult,
} from "@reasonote/activity-definitions";
import {isEmoji} from "@reasonote/core";
import {RESIChatMessageToVercelMessage} from "@reasonote/lib-ai-common";

import {
  EphemeralChat,
  EphemeralChatMessage,
} from "../../../components/EphemeralChat";
import {
  ActivityComponent,
  ActivityComponentCallbacks,
} from "../../ActivityComponent";

export const SocraticActivityMain: ActivityComponent<SocraticActivityConfig, any, SocraticResult> = 
({
  config,
  callbacks,
  ai
}) => {
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [completedObjectiveNames, setCompletedObjectiveNames] = useState<string[]>([]);

  // const aiInstructions = config.version === '0.1.0' ? 
  //   config.characterInstructions
  //   :
  //   config.aiInstructions;
  
  const aiName = 'Socrates';
  const aiIcon = '🧒';
  const learningObjectives = config.version === '0.0.0' ? config.learningObjectives : [];

  // When this first loads, create a botId for the AI.
  // const botId = useAsyncMemo(async () => {
  //   if (!aiName){
  //     return null;
  //   }

  //   const res = await sb.from('bot').insert({
  //     name: aiName,
  //     prompt: aiInstructions
  //   }).select('*').single();

  //   return res.data?.id;
  // }, [aiName]);
  const botId = undefined;


  const [messages, setMessages] = useState<
    EphemeralChatMessage[]
  >([
    // {
    //   role: "system",
    //   content: trimLines(`
            
    //     `)
    // },
  ]);

  const onSkip = useCallback(() => {
    callbacks?.onComplete?.({
      type: "skipped",
      activityType: 'socratic',
      resultData: {},
      activityConfig: config,
    })
  }, [callbacks, config]);

  const sendMessage = useCallback(
    async (message: EphemeralChatMessage) => {
      const newMessages = [...messages, message];
      setMessages((msgs) => newMessages);
      setIsResponding(true);
      const resp = await oneShotAIClient({
        systemMessage: `
          <YOUR_TASKS>
            You will be given a subject by the system, and the user's level of familiarity with it, and their age level.

            You have a few main tasks, which you'll perform in order.
            
            <TASK_1>
              Greet the user. You are responsible for asking the user questions about things they may have experienced which would relate to the given subject, and would be good fodder for an example of explaining that subject. Feel free to linger in this phase and ask a few leading questions to tease them before you move on to Task 2.
            </TASK_1>
            <TASK_2>
            Once you feel confident based on the user's answers that they have experienced something you could use as a really strong example of the subject, use the socratic method to guide them closer to the concept you're explaining. Don't overwhelm them with each message. You should let the example they've given guide your explanation.
            
            Your explanation should be in the form of a dialogue. So, you prompt them with questions to guide them to the concept. DO NOT dump the whole concept on them at once.
            
            You shouldn't use jargon they may not be familiar with yet.
            </TASK_2>
            
            <TASK_3>
            Once you've teased them towards the answer, without using any jargon, and you feel like you have them very close, you should say something like: "The concept of X is kind of like your situation..." or "X is kind of like that." 
            
            Explain the concept in a sentence or two. 
            
            If they don't get it, then you should switch to another example, and try again. But keep your messages short.

            Once you feel like they basically get a concept, you can set the 'completedObjectives' field to list the objectives they've completed.

            The chat will end when you mark the last objective complete.

            Once you mark the last objective complete, make sure you say something like "👋 bye for now!", but flavored to match the speed of the conversation.
            </TASK_3>


            <FINAL_NOTES>
              - REMEMBER: when they complete an objective, you should mark it as complete in the 'completedObjectives' field.
              - REMEMBER: avoid jargon, and only move as fast as the user can keep up.
              - REMEMBER: limit your messages to 3 sentences maximum, unless the user specifically asks for more.
              - REMEMBER: you are trying to guide the user to the concept, not just dump it on them.
            </FINAL_NOTES>

          </YOUR_TASKS>

          <CONTEXT>
            <SUBJECT description="The main subject of the activity.">
              ${config.skillName}
            </SUBJECT>
            <LEARNING_OBJECTIVES>
              ${learningObjectives.map((objective) => `
                <OBJECTIVE name="${objective.name}" description="${objective.objective}"/>
              `).join('')}
            </LEARNING_OBJECTIVES>
          </CONTEXT>
        `,
        functionName: "output_message",
        functionDescription: 'Output a message to the user. Optionally, specify if they have completed any learning objectives.',
        functionParameters: z.object({
          message: z.string().describe('The message to output to the user.'),
          completedObjectives: z.array(z.string()).optional().nullable().describe('The learning objectives the user has completed.'),
        }),
        otherMessages: newMessages.map(RESIChatMessageToVercelMessage),
      })

      setIsResponding(false);
      if (resp.data) {
        setCompletedObjectiveNames((old) => _.uniq([
          ...old, ...(resp.data?.completedObjectives ?? [])
        ]));

        setMessages((msgs) => [
          ...msgs,
          {
            role: "assistant",
            function_call: {
              name: "output_message",
              arguments: {
                raw: JSON.stringify(resp.data),
                parsed: resp.data,
              }
            }
          },
        ]);
      }
    },
  [messages, learningObjectives]);

  const {sb} = useSupabase();


  useEffect(() => {
    if (!initialMessageSent) {
      setInitialMessageSent(true);
      sendMessage({
        role: "user",
        content: "Hello!",
      });
    }
  }, [initialMessageSent]);

  const [gradingState, setGradingState] = useState<
    "waiting" | "grading" | "graded"
  >("waiting");


  const [tab, setTab] = useState<'chat' | 'objectives'>('chat');

  const numObjectivesComplete = _.uniq(completedObjectiveNames).length;
  const allObjectivesCompleted = numObjectivesComplete === learningObjectives.length;

  return (
    <Paper sx={{width: '100%'}}>
      <Stack padding={2} gap={2}>
        {/* <Typography variant="h6">
          Let's Cover Some Basics! 
        </Typography> */}
        
      
      <Tabs sx={{height: '30px', minHeight: '2.5em'}} value={tab} onChange={(e, v) => setTab(v)}>
          <Tab sx={{height: '30px', minHeight: '2.5em'}} iconPosition='start' icon={<Chat/>} label="Chat" value="chat"/>
          <Tab sx={{height: '30px', minHeight: '2.5em', maxWidth: '150px'}} iconPosition='start' icon={
              <CheckBox/>
          } label={<Stack>
            <Txt fontSize={'small'}>Objectives</Txt>
            <Txt>({numObjectivesComplete}/{learningObjectives.length})</Txt>

          </Stack>} value="objectives"/>
          {/* <Tab sx={{height: '30px', minHeight: '2.5em'}} iconPosition='start' icon={<RoleplayActivityTypeClient.renderTypeIcon/>} label="Characters" value="characters"/> */}
        </Tabs>
        
        {
          tab !== 'objectives' ? null : 
          <Stack gap={2}>
            {
              learningObjectives.map((objective) => {
                const itemIsCompleted = completedObjectiveNames.includes(objective.name);
                
                return <Stack gap={2}>
                  <Grid container gridAutoFlow={'row'} gap={.5}>
                  <Grid item xs={.5}>
                    {
                      itemIsCompleted ?
                        <CheckBox color={"primary"}/>
                        :
                        <CheckBoxOutlineBlank/>
                    }
                  </Grid>
                  <Grid item xs={11}>
                    <Stack>
                      <Typography variant="body1">
                        <span style={{textDecoration: itemIsCompleted ? 'line-through' : undefined}}>{objective.name}</span>
                      </Typography>
                      <Typography variant="caption">
                        {objective.objective}
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
                </Stack>
              })
            }
          </Stack>
        }
        
        {
          tab !== 'chat' ? null : 
          <>
            <EphemeralChat
              messages={messages.map((msg) => {
                if (msg.role === 'assistant'){
                  return ({
                    role: 'assistant',
                    content: msg.function_call?.arguments ? msg.function_call.arguments.parsed.message : '',
                    characterName: aiName,
                    characterIcon: aiIcon,
                    botId: msg.role === 'assistant' && botId ? (botId ?? undefined) : undefined,
                  })
                }
                else {
                  return {
                    ...msg,
                    characterName: 'You',
                    characterIcon: <CurUserAvatar/>,
                  }
                } 
              })}
              sendOnMount={true}
              isResponding={isResponding}
              onSend={async (message) => {
                sendMessage(message);
              }}
            />
          </>
        }

        {gradingState === "waiting" ? (
          <Button
            onClick={() => {
              onSkip();
            }}
            size="small"
            fullWidth={false}
            variant={allObjectivesCompleted ? 'contained' : 'outlined'}
          >
            I'm Done, Move On
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}

export function SocraticActivityIntro({config, callbacks, onReady}: {config: SocraticActivityConfig, callbacks?: ActivityComponentCallbacks<any, SocraticResult>, onReady: () => void}) {
  const settingName = config.version === '0.0.0' ? config.setting.name : 'Classroom';
  const settingEmoji = config.version === '0.0.0' && isEmoji(config.setting.emoji) ? config.setting.emoji : '🏫';
  const settingDescription = config.version === '0.0.0' ? config.setting.description : 'A classroom setting.';
  const objectives = config.version === '0.0.0' ? config.learningObjectives : [];

  const onSkip = useCallback(() => {
    callbacks?.onComplete?.({
      type: "skipped",
      activityType: 'socratic',
      resultData: {},
      activityConfig: config,
    })
  }, [callbacks, config]);


  return (
    <Paper>
      <Stack padding={2} gap={2}>
        <Typography variant="h5">
          {settingEmoji} {settingName}
        </Typography>
        <Typography>
          {settingDescription}
        </Typography>
        
        {
          objectives.length > 0 ?
          objectives.map((objective) => {
            return <Grid container gridAutoFlow={'row'} gap={.5}>
              <Grid item xs={.5}>
                <CheckBoxOutlineBlank/>
              </Grid>
              <Grid item xs={11}>
                <Stack>
                  <Typography variant="body1">
                    {objective.name}
                  </Typography>
                  <Typography variant="caption">
                    {objective.objective}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          })
          :
          undefined
        }

        <Fade in={true} timeout={2000}>
          <Stack gap={2}>
            <Button onClick={() => onSkip()} variant='outlined'>
              Skip
            </Button>
            <Button onClick={() => onReady()} variant="contained">
              Start
            </Button>
          </Stack>
        </Fade>
      </Stack>
    </Paper>
  )
}


export const SocraticActivity: ActivityComponent<SocraticActivityConfig, any, SocraticResult> = 
(args) => {
  const [showIntro, setShowIntro] = useState(true);

  if (showIntro){
    return <SocraticActivityIntro config={args.config} callbacks={args.callbacks} onReady={() => setShowIntro(false)}/>
  }
  else {
    return <SocraticActivityMain {...args}/>
  }
}