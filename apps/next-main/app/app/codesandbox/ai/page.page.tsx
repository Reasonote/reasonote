// 'use client'
// import React, {
//   useCallback,
//   useRef,
//   useState,
// } from "react";

// import {z} from "zod";

// import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
// import FullCenter from "@/components/positioning/FullCenter";
// import {Sandpack} from "@codesandbox/sandpack-react";
// import {
//   notEmpty,
//   trimLines,
// } from "@lukebechtel/lab-ts-utils";
// import {
//   Button,
//   LinearProgress,
//   Paper,
//   Stack,
//   TextField,
//   Typography,
// } from "@mui/material";

// export default function AICodeSandboxPage() {
//     const [codeIdea, setCodeIdea] = useState('');
//     const [fullFileContents, setFullFileContents] = useState(trimLines(`
//     // TODO
//     export default function App() {
//         return (
//             <div>
//                 <h1>New Activity</h1>
//             </div>
//         );
//     }
//     `));
//     const [generatingCodeState, setGeneratingCodeState] = useState<'waiting' | 'generating' | 'generated'>('waiting');

//     const sandpackRef = useRef<any>(null);

//     const generateCode = useCallback(async () => {
//         if (generatingCodeState === 'generating'){
//             return;
//         }

//         setGeneratingCodeState('generating');
//         const result = await oneShotAIClient({
//             systemMessage: trimLines(`
//                 # You
//                 You are an expert in react programming.

//                 # Your Task
//                 The user will present you with an idea for a react app.
//                 You should write the code for the app in ONE REACT FILE, in typescript, including any imports.

//                 Only 'react' is pre-installed.

//                 The user may present you with an existing react file, in which case you should modify that file to implement the idea.

//                 No matter what, you must ALWAYS return a full, complete react file that can be run in codesandbox without additional imports.

//                 You do NOT need to call render. Just return a default-exported react component.

//                 Even if you are only supposed to edit PART of the file,
//                 you should output a full react file that can be run in codesandbox.

//                 Your output will be used DIRECTLY, so you have to output THE ENTIRE FILE.
//             `),
//             functionName: "writeReactFile",
//             functionDescription: "Write a .tsx react file.",
//             functionParameters: z.object({
//                 reactFileContents: z.string().describe('The full contents of the react .tsx file'),
//             }),
//             otherMessages: [
//                 {
//                     role: 'user' as const,
//                     content: trimLines(`
//                     # REACT APP IDEA:
//                     ${codeIdea}
//                     `)
//                 },
//                 // If we've already generated,
//                 // Send the current react file contents
//                 (generatingCodeState === 'generated' ? {
//                     role: 'user' as const,
//                     content: trimLines(`
//                     # CURRENT REACT FILE CONTENTS
                    
//                     \`\`\`tsx
//                     ${fullFileContents}
//                     \`\`\`
//                     `)
//                 } : null)
//             ].filter(notEmpty)
//         });

//         if (result.data){
//             setGeneratingCodeState('generated');
//             setFullFileContents(result.data.reactFileContents);
//         }
//         else {
//             setGeneratingCodeState('waiting');
//         }
//     }, [codeIdea, generatingCodeState]);

//     return (
//         <FullCenter>
//             <Paper>
//                 <Stack padding={2} gap={1}>
//                     <Typography variant="h4" alignSelf={'center'}>
//                         Activity Creator 
//                     </Typography>
//                     <TextField 
//                         autoComplete="off"
//                         aria-autocomplete="none"
//                         label={'What activity should be created?'}
//                         fullWidth={true}
//                         value={codeIdea} onChange={(e) => {
//                         setCodeIdea(e.target.value);
//                     }} />

                    
//                     <Button 
//                         disabled={generatingCodeState === 'generating'}
//                         onClick={() => {
//                             generateCode()
//                         }}
//                     >
//                         Generate Code!
//                     </Button>

//                     {
//                         generatingCodeState === 'generating' && (
//                             <Stack>
//                                 <Typography variant="caption">
//                                     Generating...
//                                 </Typography>
//                                 <LinearProgress/>
//                             </Stack>
//                         )
//                     }
                    

//                     <div ref={sandpackRef} style={{width: '800px', height: '500px'}}>
//                         <Sandpack 
//                             template="react-ts"
//                             files={{
//                                 '/App.tsx': {
//                                     code: fullFileContents,
//                                 },
//                             }}
//                         />
//                         {/* <SandpackProvider
//                             template="react"
                            
//                         >
//                             <SandpackLayout>
//                                 <SandpackCodeEditor />
//                                 <SandpackPreview />
//                             </SandpackLayout>
//                         </SandpackProvider> */}
//                     </div>

//                     <Typography variant="caption" alignSelf={'center'} fontStyle={'italic'}>
//                         A just-for-fun project by Luke Bechtel
//                     </Typography>
//                 </Stack>
//             </Paper>
//         </FullCenter>
//     );
// };
export default function AICodeSandboxPage() {
    return <div>Hello</div>;
}