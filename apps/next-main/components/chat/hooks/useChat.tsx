import {
  useCallback,
  useState,
} from "react";

import _ from "lodash";
import {z} from "zod";

import {aib} from "@/clientOnly/ai/aib";
import {
  ApolloClient,
  useApolloClient,
  useQuery,
} from "@apollo/client";
import {
  notEmpty,
  trimAllLines,
} from "@lukebechtel/lab-ts-utils";
import {CtxInjectorRegistryWithUnknowns} from "@reasonote/core";
import {
  CoreMessageWithId,
  DeepPartial,
  RNAgentCMRInvokeConfig,
  RNAgentToolInvokeConfig,
  RNCoreMessage,
} from "@reasonote/lib-ai-common";
import {
  createChatMessageFlatMutDoc,
  getChatFlatQueryDoc,
  getChatMessageFlatQueryDoc,
  OrderByDirection,
} from "@reasonote/lib-sdk-apollo-client";
import {uuidv4} from "@reasonote/lib-utils";

import {oneShotAIClient} from "../../../clientOnly/ai/oneShotAIClient";

interface MessageTypeSimple {
  /** Should this message be stored, or just used as a generative example? */
  ephemeral?: boolean;
  type: "message";
  id: string;
  content: string;
  role: "user" | "system" | "assistant";
}

export const SuggestLearningTopicsFunction = {
  systemMessage: trimAllLines(`
    You are responsible for suggesting certain topics the user may want to add to their learning plan.

    You should suggest topics that the user should learn about, based on the chat history.

    Notes:
    - If the user is explicitly asking about a topic, that topic SHOULD be suggested.
    - If the user will likely want to understand another topic in order to understand the current topic, that topic SHOULD be suggested.

    `),
  functionName: "suggestLearningTopics" as const,
  functionDescription: "Suggest learning topics for the user",
  functionParameters: z.object({
    topics: z
      .array(z.string())
      .describe("The topics that the user should learn about"),
  }),
};

export async function getSuggestedTopics({
  messages,
}: {
  messages: MessageTypeSimple[];
}) {
  return oneShotAIClient({
    ...SuggestLearningTopicsFunction,
    otherMessages: messages,
  });
}


function CoreMessageWithIdToChatMessage(m: CoreMessageWithId, chatId: string, botId: string): ChatMessageType[] {
  if (m.role === "assistant") {
    if (_.isString(m.content)) {
      return [{
        __typename: "ChatMessage",
        id: m.id,
        body: m.content,
        role: "assistant",
        botId: botId,
        chatId: chatId,
        contextData: null,
        contextId: null,
        contextType: null,
        createdByBot: botId,
        functionCall: null,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        updatedBy: null,
        createdBy: null,
      }];
    }
    else if (_.isArray(m.content)) {
      // Create a separate message for each content part
      return m.content.map((part, index) => {
        if (part.type === "text") {
          return {
            __typename: "ChatMessage",
            id: `${m.id}_${index}`,
            body: part.text,
            role: "assistant",
            botId: botId,
            chatId: chatId,
            contextData: null,
            contextId: null,
            contextType: null,
            createdByBot: botId,
            functionCall: null,
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString(),
            updatedBy: null,
            createdBy: null,
          };
        }
        else if (part.type === "tool-call") {
          // If this is a tool call, we should write to our function call column
          // and then write a new message with the result of the tool call.

          return {
            __typename: "ChatMessage",
            id: `${m.id}_${index}`,
            body: null,
            role: "assistant",
            botId: botId,
            chatId: chatId,
            contextData: null,
            contextId: null,
            contextType: null,
            createdByBot: botId,
            functionCall: {
              id: part.toolCallId,
              name: part.toolName,
              arguments: part.args,
            },
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString(),
            updatedBy: null,
            createdBy: null,
          };
        }
        else {
          throw new Error(`Unknown message type: ${part.type}`);
        }
      });
    }
    else {
      // Handle case where content is neither string nor array
      return [{
        __typename: "ChatMessage",
        id: m.id,
        body: JSON.stringify(m.content),
        role: "assistant",
        botId: botId,
        chatId: chatId,
        contextData: null,
        contextId: null,
        contextType: null,
        createdByBot: botId,
        functionCall: null,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        updatedBy: null,
        createdBy: null,
      }];
    }
  }

  // For non-assistant messages
  return [{
    __typename: "ChatMessage",
    id: m.id,
    body: _.isString(m.content) ? m.content : JSON.stringify(m.content),
    role: m.role,
    botId: botId,
    chatId: chatId,
    contextData: null,
    contextId: null,
    contextType: null,
    createdByBot: botId,
    functionCall: null,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
    updatedBy: null,
    createdBy: null,
  }];
}

