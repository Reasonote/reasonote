import { z } from 'zod';

import {
  OneShotAIArgs,
  OneShotAIResponse,
} from '@reasonote/core';
import {
  ChatDriverRequest,
  ChatDriverResponse,
} from '@reasonote/lib-ai-common';

export interface AIDriver {
  /**
   * @deprecated
   */
    oneShotAI<T extends z.ZodTypeAny>(args: OneShotAIArgs<T>): Promise<OneShotAIResponse<T>>;
    chat: {
      complete(args: ChatDriverRequest): Promise<ChatDriverResponse>;
    }
}