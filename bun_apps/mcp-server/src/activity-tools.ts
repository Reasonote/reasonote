/**
 * MCP tools for generating educational activities (flashcards, multiple choice, short answer).
 *
 * These tools use an LLM to generate structured activity configs that match
 * Reasonote's existing activity schemas.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// ─── Schemas for generated activities ────────────────────────────────────────

export const GeneratedFlashcardSchema = z.object({
    type: z.literal('flashcard').default('flashcard'),
    version: z.literal('0.0.0').default('0.0.0'),
    flashcardFront: z.string().describe('The front of the flashcard (the prompt/question). Supports markdown and LaTeX (wrap in $$...$$).'),
    flashcardBack: z.string().describe('The back of the flashcard (the answer). Supports markdown and LaTeX (wrap in $$...$$).'),
});

export const GeneratedMultipleChoiceSchema = z.object({
    type: z.literal('multiple-choice').default('multiple-choice'),
    version: z.literal('1.0.0').default('1.0.0'),
    question: z.string().describe('The question to ask the user. Supports markdown.'),
    answerChoices: z.array(z.object({
        text: z.string().describe('The text of the answer choice.'),
        isCorrect: z.boolean().describe('Whether this is the correct answer.'),
        followUp: z.string().optional().describe('A short message shown after selecting this choice (fun fact for correct, hint for incorrect).'),
    })).describe('The answer choices (typically 4). Exactly one should be correct.'),
});

export const GeneratedShortAnswerSchema = z.object({
    type: z.literal('short-answer').default('short-answer'),
    version: z.literal('0.0.0').default('0.0.0'),
    questionText: z.string().describe('The text of the question.'),
    gradingCriteria: z.string().describe('The criteria used to grade the answer, including expected answers.'),
});

// ─── LLM activity generation ─────────────────────────────────────────────────

interface GenerateActivityOptions {
    topic: string;
    numItems: number;
    difficulty?: string;
    additionalContext?: string;
    apiKey: string;
    modelProvider: 'openai' | 'anthropic';
}

async function callLLM(options: {
    systemPrompt: string;
    userPrompt: string;
    apiKey: string;
    modelProvider: 'openai' | 'anthropic';
}): Promise<string> {
    const { systemPrompt, userPrompt, apiKey, modelProvider } = options;

    if (modelProvider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
        }

        const data = await response.json() as any;
        return data.choices[0].message.content;
    } else {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4096,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: userPrompt },
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
        }

        const data = await response.json() as any;
        const textBlock = data.content.find((b: any) => b.type === 'text');
        return textBlock?.text ?? '';
    }
}

function extractJSON(text: string): any {
    // Try direct parse first
    try {
        return JSON.parse(text);
    } catch {
        // Try to find JSON within markdown code blocks or raw text
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1].trim());
        }
        throw new Error('Could not extract JSON from LLM response');
    }
}

// ─── Generation functions ────────────────────────────────────────────────────

async function generateFlashcards(opts: GenerateActivityOptions) {
    const systemPrompt = `You are an expert educational content creator. Generate flashcards for studying.
Each flashcard has a "front" (question/prompt) and a "back" (answer).
Use markdown formatting. For math/science, use LaTeX wrapped in $$...$$.
Return a JSON object with an "items" array of flashcard objects.`;

    const userPrompt = `Generate ${opts.numItems} flashcard(s) about: "${opts.topic}"
${opts.difficulty ? `Difficulty level: ${opts.difficulty}` : ''}
${opts.additionalContext ? `Additional context: ${opts.additionalContext}` : ''}

Return JSON in this exact format:
{
  "items": [
    {
      "type": "flashcard",
      "version": "0.0.0",
      "flashcardFront": "...",
      "flashcardBack": "..."
    }
  ]
}`;

    const raw = await callLLM({ systemPrompt, userPrompt, apiKey: opts.apiKey, modelProvider: opts.modelProvider });
    const parsed = extractJSON(raw);
    const items = parsed.items || [parsed];
    return items.map((item: any) => GeneratedFlashcardSchema.parse(item));
}

async function generateMultipleChoice(opts: GenerateActivityOptions) {
    const systemPrompt = `You are an expert educational content creator. Generate multiple choice questions for studying.
Each question has a question text, 4 answer choices (exactly one correct), and optional follow-up messages.
Use markdown formatting. For math/science, use LaTeX wrapped in $$...$$.
Return a JSON object with an "items" array.`;

    const userPrompt = `Generate ${opts.numItems} multiple choice question(s) about: "${opts.topic}"
${opts.difficulty ? `Difficulty level: ${opts.difficulty}` : ''}
${opts.additionalContext ? `Additional context: ${opts.additionalContext}` : ''}

Return JSON in this exact format:
{
  "items": [
    {
      "type": "multiple-choice",
      "version": "1.0.0",
      "question": "...",
      "answerChoices": [
        { "text": "...", "isCorrect": true, "followUp": "Fun fact: ..." },
        { "text": "...", "isCorrect": false, "followUp": "Hint: ..." },
        { "text": "...", "isCorrect": false, "followUp": "Hint: ..." },
        { "text": "...", "isCorrect": false, "followUp": "Hint: ..." }
      ]
    }
  ]
}`;

    const raw = await callLLM({ systemPrompt, userPrompt, apiKey: opts.apiKey, modelProvider: opts.modelProvider });
    const parsed = extractJSON(raw);
    const items = parsed.items || [parsed];
    return items.map((item: any) => GeneratedMultipleChoiceSchema.parse(item));
}

async function generateShortAnswer(opts: GenerateActivityOptions) {
    const systemPrompt = `You are an expert educational content creator. Generate short answer questions for studying.
Each question has a question text and grading criteria (which includes expected answers).
Use markdown formatting. For math/science, use LaTeX wrapped in $$...$$.
Return a JSON object with an "items" array.`;

    const userPrompt = `Generate ${opts.numItems} short answer question(s) about: "${opts.topic}"
${opts.difficulty ? `Difficulty level: ${opts.difficulty}` : ''}
${opts.additionalContext ? `Additional context: ${opts.additionalContext}` : ''}

Return JSON in this exact format:
{
  "items": [
    {
      "type": "short-answer",
      "version": "0.0.0",
      "questionText": "...",
      "gradingCriteria": "Expected answer: ... Key points to look for: ..."
    }
  ]
}`;

    const raw = await callLLM({ systemPrompt, userPrompt, apiKey: opts.apiKey, modelProvider: opts.modelProvider });
    const parsed = extractJSON(raw);
    const items = parsed.items || [parsed];
    return items.map((item: any) => GeneratedShortAnswerSchema.parse(item));
}

async function generateMixed(opts: GenerateActivityOptions) {
    const systemPrompt = `You are an expert educational content creator. Generate a mix of educational activities for studying.
You should create a variety of activity types: flashcards, multiple choice questions, and short answer questions.
Use markdown formatting. For math/science, use LaTeX wrapped in $$...$$.
Return a JSON object with an "items" array containing a mix of activity types.`;

    const userPrompt = `Generate ${opts.numItems} educational activity/activities about: "${opts.topic}"
Use a mix of these types: flashcard, multiple-choice, short-answer.
${opts.difficulty ? `Difficulty level: ${opts.difficulty}` : ''}
${opts.additionalContext ? `Additional context: ${opts.additionalContext}` : ''}

Return JSON with an "items" array. Each item must match one of these formats:

Flashcard:
{ "type": "flashcard", "version": "0.0.0", "flashcardFront": "...", "flashcardBack": "..." }

Multiple Choice:
{ "type": "multiple-choice", "version": "1.0.0", "question": "...", "answerChoices": [{ "text": "...", "isCorrect": true/false, "followUp": "..." }, ...] }

Short Answer:
{ "type": "short-answer", "version": "0.0.0", "questionText": "...", "gradingCriteria": "..." }`;

    const raw = await callLLM({ systemPrompt, userPrompt, apiKey: opts.apiKey, modelProvider: opts.modelProvider });
    const parsed = extractJSON(raw);
    const items = parsed.items || [parsed];

    return items.map((item: any) => {
        switch (item.type) {
            case 'flashcard':
                return GeneratedFlashcardSchema.parse(item);
            case 'multiple-choice':
                return GeneratedMultipleChoiceSchema.parse(item);
            case 'short-answer':
                return GeneratedShortAnswerSchema.parse(item);
            default:
                throw new Error(`Unknown activity type: ${item.type}`);
        }
    });
}

// ─── Resolve API key ─────────────────────────────────────────────────────────

function resolveApiKeyAndProvider(): { apiKey: string; modelProvider: 'openai' | 'anthropic' } | null {
    // Prefer OpenAI since we use json_object response format
    if (process.env.OPENAI_API_KEY) {
        return { apiKey: process.env.OPENAI_API_KEY, modelProvider: 'openai' };
    }
    if (process.env.ANTHROPIC_API_KEY) {
        return { apiKey: process.env.ANTHROPIC_API_KEY, modelProvider: 'anthropic' };
    }
    return null;
}

// ─── Register tools on the MCP server ────────────────────────────────────────

export function registerActivityTools(server: McpServer) {

    server.tool(
        'generate-flashcards',
        {
            topic: z.string().describe('The topic or skill to generate flashcards about (e.g. "photosynthesis", "Spanish irregular verbs", "linear algebra")'),
            count: z.number().min(1).max(20).optional().describe('Number of flashcards to generate (default: 3, max: 20)'),
            difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('Difficulty level'),
            additionalContext: z.string().optional().describe('Additional context or instructions for generation (e.g. "focus on the light reactions", "use simple language")'),
        },
        async (args) => {
            const resolved = resolveApiKeyAndProvider();
            if (!resolved) {
                return {
                    content: [{ type: 'text', text: 'Error: No LLM API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in the server environment.' }],
                    isError: true,
                };
            }

            try {
                const items = await generateFlashcards({
                    topic: args.topic,
                    numItems: args.count ?? 3,
                    difficulty: args.difficulty,
                    additionalContext: args.additionalContext,
                    ...resolved,
                });

                return {
                    content: [{ type: 'text', text: JSON.stringify({ activities: items }, null, 2) }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error generating flashcards: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    server.tool(
        'generate-multiple-choice',
        {
            topic: z.string().describe('The topic or skill to generate questions about'),
            count: z.number().min(1).max(20).optional().describe('Number of questions to generate (default: 3, max: 20)'),
            difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('Difficulty level'),
            additionalContext: z.string().optional().describe('Additional context or instructions for generation'),
        },
        async (args) => {
            const resolved = resolveApiKeyAndProvider();
            if (!resolved) {
                return {
                    content: [{ type: 'text', text: 'Error: No LLM API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in the server environment.' }],
                    isError: true,
                };
            }

            try {
                const items = await generateMultipleChoice({
                    topic: args.topic,
                    numItems: args.count ?? 3,
                    difficulty: args.difficulty,
                    additionalContext: args.additionalContext,
                    ...resolved,
                });

                return {
                    content: [{ type: 'text', text: JSON.stringify({ activities: items }, null, 2) }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error generating multiple choice questions: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    server.tool(
        'generate-short-answer',
        {
            topic: z.string().describe('The topic or skill to generate questions about'),
            count: z.number().min(1).max(20).optional().describe('Number of questions to generate (default: 3, max: 20)'),
            difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('Difficulty level'),
            additionalContext: z.string().optional().describe('Additional context or instructions for generation'),
        },
        async (args) => {
            const resolved = resolveApiKeyAndProvider();
            if (!resolved) {
                return {
                    content: [{ type: 'text', text: 'Error: No LLM API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in the server environment.' }],
                    isError: true,
                };
            }

            try {
                const items = await generateShortAnswer({
                    topic: args.topic,
                    numItems: args.count ?? 3,
                    difficulty: args.difficulty,
                    additionalContext: args.additionalContext,
                    ...resolved,
                });

                return {
                    content: [{ type: 'text', text: JSON.stringify({ activities: items }, null, 2) }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error generating short answer questions: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    server.tool(
        'generate-activities',
        {
            topic: z.string().describe('The topic or skill to generate activities about'),
            count: z.number().min(1).max(20).optional().describe('Total number of activities to generate (default: 5, max: 20)'),
            types: z.array(z.enum(['flashcard', 'multiple-choice', 'short-answer'])).optional().describe('Which activity types to include (default: all three)'),
            difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('Difficulty level'),
            additionalContext: z.string().optional().describe('Additional context or instructions for generation'),
        },
        async (args) => {
            const resolved = resolveApiKeyAndProvider();
            if (!resolved) {
                return {
                    content: [{ type: 'text', text: 'Error: No LLM API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in the server environment.' }],
                    isError: true,
                };
            }

            try {
                const items = await generateMixed({
                    topic: args.topic,
                    numItems: args.count ?? 5,
                    difficulty: args.difficulty,
                    additionalContext: args.additionalContext
                        ? `${args.additionalContext}${args.types ? `. Only use these activity types: ${args.types.join(', ')}` : ''}`
                        : args.types ? `Only use these activity types: ${args.types.join(', ')}` : undefined,
                    ...resolved,
                });

                return {
                    content: [{ type: 'text', text: JSON.stringify({ activities: items }, null, 2) }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error generating activities: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );
}
