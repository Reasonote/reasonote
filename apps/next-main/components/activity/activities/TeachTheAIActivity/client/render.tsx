import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {z} from "zod";

import {aib} from "@/clientOnly/ai/aib";
import {SettingDisplay} from "@/components/activity/components/SettingDisplay";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {CurUserAvatar} from "@/components/users/profile/CurUserAvatar";
import {trimLines} from "@lukebechtel/lab-ts-utils";
import {
  Chat,
  CheckBox,
} from "@mui/icons-material";
import {
  Button,
  Fade,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  TeachTheAIActivityConfig,
  TeachTheAIResult,
} from "@reasonote/activity-definitions";
import {isEmoji} from "@reasonote/core";
import {uuidv4} from "@reasonote/lib-utils";
import {useAsyncMemo} from "@reasonote/lib-utils-frontend";

import {CharacterDisplay} from "../../../components/CharacterDisplay";
import {
  EphemeralChat,
  EphemeralChatMessage,
} from "../../../components/EphemeralChat";
import {GoalDisplay} from "../../../components/GoalDisplay";
import {
  ActivityComponent,
  ActivityComponentCallbacks,
} from "../../ActivityComponent";

export const TeachTheAIActivityMain: ActivityComponent<TeachTheAIActivityConfig, any, TeachTheAIResult> = 
({
  config,
  callbacks,
  ai
}) => {
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  const aiInstructions = config.version === '0.1.0' ? 
    config.characterInstructions
    :
    config.aiInstructions;

  const aiName = config.version === '0.1.0' ? config.characterName : 'Student';
  const aiIcon = config.version === '0.1.0' && isEmoji(config.characterEmoji) ? config.characterEmoji : '🧒';

  // When this first loads, create a botId for the AI.
  const botId = useAsyncMemo(async () => {
    if (!aiName){
      return null;
    }

    const res = await sb.from('bot').insert({
      name: aiName,
      prompt: aiInstructions
    }).select('*').single();

    return res.data?.id;
  }, [aiName]);


  const [messages, setMessages] = useState<
    EphemeralChatMessage[]
  >([
    {
      role: "system",
      content: trimLines(`
            You are a talented role-player who will pretend to be a student.

            Your goal is to act confused, and let the user explain the concept to you.

            The Concept you are learning is:

            "${config.skillName}"

            # Roleplay Instructions
            <AI-INSTRUCTIONS>
            
        `).replace("<AI-INSTRUCTIONS>", aiInstructions),
    },
  ]);

  const sendMessage = useCallback(
    async (message: EphemeralChatMessage) => {
      setMessages((msgs) => [...msgs, message]);
      setIsResponding(true);

      const messageId = uuidv4();
      const resp = await aib.streamGenObject({
        //@ts-ignore
        messages: [...messages, message].map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
        driverConfig: {
          type: "openai",
          config: {
            model: "gpt-4o-mini",
          },
        },
        schema: z.object({
          chainOfThought: z.string().describe('The chain of thought you used before generating your message'),
          message: z.string().describe('The message to send to the chat'),
        }),
        onPartialObject: (partial) => {
          if (!partial.message){
            return;
          }

          // First, if we don't have a message 
          setMessages((msgs) => {
            const existingMessage = msgs.find((m) => m.id === messageId);
            if (existingMessage){
              return [
                ...msgs.filter((m) => m.id !== messageId),
                {
                  ...existingMessage,
                  content: partial.message ?? '',
                },
              ]
            }
            else {
              return [
                ...msgs,
                {
                  id:   messageId,
                  role: "assistant",
                  content: partial.message ?? '',
                },
              ];
            }
          });
        },
      });

      setIsResponding(false);
    },
    [messages]);

  const {sb} = useSupabase();


  useEffect(() => {
    if (!initialMessageSent) {
      setInitialMessageSent(true);
      sendMessage({
        role: "user",
        content: "How can I help?",
      });
    }
  }, [initialMessageSent]);

  const [gradingState, setGradingState] = useState<
    "waiting" | "grading" | "graded"
  >("waiting");



  const teachingObjectives = config.version === '0.1.0' ? config.teachingObjectives : [];
  const completedObjectiveNames: string[] = [];

  const gradeAnswer = useCallback(async () => {
      setGradingState('grading');
      
      // Use server-side grading by submitting the conversation
      if (callbacks?.onSubmission) {
          await callbacks.onSubmission({
              conversation: messages,
          });
      }
      
      setGradingState('graded');
  }, [callbacks, messages]);

  const [tab, setTab] = useState<'chat' | 'objectives'>('chat');

  return (
    <Paper sx={{width: '100%'}}>
      <Stack padding={2} gap={2}>
        <Typography variant="h5">
          ❗️ {aiName} needs help!
        </Typography>
        
      
      <Tabs sx={{height: '30px', minHeight: '2.5em'}} value={tab} onChange={(e, v) => setTab(v)}>
          <Tab sx={{height: '30px', minHeight: '2.5em'}} iconPosition='start' icon={<Chat/>} label="Chat" value="chat"/>
          <Tab sx={{height: '30px', minHeight: '2.5em', maxWidth: '150px'}} iconPosition='start' icon={
              <CheckBox/>
          } label={`Teaching Objectives`} value="objectives"/>
          {/* <Tab sx={{height: '30px', minHeight: '2.5em'}} iconPosition='start' icon={<RoleplayActivityTypeClient.renderTypeIcon/>} label="Characters" value="characters"/> */}
        </Tabs>
        
        {
          tab !== 'objectives' ? null : 
          <GoalDisplay goals={teachingObjectives} />
        }
        {
          tab !== 'chat' ? null : 
          <>
            <EphemeralChat
              messages={messages.map((msg) => ({
                ...msg,
                characterName: msg.role === "user" ? "You" : aiName,
                characterIcon: msg.role === 'user' ? <CurUserAvatar/> : aiIcon,
                botId: msg.role === 'assistant' && botId ? (botId ?? undefined) : undefined,
              }))}
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
              gradeAnswer();
            }}
            size="small"
            variant="outlined"
            fullWidth={false}
          >
            I'm Done, Grade Me
          </Button>
        ) : null}
        {
          gradingState === 'grading' && (
            <Stack>
              <Typography variant="caption">
                Grading...
              </Typography>
              <LinearProgress/>
            </Stack>
          )
        }

      </Stack>
    </Paper>
  );
}

