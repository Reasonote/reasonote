import {NextResponse} from "next/server";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {RemoveFromUserSkillSetRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const POST = makeServerApiHandlerV2({
    route: RemoveFromUserSkillSetRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger, user } = ctx;

        const rsnUserId = user?.rsnUserId

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 401 });
        }

        // Get the user's skill set.
        const { data: skillSets, error: skillSetsError } = await supabase
            .from('skill_set')
            .select('*')
            .eq('for_user', rsnUserId)
        
        if (!skillSets) {
            return NextResponse.json({
                error: 'Error fetching skill sets!'
            }, { status: 500 });
        }

        var skillSet = skillSets[0] ?? null

        // If the user doesn't have a skill set, create one.
        if (!skillSet) {
            const { data: newSkillSet, error: newSkillSetError } = await supabase
                .from('skill_set')
                .insert({
                    for_user: rsnUserId,
                })
                .select('*')
                .limit(1)
                .single()
            
            if (!newSkillSet) {
                return NextResponse.json({
                    error: 'Error creating skill set!'
                }, { status: 500 });
            }

            skillSet = newSkillSet
        }

        const skillIdsToRemove = parsedReq.removeSkillIds ?? []

        if (skillIdsToRemove.length < 1) {
            return {
                skillSetId: skillSet.id
            }
        }

        // Now, remove the skill from the user's skill set.
        const ret = await supabase
            .from('skill_set_skill')
            .delete()
            .in('skill', skillIdsToRemove)

        return {
            skillSetId: skillSet.id,
        }
    }
})
