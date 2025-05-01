import {streamGenSubtopics} from "@reasonote/ai-generators";
import {
  AIExtraContext,
} from "@reasonote/ai-generators/src/utils/AIExtraContext";

import {
  makeArrayStreamApiRoute,
} from "../../helpers/apiHandlers/makeArrayStreamApiHandler";
import {GenerateSubtopicsRoute} from "./routeSchema";

export const { POST } = makeArrayStreamApiRoute({
    route: GenerateSubtopicsRoute,
    handler: async function* ({ parsedReq, ai, supabase, user }) {

        if (!user || !user.rsnUserId) {
            throw new Error('User not authenticated');
        }

        const resourcesContextString = await ai.prompt.skills.formatAllResources({
            skillId: parsedReq.skillId
        });

        const userContextString = await ai.prompt.skills.formatUserSkillData({
            skillId: parsedReq.skillId,
            rsnUserId: user.rsnUserId,
            skillIdPath: [parsedReq.skillId]
        });

        console.log('userContextString', userContextString);

        //get the skill name and description
        const { data: skill, error: skillError } = await supabase
            .from('skill')
            .select('_name, _description')
            .eq('id', parsedReq.skillId)
            .single();

        if (skillError) {
            throw new Error('Error getting skill: ' + skillError.message);
        }

        const generator = streamGenSubtopics({
            ai,
            skill: {
                name: skill._name,
                description: skill._description,
            },
            numTopics: parsedReq.numTopics,
            customPrompt: parsedReq.customPrompt,
            existingTopics: parsedReq.existingTopics,
            includeExpertQuestions: parsedReq.includeExpertQuestions,
            extraContext: [
                new AIExtraContext({
                    title: 'RelevantResources',
                    description: 'The relevant resources for the skill we are generating the subskill tree for.',
                    body: resourcesContextString,
                }),
                new AIExtraContext({
                    title: 'UserContext',
                    description: 'The user\'s data for the skill we are generating the subskill tree for.',
                    body: userContextString,
                }),
            ]
        });
        for await (const topic of generator) {
            if (topic.name && topic.description && topic.emoji) {
                const validQuestions = parsedReq.includeExpertQuestions && Array.isArray(topic.expertQuestions) 
                    ? topic.expertQuestions
                        .filter((q): q is { question: string; answer: string } => 
                            q !== undefined && 
                            typeof q?.question === 'string' && 
                            typeof q?.answer === 'string')
                    : [];
                
                yield {
                    topic: {
                        name: topic.name,
                        description: topic.description,
                        emoji: topic.emoji,
                        expertQuestions: validQuestions
                    }
                };
            }
        }
    }
}); 