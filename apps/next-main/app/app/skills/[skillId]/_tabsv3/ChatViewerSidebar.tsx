'use client'
import {
  useEffect,
  useState,
} from "react";

import {ChatV2} from "@/components/chat/ChatV2";
import {useMutation} from "@apollo/client";
import {
  ChatBubble,
  Close,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import {createChatFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";

// ChatViewer component - just the content without chrome
export const ChatViewer = ({ skillId }: { skillId: string }) => {
  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Create a chat mutation
  const [createChat] = useMutation(createChatFlatMutDoc);
 
  // Create a chat when the component mounts if one doesn't exist
  useEffect(() => {
    const initializeChat = async () => {
      if (!chatId) {
        try {
          // Create a new chat
          const res = await createChat({
            variables: {
              objects: [
                {
                  isPublic: false,
                }
              ],
            },
          });
          
          const newChatId = res.data?.insertIntoChatCollection?.records[0]?.id;
          
          if (newChatId) {
            setChatId(newChatId);
            console.log(`Created new chat with ID: ${newChatId}`);
          } else {
            console.error("Failed to create chat: No chat ID returned");
          }
        } catch (error) {
          console.error("Error creating chat:", error);
        }
      }
    };
    
    initializeChat();
  }, [chatId, createChat, skillId]);

  // Define tools for the skill assistant
  const skillTools = [
    {
      name: 'OfferUserOptions',
    },
  ];

  // Skill-specific system prompt
  const systemPrompt = `You are a helpful AI assistant, who is intended to help the user understand the given skill.`;

  return (
    <Box sx={{ 
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      height: '100%',
      width: '100%'
    }}>
      {chatId ? (
        <ChatV2
          chatId={chatId}
          botInfo={DEFAULT_BOT_INFO}
          textSendIsDisabled={isGenerating}
          botThinkingIcon={<ChatBubble sx={{ fontSize: 24, color: 'text.secondary', opacity: 0.5, mb: 2 }} />}
          tools={skillTools}
          systemPrompt={systemPrompt}
          contextInjectors={{
            RootSkill: {
              config: {
                skillId: skillId,
              }
            },
            BasicUserInfo: {}
          }}
        />
      ) : (
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <ChatBubble sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
          <Typography color="text.secondary">Creating chat for this skill...</Typography>
        </Box>
      )}
    </Box>
  );
};

interface ChatViewerSidebarProps {
  skillId: string;
  onClose: () => void;
}

// Sample bot info
const DEFAULT_BOT_INFO = {
  name: "Skill Assistant",
  description: "I'm here to help you with your skill learning journey.",
  avatar: "🧠"
};

export const ChatViewerSidebar = ({
  skillId,
  onClose
}: ChatViewerSidebarProps) => {
  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        bgcolor: 'background.paper'
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" component="h2" sx={{ fontSize: '1.1rem' }}>
          Chat
        </Typography>
        <IconButton onClick={onClose} edge="end" aria-label="close" size="small">
          <Close />
        </IconButton>
      </Box>
      
      {/* Chat content area */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <ChatViewer skillId={skillId} />
      </Box>
    </Box>
  );
}; 