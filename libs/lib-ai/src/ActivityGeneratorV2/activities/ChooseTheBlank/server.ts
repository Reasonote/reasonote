import { z } from 'zod';

import { trimLines } from '@lukebechtel/lab-ts-utils';
import {
  ChooseTheBlankActivityConfig,
  ChooseTheBlankActivityConfigSchema,
  ChooseTheBlankResult,
  ChooseTheBlankSubmitResult,
} from '@reasonote/activity-definitions';
import {
  ActivityGenConfig,
  ActivityGenerateRequest,
} from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { ActivityTypeServerV2 } from '../../ActivityTypeServerV2.priompt';
import { formatExample } from '../../Examples';
import { ActivityRequestHydratedValues } from '../../types';

export class ChooseTheBlankActivityTypeServerV2 extends ActivityTypeServerV2<ChooseTheBlankActivityConfig, ChooseTheBlankSubmitResult> {
    static readonly type = 'choose-the-blank' as const;
    readonly type = ChooseTheBlankActivityTypeServerV2.type;

    override async getGenConfig(args: ActivityGenerateRequest, ai: AI): Promise<ActivityGenConfig> {
        return {
            schema: ChooseTheBlankActivityConfigSchema,
            shortDescription: 'A fill-in-the-blank activity where students choose from a list of words',
            primaryInstructions: async () => `
                <INSTRUCTIONS description="Core instructions for generating a choose-the-blank activity">
                    <OVERVIEW>
                        Generate a fill-in-the-blank activity where students need to choose the correct words to complete the text.
                        The text should be educational and relevant to the topic.
                        Questions can be focused and concise, or more comprehensive with multiple blanks.
                        Use tasteful markdown formatting for emphasis (i.e. *italics*), to make the activity more engaging.
                    </OVERVIEW>

                    <CRITICAL_FORMAT_REQUIREMENTS description="Required XML formatting for hidden words">
                        - EVERY hidden word MUST be wrapped in a span tag with an id attribute
                        - The id MUST follow the format: id="hidden-word-N" where N starts at 1
                        - The hidden word MUST be placed inside the span tags exactly as it appears in hiddenWords
                        - NEVER use underscores (_____) or other placeholder formats
                        - The number in hidden-word-N MUST match the position of the word in hiddenWords array
                        
                        CORRECT FORMAT:
                        Text: "The <span id="hidden-word-1">Python</span> programming language..."
                        hiddenWords: ["Python"]

                        INCORRECT FORMATS (DO NOT USE):
                        ❌ "The _____ programming language..."
                        ❌ "The [Python] programming language..."
                        ❌ "The <span>Python</span> programming language..."
                        ❌ "The <span id="hidden-word">Python</span> programming language..."
                    </CRITICAL_FORMAT_REQUIREMENTS>

                    <QUESTION_STYLES description="Different valid approaches to questions">
                        - Focused questions with concrete examples (e.g. "In the code \`x = 5\`, \`x\` is a <span id=\"hidden-word-1\">variable</span>.")
                        - Comprehensive questions that test multiple related concepts
                        - Questions that test understanding through practical examples
                        Choose the style that best fits the concept being tested.
                    </QUESTION_STYLES>

                    <HIDDEN_WORDS description="Guidelines for selecting words to hide">
                        - Choose key terms or concepts that test understanding
                        - Select words that are central to the topic
                        - Pick terms that demonstrate comprehension when used correctly
                        - Number of blanks can vary (1-3) based on the question style
                        - ALWAYS wrap hidden words in <span> tags with correct id format
                        - The text inside span tags MUST match exactly with hiddenWords array
                    </HIDDEN_WORDS>

                    <WORD_CHOICES description="Guidelines for creating word choices">
                        - Include all correct answers in the word choices
                        - Include at least 3 plausible distractors that test understanding
                        - Additional distractors can be less plausible but still related to the topic
                        - Keep total number of choices manageable (2-4 per blank)
                        - No more than 8 choices total
                        - Word choices MUST match exactly with the text in span tags
                    </WORD_CHOICES>

                    <VALIDATION_CHECKLIST description="Final checks before submitting">
                        - ✓ Every hidden word is wrapped in <span> tags
                        - ✓ Every span has correct id="hidden-word-N" format
                        - ✓ No underscores or other placeholder formats used
                        - ✓ Text inside spans matches hiddenWords array exactly
                        - ✓ Word choices include all hidden words
                        - ✓ Span tag numbers match position in hiddenWords array
                    </VALIDATION_CHECKLIST>
                </INSTRUCTIONS>
            `,
            whenToUse: [
                'When testing vocabulary comprehension',
                'When checking understanding of key concepts',
                'When practicing proper word usage in context',
                'For reading comprehension exercises'
            ],
            whenToAvoid: [
                'When testing complex problem-solving skills',
                'When open-ended responses are needed',
                'When the concept requires long-form explanation',
                'When testing mathematical calculations'
            ],
            examples: [{
                name: "programming_example_focused",
                input: "Generate a choose-the-blank activity about Python variables",
                outputs: [{   
                    name: "good_example_focused",
                    quality: "good",
                    output: {
                        text: "In the *Python* code snippet `x = 5`, `x` is best referred to as a <span id=\"hidden-word-1\">variable</span>. This is because it can store different <span id=\"hidden-word-2\">values</span> during program execution.",
                        hiddenWords: ["variable", "values"],
                        wordChoices: ["variable", "constant", "function", "values", "parameters", "literals", "methods"]
                    },
                    explanation: "This is a good example because it:\n- Uses proper span tags with correct id format\n- Matches hidden words exactly in text and array\n- Uses concrete code example with proper formatting\n- Provides sufficient context around blanks\n- Has relevant distractors that test understanding\n- Builds on the first concept in the second blank\n- Is clear and educational without being verbose"
                }, {
                    name: "bad_example_overexplained",
                    quality: "bad",
                    output: {
                        text: "A _____ is something that stores data in memory and can change its value during program execution. For example, when we write x = 5, we are creating one.",
                        hiddenWords: ["variable"],
                        wordChoices: ["variable", "function", "class"]
                    },
                    explanation: "This is a poor example because it:\n- Uses underscores instead of proper span tags\n- Missing id attributes for hidden words\n- Over-explains the concept instead of testing it\n- Gives away the answer in the explanation\n- Has too few word choices\n- Reads like a definition rather than a practical test\n- Uses inconsistent code formatting"
                }]
            }, {
                name: "programming_example_comprehensive",
                input: "Generate a choose-the-blank activity about Python list comprehensions",
                outputs: [{   
                    name: "good_example_comprehensive",
                    quality: "good",
                    output: {
                        text: "In *Python*, the expression `[i * 2 for i in range(5)]` is an example of a <span id=\"hidden-word-1\">list comprehension</span>. This powerful feature combines a <span id=\"hidden-word-2\">loop</span> with list creation to transform each <span id=\"hidden-word-3\">element</span> in a sequence.",
                        hiddenWords: ["list comprehension", "loop", "element"],
                        wordChoices: ["list comprehension", "generator expression", "dictionary comprehension", "loop", "function", "method", "element", "index", "variable"]
                    },
                    explanation: "This is a good example because it:\n- Uses correct span tag format for all hidden words\n- Maintains exact text matching between spans and hiddenWords\n- Provides a concrete, runnable code example\n- Uses proper code formatting with backticks\n- Tests multiple related concepts progressively\n- Has plausible distractors at different difficulty levels\n- Creates a coherent narrative that builds understanding"
                }]
            }, {
                name: "literature_example",
                input: "Create a choose-the-blank activity about Shakespeare's Hamlet",
                outputs: [
                    {
                        name: "good_example_literature",
                        quality: "good",
                        output: {
                            text: "In Shakespeare's masterpiece *Hamlet*, the titular character is the <span id=\"hidden-word-1\">Prince</span> of Denmark. His famous soliloquy \"<span id=\"hidden-word-2\">To be, or not to be</span>\" contemplates the nature of existence, beginning with the immortal words \"To be, or not to be.\" This speech occurs after he discovers that his uncle <span id=\"hidden-word-3\">Claudius</span> murdered his father.",
                            hiddenWords: ["Prince", "To be, or not to be", "Claudius"],
                            wordChoices: ["Prince", "King", "Duke", "To be, or not to be", "What a piece of work is man", "O what a rogue", "Claudius", "Polonius", "Laertes"]
                        },
                        explanation: "This is a good example because it:\n- Uses proper formatting with emphasis\n- Provides rich context around each blank\n- Tests key knowledge about the play\n- Includes plausible but incorrect alternatives\n- Uses span tags for clear word placement\n- Creates a coherent narrative"
                    },
                    {
                        name: "bad_example_literature",
                        quality: "bad",
                        output: {
                            text: "_____ wrote _____. The main character is _____ who wants to kill _____.",
                            hiddenWords: ["Shakespeare", "Hamlet", "Hamlet", "Claudius"],
                            wordChoices: ["Shakespeare", "Marlowe", "Hamlet", "Macbeth", "Claudius", "Polonius"]
                        },
                        explanation: "This is a poor example because it:\n- Lacks proper formatting\n- No span tags for hidden words\n- Missing important context\n- Too many blanks in succession\n- Oversimplifies the complex plot\n- Doesn't test deeper understanding"
                    }
                ]
            }, {
                name: "science_example",
                input: "Create a choose-the-blank activity about the solar system",
                outputs: [{
                    name: "good_example_science",
                    quality: "good",
                    output: {
                        text: "Our solar system's star, the *Sun*, is classified as a <span id=\"hidden-word-1\">yellow</span> dwarf star. The planet <span id=\"hidden-word-2\">Mars</span> is known as the 'Red Planet' due to its iron oxide surface, while <span id=\"hidden-word-3\">Jupiter</span> is the largest planet and has a distinctive Great Red Spot storm system.",
                        hiddenWords: ["yellow", "Mars", "Jupiter"],
                        wordChoices: ["yellow", "white", "blue", "Mars", "Venus", "Mercury", "Jupiter", "Saturn", "Neptune"]
                    },
                    explanation: "This is a good example because it:\n- Uses proper span tags with sequential ids\n- Maintains exact text matching in all places\n- Provides educational context for each blank\n- Uses appropriate emphasis with markdown\n- Has relevant distractors for each concept\n- Creates a coherent scientific narrative\n- Tests factual knowledge with proper context"
                }, {
                    name: "bad_example_science",
                    quality: "bad",
                    output: {
                        text: "The _____ is a star. _____ is red and _____ is big.",
                        hiddenWords: ["Sun", "Mars", "Jupiter"],
                        wordChoices: ["Sun", "Moon", "Mars", "Earth", "Jupiter", "Saturn"]
                    },
                    explanation: "This is a poor example because it:\n- Uses underscores instead of proper span tags\n- Missing id attributes for hidden words\n- Lacks proper formatting and structure\n- Provides no educational context\n- Uses overly simplistic language\n- Fails to test deeper understanding\n- Missing proper scientific terminology"
                }]
            }],
            finalInstructions: async () => `
                <FINAL_INSTRUCTIONS description="Final checks and reminders for the activity">
                    <CRITICAL_FORMAT_CHECK description="Verify XML formatting">
                        - VERIFY: Every hidden word uses <span id="hidden-word-N">word</span> format
                        - VERIFY: No underscores or other formats are used for blanks
                        - VERIFY: Span tag numbers match position in hiddenWords array
                        - VERIFY: Text inside spans matches hiddenWords array exactly
                    </CRITICAL_FORMAT_CHECK>

                    <TEXT_QUALITY description="Ensuring the text is well-structured">
                        - Text should be clear and concise
                        - Include context appropriate to the question style
                        - Use proper formatting for code and emphasis
                    </TEXT_QUALITY>

                    <WORD_CHOICE_VALIDATION description="Validating word choices">
                        - Verify all hidden words appear in word choices exactly as written
                        - Must have either:
                          * At least 2 plausible distractors per blank, OR
                          * At least 3 plausible distractors total
                        - A distractor can be plausible for multiple blanks
                        - Distractors must be topic-relevant but can vary in difficulty
                        - Total number of choices should be appropriate for the question
                        - No more than 8 choices total
                    </WORD_CHOICE_VALIDATION>

                    <DIFFICULTY_BALANCE description="Maintaining appropriate difficulty">
                        - Questions should test understanding, not definitions
                        - Prefer practical examples over theoretical explanations
                        - Context should be sufficient but not excessive
                    </DIFFICULTY_BALANCE>
                </FINAL_INSTRUCTIONS>
            `
        };
    }

