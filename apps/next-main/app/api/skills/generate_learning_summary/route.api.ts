import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";
import {SupabaseDocDB} from "@reasonote/lib-ai/src/docdb/SupabaseDocDB";
import {DocumentToDag} from "@reasonote/lib-ai/src/DocumentToDag";

import {GenerateLearningSummaryRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 300 seconds.
export const maxDuration = 300;

export const { POST } = makeServerApiHandlerV3({
    route: GenerateLearningSummaryRoute,
    handler: async (ctx) => {
        const { parsedReq, ai, supabase, rsn, user } = ctx;
        const { documentId } = parsedReq;

        const docDB = new SupabaseDocDB({ai, supabase});

        const dagCreator = new DocumentToDag(ai);

        // Wait for document to be vectorized
        await docDB.waitForVectors([documentId]);
        const { chunks, documents } = await docDB.getAllChunks({
            documentIds: [documentId]
        });
        const document = documents.get(documentId);
        if (!document) {
            throw new Error(`Document with ID ${documentId} not found`);
        }

        const summary = await dagCreator.generateLearningSummary(chunks.map((chunk, idx) => ({content: chunk.content, p: chunks.length - idx})));
        const { skillName, emoji } = await dagCreator.generateSkillName(chunks[0].content, summary.summary, summary.learningObjectives);

        // Create the root skill
        const { data: rootSkillData, error: rootSkillError } = await supabase.from('skill').insert({
            _name: skillName,
            emoji,
            _description: summary.summary,
            metadata: {
                learningObjectives: summary.learningObjectives,
            },
        }).select('id').single();

        if (rootSkillError) throw new Error(`Failed to save root skill: ${rootSkillError}`);
        if (!rootSkillData) throw new Error('No data returned when creating root skill');

        // Save the document to the rootSkill
        const rsnUserId = user?.rsnUserId

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 404 });
        }

        const resp = await rsn.skill.addSkillsToUserSkillSet({
            addIds: [rootSkillData.id],
            addSkillResources: [{
                pageId: documentId,
            }],
            rsnUserId: rsnUserId,
        })

        return {
            rootSkillId: rootSkillData.id,
            skillName,
            emoji,
            summary: summary.summary,
            learningObjectives: summary.learningObjectives,
        };
    },
}); 