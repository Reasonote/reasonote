'use client'
import {useState} from "react";

import {z} from "zod";

import {aib} from "@/clientOnly/ai/aib";
import {
  Box,
  Button,
  Typography,
} from "@mui/material";

export default function RNAgentTestPage() {
    const [genObjectResponse, setGenObjectResponse] = useState<string | null>(null);
    const [genObjectLoading, setGenObjectLoading] = useState<boolean>(false);
    const [rnAgentResponse, setRnAgentResponse] = useState<string | null>(null);
    const [rnAgentLoading, setRnAgentLoading] = useState<boolean>(false);
    const [genObjectSyncResponse, setGenObjectSyncResponse] = useState<string | null>(null);
    const [genObjectSyncLoading, setGenObjectSyncLoading] = useState<boolean>(false);

    const handleGenObject = async () => {
        setGenObjectLoading(true);
        try {
            const aiResponse = await aib.streamGenObject({
                prompt: 'Suggest books for the user to read',
                schema: z.object({
                    suggestedBooks: z.array(z.string()),
                }),
                ctxInjectors: {
                    BasicUserInfo: {},
                },
                onPartialObject: (data) => {
                    console.log('Partial Object:', data);
                    setGenObjectResponse(JSON.stringify(data, null, 2));
                },
                onFinish: (res) => {
                    console.log('Final Object:', res.object);
                    setGenObjectResponse(JSON.stringify(res.object, null, 2));
                },
                thinking: {
                    schema: z.object({
                        thoughts: z.array(z.string()),
                    }),
                },
            });
        }
        catch (error) {
            console.error('Error generating object:', error);
        }
        finally {
            setGenObjectLoading(false);
        }
    }

    const handleGenObjectSync = async () => {
        setGenObjectSyncLoading(true);
        try {
            const aiResponse = await aib.genObject({
                prompt: 'Suggest books for the user to read',
                schema: z.object({
                    suggestedBooks: z.array(z.string()),
                }),
                ctxInjectors: {
                    BasicUserInfo: {},
                },
                thinking: {
                    schema: z.object({
                        thoughts: z.array(z.string()),
                    }),
                },
            });
            setGenObjectSyncResponse(JSON.stringify(aiResponse.object, null, 2));
        }
        catch (error) {
            console.error('Error generating object:', error);
        }
        finally {
            setGenObjectSyncLoading(false);
        }
    }

    const handleGeneratePrompt = async () => {
        setRnAgentLoading(true);
        try {
            const aiResponse = await aib.RNAgentStream({
                genArgs: {
                    model: 'openai:gpt-4o-mini',
                },
                chatId: 'test-chat-id',
                messages: [

                    {
                        role: 'user',
                        content: 'Can you explain photosynthesis in a way that relates to my interests? Please respond in one sentence of less than 10 words.'
                    }, {
                        role: 'context',
                        contextId: '123',
                        contextType: 'UserViewingActivity',
                    }
                ],
                execOrder: [
                    {
                        outputs: [{type: 'message'}, {type: 'tool_call', toolName: 'SuggestLesson'}],
                    },
                    {
                        outputs: [{type: 'message'}, {type: 'tool_call', toolName: 'OfferUserOptions'}],
                    },
                    {
                        outputs: [{type: 'message'}, {type: 'tool_call', toolName: 'UpdateUserSkill'}],
                    },
                ],
                tools: [
                    {
                        name: 'SuggestLesson',
                    },
                    {
                        name: 'OfferUserOptions',
                    },
                    {
                        name: 'UpdateUserSkill',
                    },
                ],
                // No context injectors configured for invocation, will be ignored.
                contextInjectors: {
                    BasicUserInfo: {},
                    Course: {
                        config: {
                            courseId: '123',
                        }
                    }
                },
                contextMessageRenderers: [
                    {
                        type: 'UserViewingActivity',
                    }
                ],
                system: 'You are a helpful tutor. Use the context about the user\'s interests to personalize your explanations. You always respond in less than 100 words.',
                onPartialOutputs: (data) => {
                    console.log('Partial Message:', data);
                    setRnAgentResponse(JSON.stringify(data, null, 2));
                },
                onFinish: (res) => {
                    console.log('Final Object:', res.object);
                    setRnAgentResponse(JSON.stringify(res.object, null, 2));
                },
            });
        } catch (error) {
            console.error('Error generating prompt:', error);
        } finally {
            setRnAgentLoading(false);
        }
    };

    return (
        <Box>
            <Button onClick={handleGenObjectSync} disabled={genObjectSyncLoading}>
                Generate Object (Sync)
            </Button>
            <Typography sx={{whiteSpace: 'pre-wrap'}}>{genObjectSyncResponse}</Typography>
            
            <Button onClick={handleGenObject} disabled={genObjectLoading}>
                Generate Object (Stream)
            </Button>
            <Typography sx={{whiteSpace: 'pre-wrap'}}>{genObjectResponse}</Typography>
            
            <Button onClick={handleGeneratePrompt} disabled={rnAgentLoading}>
                Generate Prompt (RNAgent)
            </Button>
            <Typography sx={{whiteSpace: 'pre-wrap'}}>{rnAgentResponse}</Typography>
        </Box>
    );
}
