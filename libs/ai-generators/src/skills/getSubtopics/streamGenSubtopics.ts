import {
  GetSubtopicsArgs,
  SubTopicsResponseSchema,
} from './types';

export async function* streamGenSubtopics({
    ai,
    skill,
    numTopics = 7,
    customPrompt = '',
    existingTopics = [],
    extraContext = [],
    includeExpertQuestions = false
}: GetSubtopicsArgs) {
    const basePrompt = `
        <TASK>
            Generate ${numTopics} engaging subtopics for learning about ${skill.name}.
            ${skill.description ? `Context: ${skill.description}` : ''}
            
            Each subtopic should:
            - Be distinct from existing topics and from each other
            - Have a clear, focused scope
            - Include a descriptive emoji. The emoji should be a single character in the emoji field. Do not include an emoji in either the name or description.
            - Be suitable for a 5 minute lesson and a 10 minute practice session.
            - If the context includes any specific goals, make sure the subtopics are aligned with those goals.
            - If the context includes any resources, make sure the subtopics are created from the resources.
            ${includeExpertQuestions ? 
                `- Include a list of 5 very difficult questions that can be used to test the user on this objective. These should be questions that an expert can solve / answer that are fully representative of that subtopic. i.e, once I can answer those questions, I will have mastered the subtopic. I want the questions to be highly specific and not abstract. Where possible, I want the questions to be concrete in terms of scenarios or specific problems to solve. Make sure that the questions cover any exceptions, nuances or edge cases that only a person who has a deep understanding of the topic will be able to answer.` 
                : 
                `- For the expertQuestions field, just return an empty array ([]) as this information is not needed.`
            }
        </TASK>

        ${existingTopics.length > 0 ? `
        <EXISTING_TOPICS>
            ${existingTopics.map(topic => `- ${topic.name}: ${topic.description}`).join('\n')}
        </EXISTING_TOPICS>
        ` : ''}

        ${customPrompt ? `
        <CUSTOM_FOCUS>
            ${customPrompt}
        </CUSTOM_FOCUS>
        ` : ''}
        
        ${extraContext.length > 0 ? `
        <EXTRA_CONTEXT>
            The following context will be relevant to the subtopics you are generating:

            <CONTEXT>
                ${extraContext.map(ctx => ctx.toPrompt()).join('\n')}
            </CONTEXT>
        </EXTRA_CONTEXT>
        ` : ''}
    `;

    const streamResult = await ai.streamGenObject({
        schema: SubTopicsResponseSchema,
        prompt: basePrompt,
        model: "openai:gpt-4o-mini",
        mode: "json",
        providerArgs: {
            temperature: 0.7,
            structuredOutputs: true,
        }
    });

    let seenTopics = new Set();

    for await (const partial of streamResult.partialObjectStream) {
        const lastTopic = partial.subTopics?.[partial.subTopics.length - 1];
        if (lastTopic?.name && lastTopic?.description && lastTopic?.emoji && lastTopic?.expertQuestions) {
            console.log('lastTopic', lastTopic);
            const topicKey = lastTopic.name;
            if (!seenTopics.has(topicKey) &&
                !existingTopics.some(t => t.name === lastTopic.name)) {
                seenTopics.add(topicKey);
                yield lastTopic;
            }
        }
    }
} 