const createTypedMessageId = () => `cmsg_${uuidv4().replace(/-/g, '')}`;

// Add this type definition at the top with other interfaces
interface ChatMessageType {
  __typename: "ChatMessage";
  id: string;
  body: string | null;
  role: string;
  botId: string;
  chatId: string;
  contextData: null;
  contextId: null;
  contextType: null;
  createdByBot: string;
  createdDate: string;
  updatedDate: string;
  functionCall: null | any;
  updatedBy: string | null;
  createdBy: string | null;
}

export async function asyncChat({
  ac,
  chatId,
  messagesToSend,
  onPartialResponse,
  contextInjectors,
  contextMessageRenderers,
  tools,
}: {
  ac: ApolloClient<any>;
  chatId: string;
  contextInjectors?: CtxInjectorRegistryWithUnknowns;
  contextMessageRenderers?: RNAgentCMRInvokeConfig[];
  tools?: RNAgentToolInvokeConfig<any>[];
  messagesToSend: MessageTypeSimple[];
  onPartialResponse?: (partialResponse: CoreMessageWithId) => void;
}) {
  // console.log("asyncChat chatId", chatId);

  const chatResult = await ac.query({
    query: getChatFlatQueryDoc,
    variables: {
      filter: {
        id: { eq: chatId },
      },
    },
    fetchPolicy: "network-only",
  });

  const chat = chatResult.data?.chatCollection?.edges[0]?.node;

  if (!chat) {
    throw new Error(`No chat`);
  }

  const chatMessagesQuery = {
    query: getChatMessageFlatQueryDoc,
    variables: {
      filter: {
        chatId: { eq: chatId },
      },
      orderBy: {
        createdDate: OrderByDirection.AscNullsFirst,
      },
      first: 100,
    },
  };

  // Get messages from chat in past
  const chatMessageResult = await ac.query({
    ...chatMessagesQuery,
    fetchPolicy: "network-only",
  });

  // Filter messagesToSend. If we already have an identical system message,
  // we don't need to send it again.
  // TODO: HACK
  // Remove duplicate system messages
  const seenSystemMessages: Record<string, boolean> = {};
  chatMessageResult.data?.chatMessageCollection?.edges.forEach((e) => {
    if (e.node.role === "system") {
      seenSystemMessages[e.node.body ?? ""] = true;
    }
  }); 1
  const filteredMessagesToSend = messagesToSend.filter((m) => {
    if (m.role === "system") {
      if (seenSystemMessages[m.content]) {
        return false;
      }
      seenSystemMessages[m.content] = true;
    }
    return true;
  });

  // Put new messages in backend
  // Do this in a for loop so that we preserve message order.
  for (const m of filteredMessagesToSend) {
    const res = await ac.mutate({
      mutation: createChatMessageFlatMutDoc,
      variables: {
        objects: [
          {
            chatId: chatId,
            body: m.content,
            botId:
              m.role === "assistant"
                ? "bot_01010101-0101-0101-0101-010134501073"
                : undefined,
            role: m.role,
          },
        ],
      },
    });

    if (res.errors) {
      throw new Error(`Failed to send chat messages: ${res.errors}`);
    }
  }

  // Add our messages to the fetched messages
  const fullChatHistory = [
    ...(chatMessageResult.data?.chatMessageCollection?.edges.map((e) => ({
      // type: "message" as const,
      id: e.node.id,
      content: e.node.body ?? "" as any,
      role: (e.node.botId ?
        ("assistant" as const)
        : e.node.role === "system" ?
          (
            !!e.node.contextType ?
              ("context" as const)
              : ("system" as const)
          )
          :
          (
            e.node.role === 'tool' ?
              ("tool" as const)
              : ("user" as const)
          )) as any,
      contextData: e.node.contextData,
      contextId: e.node.contextId,
      contextType: e.node.contextType,
    })) ?? []),
    ...filteredMessagesToSend,
  ]
    .filter((m: RNCoreMessage) => {
      if (m.role === "system") {
        const strMsg = JSON.stringify(m);
        if (seenSystemMessages[strMsg]) {
          return false;
        }
        seenSystemMessages[strMsg] = true;
      }
      return true;
    });

  const result2 = await ac.query({
    ...chatMessagesQuery,
    fetchPolicy: "network-only",
  });


  // Refetch the chat thread
  await ac.query({
    ...chatMessagesQuery,
    fetchPolicy: "network-only",
  });

  // Update the map and completedMessages declarations
  const partialIdToFinalId = new Map<string, string>();
  const writtenMessageIds = new Set<string>();  // Track which messages have been written

  // Function to write a message to the database
  const writeMessageToDatabase = async (message: ChatMessageType) => {
    // Skip if already written
    if (writtenMessageIds.has(message.id)) {
      return true;
    }

    try {
      await ac.mutate({
        mutation: createChatMessageFlatMutDoc,
        variables: {
          objects: [{
            chatId: message.chatId,
            body: message.body,
            role: message.role,
            botId: message.botId,
            contextData: message.contextData,
            contextId: message.contextId,
            contextType: message.contextType,
            createdByBot: message.createdByBot,
            // Have to do this bc apollo client doesn't stringify json automatically...
            functionCall: JSON.stringify(message.functionCall),
          }],
        },
      });
      writtenMessageIds.add(message.id);
      return true;
    } catch (error) {
      console.error('Failed to write message to database:', error);
      return false;
    }
  };

  const handlePartialResponse = async (partialResponses: DeepPartial<CoreMessageWithId>[]) => {
    // Get the latest message date from the cache
    const existingData = ac.cache.readQuery<{
      chatMessageCollection: {
        __typename: "ChatMessageConnection";
        edges: Array<{
          __typename: "ChatMessageEdge";
          node: {
            __typename: "ChatMessage";
            id: string;
            createdDate: string;
          };
        }>;
      };
    }>({
      query: getChatMessageFlatQueryDoc,
      variables: {
        filter: {
          chatId: { eq: chatId },
        },
        orderBy: {
          createdDate: OrderByDirection.AscNullsFirst,
        },
        first: 100,
      },
    });

    const edges = existingData?.chatMessageCollection?.edges || [];
    const latestDate = edges.length > 0
      ? edges[edges.length - 1].node.createdDate
      : new Date().toISOString();

    // Process each partial response
    for (const [index, partialResponse] of partialResponses.entries()) {
      if (!partialResponse.id || !partialResponse.content || !partialResponse.role) continue;

      // First, we must split the partialResponse into multiple messages.
      const chatMessages = CoreMessageWithIdToChatMessage(partialResponse as any, chatId, "bot_01010101-0101-0101-0101-010134501073")
        .map((m) => {
          if (!partialIdToFinalId.has(m.id)) {
            const finalId = createTypedMessageId();
            partialIdToFinalId.set(m.id, finalId);
          }

          return {
            ...m,
            id: partialIdToFinalId.get(m.id)!,
          };
        });

      // For all messages, we must process them
      for (const chatMessage of chatMessages) {
        // Update cache with the new message
        const existingEdges = existingData?.chatMessageCollection?.edges;
        const existingIndex = existingEdges?.findIndex(edge => edge.node.id === chatMessage.id);

        let newEdges;
        if (existingIndex !== undefined && existingIndex >= 0) {
          // Update existing message
          newEdges = existingEdges?.map((edge, i) =>
            i === existingIndex ? {
              __typename: "ChatMessageEdge",
              node: chatMessage,
            } : edge
          );
        } else {
          // Add new message
          newEdges = [...(existingEdges ?? []), {
            __typename: "ChatMessageEdge",
            node: chatMessage,
          }];
        }

        // Write the updated data back to the cache
        ac.cache.writeQuery({
          query: getChatMessageFlatQueryDoc,
          variables: {
            filter: {
              chatId: { eq: chatId },
            },
            orderBy: {
              createdDate: OrderByDirection.AscNullsFirst,
            },
            first: 100,
          },
          data: {
            // @ts-ignore
            chatMessageCollection: {
              __typename: "ChatMessageConnection",
              edges: newEdges,
              pageInfo: {
                __typename: "PageInfo",
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: newEdges[0]?.node.id,
                endCursor: newEdges[newEdges.length - 1]?.node.id,
              },
            },
          },
        });

        // If this is the last message in the array, store it separately
        if (chatMessages.findIndex(m => m.id === chatMessage.id) < chatMessages.length - 1) {
          // Write non-final messages to the database immediately
          await writeMessageToDatabase(chatMessage);
        }
      }
    }
  };

  const finalResult = await aib.RNAgentStream({
    genArgs: {
      model: "openai:gpt-4o-mini",
    },
    // system: ,
    chatId,
    messages: fullChatHistory,
    contextInjectors: contextInjectors,
    contextMessageRenderers: contextMessageRenderers,
    tools: tools,
    onPartialResponse: handlePartialResponse,
  });

  // After stream is complete, write the final message
  const finalMessages = _.flatten(finalResult.object.map((partialResponse) => {
    const chatMessages = CoreMessageWithIdToChatMessage(partialResponse as any, chatId, "bot_01010101-0101-0101-0101-010134501073")
      .map((m) => {
        if (!partialIdToFinalId.has(m.id)) {
          const finalId = createTypedMessageId();
          partialIdToFinalId.set(m.id, finalId);
        }

        return {
          ...m,
          id: partialIdToFinalId.get(m.id)!,
        };
      });

    return chatMessages;
  }));

  // Write any messages we've missed (writeMessageToDatabase will skip already written messages)
  if (finalMessages.length > 0) {
    for (const chatMessage of finalMessages) {
      await writeMessageToDatabase(chatMessage);
    }
  }

  await ac.refetchQueries({
    include: [getChatMessageFlatQueryDoc],
  });
}

