import {CoreMessageWithId} from "@reasonote/lib-ai-common";

export function patchStreamGenObjectResultToMessages({
    messages,
    object,
    thisMessageId,
    thisToolCallId
  }: {
    messages: CoreMessageWithId[],
    object: any,
    thisMessageId: string,
    thisToolCallId: string
  }) {
    const messageWithId = messages.find((msg) => msg.id === thisMessageId);
  
    if (messageWithId) {
      return messages.map((msg) =>
        msg.id === thisMessageId
          ? {
            ...msg,
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: thisToolCallId,
                toolName: 'json',
                args: object
              },
            ],
          }
          : msg
      );
    } else {
      return [
        ...messages,
        {
          id: thisMessageId,
          role: 'assistant' as const,
          content: [
            {
              type: 'tool-call' as const,
              toolCallId: thisToolCallId,
              toolName: 'json',
              args: object,
            },
          ],
        },
      ];
    }
  }