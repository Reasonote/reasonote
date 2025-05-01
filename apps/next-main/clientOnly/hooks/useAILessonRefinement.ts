import { useState, useCallback } from 'react';
import { aib } from '@/clientOnly/ai/aib';
import { z } from 'zod';

export function useAILessonRefinement() {
    const [isRefining, setIsRefining] = useState(false);

    const refineWithAI = useCallback(async (
        lessonName: string,
        skillName: string,
        lessonDetails: string,
        onSuccess: (refinedOutline: string) => void
    ) => {
        setIsRefining(true);
        try {
            const response = await aib.genObject({
                schema: z.object({
                    refinedOutline: z.string(),
                }),
                prompt: `
                    <INSTRUCTIONS>
                        Given the following content, write some learning objectives for the lesson:

                        <Lesson Name>
                            ${lessonName}
                        </Lesson Name>

                        <Skill Name>
                            ${skillName.trim() || lessonName}
                        </Skill Name>

                        <Current Lesson Details>
                            ${lessonDetails}
                        </Current Lesson Details>
                    </INSTRUCTIONS>

                    <SPECIAL_INSTRUCTIONS>
                        Please improve these lesson details by converting the current lesson details into learning objectives:

                        <OBJECTIVES>
                            - There should be 3-5 learning objectives
                            - Each learning objective should be a single sentence
                            - The learning objectives should be clear and measurable
                            - The learning objectives should be organized in a logical flow
                            - The learning objectives should be formatted consistently
                            - The learning objectives should be stated in a way that is easy to understand
                        </OBJECTIVES>

                        Keep the same general structure but make it more professional and comprehensive.
                    </SPECIAL_INSTRUCTIONS>

                    <OUTPUT_FORMAT>
                        - A list of learning objectives in plain text
                    </OUTPUT_FORMAT>
                `,
                model: 'openai:gpt-4o-mini',
            });

            if (response.object.refinedOutline) {
                onSuccess(response.object.refinedOutline);
            }
        } catch (error) {
            console.error('Error refining lesson details:', error);
        } finally {
            setIsRefining(false);
        }
    }, []);

    return { isRefining, refineWithAI };
} 