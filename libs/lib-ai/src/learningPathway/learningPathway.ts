import { z } from 'zod';

import { AI } from '../AI';

// Schema for user profile data
export const UserProfileSchema = z.object({
    goals: z.object({
        short_term: z.string(),
        long_term: z.string()
    }),
    interests: z.string(),
    ideal_lifestyle: z.string(),
    learning_preferences: z.string(),
    collaboration_preferences: z.enum(["solo", "group", "mixed"]),
    current_skills: z.array(z.object({
        skill: z.string(),
        proficiency_level: z.string()
    })),
    time_commitment_weekly_hours: z.number(),
    available_resources: z.string(),
    motivation_factors: z.string(),
    accountability_preferences: z.string(),
    feedback_preferences: z.enum(["detailed", "quick", "encouraging", "mixed"])
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Schema for learning pathway response
export const LearningPathwayResponseSchema = z.object({
    response: z.string(),
    updatedContext: UserProfileSchema.partial()
});

export type LearningPathwayResponse = z.infer<typeof LearningPathwayResponseSchema>;

export class LearningPathwayAI {
    constructor(private ai: AI) {}

    /**
     * Process a user message and generate a response for the learning pathway chat
     */
    async processMessage(message: string, context: Partial<UserProfile>): Promise<LearningPathwayResponse> {
        const prompt = this.buildPrompt(message, context);
        
        const result = await this.ai.genObject({
            prompt,
            schema: LearningPathwayResponseSchema,
            temperature: 0.7,
            maxTokens: 1000
        });

        // Ensure the response matches the expected type
        const response: LearningPathwayResponse = {
            response: result.object.response,
            updatedContext: result.object.updatedContext || {}
        };

        return response;
    }

    /**
     * Build a prompt for the AI based on the user's message and current context
     */
    private buildPrompt(message: string, context: Partial<UserProfile>): string {
        const contextStr = this.formatContext(context);
        
        return `You are an AI learning pathway assistant helping users create personalized learning journeys.

CURRENT CONTEXT:
${contextStr}

USER MESSAGE:
${message}

INSTRUCTIONS:
1. Analyze the user's message in the context of their learning goals and preferences
2. Provide a helpful, encouraging response that guides them through the learning pathway creation process
3. If the message contains new information about their goals, preferences, or capabilities, update the context accordingly
4. If the message is a question or request for clarification, provide a clear and supportive answer
5. If the message indicates completion of a step, acknowledge their progress and guide them to the next step

RESPONSE FORMAT:
- Provide a natural, conversational response that maintains a friendly and encouraging tone
- If updating context, include the updated fields in the response
- Keep responses concise but informative
- Focus on actionable next steps when appropriate`;
    }

    /**
     * Format the current context into a readable string for the prompt
     */
    private formatContext(context: Partial<UserProfile>): string {
        const sections: string[] = [];

        if (context.goals) {
            sections.push(`Goals:
- Short-term: ${context.goals.short_term}
- Long-term: ${context.goals.long_term}`);
        }

        if (context.interests) {
            sections.push(`Interests: ${context.interests}`);
        }

        if (context.learning_preferences) {
            sections.push(`Learning Preferences: ${context.learning_preferences}`);
        }

        if (context.current_skills?.length) {
            sections.push(`Current Skills:
${context.current_skills.map(skill => `- ${skill.skill} (${skill.proficiency_level})`).join('\n')}`);
        }

        if (context.time_commitment_weekly_hours) {
            sections.push(`Weekly Time Commitment: ${context.time_commitment_weekly_hours} hours`);
        }

        // Add other context fields as needed

        return sections.length > 0 ? sections.join('\n\n') : 'No context available';
    }
}
