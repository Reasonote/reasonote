import { createOpenAI } from '@ai-sdk/openai';

export function createGroqDriver(apikey: string) {
    return createOpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: apikey
    })
}