export function useChat({ chatId }: { chatId: string | undefined }) {
  //////////////////////////////////
  const [isGenerating, setIsGenerating] = useState(false);
  const ac = useApolloClient();

  const chatMessageResult = useQuery(getChatMessageFlatQueryDoc, {
    variables: {
      filter: {
        chatId: { eq: chatId },
      },
      orderBy: {
        createdDate: OrderByDirection.AscNullsFirst,
      },
      first: 100,
    },
  });

  // console.log("useChat chatId", chatId);

  const sendMessage = useCallback(
    async (
      msg: MessageTypeSimple,
      opts?: { chatId?: string; systemPrompt?: string, contextInjectors?: CtxInjectorRegistryWithUnknowns, contextMessageRenderers?: RNAgentCMRInvokeConfig[], tools?: RNAgentToolInvokeConfig<any>[] },
      onPartialResponse?: (partialResponse: CoreMessageWithId) => void
    ) => {
      // This can be overridden... so we must handle that.
      const usingChatId = opts?.chatId ?? chatId;

      // console.log("sendMessage usingChatId", usingChatId, 'opts?.chatId', opts?.chatId, 'chatId', chatId);

      if (!usingChatId) {
        console.error("No chatId");
        return;
      }

      // console.log("Sending message", msg, opts);

      await asyncChat({
        ac,
        chatId: usingChatId,
        contextInjectors: opts?.contextInjectors ?? {},
        contextMessageRenderers: opts?.contextMessageRenderers ?? [],
        tools: opts?.tools ?? [],
        messagesToSend: [
          opts?.systemPrompt
          ? {
            id: uuidv4(),
            type: "message" as const,
            role: "system" as const,
            content: opts.systemPrompt,
          }
          : null,
          {
            id: msg.id,
            type: "message" as const,
            role: "user" as const,
            content: msg.content,
          },
        ].filter(notEmpty),
        onPartialResponse: (partialResponse: CoreMessageWithId) => {
          console.log('partialResponse', partialResponse)
          onPartialResponse?.(partialResponse);
        },
      });
    },
    [chatMessageResult, ac, chatId]
  );

  const suggestNextMessages = useCallback(async ({
    onPartialSuggestions,
    onFinish,
    contextInjectors,
    contextMessageRenderers,
  }: {
    onPartialSuggestions?: (suggestions: DeepPartial<{content: string}[]>) => void;
    onFinish: (suggestions: {content: string}[]) => void;
    contextInjectors?: CtxInjectorRegistryWithUnknowns;
    contextMessageRenderers?: RNAgentCMRInvokeConfig[];
  }) => {
    if (!chatId) {
      console.error("No chatId for suggestNextMessages");
      onFinish([]);
      return;
    }
    
    const chatMessagesQuery = {
      query: getChatMessageFlatQueryDoc,
      variables: {
        filter: {
          chatId: {
            eq: chatId,
          },
        },
        orderBy: {
          createdDate: OrderByDirection.AscNullsFirst,
        },
        first: 100,
      },
    };

    const chatMessageResult = await ac.query({
      ...chatMessagesQuery,
      fetchPolicy: "network-only",
    });

    // Convert chat messages to the format expected by streamSuggestedNextMessages
    const chatHistory = chatMessageResult.data?.chatMessageCollection?.edges.map((e) => ({
      id: e.node.id,
      content: e.node.body ?? "",
      role: (e.node.botId ? 
        "assistant" : 
        e.node.role === "system" ? 
          (!!e.node.contextType ? "context" : "system") : 
          (e.node.role === 'tool' ? "tool" : "user")) as any,
      type: "message",
    })) ?? [];

    // Call the streamSuggestedNextMessages method
    return aib.streamSuggestedNextMessages({
      genArgs: {
        model: "openai:gpt-4o-mini",
      },
      messages: chatHistory,
      chatId: chatId,
      contextInjectors,
      contextMessageRenderers,
      onPartialSuggestions: (partialSuggestions) => {
        onPartialSuggestions?.(partialSuggestions);
      },
      onFinish: (result) => {
        if (result.object && Array.isArray(result.object)) {
          onFinish(result.object);
        } else {
          onFinish([]);
        }
      },
    });
  }, [chatId]);

  return {
    fetchResponse: chatMessageResult,
    sendMessage,
    suggestNextMessages,
  };
}
