'use client'
import {ReactFlowProvider} from "reactflow";

import {
  Paper,
  Stack,
} from "@mui/material";

import {SkillSetTree} from "../../SkillSetTree";

export default function Page(){
    return <div>
        <Paper>
            <Stack  sx={{width: '100vw', height: '90vh'}}>
                {/* @ts-ignore */}
                <ReactFlowProvider>
                    <SkillSetTree 
                        concepts={[
                            {
                                conceptName: 'Algebra',
                                prerequisites: [
                                    'Addition',
                                    'Subtraction',
                                    'Multiplication',
                                    'Division'
                                ]
                            },
                            {
                                conceptName: 'Multiplication',
                                prerequisites: [
                                    'Addition'
                                ]
                            },
                            {
                                conceptName: 'Division',
                                prerequisites: [
                                    'Multiplication'
                                ]
                            },
                            {
                                conceptName: 'Subtraction',
                                prerequisites: [
                                    'Addition'
                                ]
                            },
                            {
                                conceptName: 'Subtraction Is The Opposite of Addition',
                                prerequisites: [
                                    'Subtraction',
                                    'Addition'
                                ]
                            }
                        ]}
                    />
                </ReactFlowProvider>
            </Stack>
        </Paper>
    </div>
}