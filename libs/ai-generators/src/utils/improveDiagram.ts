import { z } from 'zod';

import { AIGenerator } from '@reasonote/lib-ai-common';

export interface ImproveMarkdownDiagramsArgs {
    ai: AIGenerator,
    markdownWithDiagrams: string,
}

export async function improveMarkdownDiagrams({ai, markdownWithDiagrams}: ImproveMarkdownDiagramsArgs) {
    const CRITICAL_PROMPT = `
        <CRITICAL>
            <NO_COMMENTARY>
                YOU SHOULD ENHANCE THE MARKDOWN CONTENT, DO NOT ADD ANY COMMENTARY, DO NOT EXPLAIN YOUR CHANGES.
            </NO_COMMENTARY>
        </CRITICAL>
    `;
    const res = await ai.genObject({
        schema: z.object({
            explanation: z.string().describe('A brief explanation of the changes you made to the diagrams.'),
            improvedMarkdown: z.string().describe('The improved markdown with diagrams. Do not include any commentary or explanation of your changes, just the improved markdown.'),
        }),
        messages: [
            {
                role: 'system',
                content: `
                <YOUR_ROLE> 
                    You are an expert at improving diagrams in markdown.

                    You will receive a markdown string that contains diagrams.

                    Your job is to improve the diagrams and make them more accurate, clear, and helpful, based on the content of the markdown.
                    
                    ${CRITICAL_PROMPT}
                </YOUR_ROLE>
                `
            },
            {
                role: 'user',
                content: `
                    ${markdownWithDiagrams}
                `
            },
        ],
        model: 'anthropic:claude-3-5-sonnet-20240620'
    });

    console.log('ORIGINAL', markdownWithDiagrams, 'IMPROVED', res.object.improvedMarkdown);

    return res.object.improvedMarkdown;
}

export async function recursivelyImproveMarkdownDiagrams(ai: AIGenerator, obj: any, depth = 0): Promise<any> {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        const processedArray: any[] = [];
        for (const value of obj) {
            if (typeof value === 'string' && containsMermaidCodeBlock(value)) {
                processedArray.push(await improveMarkdownDiagrams({ai, markdownWithDiagrams: value}));
            } else if (typeof value === 'object' && value !== null) {
                processedArray.push(await recursivelyImproveMarkdownDiagrams(ai, value, depth + 1));
            } else {
                processedArray.push(value);
            }
        }
        return processedArray;
    } else {
        const processedObj: any = {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string' && containsMermaidCodeBlock(value)) {
                processedObj[key] = await improveMarkdownDiagrams({ai, markdownWithDiagrams: value});
            } else if (typeof value === 'object' && value !== null) {
                processedObj[key] = await recursivelyImproveMarkdownDiagrams(ai, value, depth + 1);
            } else {
                processedObj[key] = value;
            }
        }

        return processedObj;
    }
}

function containsMermaidCodeBlock(text: string): boolean {
    return /```mermaid[\s\S]*?```/.test(text);
}