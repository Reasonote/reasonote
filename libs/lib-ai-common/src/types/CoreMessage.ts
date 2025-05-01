import {
  CoreMessage,
  CoreToolMessage,
  ToolCallPart,
} from 'ai';
import _ from 'lodash';

import { uuidv4 } from '@reasonote/lib-utils';

import { RESIChatMessage } from './RESIChat';

export function isAssistantToolCallMessage<T extends CoreMessage>(message: T): message is T & {role: 'assistant', content: CoreToolMessage[]} {
  return message?.role === 'assistant' && _.isArray(message?.content) && !!message?.content?.find((content) => content.type === 'tool-call');
}

export function getToolCallPartsFromMessage<T extends CoreMessage>(message: T): ToolCallPart[] {
    if (message?.role !== 'assistant' || !_.isArray(message?.content)) {
        return [];
    }

    const content = message?.content;

    return content?.filter((content) => content.type === 'tool-call') as ToolCallPart[];
}

export function getToolCallPartsFromMessages<T extends CoreMessage>(messages: T[]): ToolCallPart[] {
    return messages.flatMap((message) => getToolCallPartsFromMessage(message));
}


export function RESIChatMessageToVercelMessage(msg: RESIChatMessage): CoreMessage {
  if (msg.role === 'user' || msg.role === 'system'){
    return {
      role: msg.role,
      content: msg.content,
    }
  } else if (msg.role === 'assistant'){
    if (msg.function_call){
      return {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            // 40 chars max for toolCallId
            toolCallId: uuidv4(),
            toolName: msg.function_call.name,
            args: msg.function_call.arguments,
          }
        ]
      }
    }
    else {
      return {
        role: 'assistant',
        content: msg.content!,
      }
    }
  }
  else if (msg.role === 'function'){
    return {
      role: 'tool',
      content: [
        {
          toolName: msg.name,
          type: 'tool-result',
          toolCallId: uuidv4(),
          result: msg.content,
        }
      ]
    }
  }
  else {
    throw new Error(`Unreachable code: ${msg}`);
  }
}