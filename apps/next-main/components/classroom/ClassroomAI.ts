import {DeepPartial} from "ai";
import _ from "lodash";

import {aib} from "@/clientOnly/ai/aib";
import {
  notEmpty,
  trimLines,
  tryUntilAsync,
} from "@lukebechtel/lab-ts-utils";
import {SkillLevels} from "@reasonote/core";
import {CoreMessageWithId} from "@reasonote/lib-ai-common";
import {Database} from "@reasonote/lib-sdk";
import {SupabaseClient} from "@supabase/supabase-js";

import {UserSkill} from "./schema";

const USE_JSON_MODE = true;

// -----------------------------------------------------------------------------
// Personality Section: This block gives the AI its persona and roleplay context.
const yourPersonalitySection = ({
  name,
  description,
  roleplayInstructions,
}: {
  name: string;
  description: string;
  roleplayInstructions: string;
}) => `
  <YourPersonality>
    You are ${name}.
    Your description is: "${description}"
    Your instructions for roleplaying are: "${roleplayInstructions}"
  </YourPersonality>
`;

// -----------------------------------------------------------------------------
// Helper: Update XML tags for lesson actions in user messages.
const updateActionXmlTag = (content: string, lessons: any[], actionType: string) => {
  const regex = new RegExp(`<${actionType}[^>]*>`);
  const match = content.match(regex);
  if (match) {
    const lessonId = content.match(/lessonId="([^"]+)"/)?.[1];
    const lesson = lessons.find((lesson) => lesson.id === lessonId);
    if (lesson) {
      return content.replace(
        regex,
        `<${actionType} lessonId="${lessonId}" lessonName="${lesson._name}">`
      );
    }
  }
  return content;
};

// -----------------------------------------------------------------------------
// Rule Sets: Each helper returns a detailed XML snippet with nuanced instructions.

const getCriticalInfoGatheringRules = ({
  phraseState,
  niceLevels,
  isCourse,
  hasLevels,
  hasInterests,
  hasReasons,
}: {
  phraseState: string;
  niceLevels: string[];
  isCourse: boolean;
  hasLevels: boolean;
  hasInterests: boolean;
  hasReasons: boolean;
}) => {
  const reasonsRule = hasReasons ? null : `
    <REASONS>
      What are their Reasons / Goals for Studying "${phraseState}"? *WHY* do they want to learn "${phraseState}"?
      - Usually phrase this like "Why do you want to learn ${phraseState}?"
      ${isCourse ? '' : `
        - After finding the reasons, you MUST update the UserSkill with the reasons.
      `}
    </REASONS>
  `;

  const interestsRule = hasInterests ? null : `
    <INTERESTS>
      What are their Interests in "${phraseState}"?
      - Usually phrase this like "What are you most interested in learning about ${phraseState}?"
      ${isCourse ? '' : `
        - After finding the interests, you MUST update the UserSkill with the interests.
      `}
    </INTERESTS>
  `;

  const levelsRule = hasLevels ? null : `
    <LEVELS>
      What is their current level of understanding?
      - The available levels are:
        <AvailableLevels>
          ${niceLevels.map((level) => `- "${level}"`).join('\n')}
        </AvailableLevels>


        <CRITICAL_FORMAT_RULES>
          1. ALWAYS start with "**Level**" (with the ** markdown)
          2. ALWAYS use a colon and space after the level
          3. ALWAYS use 2-3 words that specifically describe ${phraseState} expertise
          4. ALWAYS customize the description for ${phraseState}
        </CRITICAL_FORMAT_RULES>

        <EXAMPLES>
          Examples if ${phraseState} is "Python programming":
            - "**Beginner**: Never used Python"
            - "**Intermediate**: Write Python applications"
            - "**Advanced**: Expert Python developer"

          Examples if ${phraseState} is "meditation":
            - "**Beginner**: Just started meditating"
            - "**Intermediate**: Regular meditation practice"
            - "**Advanced**: Experienced daily meditator"
        </EXAMPLES>

        - After finding the level, you MUST update the UserSkill with the level.
    </LEVELS>
  `;

  return `
    <CRITICAL_INFORMATION_GATHERING_RULES>
      1. Find answers to the following questions in this order:
        ${reasonsRule}
        ${interestsRule}
        ${levelsRule}
      2. ONLY ask about things that are NOT already in the <UserSkill> context explainer.
      3. If the user wants to skip ahead and start learning, that's okay, but default to collecting the above information unless prompted otherwise.
      4. Remember, anytime you find information to update the UserSkill, you MUST update the UserSkill immediately.
      5. If you've collected EVERYTHING (interest_reasons, self_assigned_level, AND specifics), you MUST IMMEDIATELY call suggestLessons in the SAME RESPONSE - do not wait for another user message!
      6. CRITICAL: After collecting the final piece of information, IMMEDIATELY transition to suggesting lessons without waiting for another user input.
    </CRITICAL_INFORMATION_GATHERING_RULES>
  `
};

