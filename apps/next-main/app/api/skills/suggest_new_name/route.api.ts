import _ from "lodash";
import {z} from "zod";

import {openai} from "@ai-sdk/openai";
import {genObject} from "@reasonote/lib-ai";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {SuggestNewNameRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const {
    POST,
    handler: SuggestNewNameRouteHandler,
} = makeServerApiHandlerV3({
    route: SuggestNewNameRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger, user, ai } = ctx;

        const {skill,documents} = parsedReq;

        // Pass the entire text to an AI for best-effort conversion to Markdown
        const suggestedName = await genObject({
            functionName: 'suggestLearningTopicName',
            functionDescription: 'Suggest a new learning topic name',
            schema: z.object({
                suggestedTopicName: z.string().describe('The suggested Topic name.')
            }),
            system: `
            You will receive a text document, or textDocuments, as input. 

            You may also receive an existing learning topic name.

            Your task is to create a new learning topic name that incorporates the content of all these documents, and the existing learning topic name, if provided.
            `,
            messages: [
            {
                role: 'user',
                content: `
                <EXISTING_LEARNING_TOPIC_NAME>
                ${skill.name}
                </EXISTING_LEARNING_TOPIC_NAME>

                <INPUT_DOCUMENTS>
                ${documents.map(doc => `<INPUT_DOCUMENT
                    fileName="${doc.fileName}"
                    fileType="${doc.fileType}"
                >
                    ${doc.content}
                </INPUT_DOCUMENT>`).join('\n\n')}
                </INPUT_DOCUMENTS>
                `
            }
            ],
            model: openai('gpt-4o-mini'),
        });

        return {
            suggestedName: suggestedName.object.suggestedTopicName,
        };
    }
})
