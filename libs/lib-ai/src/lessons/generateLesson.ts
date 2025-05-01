import { z } from 'zod';

import { trimLines } from '@lukebechtel/lab-ts-utils';
import { ActivityConfig } from '@reasonote/core';

import { ActivityGeneratorV2 } from '../ActivityGeneratorV2';
import { AI } from '../AI';
import { LessonGroup } from '../DocumentToDag/DocumentToDag';
import {
  GenerateLessonPartsPrompt,
} from '../prompt/AIPromptObj/generateLesson.priompt';
import { priomptRenderToString } from '../prompt/AIPromptObj/PromptComponents';

interface LessonPart {
    learningObjectives: string[];
    keyPoints: string[];
    examples: string[];
    expertQuestions: string[];
}

const TOKEN_LIMIT = 100000;

export async function generateLessonParts(ai: AI, lessonInfo: LessonGroup, tokenLimit: number = TOKEN_LIMIT): Promise<{ summary: string, partOutlines: LessonPart[] }> {
    // Validate input
    if (!lessonInfo.cluster || lessonInfo.cluster.length === 0) {
        throw new Error('Lesson must have at least one learning objective');
    }

    const prompt = await priomptRenderToString(
        GenerateLessonPartsPrompt({
            lessonName: lessonInfo.lessonName,
            expectedDurationMinutes: lessonInfo.expectedDurationMinutes,
            learningObjectives: lessonInfo.cluster.map(lo => ({
                learningObjective: lo.learningObjective,
                referenceSentences: lo.referenceSentences.map(ref => ref.sentence)
            }))
        }),
        { tokenLimit }
    );

    const lesson = await ai.genObject({
        prompt,
        schema: z.object({
            lesson: z.object({
                summary: z.string(),
                partOutlines: z.array(z.object({
                    learningObjectives: z.array(z.string()).describe("The exact learning objectives covered in this part, copied verbatim from the provided material. Each learning objective must appear in exactly one part."),
                    keyPoints: z.array(z.string()),
                    examples: z.array(z.string()).describe("Unique examples that illustrate the concepts. Each example must be different from all other examples in all parts."),
                    expertQuestions: z.array(z.string()).describe("Questions that assess whether the learner has achieved the learning objectives. These should be challenging and require deep understanding of the material.")
                }))
            })
        }),
        model: 'openai:gpt-4o-mini',
        mode: 'json',
        providerArgs: {
            structuredOutputs: true,
        },
    });

    return lesson.object.lesson;
}

