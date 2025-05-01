import { z } from 'zod';

import { trimLines } from '@lukebechtel/lab-ts-utils';

import { RNAgentTool } from '../RNAgentTool';

export const OfferUserOptionsSchema = z.object({
    friendlyText: z.string().describe(
        trimLines(`
            Friendly text for option selection.
            MUST NOT contain lesson suggestions.
            Example: "What interests you most about this topic?"
        `)
    ),
    options: z.array(z.object({
        emoji: z.string(),
        text: z.string().describe(
            trimLines(`
                Option text.
                MUST NOT contain lesson suggestions.
                Example: "Building websites" (NOT "Lesson: Building websites")
            `)
        )
    })),
    finalEndText: z.string(),
});

export type OfferUserOptions = z.infer<typeof OfferUserOptionsSchema>;

export class OfferUserOptionsTool implements RNAgentTool<any, any, any> {
    name = 'OfferUserOptions';
    description = 'Present a set of options for the user to choose from';
    args = OfferUserOptionsSchema;
    requiresIteration = false;

    async explain() {
        return trimLines(`
            <CRITICAL_REQUIREMENTS>
                1. OPTION FORMATTING:
                   - Each option MUST have an emoji and text
                   - Text MUST be clear and concise
                   - NEVER include lesson suggestions in options
                   - Keep options focused on user interests
                   
                2. FRIENDLY TEXT:
                   - MUST be engaging and conversational
                   - MUST clearly explain what you're asking
                   - MUST NOT contain lesson suggestions
                   - Should encourage user interaction
                   
                3. FINAL END TEXT:
                   - Optional closing message
                   - Can be empty string if not needed
                   - Should maintain conversation flow
            </CRITICAL_REQUIREMENTS>

            <EXAMPLES>
                ✅ GOOD OPTIONS:
                   - "🌐 Building websites"
                   - "🎨 Creating digital art"
                   - "📱 Mobile app development"
                
                ❌ BAD OPTIONS:
                   - "🎓 Lesson: HTML Basics"
                   - "📚 Tutorial on JavaScript"
                   - "Learn Python Programming"
            </EXAMPLES>
        `);
    }
} 