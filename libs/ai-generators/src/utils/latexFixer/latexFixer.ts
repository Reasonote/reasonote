import { z } from 'zod';

import { trimAllLines } from '@lukebechtel/lab-ts-utils';
import { AIGenerator } from '@reasonote/lib-ai-common';

export interface LatexFixerArgs {
    stringsToFix: string[];
}

export async function latexFixer(args: LatexFixerArgs, ai: AIGenerator) {
    const { stringsToFix } = args;

    const object = Object.fromEntries(stringsToFix.map((_, idx) => [`string${idx}`, stringsToFix[idx]]));

    // Create a zod object of the exact length of stringsToFix
    const zodObject = z.object(Object.fromEntries(stringsToFix.map((_, idx) => [`string${idx}`, z.string().describe(`String ${idx}`)])));

    // First, quick check to see if any of 
    const res = await ai.genObject({
        schema: z.object({
            result: z.union([
                z.object({
                    type: z.literal('no-latex-to-fix'),
                }).describe("If no LaTeX in the strings needs fixing, this should be your response"),
                z.object({
                    type: z.literal('latex-found'),
                    fixedLatexStrings: zodObject.describe("The strings with proper latex"),
                }),
            ])
        }),
        system: trimAllLines(`
            # Your Role
            You are responsible for improving LaTeX support in the user provided strings that follow.
            You must always use double backslashes (\\\\) in LaTeX commands.

            The strings are written in Markdown, and you should not change the Markdown formatting.

            # LaTeX Handling Rules
            1. Add <latex></latex> tags around LaTeX expressions that are:
               - Currently wrapped in $ or $$ symbols
               - Contain LaTeX commands like \\\\frac, \\\\cdot, \\\\text, etc. and are not already properly tagged
               - IMPORTANT: Always use double backslashes (\\\\) in ALL LaTeX commands
            
            2. DO NOT modify any code examples or code blocks:
               - Content inside \`single backticks\` should be preserved as-is UNLESS it's inside a \\\\text{} command
               - Content inside triple backtick code blocks should be preserved as-is
               - If you find LaTeX tags around what appears to be code (e.g., <latex>console.log('hi')</latex>), 
                 convert it back to appropriate code formatting UNLESS it's inside a \\\\text{} command

            # Examples
            GOOD:
            - "The fraction <latex>\\\\frac{1}{2}</latex> is correct"
            - "Function <latex>f(x) = \\\\text{\`x + 1\`}</latex> is valid"
            - "Complex equation <latex>\\\\int_0^\\\\infty \\\\frac{x^2}{\\\\sqrt{x+1}} \\\\, dx</latex>"
            - "Multiple commands <latex>\\\\sum_{i=1}^n \\\\text{\`f(\${i})\`}</latex>"
            - "Here's code: \`console.log('hi')\`"

            BAD:
            - "Single backslash: <latex>\\frac{1}{2}</latex>"
            - "Missing backslashes: <latex>text{\`code\`}</latex>"
            - "The fraction $\\\\frac{1}{2}$ needs fixing"
            - "Function <latex>f(x) = x + 1</latex> lost its \\\\text command"
            - "Code shouldn't be latex: <latex>const x = 1;</latex>"

            # Notes
            - CRITICAL: Always use double backslashes (\\\\) in ALL LaTeX commands
            - REMEMBER: Code examples should NEVER have LaTeX tags
            - REMEMBER: If there are already correct <latex></latex> tags around actual LaTeX, leave them in place
            - REMEMBER: $ and $$ should be replaced with <latex></latex> tags ONLY for actual LaTeX content
        `),
        messages: [
            {
                role: 'user',
                content: JSON.stringify({ stringsToFix: object }, null, 2)
            }
        ],
        model: 'openai:gpt-4o-mini',
        mode: 'json',
        providerArgs: {
            structuredOutputs: true,
        },
    });

    if (!res.object) {
        throw new Error('LatexFixer: No response from AI');
    }

    const result = res.object.result;

    if (result.type === 'no-latex-to-fix') {
        return {
            fixedLatexStrings: stringsToFix,
        };
    }
    else {
        // Convert the zod object to an array of strings, ordered by the original stringsToFix array
        const fixedLatexStrings = stringsToFix.map(str => result.fixedLatexStrings[`string${stringsToFix.indexOf(str)}`]);

        return {
            fixedLatexStrings,
        };
    }
} 