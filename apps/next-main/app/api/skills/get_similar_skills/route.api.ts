import _ from "lodash";
import {NextResponse} from "next/server";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {GetSimilarSkillsRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const POST = makeServerApiHandlerV2({
    route: GetSimilarSkillsRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger, user, ai} = ctx;

        const rsnUserId = user?.rsnUserId

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 404 });
        }

        let skill: {id?: string, _name: string, _description?: string | null, nameEmbedding?: number[], descriptionEmbedding?: number[]};

        if (parsedReq.skill.type === 'skill'){
            // Get the skill.
                const { data: skillData, error: skillError } = await supabase
                .from('skill')
                .select('id,_name,_description')
                .eq('id', parsedReq.skill.id)
                .single()

            if (!skillData) {
                return NextResponse.json({
                    error: `Error fetching skill ${parsedReq.skill.id}! (skillError: ${JSON.stringify(skillError, null, 2)})`
                }, { status: 500 });
            }

            skill = skillData;
        }
        else {
            skill = {
                _name: parsedReq.skill.name,
                _description: parsedReq.skill.description,
                nameEmbedding: parsedReq.skill.nameEmbedding,
                descriptionEmbedding: parsedReq.skill.descriptionEmbedding,
            }
        }

        if (!skill || skill === null) {
            return NextResponse.json({
                error: `Skill not found or stub not provided!!`
            }, { status: 404 });
        }
    
        // Embed both the skill name and description

        const shouldUseDescription = skill._description && skill._description.trim().length > 1;

        const nameAndDescriptionText = `${skill._name}: ${skill._description}`;

        const nameSimResp = await ai.vectors.match({
            queryText: skill._name,
            queryEmbedding: skill.nameEmbedding,
            matchCount: parsedReq.matchCount,
            matchThreshold: parsedReq.nameMatchThreshold,
            minContentLength: parsedReq.nameMinContentLength,
            filterTablename: 'skill',
            filterColname: '_name',
            filterColpath: undefined,
        })

        const nameSim = nameSimResp.data;

        if (nameSim === null) {
            return NextResponse.json({
                error: `Error fetching name similarity for skill ${parsedReq.skill}!`
            }, { status: 500 });
        }

        if (shouldUseDescription){
            // Get description similarity
            const descSimResp = skill._description && shouldUseDescription ? await ai.vectors.match({
                queryText: skill._description ?? '',
                queryEmbedding: skill.descriptionEmbedding,
                matchCount: parsedReq.matchCount,
                matchThreshold: parsedReq.descriptionMatchThreshold,
                minContentLength: parsedReq.descriptionMinContentLength,
                filterTablename: 'skill',
                filterColname: '_description',
                filterColpath: undefined,
            }) : undefined

            const nameAndDescriptionSimResp = nameAndDescriptionText ? await ai.vectors.match({
                queryText: nameAndDescriptionText,
                queryEmbedding: skill.nameEmbedding,
                matchCount: parsedReq.matchCount,
                matchThreshold: parsedReq.combinedMatchThreshold,
                minContentLength: 3,
                filterTablename: 'skill',
                filterColname: 'name_and_description',
                filterColpath: undefined,
            }) : undefined;

            // Now, only include results that are in both lists.
            const descSim = descSimResp?.data;
            const nameAndDescriptionSim = nameAndDescriptionSimResp?.data;

            if (shouldUseDescription && (descSim === undefined || descSim === null)) {
                console.warn(`Error fetching description similarity for skill ${parsedReq.skill}! Will simply use name similarity.`)
            }

            const similarSkillIds = descSim !== undefined && descSim !== null ? 
                _.intersection(nameSim.map((sim) => sim._ref_id), descSim.map((sim) => sim._ref_id))
                : nameSim.map((sim) => sim._ref_id);


            // Filter out current id.
            const filteredSimilarSkillIds = similarSkillIds.filter((id) => id !== skill.id);
            
            // Now fetch the corresponding records

            // TODO
            return {
                similarSkills: filteredSimilarSkillIds.map((id) => {
                    const nameSimRecord = nameSim.find((sim) => sim._ref_id === id);
                    const descSimRecord = descSim?.find((sim) => sim._ref_id === id);

                    return {
                        id,
                        name: nameSimRecord?.raw_content,
                        description: descSimRecord?.raw_content,
                        nameSimilarity: nameSimRecord?.similarity,
                        descriptionSimilarity: descSimRecord?.similarity,
                        combinedSimilarity: nameAndDescriptionSimResp?.data?.find((sim) => sim._ref_id === id)?.similarity,
                    }
                })
            }
        }
        else {
            return {
                similarSkills: nameSimResp.data?.map((sim) => ({
                    id: sim._ref_id,
                    name: sim.raw_content,
                    nameSimilarity: sim.similarity,
                }))
            }
        }
    }
})
