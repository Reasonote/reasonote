"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {ChatV2} from "@/components/chat/ChatV2";
import {Txt} from "@/components/typography/Txt";
import {useMutation} from "@apollo/client";
import {Stack} from "@mui/material";
import {
  createChatFlatMutDoc,
  createChatMessageFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";

export default function LearningPathwayPage() {
    const { loading } = useRsnUser();
    const [chatId, setChatId] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [createChat] = useMutation(createChatFlatMutDoc);
    const [createMessage] = useMutation(createChatMessageFlatMutDoc);

    // Create initial chat and message
    useEffect(() => {
        const initializeChat = async () => {
            if (chatId) return;

            try {
                // Create the chat first
                const chatResult = await createChat({
                    variables: {
                        objects: [{
                            isPublic: false,
                            topic: "Learning Pathway"
                        }]
                    }
                });

                const newChatId = chatResult.data?.insertIntoChatCollection?.records[0]?.id;
                if (!newChatId) {
                    throw new Error("Failed to create chat");
                }

                // Add the initial message
                await createMessage({
                    variables: {
                        objects: [{
                            chatId: newChatId,
                            role: "assistant",
                            body: `Hello! I'm your Learning Pathway Assistant. I'll help you create a personalized learning journey that aligns with your goals and preferences.

Here's what I'll help you with:
1. Understanding your learning goals (both short-term and long-term)
2. Identifying your current skills and knowledge
3. Learning about your preferred learning style and available resources
4. Creating a structured pathway to achieve your goals
5. Setting up milestones and checkpoints for your progress

Let's start with your goals! Could you tell me:
1. What are your short-term learning goals? (What would you like to achieve in the next few months?)
2. What are your long-term learning goals? (What would you like to achieve in the next few years?)

Feel free to be as specific or general as you'd like - we can refine these goals together.`
                        }]
                    }
                });

                setChatId(newChatId);
                setIsInitialized(true);
            } catch (error) {
                console.error("Error creating initial chat:", error);
            }
        };

        initializeChat();
    }, [chatId, createChat, createMessage]);

    const handleSendMessage = useCallback(async (message: string) => {
        try {
            const response = await fetch("/api/ai/learning_pathway", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message,
                    context: {} // We'll maintain context in the API
                })
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            console.log(response);

            // The ChatV2 component will handle displaying the response
            return response.json();
        } catch (error) {
            console.error("Error processing message:", error);
            throw error;
        }
    }, []);

    if (loading || !isInitialized) {
        return (
            <Stack spacing={2} p={2}>
                <Txt>Initializing learning pathway...</Txt>
            </Stack>
        );
    }

    return (
        <Stack spacing={2} p={2}>
            <Txt variant="h4">Learning Pathway</Txt>
            <Txt variant="body1">
                Let's create a personalized learning pathway tailored to your goals and preferences.
            </Txt>
            <ChatV2
                chatId={chatId!}
                botInfo={{
                    name: "Learning Pathway Assistant",
                    description: "I help create personalized learning pathways",
                    avatar: "🎓"
                }}
                onSendMessage={handleSendMessage}
                systemPrompt={`You are an AI learning pathway assistant helping users create personalized learning journeys.
Your role is to:
1. Guide users through articulating their learning goals and preferences
2. Help them identify their current capabilities and available resources
3. Create a structured learning pathway that matches their needs
4. Provide encouragement and support throughout the process

Be friendly, encouraging, and focus on actionable next steps.`}
            />
        </Stack>
    );
}