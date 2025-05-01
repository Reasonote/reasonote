import {z} from "zod";

import {driverConfigToRegistryString} from "@reasonote/lib-ai-common";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {InterestsGetSpecificInterestListRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const POST = makeServerApiHandlerV2({
    route: InterestsGetSpecificInterestListRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger, ai, user } = ctx;

        const aiResp = await ai.genObject({
            system: `
            # Your Role
            You are trying to narrow in on what specific interests a user has based on a list of generic interests they have selected.
            
            The user will give you their generic interests, and your goal is to narrow down to a list of specific interests that they may have based on the generic interests they have selected.
            
            You should add NEW items to the FULL_INTEREST_LIST, which is a list of all possible interests that the user could have.

            So, for example, if the user has selected "Movies" as a generic interest, you may want to return "Action Movies", "Romantic Movies", "Comedy Movies", etc. as specific interests.

            If they've selected a certain sport, you might select a few popular teams or players in that sport.

            If they've selected "Music", you might select a few popular bands or genres.


            <FULL_INTEREST_LIST>
            ${JSON.stringify(parsedReq.fullListOfInterests)}
            </FULL_INTEREST_LIST>
            
            
            - REMEMBER: DO NOT ADD DUPLICATES TO THE LIST, ONLY ADD NEW INTERESTS.
            `,
            functionName: 'output_specific_interests',
            functionDescription: 'Outputs your list of specific interests based on the generic interests the user has selected.',
            schema: z.object({
                specificInterests: z.array(z.object({emoji: z.string(), name: z.string()})),
            }),
            messages: [
                {
                    role: 'user',
                    content: `
                    <MY_CHOSEN_INTERESTS>
                    ${JSON.stringify(parsedReq.userSelectedInterests)}
                    </MY_CHOSEN_INTERESTS>
                    `
                }
            ],
            model: parsedReq.driverConfig ? driverConfigToRegistryString(parsedReq.driverConfig) : undefined
        })
        
        if (aiResp.object){
            return {
                interests: aiResp.object.specificInterests
            }
        } else {
            throw new Error('No response from AI!')
        }
    }
})