    override postProcessConfig = async ({config, request, ai}: {config: ChooseTheBlankActivityConfig, request: ActivityGenerateRequest, ai: AI}): Promise<ChooseTheBlankActivityConfig> => {
        // First ensure word choices are complete
        const requiredCounts = config.hiddenWords.reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const currentCounts = config.wordChoices.reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const newWordChoices = [...config.wordChoices];

        Object.entries(requiredCounts).forEach(([word, requiredCount]) => {
            const currentCount = currentCounts[word] || 0;
            const missing = requiredCount - currentCount;
            if (missing > 0) {
                for (let i = 0; i < missing; i++) {
                    newWordChoices.push(word);
                }
            }
        });

        // Now fix any formatting issues in the text
        let newText = config.text;

        // 1. Replace any series of underscores with proper span tags
        const underscorePattern = /_{3,}/g;
        let underscoreMatch;
        let underscoreIndex = 0;
        while ((underscoreMatch = underscorePattern.exec(newText)) !== null) {
            const hiddenWord = config.hiddenWords[underscoreIndex] || '';
            newText = newText.replace(underscoreMatch[0], `<span id="hidden-word-${underscoreIndex + 1}">${hiddenWord}</span>`);
            underscoreIndex++;
        }

        // 2. Fix spans that are missing proper id format
        const improperSpanPattern = /<span[^>]*>(.*?)<\/span>/g;
        let spanMatch;
        let spanIndex = 0;
        const processedWords = new Set<number>();
        
        newText = newText.replace(improperSpanPattern, (match, content) => {
            // Skip if this is already a properly formatted span
            if (match.includes('id="hidden-word-')) {
                const idMatch = match.match(/id="hidden-word-(\d+)"/);
                if (idMatch) {
                    const index = parseInt(idMatch[1]) - 1;
                    processedWords.add(index);
                    // Ensure the content matches the hidden word
                    return `<span id="hidden-word-${idMatch[1]}">${config.hiddenWords[index] || content}</span>`;
                }
            }
            
            // Find the next unused index
            while (processedWords.has(spanIndex)) {
                spanIndex++;
            }
            processedWords.add(spanIndex);
            
            // Replace with proper format
            return `<span id="hidden-word-${spanIndex + 1}">${config.hiddenWords[spanIndex] || content}</span>`;
        });

        // 3. Ensure all hidden words are properly represented in spans
        config.hiddenWords.forEach((word, index) => {
            if (!processedWords.has(index)) {
                // If a hidden word isn't in a span yet, append it to the text
                newText += ` <span id="hidden-word-${index + 1}">${word}</span>`;
            }
        });

        return {
            ...config,
            text: newText,
            wordChoices: newWordChoices
        };
    }

