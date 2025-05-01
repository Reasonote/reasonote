import _, {toNumber} from "lodash";
import {NextResponse} from "next/server";

import {notEmpty} from "@lukebechtel/lab-ts-utils";

import {ApiRouteContextFull} from "../../helpers/ApiRouteContext";
import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {GetSubskillsDirectRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export async function GetSubskillsDirectRouteHandler(ctx : ApiRouteContextFull<typeof GetSubskillsDirectRoute>){
    const { req, parsedReq,  supabase, logger, user } = ctx;

    const rsnUserId = user?.rsnUserId

    if (!rsnUserId) {
        return NextResponse.json({
            error: 'User not found!'
        }, { status: 404 });
    }

    const skill = parsedReq.skill;

    console.log(`skill:`, skill)

    // Get the whole skill tree, along with calculated scores.
    const {data: skillsWithScoresData} = await supabase.rpc('get_linked_skills_with_scores', {
        input_skill_id: skill.id,
        user_id: rsnUserId,
    });

    console.log(`skillsWithScoresData:`, skillsWithScoresData)

    if (!skillsWithScoresData){
        throw new Error("No skillsWithScores")
    }

    // This function should order the subskills by their difficulty.
    // Turning this:
    // | BASIC.INTERMEDIATE.INTRO.INTRO.INTRO
    // | BASIC.BASIC
    // | BASIC.INTRO.INTRO.INTRO
    // | BASIC.INTRO
    // | INTRO.BASIC
    // | INTRO.INTRO
    // | INTRO.INTERMEDIATE
    // Into this:
    // | INTRO.INTRO
    // | INTRO.BASIC
    // | INTRO.INTERMEDIATE
    // | BASIC.INTRO
    // | BASIC.INTRO.INTRO.INTRO
    // | BASIC.BASIC
    // | BASIC.INTERMEDIATE.INTRO.INTRO.INTRO

    async function orderSubskillsByDifficulty({unsorted}: {unsorted: typeof skillsWithScoresData}){
        if (!unsorted){
            throw new Error("No directResp")
        }
        
        if (unsorted.length === 0){
            return unsorted;
        }
        
        // Get the maxdepth
        const maxDepth = _.max(unsorted.map((subskill) => subskill.level_path.length));

        if (maxDepth === undefined){
            throw new Error("No max depth")
        }
        
        const sortValues = unsorted.map((subskill) => {
            const skillLinkLevels = subskill.level_path;

            // Convert to index
            const skillLinkLevelIndex = skillLinkLevels.map((level) => {
                return ['INTRO', 'BASIC', 'INTERMEDIATE', 'ADVANCED', 'MASTER'].indexOf(level);
            })
    
            // Now, we must create numbers of length maxDepth.
            // We want the parent of a group to be the very last thing that gets studied,
            // So, we find 
            skillLinkLevelIndex.push(..._.range((maxDepth + 1) - skillLinkLevelIndex.length).map(() => 5));
    
            const sortOrder = toNumber(`${skillLinkLevelIndex.join('')}`);

            return {
                id: subskill.skill_id,
                sortOrder,
            }
        })

        const sortedVersion = _.sortBy(sortValues, (sv) => sv.sortOrder).map((sv) => {
            const found = unsorted.find((subskill) => subskill.skill_id === sv.id);

            return unsorted.find((subskill) => subskill.skill_id === sv.id);
        }).filter(notEmpty) 

        return sortedVersion;
    }

    return orderSubskillsByDifficulty({unsorted: skillsWithScoresData});     
}


export const POST = makeServerApiHandlerV2({
    route: GetSubskillsDirectRoute,
    handler: GetSubskillsDirectRouteHandler
})