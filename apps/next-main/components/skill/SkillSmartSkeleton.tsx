import {z} from "zod";

import {
  Card,
  SkeletonProps,
  Stack,
} from "@mui/material";
import {useSkillFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import {MuiMarkdownDefault} from "../markdown/MuiMarkdownDefault";
import {SmartSkeleton} from "../smart-skeleton/SmartSkeleton";
import {Txt} from "../typography/Txt";

export function SkillSmartSkeleton({skillId, skillName, height, width, skeletonProps}: {skillId?: string, skillName?: string, height: string, width: string, skeletonProps: SkeletonProps}){
    const skillRes = useSkillFlatFragLoader(skillId);

    const skillData = skillRes.data;

    const usingSkillName = skillData?.name ?? skillName;
    
    return <SmartSkeleton
        height={height}
        width={width}
        skeletonProps={{
            variant: 'rounded',
            ...skeletonProps,
        }}
        oneShotAIArgs={skillData ? {
            systemMessage: `
            You should generate a fun (real!) fact for the user to entertain them while they wait for their skill to load.

            This should be relevant to the skill in some way.

            Don't make it "preachy" -- it really should just be a fun fact.

            You should use markdown formatting, to make the text more engaging.

            Always begin your fun fact with "Did you know?".

            It should be SPECIFIC, not general. Cite numbers, dates, names, data, etc.

            <SKILL name="${usingSkillName}">
            </SKILL>
            `,
            functionName: 'output_fun_fact',
            functionDescription: 'Output a fun fact to entertain the user while they wait for their lesson to be generated.',
            functionParameters: z.object({
                funFact: z.string().describe('The fun fact to display to the user, in markdown'),
            }),
            driverConfig: {
                type: 'openai',
                config: {
                    model: 'gpt-4o-mini'
                }
            }
        } : undefined}
        formatResponse={(response) => {
            if (!response.data) return null;
            
            return <Stack alignItems={'center'} alignContent={'center'} justifyContent={'center'} height={'100%'} width={'100%'} maxWidth={'300px'}>
                <Card>
                    <Txt variant="caption" fontStyle={'italic'}>Generating your lesson, this should only take a few more seconds...</Txt>
                    <br/>
                    <Txt startIcon={'🤔'} variant="h6">Fun Fact</Txt>
                    <MuiMarkdownDefault>
                        {response.data.funFact}
                    </MuiMarkdownDefault>
                </Card>
            </Stack>
        }}
    />
}