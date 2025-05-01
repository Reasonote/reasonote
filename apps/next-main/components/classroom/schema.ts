import {z} from "zod";

import {trimLines} from "@lukebechtel/lab-ts-utils";
import {SkillLevels} from "@reasonote/core";
import {Activity} from "@reasonote/core/src/interfaces/Activity";

export const UserSkillSchema = z.object({
    id: z.string().nullable(),
    skill: z.string().nullable(),
    rsn_user: z.string().nullable(),
    interest_reasons: z.array(z.string()).nullable().describe(
        trimLines(`
            The reasons why the user wants to learn this subject.
            MUST be in the form of 'I want ...' statements.
            Each reason should be specific and actionable.
        `)
    ),
    self_assigned_level: z.string().nullable().describe(
        trimLines(`
            The user's self-assigned skill level.
            VALID LEVELS: ${SkillLevels.join(", ")}
            Choose the level that best matches the user's described experience.
        `)
    ),
    specifics: z.array(z.string()).nullable().describe(
        trimLines(`
            Particular topics or concepts the user wants to learn about.
            Each specific should be:
            1. Clear and focused
            2. Related to the main skill
            3. Achievable within a 5-10 minute lesson. 
        `)
    ),
    created_date: z.string().optional(),
    updated_date: z.string().optional(),
});
export type UserSkill = z.infer<typeof UserSkillSchema>;

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

export const OutputsCreateLessonsSchema = z.object({
  lessons: z.array(LessonStubSchema).describe("The lessons to create."),
})
export type OutputsCreateLessons = z.infer<typeof OutputsCreateLessonsSchema>;

export const OutputsShowLessonPickerSchema = z.object({
  lessons: z.array(z.union([LessonStubSchema, z.string()])).describe("The lessons to show to the user. (Can be the id or name of the lesson if it has already been created, or a stub if it has not been created yet.)"),
})
export type OutputsShowLessonPicker = z.infer<typeof OutputsShowLessonPickerSchema>;

export const OutputsSuggestLessonsSchema = z.object({
  lessons: z.array(z.union([
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
  ),
})
export type OutputsSuggestLessons = z.infer<typeof OutputsSuggestLessonsSchema>;


export type LessonWithActivities = LessonStub & { 
  activities: Activity[];
  isUnderConstruction: boolean;
  createdAt: number;
}

// TODO: split into separate schemas
// TODO: agent should get feedback when it tries to call an output it can't currently --
//     i.e. "you tried to call this tool, but you weren't in the right state. You must be in the X state to call this output. Do you want to switch to this state?"

export const OutputsUpdateUserSkillSchema = z.object({
  interest_reasons: z.array(z.string()).nullable().describe("The reasons why the user wants to learn this subject."),
  self_assigned_level: z.enum(SkillLevels).nullable().describe(`The user's self-assigned skill level. (VALID LEVELS: ${SkillLevels.join(", ")})`),
  specifics: z.array(z.string()).nullable().describe("Specific subjects or topics within the skill that the user is interested in."),
})
export type OutputsUpdateUserSkill = z.infer<typeof OutputsUpdateUserSkillSchema>;

export const CombinedGenSchema = z.object({
    message: z.string().describe(trimLines(`
        The chat message to display to the user.
        
        CRITICAL: This field is for conversational messages ONLY.
        DO NOT PUT LESSONS HERE - Use outputs.suggestLessons instead.
        
        VALID EXAMPLES:
        ✅ "I understand you want to learn about Python. Let me suggest some lessons..."
        ✅ "That's great! Let me prepare some lessons for you..."
        ✅ "I'll help you find the right lesson..."
        
        INVALID EXAMPLES:
        ❌ "Here are some lessons: 1. Introduction to Python..."
        ❌ "I suggest starting with the 'Python Basics' lesson..."
        ❌ "Let's begin with a lesson on variables..."
    `)),
    outputs: z.object({
        // STATE
        alterStatus: z.enum(["info", "pick-lesson"]).nullable().describe(
            trimLines(`
                Update your status.
                Use "pick-lesson" when you're ready to suggest lessons.
            `)
        ),
        
        // ->'info'
        updateUserSkill: OutputsUpdateUserSkillSchema.nullable(),
        offerUserOptions: z.object({
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
        }).nullable(),
        
        // ->'pick-lesson'
        suggestLessons: OutputsSuggestLessonsSchema.nullable().describe(
            trimLines(`
                THIS IS THE ONLY PLACE WHERE LESSONS SHOULD BE SUGGESTED.
                
                When suggesting lessons:
                1. ALWAYS use this output
                2. NEVER put lesson suggestions in the message field
                3. NEVER put lesson suggestions in offerUserOptions
                
                WORKFLOW:
                1. Set alterStatus to "pick-lesson"
                2. Use this field to suggest lessons
                3. Keep message field conversational only
            `)
        ),
    }),
    z_eot: z.number().describe(`
      Marks the END of your output.

      ONLY fill this out once you have finished ALL other outputs.

      Set this to the number 1.
    `)
})
export type CombinedGen = z.infer<typeof CombinedGenSchema>;