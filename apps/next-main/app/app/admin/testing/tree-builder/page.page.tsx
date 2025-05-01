'use client'
import {
  useCallback,
  useState,
} from "react";

import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {TxtField} from "@/components/textFields/TxtField";
import {TxtFieldWithAction} from "@/components/textFields/TxtFieldWithAction";
import {AutoAwesome} from "@mui/icons-material";
import {
  Card,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import {MermaidReact} from "./Mermaid";

function TreeViewer(){
    // TODO: we always want to reduce the tree down to exactly 
    return <Stack>
        
    </Stack>
}

export default function TreeBuilderPage(){
    const [instructions, setInstructions] = useState<string>('');
    const [chart, setChart] = useState<string>('graph TD\nA[Christmas] -->|Get money| B(Go shopping)\nB --> C{Let me think}\nC -->|One| D[Laptop]\nC -->|Two| E[iPhone]\nC -->|Three| F[fa:fa-car]');

    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const getMermaidDiagram = useCallback(async () => {
        setIsGenerating(true);
        try {
            const res = await oneShotAIClient({
                systemMessage: `
                You are responsible for outputting / updating a mermaid diagram, in the fashion that the user prefers.
    
                IF there is a current mermaid chart, you should *not* include any of the existing mermaid chart,
                and only add your new lines to the chart.
    
                `,
                functionName: 'output_mermaid_diagram',
                functionDescription: 'Output a mermaid diagram',
                functionParameters: z.object({
                    newMermaidChart: z.string().describe('The new lines to add to the mermaid chart'),
                }),
                otherMessages: [
                    {
                        role: 'system',
                        content: `
                        <CURRENT_MERM_CHART>
                        ${chart}
                        </CURRENT_MERM_CHART>
                        `
                    },
                    {
                        role: 'user',
                        content: instructions
                    }
                ]
            })

            const newMermaidChartLines = res.data?.newMermaidChart;

            if (newMermaidChartLines) {
                setChart((old) => {
                    return newMermaidChartLines;
                })
            }
        }
        finally {
            setIsGenerating(false);
        }
        
    }, [chart, instructions]);


    return <Stack sx={{width: '100vw'}}>
        <Grid container>
            <Grid item xs={4} padding={'10px'}>
                <Stack>
                    <Card>
                        <TxtFieldWithAction
                            multiline
                            fullWidth
                            value={instructions}
                            onChange={(ev) => setInstructions(ev.target.value)}
                            onAction={getMermaidDiagram}
                            actionIcon={<AutoAwesome/>}
                            actionInProgress={isGenerating}
                        />
                    </Card>
                    <Card>
                        <TxtField
                            multiline
                            fullWidth
                            value={chart} 
                            onChange={(ev) => setChart(ev.target.value)}
                        />
                    </Card>
                    
                </Stack>
            </Grid>
            <Grid item xs={8} padding={'10px'}>
                <Card> 
                    <Typography variant={'h5'}>Tree Viewer</Typography>
                    <MermaidReact chart={chart} />
                </Card>
            </Grid>
        </Grid>
    </Stack>
}