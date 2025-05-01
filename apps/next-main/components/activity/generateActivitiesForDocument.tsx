import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {ApolloClient} from "@apollo/client";
import {trimLines} from "@lukebechtel/lab-ts-utils";
import {createActivityFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";

import {
  ActivityType,
} from "@reasonote/core"

interface GenerateActivityForSkillArgs {
    ac: ApolloClient<any>;
    doc: string;
    userContextInfo?: string;
    activityType?: ActivityType;
    allowedActivityTypes?: ActivityType[];
}


// TODO: Because we haven't broken the page up into subskills,
// We're getting duplicated results, etc.
// What we need to do is build up a concept learning tree,
// And then generate along that tree.


export async function generateActivitiesForDocument({ac, doc, activityType, allowedActivityTypes}: GenerateActivityForSkillArgs){
    const ret = await oneShotAIClient({
        systemMessage: trimLines(`
              # Your Task
              You are responsible for helping the user learn about the contents of a document.

              They will provide you with the document (SOURCE_DOCUMENT)
              
              And you will provide them with a list of well-formed Activities / Exercises that will help them learn the contents of the document.

              You should order the activities in a way that makes sense for the user to learn the document.

              You will do this by creating a flashcard that will be used to quiz the user.
  
              You can use markdown to format your flashcard.
        `),
        functionName: "createFlashcard",
        functionDescription: "Create a flashcard",
        functionParameters: z.object({
            flashcards: z.array(z.object({
                flashcardFront: z
                    .string()
                    .describe("The front of the flashcard (the prompt/question)"),
                flashcardBack: z
                    .string()
                    .describe("The back of the flashcard (the answer)"),
            })),
        }),
        otherMessages: [
            {
                role: 'user',
                content: trimLines(`
                <DOCUMENT>

                ${doc}
                `)
            }
        ]
    });

    if (ret.data) {
        const activityCreateResult = await ac.mutate({
          mutation: createActivityFlatMutDoc,
          variables: {
            objects: ret.data.flashcards.map((f) => {
                return {
                    name: "Flashcard",
                    source: "ai-generated",
                    type: "flashcard",
                    typeConfig: JSON.stringify(f),
                }
            }),
          },
        });
  
        return activityCreateResult;
    } else {
        return null;
    }
}