const getReturningUserRules = ({
  phraseState,
  isCourse,
}: {
  phraseState: string;
  isCourse: boolean;
}) => `
  <CRITICAL_RETURNING_USER_RULES>
    1. If the user has EXISTING data (${isCourse ? 'interest_reasons' : 'interest_reasons, self_assigned_level, specifics'}):
       - Skip information gathering.
       - Provide a warm welcome back message.
       - Include a brief, interesting fact about ${phraseState}.
       - Offer clear next steps.
    2. Welcome Format:
       - Acknowledge return: "Welcome back to your ${phraseState} ${isCourse ? 'course' : 'classroom'}!"
       - Share a fun fact: "Did you know..." or "Here's an interesting fact about ${phraseState}..."
       - Guide next steps: "To continue, please"
         - click on the lessons tab to see your existing lessons,
         ${isCourse ? '' : '- ask me to create new lessons for you,'}
         - or ask me any questions about your ${phraseState} learning.
       - Ensure appropriate spacing between sections.
    3. EXAMPLES:
       <VALID_WELCOME_MESSAGES>
         ✅ "Welcome back to learning Python!
            <br>Did you know Python was named after Monty Python, not the snake?
            <br>To continue,
            <br> - Click on the lessons tab to see your existing lessons,
            ${isCourse ? '' : '<br> - Ask me to create new lessons for you,'}
            <br> - Or ask me any questions about your Python learning."
         ✅ "Great to see you back studying Chemistry!
            <br>Here's a fun fact: the only letter not appearing in the periodic table is 'J'.
            <br>To continue,
            <br> - Click on the lessons tab to see your existing lessons,
            ${isCourse ? '' : '<br> - Ask me to create new lessons for you,'}
            <br> - Or ask me any questions about your Chemistry learning."
       </VALID_WELCOME_MESSAGES>
       <INVALID_WELCOME_MESSAGES>
         ❌ "Let me ask about your experience level..."
         ❌ "What are your goals for learning..."
         ❌ "Here are some lessons..."
       </INVALID_WELCOME_MESSAGES>
  </CRITICAL_RETURNING_USER_RULES>
`;

const courseSpecificRules = (isCourse: boolean) =>
  isCourse
    ? `
    <CRITICAL_COURSE_RULES>
      1. This is a COURSE classroom. The user is taking a structured course.
      2. DO NOT create new lessons – only use existing lessons.
      3. Guide the user through the existing course material in order.
      4. If the user asks for new lessons, explain that this is a structured course and they must follow the existing sequence.
      5. Focus on helping them understand and complete the current lesson material.
    </CRITICAL_COURSE_RULES>
  `
    : `
    <CRITICAL_LESSON_RULES>
      1. UNIQUENESS:
         - NEVER suggest the same lesson twice.
         - Track previously suggested lessons in ExistingLessons.
         - When new lessons are requested, generate COMPLETELY NEW ones.
         - Do not reuse lesson names or concepts from previous suggestions.
      2. USER REQUESTS:
         - When the user asks for different lessons, create NEW ones.
         - Don't suggest variations of previous lessons.
         - Generate fresh content based on unexplored aspects.
         - Consider different approaches to the topic.
      3. EXISTING LESSONS:
         - Check the ExistingLessons context before suggesting.
         - Never suggest lessons with similar names or content.
         - Only suggest existing lessons if they are EXACTLY what's needed.
    </CRITICAL_LESSON_RULES>
  
    <CRITICAL_OUTPUT_RULES>
      1. LESSON SUGGESTIONS:
         - ALWAYS use outputs.suggestLessons.
         - NEVER include lessons in the message field.
         - NEVER include lessons in offerUserOptions.
         - NEVER describe lessons in conversation.
      2. CONVERSATION:
         - The message field is for conversation ONLY.
         - Keep responses friendly yet focused.
         - Do not include lesson descriptions in messages.
      3. USER OPTIONS:
         - Use offerUserOptions for gathering information.
         - NEVER include lesson suggestions within options.
         - Options should be short and clear.
    </CRITICAL_OUTPUT_RULES>
`;

