import { z } from 'zod';

import { trimLines } from '@lukebechtel/lab-ts-utils';

import { RNAgentTool } from '../RNAgentTool';

export const LessonStubSchema = z.object({
  name: z.string().describe(
    trimLines(`
          The name of the lesson.
          REQUIREMENTS:
          - Clear and descriptive
          - 2-7 words long
          - Starts with an action verb
          - Focuses on the main learning outcome
      `)
  ),
  description: z.string().describe(
    trimLines(`
          The lesson description.
          MUST include:
          - Clear learning outcomes
          - Key concepts covered
          - Practical applications
          Keep it concise (2-3 sentences)
      `)
  ),
  emoji: z.string().describe(
    trimLines(`
          A single emoji that represents the lesson's main concept.
          Choose an emoji that:
          - Is immediately recognizable
          - Relates directly to the subject matter
          - Helps with visual recall
      `)
  ),
  subjects: z.array(z.string()).nullable().describe(
    trimLines(`
          The subjects covered in this lesson.
          Each subject should be:
          - Specific and well-defined
          - Directly related to the lesson content
          - Listed in order of importance
      `)
  ),
  learningObjectives: z.array(z.string()).nullable().describe(
    trimLines(`
          The learning objectives for this lesson.
          Each objective MUST:
          - Start with a measurable action verb
          - Be specific and achievable
          - Align with the lesson content
          - Be testable through activities
      `)
  ),
})
export type LessonStub = z.infer<typeof LessonStubSchema>;

export const SuggestLessonsToolArgsSchema = z.array(z.union([
    z.object({
      type: z.literal('create'),
      lesson: LessonStubSchema.describe(
        trimLines(`
            <CRITICAL_REQUIREMENTS>
              1. UNIQUENESS:
                 - MUST be completely unique - check ExistingLessons
                 - MUST NOT reuse names or concepts from previous lessons
                 - MUST be different from any previously suggested lessons
                 - MUST provide fresh perspectives on the topic
                 - MUST focus on unexplored aspects of the subject
  
              2. CONTENT QUALITY:
                 - Start with a clear, action-oriented name
                 - Include specific, measurable learning objectives
                 - Provide practical, real-world applications
                 - Match user's current skill level
                 - Build naturally on previous knowledge
  
              3. LEARNING APPROACH:
                 - Use varied teaching methods
                 - Consider different learning styles
                 - Include engaging examples and analogies
                 - Provide clear progression of concepts
                 - Keep content focused and achievable
            </CRITICAL_REQUIREMENTS>
  
            <WHEN_USER_ASKS_FOR_NEW_LESSONS>
              1. CONTENT GENERATION:
                 - Generate COMPLETELY FRESH content
                 - Do NOT modify previous lesson ideas
                 - Use different teaching approaches
                 - Cover different aspects of the topic
                 - Consider different learning styles
  
              2. DIFFERENTIATION:
                 - Choose new angles on the topic
                 - Use different activity types
                 - Focus on unexplored concepts
                 - Vary difficulty levels appropriately
                 - Create unique learning experiences
  
              3. VERIFICATION:
                 - Check against ExistingLessons
                 - Ensure no concept overlap
                 - Verify unique approach
                 - Confirm fresh perspective
                 - Validate appropriate difficulty
            </WHEN_USER_ASKS_FOR_NEW_LESSONS>
          `)
      ),
    }),
    z.object({
      type: z.literal('existing'),
      lessonId: z.string().describe(
        trimLines(`
            <CRITICAL_REQUIREMENTS>
              1. USAGE RULES:
                 - MUST NOT suggest previously recommended lessons
                 - MUST be EXACTLY what the user needs right now
                 - MUST match current learning context perfectly
                 - MUST align with user's current skill level
                 - MUST NOT be suggested just because it exists
  
              2. VERIFICATION:
                 - Check lesson history thoroughly
                 - Verify perfect content match
                 - Confirm skill level alignment
                 - Ensure contextual relevance
                 - Validate learning progression
  
              3. WHEN TO USE:
                 - ONLY when an existing lesson perfectly matches
                 - NEVER as a fallback option
                 - NEVER if a new lesson would serve better
                 - ONLY if content exactly matches need
                 - ONLY if skill level is appropriate
            </CRITICAL_REQUIREMENTS>
          `)
      ),
    }),
  ])).describe(
    trimLines(`
        <CRITICAL_RULES>
          1. OUTPUT USAGE:
             - This is the ONLY place where lessons should be suggested
             - NEVER put lessons in message field
             - NEVER put lessons in offerUserOptions
             - NEVER describe lessons in conversation
             - ALWAYS use this output for lesson suggestions
  
          2. UNIQUENESS REQUIREMENTS:
             - Each suggestion MUST be completely unique
             - Never repeat previously suggested lessons
             - Never suggest similar lessons with minor variations
             - Track all suggestions to avoid repetition
             - Generate fresh content for each request
  
          3. WHEN USER ASKS FOR NEW LESSONS:
             - Check ExistingLessons context first
             - Generate completely new content
             - Use different teaching approaches
             - Focus on unexplored aspects
             - Consider different learning styles
  
          4. ORDERING:
             - Most relevant lessons first
             - Match current learning context
             - Align with skill progression
             - Consider prerequisite knowledge
             - Build complexity gradually
        </CRITICAL_RULES>
  
        <EXAMPLES>
          ✅ GOOD: Completely new lessons with fresh approaches
          ✅ GOOD: Different teaching methods for same topic
          ✅ GOOD: Unique perspectives on the subject
          
          ❌ BAD: Minor variations of previous lessons
          ❌ BAD: Repeated concepts with different names
          ❌ BAD: Similar content in different formats
        </EXAMPLES>
      `)
)
export type SuggestLessonsToolArgs = z.infer<typeof SuggestLessonsToolArgsSchema>;


export class SuggestLessonsTool implements RNAgentTool<any, any, any> {
  name = 'SuggestLessons';
  description = 'Suggest lessons.';
  args = SuggestLessonsToolArgsSchema;
  requiresIteration = false;
};