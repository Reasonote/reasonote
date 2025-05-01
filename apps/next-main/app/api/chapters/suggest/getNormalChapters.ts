import {NextResponse} from "next/server";
import {z} from "zod";

import {
  createChapterFlatMutDoc,
  FilterIs,
} from "@reasonote/lib-sdk-apollo-client";

import {ApiRouteContextFull} from "../../helpers/ApiRouteContext";
import {
  ChaptersSuggestRoute,
  SuggestedChaptersSchema,
} from "./routeSchema";

export async function getNormalChapters(ctx:  ApiRouteContextFull<typeof ChaptersSuggestRoute>){
    const { req, ac, rsn, parsedReq,  supabase, logger, user, ai } = ctx;

    const rsnUserId = user?.rsnUserId

    if (!rsnUserId) {
        return NextResponse.json({
            error: 'User not found!'
        }, { status: 404 });
    }

    const skillsToUpsert = 'skillNamePath' in parsedReq.subject ? 
        parsedReq.subject.skillNamePath.map((name) => ({
            name,
        })) : parsedReq.subject.skillIdPath.map((id) => ({
            id,
        }));

    const upsertSkillsResp = await rsn.skill.upsertSkillsForUser({
        skillPath: skillsToUpsert,
        addToUserSkillSet: parsedReq.addToUserSkillSet,
    })

    if (upsertSkillsResp.error) {
        return NextResponse.json({
            error: `Could not upsert skills. ${JSON.stringify(upsertSkillsResp.error)}`
        }, { status: 500 });
    }

    const skills = upsertSkillsResp.data?.skills;

    const rootSkillId = skills?.[0].id;

    if (!rootSkillId) {
        return NextResponse.json({
            error: 'Could not get root skill id. This should never occur.'
        }, { status: 500 });
    }

    const aiCtxRes = await rsn.skill.getSkillPathAiContext({names: skills.map((s) => s.name)});

    if (!aiCtxRes.data) {
        console.error('Could not fetch skill context:', aiCtxRes.error)
        throw new Error(`Could not fetch skill context. ${JSON.stringify(aiCtxRes.error)}`)
    }

    const formattedChapters = await ai.prompt.chapters.formatChapters({
        filter: {
            rootSkill: {
                eq: rootSkillId
            },
            rootSkillOrder: {
                is: FilterIs.NotNull
            }
        }
    });

    const initSection = `
        # The Primary Skill You Are Teaching:
        ${aiCtxRes.data}

        ${  
            formattedChapters ?
            `
            <ExistingChapters description="The following chapters have already been created for this user:">
                ${formattedChapters}
            </ExistingChapters>
            `
            : 
            ''
        }      
    ` 


    const defaultOneShotArgs = {
        prompt: `
        # Your Role
        You are responsible for suggesting a set of ${parsedReq.numChapters} "learning chapters" for a user based on the data you're given.

        Each chapter will be broken down into lessons, and each lesson will be composed of several activities.

        These activities will be explained to you in the "Relevant Context" section.

        ${initSection}

        --------------------------------
        # About the User
        ## The User's Relationship to the Skill
        ${await ai.prompt.skills.formatUserSkillData({
            skillId: rootSkillId,
            rsnUserId: rsnUserId,
            skillIdPath: skills.map((s) => s.id),
        })}

        --------------------------------

        # Relevant Context
        The following documents help construct relevant context for the skill you are teaching:

        ${await ai.prompt.skills.formatSnips({
            skillId: rootSkillId,
            aiGenerateContext: `
            We are building micro-lessons.
            
            ${initSection}
            `
        })}

        --------------------------------

        # Final Notes
        - Your chapters should NOT be the same as the existing chapters.
        - Remember to keep the chapters short and to the point.
        - DO NOT prefix chapter with "Chapter 1", "Chapter 2", etc.
        - You are only making ${parsedReq.numChapters} chapters.
        - Your Description should be 1-2 sentences long, MAX. It should start with "Learn ..."
        `,
        functionName: 'output_chapters',
        functionDescription: 'Output a set of suggested next chapters for a user.',
        functionParameters: z.object({
            chapters: z.array(
                SuggestedChaptersSchema.omit({
                    id: true, 
                })
            ).describe('The chapters to output'),
        }),
    }
 
    const chapterOutput = await ai.genObject({
        ...defaultOneShotArgs,
        schema: z.object({
            chapters: z.array(
                SuggestedChaptersSchema.pick({name: true, iconEmoji: true, description: true})
            ).describe('The lessons to output'),
        })
    })

    if (!chapterOutput.object) {
        return NextResponse.json({
            error: 'No data returned from AI server!'
        }, { status: 500 });
    }

    // Add to backend, in order.
    var chapterIds: string[] = [];
    for (const chapter of chapterOutput.object.chapters) {
        const result = await ac.mutate({
            mutation: createChapterFlatMutDoc,
            variables: {
                objects: [{
                    name: chapter.name,
                    icon: chapter.iconEmoji,
                    summary: chapter.description,
                    rootSkill: rootSkillId,
                    rootSkillPath: skills.map((s) => s.id),
                    forUser: rsnUserId,
                }]
            }
        });

        const theId = result.data?.insertIntoChapterCollection?.records?.[0]?.id

        if (!theId) {
            console.error('Could not get the id of the chapter:', result)
            throw new Error('Could not get the id of the chapter.')
        }

        chapterIds.push(theId);
    }

    return {
        chapterIds,
        skillPath: skills,
    }
}