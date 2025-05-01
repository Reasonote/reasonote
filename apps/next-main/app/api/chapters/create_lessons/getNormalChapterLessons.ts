import {NextResponse} from "next/server";
import {z} from "zod";

import {openai} from "@ai-sdk/openai";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {createLessonFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";
import {
  getChapterDeep,
} from "@reasonote/lib-sdk-apollo-client/src/gqlDocuments/queries/getChapterDeep";

import {ApiRouteContextFull} from "../../helpers/ApiRouteContext";
import {
  SuggestedLessonSchema,
} from "../../lesson/get_suggested_lessons/routeSchema";
import {ChaptersCreateLessonsRoute} from "./routeSchema";

export async function getNormalChapterLessons(ctx:  ApiRouteContextFull<typeof ChaptersCreateLessonsRoute>){
    const { req, ac, rsn, parsedReq,  supabase, logger, user, ai } = ctx;

    const rsnUserId = user?.rsnUserId

    if (!rsnUserId) {
        return NextResponse.json({
            error: 'User not found!'
        }, { status: 404 });
    }

    // Get the chapter
    const chapterId = parsedReq.chapterId;

    const chapterRes = await ac.query({
        query: getChapterDeep,
        variables: {
            filter: {
                id: {
                    eq: chapterId
                }
            }
        }
    });

    const chapter = chapterRes.data?.chapterCollection?.edges?.[0]?.node;

    if (!chapter) {
        return NextResponse.json({
            error: 'Chapter not found!'
        }, { status: 404 });
    }

    const skillIdPath = chapter.rootSkillPath?.filter(notEmpty) ?? [];
    const rootSkillId = chapter.rootSkill;

    const skillsInPath = (await rsn.skill.getSkillsInPath(skillIdPath))?.data;

    if (!skillsInPath) {
        return NextResponse.json({
            error: 'Could not fetch skills in path.'
        }, { status: 404 });
    }
    const aiCtxRes = await rsn.skill.getSkillPathAiContext({names: skillsInPath.map((s) => s._name)});

    if (!aiCtxRes.data) {
        console.error('Could not fetch skill context:', aiCtxRes.error)
        throw new Error(`Could not fetch skill context. ${JSON.stringify(aiCtxRes.error)}`)
    }

    const initSection = `
        <CHAPTER_FOR_LESSONS description="The chapter you're designing lessons for.">
        ${await ai.prompt.chapters.formatObj(chapter)}
        </CHAPTER_FOR_LESSONS>    
    `

    const defaultOneShotArgs = {
        prompt: `
        # Your Role
        You are responsible for creating a set of ${parsedReq.numLessons} very short auto-generated lessons for a micro-learning chapter, based on the data you have available to you.

        ${initSection}

        --------------------------------
        # About the User
        ## The User's Relationship to the Skill
        ${await ai.prompt.skills.formatUserSkillData({
            skillId: rootSkillId,
            rsnUserId: rsnUserId,
            skillIdPath: skillIdPath,
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
        - Remember to keep the lessons short and to the point.
        - Remember to order the lessons in a logical sequence.
        - Do not prefix lessons with "Lesson 1", "Lesson 2", etc.
        - You are only making ${parsedReq.numLessons} lessons.
        - Your Description should be 1-2 sentences long, MAX. It should start with "Learn ..."
        `,
        functionName: 'output_chapter_lessons',
        functionDescription: 'Output a set of lessons for the chapter.',
        schema: z.object({
            lessons: z.array(SuggestedLessonSchema.omit({id: true})).describe('The lessons to output'),
        }),
        models: [
            openai('gpt-4o-mini'),
        ]
    }

    const lessonOutput = await ai.genObject({
        ...defaultOneShotArgs,
        schema: z.object({
            lessons: z.array(
                SuggestedLessonSchema.pick({
                    title: true, 
                    lessonIconEmoji: true,
                    description: true
                })
            ).describe('The lessons to output'),
        })
    })

    if (!lessonOutput) {
        return NextResponse.json({
            error: 'No data returned from AI server!'
        }, { status: 500 });
    }

    // Add to backend, in order.
    var idx = 0;
    for (const lesson of lessonOutput.object.lessons) {
        const result = await ac.mutate({
            mutation: createLessonFlatMutDoc,
            variables: {
                objects: [{
                    name: lesson.title,
                    icon: lesson.lessonIconEmoji,
                    summary: lesson.description,
                    rootSkill: rootSkillId,
                    rootSkillPath: skillIdPath,
                    forUser: rsnUserId,
                    chapter: chapterId,
                    chapterOrder: idx,
                }]
            }
        });

        //@ts-expect-error
        lesson.id = result.data?.insertIntoLessonCollection?.records?.[0].id;

        idx++;
    }

    return {
        lessonIds: lessonOutput.object.lessons.map((l: any) => l.id),
    }
}