// Add retry helper function at the top of the file
async function* retryGenerator<T>(
    generator: () => AsyncGenerator<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000, // 1 second base delay
): AsyncGenerator<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const gen = generator();
            for await (const item of gen) {
                yield item;
            }
            return; // Success - exit the retry loop
        } catch (error) {
            attempt++;
            console.error(`[LessonGenerator] Generation attempt ${attempt} failed:`, error);
            
            if (attempt === maxRetries) {
                throw new Error(`Failed to generate after ${maxRetries} attempts: ${error}`);
            }
            
            // Exponential backoff with jitter
            const delay = baseDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random());
            console.log(`[LessonGenerator] Retrying in ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

export async function* generateLessonActivities(
    lessonParts: LessonPart[],
    lessonGroup: LessonGroup,
    activityGenerator: ActivityGeneratorV2,
    numActivitiesPerPart: number
): AsyncGenerator<{
    activityConfig: ActivityConfig;
    skill: {
        id: string;
        name: string;
    };
}> {
    function getStageSpecificConfig(partIndex: number, isLastPart: boolean) {
        // Simplified to just two stages
        const isIntroduction = partIndex === 0;

        return {
            genConfigOverrides: {
                shortDescription: isIntroduction
                    ? 'Clear introduction of core concepts with efficient explanations'
                    : 'Building upon core concepts with focused, relevant extensions',
                primaryInstructions: async () => trimLines(`
                    <INSTRUCTIONS description="Core instructions for generating educational content">
                        <OVERVIEW>
                            ${isIntroduction ? `
                            Create clear, efficient explanations that introduce core concepts.
                            Focus on establishing solid understanding through concise, well-structured content.
                            ` : `
                            Build upon earlier concepts with focused, relevant extensions.
                            Start with a brief transition (1-2 sentences) connecting to previous material.
                            `}
                        </OVERVIEW>
    
                        <CONTENT_PRINCIPLES>
                            - Be concise but thorough - explain everything necessary without redundancy
                            - Use clear, straightforward language
                            - Include only sections that are relevant to the subject matter
                            - Adapt the structure to fit the content naturally
                            - Focus on helping learners understand, not on following a rigid template
    
                            <STRUCTURE_GUIDANCE>
                                - Let the content dictate the structure, not convention
                                - Focus on clear progression of ideas
                                ${isLastPart ? `
                                - Include a conclusion section that:
                                    * Synthesizes the key points from this final part
                                    * Shows how these concepts connect to the overall lesson
                                    * Reinforces the most important takeaways
                                    * Does NOT introduce new concepts
                                ` : `
                                - DO NOT include a conclusion section - this is not the final part of this lesson
                                - End naturally when you've covered the part's content
                                `}
                            </STRUCTURE_GUIDANCE>
    
                            <OPTIONAL_ELEMENTS>
                                The following elements should only be included when they genuinely enhance understanding:
                                - Examples (useful for abstract concepts, math, processes)
                                - Practical applications (relevant for skills, techniques, scientific concepts)
                                - Visual aids (helpful for spatial concepts, processes, relationships)
                                - Step-by-step breakdowns (useful for procedures, complex concepts)
                                - Real-world connections (when they illuminate the concept, not just for sake of inclusion)
                                ${isLastPart ? '- Conclusion (REQUIRED for this final part)' : '- Summaries (only when complexity requires consolidation)'}
                            </OPTIONAL_ELEMENTS>
    
                            <SUBJECT_SPECIFIC_GUIDANCE>
                                Adapt your approach based on the subject matter:
                                - For historical topics: Focus on clear narrative, key events, and their significance
                                - For mathematical concepts: Include relevant examples and step-by-step explanations
                                - For scientific principles: Explain mechanisms and include relevant applications
                                - For theoretical concepts: Use clear definitions and logical progression
                                - For practical skills: Emphasize process and application
                            </SUBJECT_SPECIFIC_GUIDANCE>
                        </CONTENT_PRINCIPLES>
    
                        <WRITING_STYLE>
                            ${isIntroduction ? `
                            - Use precise, accessible language
                            - Define new terms when introduced
                            - Break down complex ideas efficiently
                            - Present information in a logical sequence
                            - Focus on clarity and understanding
                            ` : `
                            - Start with a concise connection to previous content
                            - Build naturally on established concepts
                            - Maintain clear, efficient explanations
                            - Add depth where relevant
                            - Keep focus on new material while acknowledging foundations
                            `}
    
                            <EFFICIENCY_GUIDELINES>
                            - Avoid unnecessary repetition
                            - Use direct, clear statements
                            - Include details when they matter, not for completeness
                            - Structure content to flow naturally
                            - Break complex ideas into digestible pieces
                            ${isLastPart ? `
                            - Save synthesis and broader connections for the conclusion section
                            ` : `
                            - Don't add unnecessary wrapping sections
                            `}
                            </EFFICIENCY_GUIDELINES>
                        </WRITING_STYLE>
    
                        <FORMATTING>
                            - Use markdown headers (##, ###) to organize content logically
                            - Format mathematical expressions in LaTeX ($$...$$) when needed
                            - Use code blocks with proper syntax highlighting for technical content
                            - Apply emphasis (*italic*, **bold**) sparingly for important terms
                            - Include diagrams or visual aids only when they enhance understanding
                            ${isLastPart ? `
                            - Use ### Conclusion for the final section
                            ` : ''}
                        </FORMATTING>
    
                        ${isLastPart ? `
                        <CONCLUSION_REQUIREMENTS>
                            The conclusion section MUST:
                            - Start with "### Conclusion"
                            - Synthesize the key concepts from this part
                            - Show how these concepts fit into the broader lesson
                            - Reinforce critical understanding points
                            - Be concise (2-4 paragraphs)
                            - NOT introduce new concepts or examples
                            - NOT repeat content verbatim
                            - Focus on understanding and connections
                        </CONCLUSION_REQUIREMENTS>
                        ` : ''}
                    </INSTRUCTIONS>
                `),
                examples: [{
                    name: "stage_specific_example_history",
                    input: "Teach about the Industrial Revolution",
                    outputs: [{
                        name: "good_example",
                        quality: "good",
                        output: {
                            type: "slide",
                            version: "0.0.0",
                            titleEmoji: "🏭",
                            title: isIntroduction
                                ? "The Industrial Revolution Begins"
                                : "The Industrial Revolution Reshapes Society",
                            markdownContent: trimLines(`
                                ${isIntroduction ? `
                                ### Britain's Industrial Transformation
                                In the late 18th century, Britain underwent a dramatic change in how goods were made and work was done. This shift from handmade to machine-made production would spread globally and transform human society.
    
                                ### Why Britain Led the Way
                                Several factors came together in Britain to spark this change:
                                - Rich coal and iron deposits near major ports
                                - Growing overseas trade providing raw materials
                                - Strong banking system funding new ventures
                                - Agricultural improvements freeing up workers
    
                                ### The First Major Changes
                                The transformation began in specific industries:
                                - Textile production moved from homes to factories
                                - Steam engines revolutionized mining and manufacturing
                                - Iron production increased dramatically with new methods
                                - Canals and roads expanded to connect industrial centers
    
                                ### Life in the Early Industrial Age
                                As these changes took hold, they affected how people lived and worked:
                                - Workers moved from rural areas to growing towns
                                - Factory work replaced traditional crafts
                                - New industrial cities emerged near resources
                                - Traditional skills gave way to machine operation
                                ` : `
                                The Industrial Revolution's technological changes led to profound social transformations that reshaped how people lived and worked.
    
                                ### A New Working Class
                                Factory work created new social patterns:
                                - Regular working hours replaced seasonal rhythms
                                - Women and children joined the industrial workforce
                                - Workers organized to demand better conditions
                                - New middle class of factory managers emerged
    
                                ### Cities Transform
                                Industrial cities developed distinct characteristics:
                                - Dense housing near factories
                                - New transportation networks
                                - Public health challenges
                                - Growing class divisions
    
                                ### Political and Economic Power
                                The revolution shifted where power lay in society:
                                - Factory owners gained unprecedented wealth
                                - Workers formed unions and mutual aid societies
                                - Local governments expanded their roles
                                - New laws regulated working conditions
    
                                ${isLastPart ? `
                                ### Conclusion
                                The social transformations of the Industrial Revolution fundamentally reshaped society's structure and power dynamics. The emergence of new social classes, urban environments, and political organizations created lasting changes that we still see today. These developments highlight how technological changes can drive profound social and economic reorganization, affecting everything from daily work patterns to the basic structures of political power.
                                ` : ''}
                                `}
                            `)
                        }
                    }],
                },
                {
                    name: "stage_specific_example_physics",
                    input: "Teach about Newton's First Law",
                    outputs: [{
                        name: "good_example",
                        quality: "good",
                        output: {
                            type: "slide",
                            version: "0.0.0",
                            titleEmoji: "🚀",
                            title: isIntroduction
                                ? "Newton's First Law: The Law of Inertia"
                                : "Applying Newton's First Law",
                            markdownContent: trimLines(`
                                ${isIntroduction ? `
                                ### Newton's First Law
                                An object will remain at rest or in uniform motion unless acted upon by an external force. This principle, known as inertia, describes how objects resist changes to their motion.
    
                                Objects naturally maintain their current state of motion:
                                - A stationary object stays still
                                - A moving object keeps moving at the same speed and direction
                                - Only external forces can change this natural behavior
    
                                ### Understanding Through Daily Life
                                We can see inertia at work in many everyday situations:
                                - A book stays on a table until pushed (resistance to starting motion)
                                - Passengers lean forward when a bus stops (tendency to stay in motion)
                                - Objects sliding on ice continue moving (minimal opposing forces)
                                - A soccer ball rolls farther on smooth grass than rough ground (effect of friction)
    
                                ### How Forces Change Motion
                                \`\`\`mermaid
                                graph LR
                                    A[Object in Motion] -->|No Forces| B[Continues Same Motion]
                                    A -->|Friction| C[Gradually Slows]
                                    A -->|Applied Force| D[Changes Motion]
                                \`\`\`
    
                                When no forces act on an object, it maintains its motion. However, in real situations:
                                - Friction gradually slows moving objects
                                - Air resistance affects falling objects
                                - Gravity constantly pulls objects downward
                                ` : `
                                Building on our understanding of how objects maintain their motion, let's explore more sophisticated situations.
    
                                ### Motion in Everyday Technology
                                Vehicle safety systems rely heavily on managing inertia:
                                - Seat belts prevent continued forward motion during sudden stops
                                - Airbags extend the stopping time to reduce impact force
                                - Anti-lock brakes prevent skidding by controlling deceleration
                                - Crumple zones absorb impact energy through controlled deformation
    
                                ### Circular Motion and Inertia
                                Objects moving in a circle are constantly changing direction, requiring a continuous force:
                                - Satellites need gravity to maintain orbit
                                - Cars need friction to turn corners
                                - A spinning athlete needs internal forces to rotate
                                - The moon needs Earth's gravity to maintain its path
    
                                ### Worked Example: Car Braking
                                A car traveling at 20 m/s (about 45 mph) needs to stop:
    
                                1. With no brakes (ice):
                                   - No significant forces acting
                                   - Car continues at 20 m/s
                                   - Demonstrates pure inertial motion
                                
                                2. Normal road conditions:
                                   - Friction provides stopping force
                                   - Takes about 40 meters to stop
                                   - Controlled, safe deceleration
                                
                                3. Emergency braking:
                                   - Maximum friction applied
                                   - Shorter stopping distance
                                   - Risk of skidding (hence ABS)
    
                                ${isLastPart ? `
                                ### Conclusion
                                Our exploration of Newton's First Law in practical applications reveals its fundamental role in modern technology and safety systems. From vehicle design to space exploration, understanding and working with inertia is crucial for engineering solutions. These real-world applications demonstrate how a basic principle of physics underpins countless aspects of our technological world, bridging the gap between theoretical physics and practical engineering.
                                ` : ''}
                                `}
                            `)
                        }
                    }]
                }],
                finalInstructions: async () => trimLines(`
                    <FINAL_INSTRUCTIONS description="Final checks for educational content">
                        <CONTENT_QUALITY>
                            ${isIntroduction ? `
                            - Core concepts explained clearly
                            - Key terms defined precisely
                            - Information structured logically
                            - Content is accessible
                            - Foundation is solid
                            ` : `
                            - Clear connection to previous content
                            - New concepts build effectively
                            - Content extends understanding
                            - Structure supports learning
                            - Progression is natural
                            `}
                        </CONTENT_QUALITY>
    
                        <EFFICIENCY_CHECK>
                            - Information is presented concisely
                            - No unnecessary repetition
                            - Each section serves a clear purpose
                            - Optional elements are used appropriately
                            - Content structure fits the subject matter
                        </EFFICIENCY_CHECK>
    
                        <CLARITY_CHECK>
                            - Language is clear and direct
                            - Complex ideas broken down effectively
                            - Information flows logically
                            - Key points are evident
                            - Content is appropriately detailed
                        </CLARITY_CHECK>
    
                        <FORMATTING_VALIDATION>
                            - Markdown syntax is correct
                            - Headers organize content logically
                            - Formatting enhances readability
                            - Visual elements used appropriately
                            - Technical notation is correct
                            - ${isLastPart ? `
                            - Conclusion section is present and appropriate
                            ` : 'There is no conclusion section'}
                        </FORMATTING_VALIDATION>
                    </FINAL_INSTRUCTIONS>
                `)
            }
        };
    }

    console.log('[LessonGenerator] Generating lesson activities');
    console.log('[LessonGenerator] Lesson parts:', lessonParts);
    console.log('[LessonGenerator] SkillIds:', lessonGroup.cluster.map(s => s.ids));

    // Track content progression
    const contentContext = {
        coveredConcepts: new Set<string>(),
        usedExamples: new Set<string>(),
        previousSlides: [] as { content: string, learningObjectives: string[], activities: string[] }[],
        previousActivities: [] as { type: string, content: string, learningObjectives: string[] }[]
    };

    // Generate slide + activity pairs based on the lesson plan
    for (let i = 0; i < lessonParts.length; i++) {
        const part = lessonParts[i];
        const isLastPart = i === lessonParts.length - 1;
        const stageConfig = getStageSpecificConfig(i, isLastPart);

        console.log('[LessonGenerator] Generating slide for part', i + 1);
        
        // Wrap slide generation in retry logic
        const slideGenerator = () => activityGenerator.generateActivities({
            from: {
                skill: {
                    id: lessonGroup.cluster.find(s => s.learningObjective === part.learningObjectives[0])?.ids[0] ?? lessonGroup.cluster[0].ids[0],
                    name: part.learningObjectives[0],
                },
            },
            validActivityTypes: ['slide'],
            numActivities: 1,
            typeConfigs: {
                slide: {
                    activityTypeSpecificConfig: stageConfig
                }
            },
            additionalInstructions: trimLines(`
                ${i > 0 ? `
                <PREVIOUS_CONTENT>
                    The following concepts and examples have already been covered in previous parts:
                    
                    Previously Covered Concepts:
                    ${Array.from(contentContext.coveredConcepts).map(concept => `- ${concept}`).join('\n')}
                    
                    Previous Slides:
                    ${contentContext.previousSlides.map((slide, idx) => `
                        Part ${idx + 1}:
                        ${slide.content}
                        Learning Objectives: ${slide.learningObjectives.join(', ')}
                    `).join('\n')}
                    
                    DO NOT repeat these concepts unless building directly upon them.
                    When referencing previous concepts, explicitly connect them to new material.
                    
                    CRITICAL: Ensure your content:
                    1. Does not re-teach concepts already covered
                    2. Explicitly builds upon previous concepts when relevant
                    3. Focuses on new material while referencing prior knowledge
                    4. Shows clear progression and connections to previous parts
                </PREVIOUS_CONTENT>
                ` : ''}

                <EDUCATIONAL_CONTENT_GUIDELINES>
                    1. TEACH, don't just present:
                    - Start with clear definitions and foundational concepts
                    - Build understanding step by step
                    - Explain the "why" behind each concept
                    - Address common misconceptions proactively

                    2. Use the key points as a foundation:
                    ${part.keyPoints.map(point => `   - ${point}`).join('\n')}
                    For each point:
                    - Define any new terms
                    - Explain underlying principles
                    - Connect to previous knowledge
                    - Highlight practical applications

                    3. Incorporate examples effectively if they aid in understanding the key points:
                    ${part.examples.filter(example => !contentContext.usedExamples.has(example)).map(example => `   - ${example}`).join('\n')}
                    For each example:
                    - Break down the solution process
                    - Explain each step's reasoning
                    - Connect to the theory
                    - Show alternative approaches when relevant

                </EDUCATIONAL_CONTENT_GUIDELINES>

                <CONTENT_REQUIREMENTS>
                    - Focus on deep understanding over surface-level coverage
                    - Include complete explanations and derivations
                    - Use precise, unambiguous language
                    - Make complex ideas accessible without oversimplifying
                    - Connect theory to practice
                    - CRITICAL: Use ONLY the provided reference material
                    - DO NOT introduce concepts, examples, or explanations from external sources
                    - When explaining concepts, stick strictly to what is supported by the reference sentences
                    - If a concept seems incomplete, work with what is provided rather than filling in gaps with external knowledge
                    ${i > 0 ? `- Build upon and reference concepts from previous parts when relevant
                    - Explicitly show how new concepts connect to or extend previously covered material` : ''}
                </CONTENT_REQUIREMENTS>

                Make the content engaging and focused on helping the learner master this specific part of the lesson.
            `),
        });

        // Handle slide generation with retries
        try {
            for await (const slideConfig of retryGenerator(slideGenerator)) {
                console.log('[LessonGenerator] Generated slide for part', i + 1);
                const skillId = lessonGroup.cluster.find(s => s.learningObjective === part.learningObjectives[0])?.ids[0] ?? lessonGroup.cluster[0].ids[0];
                
                contentContext.previousSlides.push({
                    content: (slideConfig as any).markdownContent || '',
                    learningObjectives: part.learningObjectives,
                    activities: []
                });

                yield {
                    activityConfig: slideConfig as ActivityConfig,
                    skill: {
                        id: skillId,
                        name: part.learningObjectives[0]
                    }
                };
            }
        } catch (error) {
            console.error('[LessonGenerator] Failed to generate slide after all retries:', error);
            throw error; // Re-throw to handle at a higher level if needed
        }

        console.log('[LessonGenerator] Generating activities for part', i + 1);
        
        // Wrap activities generation in retry logic
        const activitiesGenerator = () => activityGenerator.generateActivities({
            from: {
                skill: {
                    id: lessonGroup.cluster.find(s => s.learningObjective === part.learningObjectives[0])?.ids[0] ?? lessonGroup.cluster[0].ids[0],
                    name: part.learningObjectives[0],
                },
            },
            validActivityTypes: ['multiple-choice', 'choose-the-blank', 'fill-in-the-blank', 'short-answer'],
            numActivities: numActivitiesPerPart - 1,
            additionalInstructions: trimLines(`
                ${i > 0 ? `
                <PREVIOUS_CONTENT>
                    Previous parts have covered:
                    ${Array.from(contentContext.coveredConcepts).map(concept => `- ${concept}`).join('\n')}
                    
                    Previously Used Activities:
                    ${contentContext.previousActivities.map(activity => `
                        Type: ${activity.type}
                        Testing: ${activity.learningObjectives.join(', ')}
                        Content: ${activity.content}
                    `).join('\n\n')}
                    
                    Focus assessment on the NEW concepts from this part:
                    ${part.keyPoints.filter(point => !Array.from(contentContext.coveredConcepts).slice(0, -part.keyPoints.length).includes(point)).map(point => `- ${point}`).join('\n')}
                    
                    CRITICAL: Ensure your activities:
                    1. Do not repeat scenarios or question formats from previous activities
                    2. Test different aspects of the concepts than previous activities
                    3. Use fresh examples and contexts
                    4. Build upon previous knowledge in meaningful ways
                    5. Avoid similar numerical values or specific examples used before
                </PREVIOUS_CONTENT>
                ` : ''}

                <CURRENT_SLIDE>
                    ${contentContext.previousSlides[i]?.content || ''}
                </CURRENT_SLIDE>

                Use these expert assessment questions as inspiration:
                ${part.expertQuestions.map(question => `- ${question}`).join('\n')}

                Make sure the activity:
                1. Directly tests understanding of the key points from this specific part
                2. Uses relevant examples similar to those presented
                3. Challenges the learner to demonstrate deep understanding
                4. Requires application of concepts, not just recall
                5. Tests the ability to explain relationships and identify principles
                6. CRITICAL: NEVER use the exact same examples or calculations shown in the content
                7. Create new scenarios that:
                  * Apply the same concepts but with different values/contexts
                  * Test understanding through novel situations
                  * Challenge learners to transfer knowledge to new cases
                  * Use different numbers if mathematical
                  * Use different specific examples if conceptual
                ${i > 0 ? `8. When testing concepts that build on previous parts:
                  * Focus primarily on the new material
                  * Only include previous concepts in the context of how they connect to new material
                  * Test understanding of relationships between old and new concepts` : ''}
                TODO: Add the activities to avoid similarity with existing activities
                TODO: Add anchoring to the slide
            `),
        });

        // Handle activity generation with retries
        try {
            for await (const activityConfig of retryGenerator(activitiesGenerator)) {
                console.log('[LessonGenerator] Generated activity for part', i + 1);
                const skillId = lessonGroup.cluster.find(s => s.learningObjective === part.learningObjectives[0])?.ids[0] ?? lessonGroup.cluster[0].ids[0];
                
                contentContext.previousActivities.push({
                    type: (activityConfig as ActivityConfig).type,
                    content: JSON.stringify(activityConfig),
                    learningObjectives: part.learningObjectives
                });
                
                if (contentContext.previousSlides[i]) {
                    contentContext.previousSlides[i].activities.push(JSON.stringify(activityConfig));
                }

                yield {
                    activityConfig: activityConfig as ActivityConfig,
                    skill: {
                        id: skillId,
                        name: part.learningObjectives[0]
                    }
                };
            }
        } catch (error) {
            console.error('[LessonGenerator] Failed to generate activities after all retries:', error);
            throw error; // Re-throw to handle at a higher level if needed
        }

        // Update content context for next part
        part.keyPoints.forEach(point => contentContext.coveredConcepts.add(point));
        part.examples.forEach(example => contentContext.usedExamples.add(example));
    }
}