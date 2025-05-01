import { trimLines, trimAllLines, prefixAllLines } from "@lukebechtel/lab-ts-utils";
import { ActivityTypeMetadata } from "@reasonote/core";
import { GetLessonOverviewArgs } from "./types";

export function createLessonOverviewPrompt({
    lessonContext,
    fieldsToGet,
    skillContext,
    existingActivities,
}: Omit<GetLessonOverviewArgs, 'ai'>) {
    return trimLines(`
        <YOUR_ROLE>
            You are an expert educational content creator specializing in micro-learning experiences.
            Your goal is to create engaging, effective lessons that follow cognitive learning principles.
            
            IMPORTANT: Each part of the lesson must build naturally to the next, creating a cohesive learning journey.
        </YOUR_ROLE>

        <CONTEXT>
            ${
                skillContext?.aiContext ?
                    `
                    <PRIMARY_SKILL description="The primary skill you are teaching.">
                        ${skillContext.aiContext}
                    </PRIMARY_SKILL>
                    `
                    :
                    ''
            }

            ${lessonContext ? `
                <LESSON_CONTEXT>
                    ${lessonContext}
                </LESSON_CONTEXT>
            ` : ''}

            ${skillContext?.resources ? `
                <RESOURCES description="Resources and references for creating the lesson">
                    ${skillContext.resources}
                </RESOURCES>
            ` : ''}

            ${existingActivities ? `
                <EXISTING_ACTIVITIES>
                    ${JSON.stringify(existingActivities, null, 2)}
                </EXISTING_ACTIVITIES>
            ` : ''}
        </CONTEXT>

        <FINAL_NOTES>
            ${
                fieldsToGet.includes('slides') ? 
                    trimAllLines(`
                        <SLIDES_REQUIREMENTS>
                            You MUST follow these requirements for slides:

                            1. STRUCTURE AND FLOW:
                               - Start with a clear introduction slide
                               - Present concepts in a logical progression
                               - End with a summary/review slide
                               - 5-8 slides total (including intro and summary)
                            
                            2. CONTENT REQUIREMENTS:
                               - Each slide MUST cover exactly ONE main concept
                               - Include clear examples for each concept
                               - Use analogies where appropriate
                               - Define all technical terms
                               - Link each slide to specific learning objectives
                            
                            3. ENGAGEMENT RULES:
                               - Keep text concise (50-100 words per slide)
                               - Use active voice 
                            
                            4. MARKDOWN FORMATTING:
                               - Use \`<br/>\` for major section breaks
                               - Use single line breaks for minor separation
                               - Use \`-\` for bullet points
                               - Use \`*\` for emphasis on key terms
                        </SLIDES_REQUIREMENTS>
                    `)
                    :
                    ''
            }
            ${
                fieldsToGet.includes('practice') ? 
                    trimAllLines(`
                        <PRACTICE>
                            <ACTIVITY_SEQUENCE_REQUIREMENTS>
                                You MUST follow this EXACT sequence when generating activities:
                                1. FOUNDATION (8-12 Simple Activities):
                                   - Start with the most basic concepts
                                   - Each activity should take 30-45 seconds
                                   - Use multiple choice and fill-in-the-blank heavily here
                                
                                2. REINFORCEMENT (3-5 Moderate Activities):
                                   - Build on the foundation activities
                                   - Each activity should take 1-2 minutes
                                   - Start combining multiple concepts
                                   - Use more interactive activity types
                                
                                3. MASTERY (EXACTLY 1 Complex Activity):
                                   - Must be the FINAL activity
                                   - Should take 2-4 minutes
                                   - Must combine multiple concepts
                                   - Should challenge the student's understanding
                                   
                                STRICT REQUIREMENTS:
                                - Total activities: 12-18
                                - Total practice time: 8-12 minutes
                                - Activities MUST increase in difficulty gradually
                                - NO complex activities until the end
                            </ACTIVITY_SEQUENCE_REQUIREMENTS>

                            <ACTIVITY_COVERAGE_REQUIREMENTS>
                                You MUST ensure:
                                1. Every learning objective is practiced at least:
                                   - 2x in Simple activities
                                   - 1x in Moderate activities
                                   - Included in the final Complex activity
                                
                                2. Key concepts from slides appear:
                                   - 3x in Simple activities
                                   - 2x in Moderate activities
                                   - All combined in Complex activity
                                
                                3. Activity type distribution:
                                   - Use at least 4 different activity types for Simple
                                   - Use at least 2 different types for Moderate
                                   - Choose the most comprehensive type for Complex
                            </ACTIVITY_COVERAGE_REQUIREMENTS>

                            <ACTIVITY_TYPE_METADATA>
                                \`\`\`json
                                ${prefixAllLines(JSON.stringify(ActivityTypeMetadata, null, 2), '                                ')}
                                \`\`\`
                            </ACTIVITY_TYPE_METADATA>
                        </PRACTICE>
                    `)
                    :
                    ''     
            }
        </FINAL_NOTES>
    `);
} 