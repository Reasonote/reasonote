import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {trimAllLines} from "@lukebechtel/lab-ts-utils";

export interface baseRunSwotAnalysisArgs {
    pageTitle: string;
    pageDescription: string;
    pageContent: string;
}



export interface runSwotAnalysisArgs extends baseRunSwotAnalysisArgs {
    personas?: SwotAnalysisPersona[];
}

export const SWOTItem = z.object({
    type: z.enum(['strength', 'weakness', 'opportunity', 'threat']),
    description: z.string().describe('The description of the strength, weakness, opportunity, or threat'),
    impact: z.enum(['high', 'medium', 'low']).optional().default('medium'),
    likelihood: z.enum(['high', 'medium', 'low']).optional().default('medium')
}).describe('An item in a SWOT analysis')

export const swotAnalysisResultSchema = z.object({
    swotItems: z.array(SWOTItem).describe('The SWOT items for the given subject'),
})
export type swotAnalysisResult = z.infer<typeof swotAnalysisResultSchema>

export interface SwotAnalysisPersona {
    name: string;
    description: string;
}



async function swotAnalysisAsPersona({
    pageTitle,
    pageDescription,
    pageContent,
    persona
}: baseRunSwotAnalysisArgs & {persona: SwotAnalysisPersona}) {
    // TODO: run a swot analysis as a given persona
    return await oneShotAIClient({
        driverConfig: {
            type: 'openai',
            config: {
                model: 'gpt-4o',
                temperature: 1,
            }
        },
        systemMessage: `
        # Your Role
        You are responsible for running a SWOT analysis for the given page, as the given persona.

        ## YOUR PERSONA NAME: "${persona.name}"
        ## YOUR PERSONA DESCRIPTION:
        \`\`\`
        ${persona.description}
        \`\`\`

        --------------------------------------------
        # Page
        ## Title
        "${pageTitle}"

        ## Description
        \`\`\`
        ${pageDescription}
        \`\`\`

        ## Content
        \`\`\`
        ${pageContent}
        \`\`\`

        `,
        functionName: "swotAnalysis",
        functionDescription: "Output a SWOT analysis for the given page, as the given persona.",
        functionParameters: swotAnalysisResultSchema
    })
}

export const swotAnalysisResultWithPersonaSchema = z.object({
    swotitems: z.array(z.object({
        item: SWOTItem,
        personas: z.string().array().describe('The personas who said this SWOT item')
    })).describe('The SWOT items for the given subject'),
})

async function swotAnalysisCombiner({
    analyses
}: {analyses: (swotAnalysisResult & {persona: SwotAnalysisPersona})[]}) {
    return await oneShotAIClient({
        systemMessage: `
        # Your Role
        You are responsible for combining the given SWOT analyses into a comprehensive list of strengths, weaknesses, opportunities, and threats.

        You MUST Ensure that you are not duplicating any of the items in the lists
        You MUST Ensure that you are not missing any items.


        If multiple items have different likelihoods or impacts, you should choose the highest likelihood and the highest impact.
        `,
        functionName: "combineSwotAnalyses",
        functionDescription: "Combine multiple SWOT analyses into one.",
        functionParameters: swotAnalysisResultWithPersonaSchema,
        otherMessages: analyses.map((analysis, index) => {
            const formatSwotItem = (item: {type: string, description: string, impact: string, likelihood: string}) => `
            - ${item.description}
            --- LIKELIHOOD: ${item.likelihood}
            --- IMPACT: ${item.impact}
            `

            const strengths = analysis.swotItems.filter(item => item.type === 'strength').map(item => formatSwotItem(item))
            const weaknesses = analysis.swotItems.filter(item => item.type === 'weakness').map(item => formatSwotItem(item))
            const opportunities = analysis.swotItems.filter(item => item.type === 'opportunity').map(item => formatSwotItem(item))
            const threats = analysis.swotItems.filter(item => item.type === 'threat').map(item => formatSwotItem(item))       

            return ({
                role: 'assistant',
                content: trimAllLines(`
                --------------------------------------------
                # SWOT Analysis ${index + 1}

                # PERSONA: "${analysis.persona.name}"

                --------------------------------------------
                # ANALYSIS

                Strengths:
                \`\`\`
                ${strengths.join('\n')}
                \`\`\`

                Weaknesses:
                \`\`\`
                ${weaknesses.join('\n')}
                \`\`\`

                Opportunities:
                \`\`\`
                ${opportunities.join('\n')}
                \`\`\`

                Threats:
                \`\`\`
                ${threats.join('\n')}
                \`\`\`
                `)
            })
        })
    })
}


export async function runSWOTAnalysis(
{
    pageTitle,
    pageDescription,
    pageContent,
    personas
}: runSwotAnalysisArgs) {
    const usingPersonas = personas && (personas.length > 0) ? personas : [
        {
            name: 'SWOT Expert',
            description: 'An expert in SWOT analysis'
        }
    ] 


    const analyses = await Promise.all(usingPersonas.map(async (persona) => {
        const result = await swotAnalysisAsPersona({
            pageTitle,
            pageDescription,
            pageContent,
            persona
        });

        if (result.success) {
            return {
                ...result.data,
                persona
            }
        }
        else {
            return {
                swotItems: [],
                persona
            }
        }
    }))

    // If there is only one persona, we can just return the result of the analysis
    if (analyses.length === 1) {
        const analysis = analyses[0];
        return {
            success: true,
            data: {
                swotitems: analysis.swotItems.map(item => ({
                    item,
                    personas: [analysis.persona.name]
                }))
            }
        }
    }
    else {
        return await swotAnalysisCombiner({analyses})
    }
}