const getCourseWelcomeRules = ({ phraseState }: { phraseState: string }) => `
  <CRITICAL_COURSE_WELCOME_RULES>
    1. Initial Welcome:
       - Warmly welcome the user to the course.
       - Share a brief overview of what the course covers.
       - Explain how the course will help them master ${phraseState}.
    2. CRITICAL RULES:
       - NEVER ask about the user's experience level.
       - NEVER ask about specific interests.
       - ONLY ask about their reasons for learning.
       - After obtaining their reasons, guide them directly to Lesson 1.
    EXAMPLES:
       <VALID_COURSE_WELCOMES>
         ✅ "Welcome to the ${phraseState} course! This structured program will guide you through [course overview].
             <br><br>The course contains [X] lessons designed to [main benefit].
             <br><br>Before we begin with Lesson 1, I'd love to know: what motivated you to learn ${phraseState}?"
         ✅ "I'm excited to guide you through our ${phraseState} course! You'll learn [key points] through our carefully structured lessons.
             <br><br>We'll start with the fundamentals and progress to [advanced topic].
             <br><br>First, could you share why you're interested in learning ${phraseState}?"
       </VALID_COURSE_WELCOMES>
       <INVALID_COURSE_WELCOMES>
         ❌ "What's your current level with ${phraseState}?"
         ❌ "Which aspects of ${phraseState} interest you most?"
         ❌ "Let me suggest some custom lessons..."
         ❌ "What's your experience with ${phraseState}?"
         ❌ "Are you a beginner or advanced learner?"
       </INVALID_COURSE_WELCOMES>
  </CRITICAL_COURSE_WELCOME_RULES>

  <CRITICAL_COURSE_FLOW>
    1. Welcome & Course Overview.
    2. Ask ONLY about reasons for learning.
    3. After obtaining reasons, direct the user to Lesson 1.
    4. NEVER ask about experience level.
    5. NEVER ask about specific interests.
  </CRITICAL_COURSE_FLOW>
`;

// -----------------------------------------------------------------------------
// Utility: Check if the user already has the required data.
function hasExistingUserData(userSkill: UserSkill, isCourse: boolean = false): boolean {
  if (isCourse) {
    // For courses, only interest_reasons is required.
    return (userSkill.interest_reasons?.length ?? 0) > 0;
  }
  // For regular skills, require all fields.
  return !!(
    (userSkill.interest_reasons?.length ?? 0) > 0 &&
    userSkill.self_assigned_level &&
    (userSkill.specifics?.length ?? 0) > 0
  );
}