    /**
     * This is the evaluator that will be run after the activity is generated.
     * It will be run multiple times if the activity is not valid.
     * 
     * @param args - The arguments for the evaluation: {config, request, ai}
     * @param args.config - The generated activity config
     * @param args.request - The request that generated the activity
     * @param args.ai - The AI instance
     * 
     * @returns result - The result of the evaluation
     * @returns result.isValid - Whether the activity is valid
     * @returns result.feedback - The feedback from the evaluation
     * @returns result.feedback.issues - The issues found with the activity
     * @returns result.feedback.generalFeedback - General feedback about the activity
     */
    override evaluateConfig = async ({config, request, ai}: {config: ChooseTheBlankActivityConfig, request: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues}, ai: AI}): Promise<{isValid: boolean, feedback: {issues: {issue: string, suggestedFix: string | null}[] | null, generalFeedback: string | null}}> => {
        const genConfig = await this.getGenConfig(request, ai);
        
        // Get activity-specific instructions
        const primaryInstructions = await genConfig.primaryInstructions(request);
        const finalInstructions = await genConfig.finalInstructions?.(request);
        const context = await ai.prompt.activities.generateActivityContextString(request);

        const evaluationResponse = await ai.genObject({
            model: 'openai:gpt-4o-mini',
            schema: z.object({
                thinking: z.array(z.object({
                    reasoning: z.string().describe('The AI\'s reasoning for the issue'),
                    possibleIssue: z.string(),
                    distractorEvaluation: z.array(z.object({
                        distractor: z.string(),
                        evaluation: z.string(),
                    })),
                    severity: z.enum(['nit', 'minor', 'major', 'critical']),
                })).describe('Use this to think through the activity config provided, and to make sure your evaluation is thorough and accurate'),
                result: z.object({
                    isValid: z.boolean(),
                    issues: z.array(z.object({
                        issue: z.string().describe('The issue found with the activity'),
                        suggestedFix: z.string().nullable().describe('A suggested fix for the issue'),
                    })).nullable().describe('The issues found with the activity'),
                    generalFeedback: z.string().nullable().describe('General feedback about the activity'),
                }).describe('The final result of the evaluation'),
            }),
            messages: [
                {
                    role: 'system',
                    content: trimLines(`
                        <YOUR_TASK>
                            Your task is to evaluate if the generated activity follows all the instructions and requirements.
                            The goal is to identify genuine problems that would make the activity ineffective, NOT to suggest minor improvements.
                            
                            <CORE_PRINCIPLE>
                                If a question effectively tests understanding of a concept, it should be marked as valid,
                                even if you can think of ways it could be marginally improved.
                                DO NOT suggest improvements to questions that are already working well.
                            </CORE_PRINCIPLE>

                            <EVALUATION_PRINCIPLES>
                                - A focused question with a concrete example is often better than a complex one
                                - If a question makes students think about the right concept, it's working
                                - Any distractor that's topic-relevant is fine - they don't all need to be equally plausible
                                - One well-chosen blank is better than multiple forced ones
                                - Practical examples (like code) are better than theoretical ones
                            </EVALUATION_PRINCIPLES>

                            <DISTRACTOR_EVALUATION description="Guidelines for evaluating distractors">
                                - A distractor is considered plausible if it:
                                  * Is related to the topic/concept being tested
                                  * Could reasonably be chosen by someone with partial understanding
                                  * Makes sense in the context of the question
                                - Count ALL plausible distractors, not just the most challenging ones
                                - A distractor can be plausible for multiple blanks
                                - The activity is valid if it has either:
                                  * At least 2 plausible distractors per blank, OR
                                  * At least 3 plausible distractors total
                                - Do not count the correct answer(s) as distractors

                                <EXAMPLE_EVALUATIONS description="Examples of how to evaluate distractors">
                                    <PROGRAMMING_EXAMPLE>
                                        Question: "In Python, 'x = 5' creates a <span>variable</span>"
                                        Correct answer: "variable"
                                        ALL of these count as plausible distractors:
                                        - "constant" (related concept, common confusion)
                                        - "parameter" (similar role in code)
                                        - "value" (related to assignment)
                                        - "function" (another named entity)
                                        - "type" (related to data storage)
                                        This would pass with 5 plausible distractors
                                    </PROGRAMMING_EXAMPLE>

                                    <SCIENCE_EXAMPLE>
                                        Question: "The planet <span>Mars</span> is known as the Red Planet"
                                        Correct answer: "Mars"
                                        ALL of these count as plausible distractors:
                                        - "Venus" (another planet)
                                        - "Mercury" (another planet)
                                        - "Jupiter" (another planet)
                                        - "Saturn" (another planet)
                                        This would pass with 4 plausible distractors
                                    </SCIENCE_EXAMPLE>

                                    <LITERATURE_EXAMPLE>
                                        Question: "<span>Hamlet</span> was written by Shakespeare"
                                        Correct answer: "Hamlet"
                                        ALL of these count as plausible distractors:
                                        - "Macbeth" (another Shakespeare play)
                                        - "Othello" (another Shakespeare play)
                                        - "Romeo and Juliet" (another Shakespeare play)
                                        This would pass with 3 plausible distractors
                                    </LITERATURE_EXAMPLE>

                                    <COMMON_MISTAKES description="What evaluators often get wrong">
                                        ❌ "Only counting the most challenging distractors"
                                        ❌ "Requiring distractors to be equally plausible"
                                        ❌ "Not counting related terms as distractors"
                                        ❌ "Requiring distractors to be perfect alternatives"
                                        ✓ "Count ALL topic-relevant options as distractors"
                                        ✓ "Accept varying levels of plausibility"
                                        ✓ "Include all related concepts that fit grammatically"
                                    </COMMON_MISTAKES>
                                </EXAMPLE_EVALUATIONS>
                            </DISTRACTOR_EVALUATION>

                            <CRITICAL_ISSUES description="ONLY flag these as problems">
                                - Missing/broken formatting that makes the question unclear
                                - Text that explicitly gives away the answer
                                - Distractors completely unrelated to the topic
                                - Technical errors that make the question incorrect
                            </CRITICAL_ISSUES>

                            <AUTOMATIC_PASS description="Automatically pass questions that have these">
                                - Clear concrete example (like a code snippet)
                                - Sufficient distractors (3+ total plausible)
                                - Proper formatting
                                - Tests a specific concept
                            </AUTOMATIC_PASS>

                            <ABSOLUTELY_DO_NOT_FLAG description="Never mention these as issues">
                                - Could have more blanks
                                - Could have more context
                                - Some distractors are less plausible
                                - Question is too focused/simple
                                - Could test deeper understanding
                                - Could have better distractors
                                - Could be more comprehensive
                            </ABSOLUTELY_DO_NOT_FLAG>
                        </YOUR_TASK>

                        <EVALUATION_CONTEXT description="Context for evaluating a choose-the-blank activity">
                            <ACTIVITY_INSTRUCTIONS description="The instructions that were provided for generating this activity">
                                ${primaryInstructions}
                            </ACTIVITY_INSTRUCTIONS>

                            <EXAMPLES description="Examples of good and bad choose-the-blank activities">
                                ${genConfig.examples ? genConfig.examples.map((example, index) => formatExample(example, index)).join('\n') : 'No examples provided'}
                            </EXAMPLES>

                            <ACTIVITY_CONTEXT description="The context in which this activity was generated">
                                ${context}
                            </ACTIVITY_CONTEXT>

                            <FINAL_CHECKS description="Final requirements that must be met">
                                ${finalInstructions}
                            </FINAL_CHECKS>
                        </EVALUATION_CONTEXT>
                    `)
                },
                {
                    role: 'user',
                    content: trimLines(`
                        <ACTIVITY_TO_EVALUATE>
                            <TEXT>${config.text}</TEXT>
                            <HIDDEN_WORDS>${config.hiddenWords.join(', ')}</HIDDEN_WORDS>
                            <WORD_CHOICES>${config.wordChoices.join(', ')}</WORD_CHOICES>
                        </ACTIVITY_TO_EVALUATE>
                    `)
                }
            ],
            mode: 'json',
            providerArgs: {
                structuredOutputs: true,
            },
        });

        console.debug('Evaluation response:', evaluationResponse.object);

        return {
            isValid: evaluationResponse.object.result.isValid,
            feedback: {
                issues: evaluationResponse.object.result.issues,
                generalFeedback: evaluationResponse.object.result.generalFeedback,
            }
        };
    }

    createEmptyConfig(): ChooseTheBlankActivityConfig {
        return {
            version: "0.0.0",
            type: this.type,
            text: "",
            hiddenWords: [],
            wordChoices: [],
        };
    }

    async getCompletedTip(result: ChooseTheBlankResult): Promise<string | undefined> {    
        if (result?.feedback?.aboveTheFoldAnswer) {
            return result.feedback.aboveTheFoldAnswer;
        }
        return undefined;
    }

    override gradeUserAnswer = async ({config, userAnswer, ai}: {config: ChooseTheBlankActivityConfig, userAnswer: {userAnswers: string[]}, ai: AI}): Promise<ChooseTheBlankSubmitResult> => {
        // Extract hidden words from the text
        const hiddenWordsRegex = /<span id="hidden-word-(\d+)">([^<]+)<\/span>/g;
        const hiddenWords: {index: number, word: string}[] = [];
        let match;
        
        while ((match = hiddenWordsRegex.exec(config.text)) !== null) {
            hiddenWords.push({
                index: parseInt(match[1]),
                word: match[2].trim().toLowerCase()
            });
        }
        
        // Sort hidden words by index
        hiddenWords.sort((a, b) => a.index - b.index);
        
        // Get user answers
        const userAnswers = Array.isArray(userAnswer.userAnswers) ? userAnswer.userAnswers : [userAnswer.userAnswers];
        
        // Check if we have the right number of answers
        if (userAnswers.length !== hiddenWords.length) {
            return {
                shortFeedback: `Expected ${hiddenWords.length} answers, but got ${userAnswers.length}.`,
                score: 0,
                details: {
                    explanation: `Expected ${hiddenWords.length} answers, but got ${userAnswers.length}.`,
                    gradePerBlank: []
                }
            };
        }
        
        // Generate feedback using AI for more detailed explanation and grading
        const gradeResult = await ai.genObject({
            model: 'openai:gpt-4o',
            schema: z.object({
                grade0To100: z
                    .number()
                    .describe("The grade, from 0 to 100"),
                shortExplanation: z
                    .string()
                    .describe(
                        "A short ~1-sentence explanation given to the user for why the user got the question right or wrong. If the answer was right, this could be one fun fact. If the answer was wrong, this should be a hint for next time."
                    ),
                explanation: z
                    .string()
                    .describe(
                    "An explanation given to the user for why the user got the question right or wrong."
                    ),
                gradePerBlank: z.array(z.object({
                    hiddenWord: z.string().describe("The word that was hidden in the question"),
                    userAnswer: z.string().describe("The user's answer to the question"),
                    grade0To100: z.number().describe("The grade, from 0 to 100"),
                    explanation: z.string().describe("Explanation of why this answer is correct or incorrect")
                })).describe("The individual grade for each word in the question."),
            }),
            messages: [
                {
                    role: 'system',
                    content: `
                        # You
                        You are an excellent, detail-oriented grader.

                        # Your Task
                        You are responsible for grading the user's answer to the following choose-the-blank question:
                        \`\`\`json
                        ${JSON.stringify(config, null, 2)}
                        \`\`\`

                        You have the ability to give partial credit. The expectation is that the user selects the correct words from the provided choices.

                        # Notes
                        - When you give feedback to the user, address them as: "You".
                        - If you think you have a fun fact related to the question, you can include it in your feedback. Doing this will help the user by making things more memorable.
                    `
                },
                {
                    role: 'user',
                    content: `
                        # MY ANSWERS:
                        ${userAnswers
                            .map((answer, idx) => {
                                return `Blank ${idx + 1} Answer: "${answer}" (Expected: "${hiddenWords[idx].word}")`;
                            })
                            .join("\n")}
                    `
                }
            ],
            providerArgs: {
                structuredOutputs: true,
            },
        });
        
        return {
            score: gradeResult.object.grade0To100 / 100, // Convert from 0-100 to 0-1 scale
            shortFeedback: gradeResult.object.shortExplanation,
            details: {
                explanation: gradeResult.object.explanation,
                gradePerBlank: gradeResult.object.gradePerBlank
            }
        };
    }
} 