export function TeachTheAIActivityIntro({config, callbacks, onReady}: {config: TeachTheAIActivityConfig, callbacks?: ActivityComponentCallbacks<any, any>, onReady: () => void}) {
  const settingName = config.version === '0.1.0' ? config.setting.name : 'Classroom';
  const settingEmoji = config.version === '0.1.0' && isEmoji(config.setting.emoji) ? config.setting.emoji : '🏫';
  const aiName = config.version === '0.1.0' ? config.characterName : 'Student';
  const aiIcon = config.version === '0.1.0' ? config.characterEmoji : '🧒';
  const narratorIntro = config.version === '0.1.0' ? config.narratorIntro : 'You are busy working on your homework. Suddenly, a student approaches you, looking confused.';
  const objectives = config.version === '0.1.0' ? config.teachingObjectives : [];

  const onSkip = useCallback(() => {
    if (callbacks?.onSkip) {
      callbacks.onSkip({});
    }
  }, [callbacks, config]);

  return (
    <Paper>
      <Stack padding={2} gap={2}>
        <SettingDisplay name={settingName} emoji={settingEmoji} description={narratorIntro} />
        <CharacterDisplay characters={[{
          name: aiName,
          emoji: aiIcon,
          description: '' 
        }]} />

        <GoalDisplay goals={objectives} />

        {!callbacks?.hideSkipButton && (
            <Fade in={true} timeout={2000}>
              <Stack gap={2}>
                <Button onClick={() => onSkip()} variant='outlined'>
              Skip
            </Button>
            <Button onClick={() => onReady()} variant="contained" sx={{fontWeight: 'bold'}}>
              Start Teaching
            </Button>
          </Stack>
        </Fade>
        )}
      </Stack>
    </Paper>
  )
}


export const TeachTheAIActivity: ActivityComponent<TeachTheAIActivityConfig, any, TeachTheAIResult> = 
(args) => {
  const [showIntro, setShowIntro] = useState(true);

  if (showIntro){
    return <TeachTheAIActivityIntro config={args.config} callbacks={args.callbacks} onReady={() => setShowIntro(false)}/>
  }
  else {
    return <TeachTheAIActivityMain {...args}/>
  }
}