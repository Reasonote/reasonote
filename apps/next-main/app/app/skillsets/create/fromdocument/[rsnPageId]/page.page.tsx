'use client'
import {useState} from "react";

import {z} from "zod";

import {
  RsnPageDisplayer,
} from "@/app/app/documents/document-display/RsnPageDisplayer";
import {aib} from "@/clientOnly/ai/aib";
import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {useRouteParams} from "@/clientOnly/hooks/useRouteParams";
import {
  FlashcardActivity,
} from "@/components/activity/activities/FlashcardActivity/client/render";
import {SkillIcon} from "@/components/icons/SkillIcon";
import {NotFoundPage} from "@/components/navigation/NotFound";
import FullCenter from "@/components/positioning/FullCenter";
import {
  notEmpty,
  trimLines,
} from "@lukebechtel/lab-ts-utils";
import {ArrowRight} from "@mui/icons-material";
import {
  Button,
  Card,
  Stack,
  Typography,
} from "@mui/material";
import {RsnPage} from "@reasonote/lib-sdk-apollo-client";
import {useRsnPageFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

interface Section {
    type: 'section',
    name: string,
    description?: string,
    subSkills?: Skill[]
}

type ActivityStub = FlashcardActivityStub;

interface FlashcardActivityStub {
    type: 'flashcard',
    front: string,
    back: string,
}

interface Skill {
    type: 'skill',
    name: string,
    description?: string,
    subSkills?: Skill[],
    activities?: ActivityStub[]
}

export function SkillListEntry(p: {s: Skill}){
    return <Card sx={{paddingLeft: '10px'}} elevation={10}>
        <Stack>
            <Typography variant="caption">
                {
                p.s.name
            }
            </Typography>
            {
                p.s.description ? 
                    <Stack sx={{paddingLeft: '10px'}}>
                        {p.s.description}
                    </Stack>
                    :
                    null
            }
            <Typography variant="caption"> Activities</Typography>
            <Stack gap={1}>
                {
                    p.s.activities?.map((a, idx) => {
                        return <Card sx={{padding: '10px'}} elevation={15}>
                            <Stack>
                                <FlashcardActivity 
                                    config={{
                                        type: 'flashcard',
                                        version: '0.0.0',
                                        flashcardFront: a.front,
                                        flashcardBack: a.back,
                                        // metadata: {
                                        //     challengeSubSkills: ['alpha'],
                                        //     improveSubSkills: ['beta'],
                                        //     subSkills: ['gamma'],
                                        // }
                                    }}
                                    ai={aib}
                                />
                            </Stack>
                        </Card>
                    })
                }
            </Stack>
        </Stack>
    </Card>
}

export function SectionNodeComp(p: {id: any; data: Section}) {
    return <Card sx={{padding: '10px'}} elevation={5}>
        <Stack>
            <Typography variant="h5">{p.data.name}</Typography>
            {
                p.data.description ? 
                    <Stack sx={{paddingLeft: '10px'}}>
                        {p.data.description}
                    </Stack>
                    :
                    null
            }
            {
                p.data.subSkills?.length && p.data.subSkills.length > 0 ?
                    <>
                        <Stack direction={'row'} gap={1} alignItems={'center'}>
                            <SkillIcon fontSize="small"/>
                            <Typography variant="h6"> Skills</Typography>
                        </Stack>
                        <Stack gap={1}>
                            {
                                p.data.subSkills?.map((s, idx) => {
                                    if (s.type === 'skill'){
                                        return <SkillListEntry s={s}/>
                                    }
                                })
                            }
                        </Stack>
                    </>
                    
                    :
                    null
            } 
        </Stack>
    </Card>
}


////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////


async function createSections(pages: RsnPage[]){
    const result = await oneShotAIClient({
        systemMessage: trimLines(`
        # YOUR ROLE
        You are a very smart teacher, responsible for helping break down concepts into smaller pieces for students to progress through.

        # YOUR TASK
        You are tasked with breaking down the user's document(s) into sections, so that students can progress through the document in a structured way.

        # ADDITIONAL NOTES
        - Order the sections in the order that you think makes the most sense, from a pedagogical perspective.
        - You can create as many sections as you want.
        - Use the best judgement you can to determine what a "section" is.
        `),
        functionName: "outputSections",
        functionDescription: "Output the document sections",
        functionParameters: z.object({
            sections: z.array(z.object({
                name: z.string().describe('The name of the section'),
                description: z.string().describe('A brief (1-2 sentence) description of the section'),
            }))
        }),
        otherMessages: [
            ...pages.map((p, idx) => ({
                role: 'user' as const,
                content: trimLines(`
                <DOCUMENT-${idx}>
                # ${p.name}

                ${p.body}
                `)
            }))
        ],
        driverConfig: {
            type: 'openai',
            config: {
                model: 'gpt-3.5-turbo-0613'
            }
        }
    })

    return result.data?.sections.map((s) => ({
        type: 'section' as const,
        name: s.name,
        description: s.description
    }));
}


async function createSkills(pages: RsnPage[], sections: Section[]){

    const result = await oneShotAIClient({
        systemMessage: trimLines(`
        # YOUR ROLE
        You are a very smart teacher, responsible for helping break down concepts into smaller pieces for students to progress through.

        # YOUR TASK
        You are tasked with breaking down the user's document(s) into skills, so that students can progress through the document in a structured way.

        You have already created the sections, so you can use those to help you break down the skills.

        # ADDITIONAL NOTES
        - Order the skills in the order that you think makes the most sense, from a pedagogical perspective.
        - You can create as many skills as you want.
        - Use the best judgement you can to determine what a "skill" is.

        -----------------------------------
        # SECTIONS
        ${sections?.map((s, idx) => `
        # SECTION: "${s.name}"
        ${s.description}
        `).join('\n') ?? ''}
        `),
        functionName: "outputSkills",
        functionDescription: "Output skills under each section",
        functionParameters: z.object({
            skillsPerSection: z.array(z.object({
                sectionName: z.string().describe(`The name of the section these skills should go under (ONE OF: ${sections?.map((s) => `"${s.name}"`).join(', ')})`),
                skills: z.array(z.object({
                    name: z.string().describe('The name of the skill'),
                    description: z.string().describe('A 1 sentence description of the skill.'),
                }))
            }))
        }),
        otherMessages: [
            ...pages.map((p, idx) => ({
                role: 'user' as const,
                content: trimLines(`
                <DOCUMENT-${idx}>
                # ${p.name}

                ${p.body}
                `)
            }))
        ],
        driverConfig: {
            type: 'openai',
            config: {
                model: 'gpt-4o'
            }
        }
    })

    return result.data?.skillsPerSection;
}


export async function generateActivityForPageSection(rsnPages: RsnPage[], sections: Section[], section: Section){
    const activityType = "flashcard";

    if (activityType === "flashcard") {
        const skills = section.subSkills ?? [];

        const flashcardAct = await oneShotAIClient({
            systemMessage: trimLines(`
            # YOU
            You are an excellent teacher, familiar with all the best pedagogical methods.

            # YOUR TASK
            The user has provided you with a document they want to learn about.
            
            You have already broken the document up into Sections, and Skills.

            Now, you are going to generate a set of flashcards that will help the user learn the following Section:

            Section: ${section.name}
            Section Description: ${section.description}
            Section Skills: 
                ${skills.map((s) => `
                - ${s.name}: ${s.description}
                `).join('\n')}


            # ADDITIONAL NOTES
            - You will do this by creating flashcards that will be used to quiz the user.
            - You should create at least one flashcard per skill.

            You can use markdown to format your flashcards.
            `),
            functionName: "createFlashcards",
            functionDescription: "Create flashcards",
            functionParameters: z.object({
                flashcards: z.array(z.object({
                    skillName: z.string().describe('The name of the skill this flashcard is for'),
                    flashcardFront: z
                        .string()
                        .describe("The front of the flashcard (the prompt/question)"),
                    flashcardBack: z
                        .string()
                        .describe("The back of the flashcard (the answer)"),
                }))
            }),
            otherMessages: [
                {
                    role: 'system',
                    content: trimLines(`
                    # SECTIONS
                    ${sections.map((s, idx) => `
                    ##  SECTION: "${s.name}"
                    ${s.description}
                    `).join('\n')}
                    `)
                },
                ...rsnPages.map((p, idx) => ({
                    role: 'user' as const,
                    content: trimLines(`
                    <DOCUMENT-${idx}>
                    # ${p.name}

                    ${p.body}
                    `)
                }))
            ]
        });

        return flashcardAct;
    }
}



export default function Page(o: any){
    const rsnPageId = useRouteParams(o.params, 'rsnPageId');

    const rsnPageResult = useRsnPageFlatFragLoader(rsnPageId)
    const [sections, setSections] = useState<Section[]>([])
    const [activities, setActivities] = useState<{
        sectionName: string,
        skillName: string,
        activity: any
    }[]>([])

    const [importStatus, setImportStatus] = useState<'idle' | 'getting-sections' | 'getting-skills' | 'done'>('idle');

    const rsnPageData = rsnPageResult.data;
    const canImport = !!rsnPageData?.body && rsnPageData?.body.length > 0 && importStatus === 'idle'; 

    return rsnPageId ? <FullCenter sx={{padding: '10px'}}>
        <Stack direction={'row'} gap={1}> 
            <Card sx={{width: '300px', padding: '10px'}}>
                <Stack>
                    <RsnPageDisplayer 
                        selectedDocId={rsnPageId} 
                        maxRows={10}
                    />
                    {
                        rsnPageData &&
                        <>
                            <Stack gap={2} width={'120px'}>
                                <Button 
                                    size="small"
                                    variant="contained"
                                    disabled={!canImport}
                                    onClick={async () => {
                                        setImportStatus('getting-sections')
                                        try {
                                            // 1. Create sections
                                            const sects = await createSections([{...rsnPageData, nodeId: rsnPageId}])

                                            // Set the sections
                                            setSections(sects ?? [])

                                            if (!sects){
                                                setImportStatus('idle')
                                                console.error('No sections returned from AI')
                                                return;
                                            }

                                            setImportStatus('getting-skills')

                                            // 2. Now, we need to create the skills for each section.
                                            const skills = await createSkills([{...rsnPageData, nodeId: rsnPageId}], sects)

                                            // Map the skills to the sections
                                            const newSects = sects?.map((node) => {
                                                if (node.type === 'section'){
                                                    const skillsForSection = skills?.find((s) => s.sectionName === node.name)?.skills;
                                                    if (skillsForSection){
                                                        return {
                                                            ...node,
                                                            subSkills: skillsForSection.map((s) => ({
                                                                type: 'skill' as const,
                                                                name: s.name,
                                                                description: s.description
                                                            }))
                                                        }
                                                    }
                                                }
                                                return {
                                                    ...node,
                                                    subSkills: []
                                                };
                                            })

                                            console.log(newSects)

                                            // Set the sections
                                            setSections(newSects)

                                            // TODO: this is dirty
                                            const allSkills = newSects?.flatMap((s) => s.subSkills ?? [])
                                            const activities = await Promise.all(newSects?.map(async (sect) => {
                                                const act = await generateActivityForPageSection([{...rsnPageData, nodeId: rsnPageId}], newSects, sect)
                                                return act;
                                            }))

                                            const activitiesFlat = activities?.flatMap((a) => a?.data?.flashcards).filter(notEmpty)

                                            const newActivities = activitiesFlat?.map((a) => ({
                                                sectionName: newSects?.find((s) => s.subSkills?.find((s2) => s2.name === a.skillName))?.name,
                                                skillName: a.skillName,
                                                activity: a
                                            }))

                                            setSections(newSects.map((s) => ({
                                                ...s,
                                                subSkills: s.subSkills?.map((s2) => ({
                                                    ...s2,
                                                    activities: newActivities?.filter((a) => a.skillName === s2.name)
                                                        .map((a) => {
                                                            const front = a.activity?.flashcardFront;
                                                            const back = a.activity?.flashcardBack;

                                                            if (!front || !back){
                                                                return undefined;
                                                            }

                                                            return {
                                                                type: 'flashcard' as const,
                                                                front: front,
                                                                back: back,
                                                            }
                                                        })
                                                        .filter(notEmpty)
                                                }))
                                            })))

                                            setImportStatus('done')

                                            // 3. Now, we need to create activities for each skill.
                                        }
                                        finally{
                                            setImportStatus('idle')
                                        }
                                    }}
                                    endIcon={<ArrowRight fontSize="large"/>}
                                >
                                    Import Doc
                                </Button>
                            </Stack>
                        </>
                    }
                </Stack>
            </Card>
            {
                rsnPageData ? 
                    <>
                        <Card sx={{flex: 1, minWidth: '100px', maxWidth: '80vw', padding: '10px', overflow: 'scroll'}}>
                            <Stack gap ={1}>
                                <Button variant="contained">
                                    Review (TODO)
                                </Button>
                                {
                                    importStatus === 'getting-sections' ?
                                        <Typography>Getting Sections...</Typography>
                                        :
                                        null
                                }
                                {
                                    sections?.map((node, idx) => {
                                        if (node.type === 'section'){
                                            return <SectionNodeComp key={idx} id={idx} data={node} />
                                        }
                                    })
                                }
                            </Stack>
                            
                        </Card> 
                    </>
                    :
                    null
            }
        </Stack>
    </FullCenter>
    :
    <NotFoundPage/>
}