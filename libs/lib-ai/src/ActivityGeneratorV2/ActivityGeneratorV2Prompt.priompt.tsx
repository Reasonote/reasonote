import { CoreMessage } from 'ai';

//@ts-ignore
import * as Priompt from '@anysphere/priompt';
import { ActivityGenerateRequest } from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { priomptRenderToString } from '../prompt/AIPromptObj/PromptComponents';
import {
  FinalSystemPrompt,
  GenActContextSection,
  PrimarySystemPrompt,
} from './prompts';
import { ActivityGeneratorV2HydratedRequest } from './types';

/**
 * Gets context messages from injectors provided in the request
 */
async function getCtxMessages(req: ActivityGenerateRequest, ai: AI): Promise<any[]> {
    return req.ctxInjectors ? await ai.getCtxMessagesFromInvokeConfigs(
        req.ctxInjectors.reduce((acc, injector) => {
            acc[injector.name] = { config: injector.config };
            return acc;
        }, {} as { [key: string]: { config: any } })
    ) : [];
}

/**
 * Generates the final array of messages for activity generation
 */
export async function getGenerateActivityMessages(
    ai: AI,
    req: ActivityGeneratorV2HydratedRequest
): Promise<CoreMessage[]> {
    // Generate all system prompts
    const [primarySystemPrompt, contextSystemPrompt, finalSystemPrompt, ctxMessages] = await Promise.all([
        PrimarySystemPrompt.renderAsync(ai, req, req.hydrated.validActivityTypeServers),
        GenActContextSection.renderAsync(ai, req),
        FinalSystemPrompt.renderAsync(req, req.hydrated.validActivityTypeServers),
        getCtxMessages(req, ai)
    ]);

    return [
        {
            role: 'system',
            content: await priomptRenderToString(primarySystemPrompt),
        },
        {
            role: 'system',
            content: await priomptRenderToString(contextSystemPrompt),
        },
        {
            role: 'system',
            content: await priomptRenderToString(finalSystemPrompt),
        },
        // TODO: ctxMessages are oddly positioned here.
        ...ctxMessages,
        ...(req.otherMessages ?? []),
    ];
}