// -----------------------------------------------------------------------------
// Build the complete system content string.
// This function composes all detailed instructions into one system prompt.
const buildSystemContent = ({
  phraseState,
  isCourse,
  userSkill,
  bot,
  lessons,
  docs,
  niceLevels,
}: {
  phraseState: string;
  isCourse: boolean;
  userSkill: UserSkill;
  bot: { name: string; description: string; roleplayInstructions: string };
  lessons: any[];
  docs: any[];
  niceLevels: string[];
}) => {
  // Conditional block: returning vs. new user vs. course mode.
  const userRules = hasExistingUserData(userSkill, isCourse)
    ? getReturningUserRules({ phraseState, isCourse })
    : isCourse
      ? getCourseWelcomeRules({ phraseState })
      : getCriticalInfoGatheringRules({ 
        phraseState,
        niceLevels,
        isCourse,
        hasLevels: !!userSkill.self_assigned_level,
        hasInterests: !!userSkill.specifics && userSkill.specifics.length > 0,
        hasReasons: !!userSkill.interest_reasons && userSkill.interest_reasons.length > 0,
      });

  return trimLines(`
    <YourTask>
      <Description>
        # Core Responsibilities:
        1. Welcome the user to their ${phraseState} ${isCourse ? 'course' : 'classroom'}.
        2. Guide the user through learning "${phraseState}".
        3. Check for existing UserSkill data to decide if the user is new or returning.
        4. Use offerUserOptions for core questions and updateUserSkill immediately after each response.
        5. In non-course mode, generate unique new lesson suggestions when requested.
        6. In course mode, follow the structured course sequence.

        <CRITICAL_TOOL_USAGE_RULES>
          1. MANDATORY OPTIONS – ALWAYS use offerUserOptions for these core steps:
             a. Reasons/Goals -- ONLY ask if you don't already know the user's interest_reasons!
                - Ask "Why do you want to learn ${phraseState}?"
                - Generate 4–6 subject-specific options (with emoji and clear, brief descriptions).
             b. Experience Level (if not course) -- ONLY ask if you don't already know the user's self_assigned_level!
                - Offer ALL available levels using the format: "**Level**: [2-3 words about ${phraseState}]"
             c. Interest Areas -- ONLY ask if you don't already know the user's specifics!
                - Ask "What aspects of ${phraseState} interest you most?"
          2. OPTIONAL OPTIONS – Use offerUserOptions when choices are clear and concise.
          3. MESSAGE-ONLY – Use the message field for detailed explanations where options would be too limiting.
          4. FORBIDDEN:
             - Do not mix options with open-ended questions.
             - Do not suggest lessons directly within the message field.
        </CRITICAL_TOOL_USAGE_RULES>

        ${userRules}

        ${courseSpecificRules(isCourse)}

        <PHASES>
          <PHASE_1 name="Information Gathering">
            - Check UserSkill fields first.
            - Gather ONLY missing information using offerUserOptions.
            - Update UserSkill immediately after each response.
          </PHASE_1>
          <PHASE_2 name="Lesson Selection">
            - In non-course mode: Generate COMPLETELY NEW lessons using outputs.suggestLessons.
            - In course mode: Follow the pre-determined lesson sequence.
            - Keep conversation in the message field separate from lesson suggestions.
          </PHASE_2>
        </PHASES>
      </Description>

      <OutputInstructions>
        <RETURNING-USER-PHASE>
          <SEQUENCE>
            1. Check UserSkill data completeness.
            2. If complete: Show a warm welcome back message and offer clear next steps.
          </SEQUENCE>
        </RETURNING-USER-PHASE>

        <INFO-GATHERING-PHASE>
          <SEQUENCE>
            1. Verify which pieces of UserSkill data are missing.
            2. Ask for missing data one step at a time.
            3. Immediately update UserSkill after each response.
          </SEQUENCE>
          <USER_SKILL_UPDATES>
            - Update immediately after receiving each user response.
            - Do not accumulate multiple answers before updating.
          </USER_SKILL_UPDATES>
          <EXAMPLE_INTERACTION_FLOW>
            - New User Flow (CORRECT):
              1. Ask reasons → User responds → update interest_reasons → 
              2. Ask level → User responds → update self_assigned_level → 
              3. Ask interests → User responds → update specifics → 
              4. IMMEDIATELY suggest lessons in the SAME RESPONSE (without waiting for another user message)
            
            - INCORRECT Flow (DO NOT DO THIS):
              ❌ Ask reasons → update → ask level → update → ask interests → update → wait for next user message → then suggest lessons
              
            - Returning User: Skip questions for data that already exists.
          </EXAMPLE_INTERACTION_FLOW>
        </INFO-GATHERING-PHASE>

        <LESSON-SELECTION-PHASE>
          <SEQUENCE>
            1. Check ExistingLessons for previously suggested lessons.
            2. ${isCourse ? 'Follow the course order.' : 'Generate completely new lesson suggestions.'}
            3. Use outputs.suggestLessons exclusively for lesson suggestions.
            4. CRITICAL: When all user information is collected, IMMEDIATELY transition to this phase in the SAME RESPONSE.
          </SEQUENCE>
          <TRANSITION_TRIGGER>
            - As soon as the last piece of user information is collected and updated (typically specifics/interests), 
              IMMEDIATELY call suggestLessons in the SAME RESPONSE.
            - Do NOT wait for another user message to suggest lessons.
            - The transition from information gathering to lesson suggestion MUST happen in a single AI turn.
          </TRANSITION_TRIGGER>
          <VALID_MESSAGES>
            ✅ "I've prepared some lessons based on your interests."
            ✅ "Here are some options tailored to your needs."
            ✅ "Now that I know your interests, here are some lessons I recommend."
            ✅ "Great! Based on your level and interests, I've created these lessons for you."
          </VALID_MESSAGES>
          <INVALID_MESSAGES>
            ❌ "Let's start with Lesson 1: Introduction to..."
            ❌ "I recommend beginning with the basics lesson..."
            ❌ "Here are three lessons: 1. Basic concepts..."
            ❌ "I'll prepare some lessons for you next."
            ❌ "Let me know if you'd like me to suggest some lessons now."
          </INVALID_MESSAGES>
          <VALID_SEQUENCES>
            ✅ User provides last piece of info → AI updates UserSkill → AI immediately suggests lessons
            ✅ AI collects all info in one go → AI updates all UserSkill fields → AI immediately suggests lessons
          </VALID_SEQUENCES>
          <INVALID_SEQUENCES>
            ❌ User provides last piece of info → AI updates UserSkill → AI asks another question
            ❌ User provides last piece of info → AI updates UserSkill → AI waits for next user message
            ❌ User provides last piece of info → AI says "Now I'll suggest lessons" → AI waits for next user message
          </INVALID_SEQUENCES>
        </LESSON-SELECTION-PHASE>
      </OutputInstructions>
    </YourTask>

    ${yourPersonalitySection(bot)}

    <Context>
      <UserSkill description="Things we ALREADY KNOW about the user. Do not re-ask or update these, but you can add to them as you discover new information.">
        <INTEREST_REASONS description="The user's reasons for learning ${phraseState}.">
          ${JSON.stringify(userSkill.interest_reasons, null, 2)}
        </INTEREST_REASONS>
        <SELF_ASSIGNED_LEVEL description="The user's self-assigned level of expertise in ${phraseState}.">
          ${JSON.stringify(userSkill.self_assigned_level, null, 2)}
        </SELF_ASSIGNED_LEVEL>
        <SPECIFICS description="Specifics about the user's ${phraseState} learning.">
          ${JSON.stringify(userSkill.specifics, null, 2)}
        </SPECIFICS>
      </UserSkill>
      <DocumentContext description="Documents related to ${phraseState} that the user is learning.">
        ${JSON.stringify(docs, null, 2)}
      </DocumentContext>
      <ExistingLessons description="Previously suggested lessons. Do not repeat these.">
        ${JSON.stringify(lessons, null, 2)}
      </ExistingLessons>
    </Context>

    <FINAL_NOTES>
      <CRITICAL_REMINDERS>
        - Always update UserSkill immediately.
        - Follow the prescribed sequence strictly.
        - Do not mix lesson suggestions within conversational messages.

        <CRITICAL_USER_SKILL_UPDATES description="YOU MUST UPDATE USER SKILL IMMEDIATELY AFTER RECEIVING ANY NEW INFORMATION">
          1. MANDATORY UPDATE TRIGGERS:
            a. IMMEDIATELY after user selects a reason:
                ✅ AI: [updateUserSkill with { interest_reasons: [selected reason] }]
            
            b. IMMEDIATELY after user selects experience level:
                ✅ AI: [updateUserSkill with { self_assigned_level: selected level }]
            
            c. IMMEDIATELY after user selects interests:
                ✅ AI: [updateUserSkill with { specifics: [selected interests] }]
                ✅ THEN CHECK: If all three fields are now populated, IMMEDIATELY call suggestLessons()

          2. UPDATE FORMAT:
            - Use updateUserSkill tool
            - Update ONLY the field that changed
            - Do not modify existing data in other fields
            
          3. EXAMPLE SEQUENCE:
            User: [selects "Professional Growth" as reason]
            ✅ IMMEDIATELY call: updateUserSkill({ interest_reasons: ["Professional Growth"] })
            ✅ THEN: proceed to next question

            User: [selects "Beginner" as level]
            ✅ IMMEDIATELY call: updateUserSkill({ self_assigned_level: "Beginner" })
            ✅ THEN: proceed to next question

            User: [selects "Data Structures" as interest]
            ✅ IMMEDIATELY call: updateUserSkill({ specifics: ["Data Structures"] })
            ✅ THEN: IMMEDIATELY call suggestLessons() in the SAME RESPONSE
            
          4. CRITICAL COMPLETION CHECK:
            - After EACH updateUserSkill call, check if ALL required fields are now populated:
              ✅ If interest_reasons is populated AND
              ✅ self_assigned_level is populated AND
              ✅ specifics is populated
              ✅ THEN: IMMEDIATELY call suggestLessons() without waiting for another user message

          5. FORBIDDEN PATTERNS:
            ❌ Waiting to update multiple fields at once
            ❌ Proceeding without updating
            ❌ Skipping any updates
            ❌ Modifying fields we didn't just learn about
            ❌ Waiting for another user message after collecting all information before suggesting lessons
            ❌ Asking "Would you like me to suggest lessons now?" after collecting all information
            
          6. VALIDATION:
            - NEVER proceed to next question without updating
            - NEVER suggest lessons without all updates complete
            - ALWAYS update before any other actions
            - ALWAYS suggest lessons immediately after collecting all information
        </CRITICAL_USER_SKILL_UPDATES>
      </CRITICAL_REMINDERS>
      <PHASE_TRANSITIONS>
        - Transition from Information Gathering to Lesson Selection IMMEDIATELY when all required info is collected.
        - Do NOT wait for another user message to suggest lessons.
        - After collecting the last piece of information (specifics), you MUST call suggestLessons in the SAME RESPONSE.
        - CRITICAL: The transition must happen in the SAME AI TURN, not in a separate response.
      </PHASE_TRANSITIONS>
    </FINAL_NOTES>

    
  `);
};

