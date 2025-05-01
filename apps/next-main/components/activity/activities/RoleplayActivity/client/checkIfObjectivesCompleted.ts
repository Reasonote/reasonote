import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {
  trimAllLines,
  trimLines,
} from "@lukebechtel/lab-ts-utils";

import {EphMessageWithCharacterInfo} from "../../../components/EphemeralChat";
import {RoleplayActivityConfig} from "@reasonote/activity-definitions";

interface CheckIfObjectivesCompletedArgs {
    config: RoleplayActivityConfig,
    messages: EphMessageWithCharacterInfo[],
}

function formatMessage(message: EphMessageWithCharacterInfo){
    return trimLines(`
        <${message.characterName}>

        ${message.content}
    `)
}

export async function CheckIfObjectivesCompleted({config, messages}: CheckIfObjectivesCompletedArgs){
    return await oneShotAIClient({
        systemMessage: trimAllLines(`
            # Your Task
            You are responsible for determining if the user has completed the objectives of the roleplay activity.

            You will be provided with the message history of the roleplay activity.

            
            # Roleplay Context
            ## Roleplay Setting
            ### Name
            ${config.setting.name}
            ### Description
            ${config.setting.description}

            ## User Character
            ### ${config.userCharacter.name}
            #### Description
            ${config.userCharacter.description}
            
            ## User Objectives
            ${config.userCharacter.objectives.map(o => trimLines(`
                ### "${o.objectiveName}"
                #### Description
                ${o.objectiveDescription}
                #### Grading Criteria
                ${o.private.gradingCriteria}
            `)).join("\n")}

            ## Other Roleplay Characters
            ${config.characters.map(c => trimLines(`
                ### ${c.public.name}
                #### Description
                ${c.public.description}
                #### PRIVATE Personality
                ${c.private.personality}
                #### PRIVATE Motivation
                ${c.private.motivation}
            `)).join("\n")}


            # Final Notes
            - If the user's object is something like "Understand", the user must CLEARLY DEMONSTRATE THEIR UNDERSTANDINg.
            - It is not enough for the user to say "okay" or "I understand". The user must demonstrate their understanding by paraphrasing what the other character said, or by asking a question that shows that they fully understand.
        `),
        functionName: "outputObjectivesCompleted",
        functionDescription: "Output the objectives that the user has completed",
        functionParameters: z.object({
            result: z.object({
                objectivesCompleted: z.array(z.object({
                    objectiveName: z.string(),
                    whyTheyCompletedIt: z.string(),
                })).describe("The objectives that the user has completed. IF the user has not completed any objectives, then this can be undefined, or an empty array."),
            })
        }),
        // driverConfig: {
        //     type: 'openai',
        //     config: {
        //         model: 'gpt-3.5-turbo-16k-0613',
        //     }
        // },
        //@ts-ignore
        otherMessages: messages.map(m => {
            return {
                role: m.role as 'user' | 'assistant',
                content: formatMessage(m),
            } as const;
        })
    })
}