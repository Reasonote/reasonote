import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {useApolloClient} from "@apollo/client";
import {trimAllLines} from "@lukebechtel/lab-ts-utils";
import {
  AI_EXPLAINERS,
  aiExplainerFormat,
} from "@reasonote/core-static-prompts";
import {RNCoreMessage} from "@reasonote/lib-ai-common";
import {ChatMessageFlatFragFragment} from "@reasonote/lib-sdk-apollo-client";
import {
  JSONSafeParse,
  notEmpty,
  uuidv4,
} from "@reasonote/lib-utils";

import {ChatDumbComponent} from "./ChatDumb";
import {useChat} from "./hooks/useChat";

export interface ChatInnerComponentProps {
    chatId: string;
    systemContextMessage?: string;
    suggestedNextMessages?: string[];
    onSendStart?: (textToSend: string) => any;
    onSendComplete?: (textToSend: string, result: any) => any;
}


export function ChatMessageToCoreMessage(chatMessage: ChatMessageFlatFragFragment): (RNCoreMessage & {id: string}) | null {
  // Handle assistant messages with function calls
  if (chatMessage.role === "assistant" && chatMessage.functionCall) {
    // If it isn't a json object, we need to parse it.
    let functionCall = JSONSafeParse(chatMessage.functionCall)?.data;

    if (!functionCall) {
      console.error('Failed to parse function call', chatMessage.functionCall);
      return null;
    }

    return {
      id: chatMessage.id,
      role: "assistant",
      content: [{
        type: "tool-call" as const,
        toolCallId: functionCall.id,
        toolName: functionCall.name,
        args: functionCall.arguments,
      }],
    };
  }

  return {
    id: chatMessage.id,
    role: chatMessage.role === "assistant" ? "assistant" : 
          chatMessage.role === "system" ? 
            (chatMessage.contextType ? "context" : "system") : 
            (chatMessage.role === "tool" ? "tool" : "user"),
    content: chatMessage.body || "",
    contextData: chatMessage.contextData,
    contextId: chatMessage.contextId,
    contextType: chatMessage.contextType,
  } as RNCoreMessage & {id: string};
}

export function ChatInnerComponent(
    {
        suggestedNextMessages: propSuggestedNextMessages,
        onSendStart,
        onSendComplete, 
        ...props
    }: ChatInnerComponentProps
) {
    const { chatId } = props;
    //////////////////////////////////
    const ac: any = useApolloClient();

    const { sendMessage, fetchResponse: chatMessagesResult, suggestNextMessages } = useChat({
      chatId,
    });
  
    const [isGenerating, setIsGenerating] = useState(false);
    const [text, setText] = useState("");
    const [suggestedMessages, setSuggestedMessages] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
    // TODO: Picking the authors should have some smarts applied to it. Can pick the authors by some sort of topic, or something like that.
    // TODO: Add a way to add your own author
    const [chatMemberIds, setChatMemberIds] = useState<string[]>(() => {
      return [];
    });


    // Load suggested next messages when the component mounts with a new chatId
    useEffect(() => {
      setSuggestedMessages([]);
      const loadSuggestedMessages = async () => {
        if (!chatId) return;
        
        // Only load suggested messages if there are no user messages in the chat
        const hasUserMessages = chatMessagesResult.data?.chatMessageCollection?.edges?.some(
          edge => edge?.node && edge.node.role === 'user'
        );
        
        if (hasUserMessages) {
          setSuggestedMessages([]);
          return;
        }
        
        setIsLoadingSuggestions(true);
        try {
          await suggestNextMessages({
            onPartialSuggestions: (partialSuggestions) => {
              // Extract content from partial suggestions and update state
              if (partialSuggestions && Array.isArray(partialSuggestions)) {
                const messages = partialSuggestions
                  .filter(suggestion => suggestion && suggestion.content)
                  .map(suggestion => suggestion?.content as string);
                
                if (messages.length > 0) {
                  setSuggestedMessages(messages);
                }
              }
            },
            onFinish: (finalSuggestions) => {
              // Extract content from final suggestions and update state
              if (finalSuggestions && Array.isArray(finalSuggestions)) {
                const messages = finalSuggestions
                  .filter(suggestion => suggestion && suggestion.content)
                  .map(suggestion => suggestion.content);
                
                setSuggestedMessages(messages);
              }
              setIsLoadingSuggestions(false);
            },
            contextInjectors: {
              BasicUserInfo: { }
            },
            contextMessageRenderers: [
              {
                type: 'ViewingActivity'
              },
              {
                type: 'ViewingLesson'
              }
            ]
          });
        } catch (error) {
          console.error("Error loading suggested messages:", error);
          setIsLoadingSuggestions(false);
        }
      };

      loadSuggestedMessages();
    }, [chatId]);
  
    const onSend = useCallback(
      async (textToSend: string) => {
        // console.log("onSend chatId", chatId);
        // Suggestions are cleared, new history.
        onSendStart?.(textToSend);
        setIsGenerating(true);
        // Clear suggested messages when user sends a message
        setSuggestedMessages([]);
  
        // TODO: this sends the context every time.. we should only send context
        // if it's new...
        const sendMessageArgs: Parameters<typeof sendMessage> = [
          {
            type: "message",
            id: uuidv4(),
            role: "user",
            content: textToSend,
          },
          {
            systemPrompt: [
              props.systemContextMessage,
              trimAllLines(`
              ${aiExplainerFormat(AI_EXPLAINERS.OUTPUT_FORMAT_MARKDOWN_LATEX)}
              `)].join("\n"),
            contextMessageRenderers: [
              {
                type: 'ViewingActivity'
              },
              {
                type: 'ViewingLesson'
              }
            ],
            contextInjectors: {
              BasicUserInfo: { }
            },
            tools: [
              {
                name: 'SearchRN',
              } 
            ]
          }
        ];
  
        const sendMessageResp = await sendMessage(
          ...sendMessageArgs 
        );
  
        setIsGenerating(false);
        onSendComplete?.(textToSend, sendMessageResp);

        // Clear any existing suggested messages
        setSuggestedMessages([]);
      },
      [isGenerating, text, chatMemberIds, sendMessage, chatId, suggestNextMessages]
    );
  
    const sendButtonClick = useCallback(async () => {
      onSend(text);
      setText("");
    }, [isGenerating, chatMessagesResult, text, chatMemberIds, onSend]);
  
    useEffect(() => {
      const bottomEl = document.querySelector("#chat-bottom");
      if (bottomEl) {
        bottomEl.scrollIntoView({ behavior: "smooth" });
      }
    }, [chatMessagesResult, suggestedMessages]);
  
    // Use prop suggestions if provided, otherwise use the ones we fetched
    const displaySuggestedMessages = (propSuggestedNextMessages && propSuggestedNextMessages.length > 0) ? propSuggestedNextMessages : suggestedMessages;

    return (
      <ChatDumbComponent
        chatId={chatId}
        onSend={onSend}
        chatMessages={
          chatMessagesResult.data?.chatMessageCollection?.edges?.map(
            (e) => e?.node ? ChatMessageToCoreMessage(e?.node) : null
          ).filter(notEmpty) ?? []
        }
        suggestedNextMessages={displaySuggestedMessages}
        isGenerating={isGenerating || isLoadingSuggestions}
      />
    );
  }