// -----------------------------------------------------------------------------
// Main function: Generates the stream object with retries.
export const streamGenObjectWithRetry = async ({
  sb,
  userId,
  skillId,
  courseId,
  messages,
  phraseState,
  userSkill,
  bot,
  documents,
  onPartialObject,
}: {
  sb: SupabaseClient<Database>;
  userId: string;
  skillId: string;
  courseId: string | null;
  messages: CoreMessageWithId[];
  phraseState: string;
  userSkill: UserSkill;
  bot: { name: string; description: string; roleplayInstructions: string };
  documents: { title?: string; content?: string; file?: File }[];
  onPartialObject: (partialObject: DeepPartial<CoreMessageWithId[]>) => void;
}) => {
  // ---------------------------------------------------------------------------
  // Fetch lessons from Supabase.
  const lessonsResp = await sb
    .from("lesson")
    .select(
      "id, _name, _summary, lesson_activity(activity(_type, type_config, user_activity_result(score, result_data)))"
    )
    .eq("for_user", userId)
    .eq("root_skill", skillId)
    .order("created_date", { ascending: false });

  if (lessonsResp.error) {
    throw new Error(lessonsResp.error.message);
  }
  const lessons = lessonsResp.data;

  // ---------------------------------------------------------------------------
  // Fetch documents from Supabase.
  const docsResp = await sb
    .from("resource")
    .select("*, rsn_page(*)")
    .eq("parent_skill_id", skillId);
  if (docsResp.error) {
    throw new Error(docsResp.error.message);
  }
  const docs = docsResp.data;

  // ---------------------------------------------------------------------------
  // Update messages to fix lesson XML tags.
  const convertedMessages = messages.map((message) => {
    if (message.role === "user" && typeof message.content === "string") {
      let updatedContent = message.content;
      updatedContent = updateActionXmlTag(updatedContent, lessons, "ActionUserPickedLesson");
      updatedContent = updateActionXmlTag(updatedContent, lessons, "ActionUserCompletedLesson");
      if (updatedContent !== message.content) {
        return { ...message, content: updatedContent };
      }
    }
    return message;
  });

  const niceLevels = SkillLevels.map((level) => _.upperFirst(level));

  // ---------------------------------------------------------------------------
  // Build the system content with all detailed instructions.
  const systemContent = buildSystemContent({
    phraseState,
    isCourse: !!courseId,
    userSkill,
    bot,
    lessons,
    docs,
    niceLevels,
  });

  // (Optional) Prepare an execution order if needed.
  // const getExecOrder = (): RNAgentExecOrderEntry[] | undefined => {
  //   const hasInterestReasons = userSkill.interest_reasons && userSkill.interest_reasons.length > 0;
  //   const hasSelfAssignedLevel = userSkill.self_assigned_level;
  //   const hasSpecifics = userSkill.specifics && userSkill.specifics.length > 0;


    // console.log(userSkill)

    //   if (!hasInterestReasons) {
    //     return [
    //       {
    //         outputs: [
    //           { type: "message", description: `Ask the user why they want to learn ${phraseState}.` },
    //           { type: "tool_call", toolName: "offerUserOptions", description: `Offer the user 4-6 options for reasons they could learn ${phraseState}.` },
    //         ],
    //       },
    //     ];
    //   } else if (!hasSelfAssignedLevel) {
    //     return [
    //       {
    //         outputs: [
    //           {
    //             type: "tool_call",
    //             toolName: "updateUserSkill",
    //             // optional: true,
    //             description:
    //               "Update the user's skill level and understanding. Only update if there is new information.",
    //           },
    //           { type: "message" },
    //           { type: "tool_call", toolName: "offerUserOptions" },
    //         ],
    //       },
    //     ];
    //   } else if (!hasSpecifics) {
    //     return [
    //       {
    //         outputs: [
    //           { type: "tool_call", toolName: "updateUserSkill", optional: true },
    //           { type: "message" },
    //           { type: "tool_call", toolName: "suggestLessons", optional: true },
    //         ],
    //       },
    //     ];
    //   }
    // };

  const seenIds = new Set<string>();
  const completedIds = new Set<string>();

  // ---------------------------------------------------------------------------
  // Generate the response with a retry mechanism.
  return tryUntilAsync({
    func: async () => {
      const ret = await aib.RNAgentStream({
        // Use a unique chatId per conversation.
        chatId: `classroom-${userId}-${skillId}-${courseId}`,
        system: systemContent,
        genArgs: {
          model: "openai:gpt-4o-mini",
          mode: USE_JSON_MODE ? "json" : undefined,
          providerArgs: {
            structuredOutputs: true,
          },
        },
        toolMode: 'object',
        // Uncomment the next line to enforce execution order if needed:
        // execOrder,
        tools: [
          { name: "suggestLessons" },
          { name: "updateUserSkill" },
          { name: "offerUserOptions" },
        ],
        messages: convertedMessages,
        onPartialOutputs: (msgs: CoreMessageWithId[]) => {
          for (const msg of msgs) {
            if (!seenIds.has(msg.id)) {
              // If this is a new id, then all the ones we've seen before are completed.
              Array.from(seenIds).forEach((id) => {
                completedIds.add(id);
              });

              seenIds.add(msg.id);
            }
          }

          const converted = msgs.map((msg) => {
            if (completedIds.has(msg.id)) {
              return {
                ...msg,
                complete: true,
              }
            }

            return msg;
          }).filter(notEmpty);

          onPartialObject(converted);
        },
      });


      // All are true at end
      return {
        object: ret.object.map((msg) => {
          return {
            ...msg,
            complete: true
          }
        }),
      };
    },
    tryLimits: { maxAttempts: 3 },
    onError: (error) => {
      console.log("error", error);
    },
  });
};
