"use client";
import {
  ChatV4UpsertContextRoute,
} from "@/app/api/chat/v4/upsert_context/routeSchema";
import {
  ApolloClient,
  makeVar,
} from "@apollo/client";
import {createChatFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";

export type ChatDrawerContextMessage = {
    contextType: 'ViewingLesson',
    contextId: string,
    contextData: {
        lessonId?: string;
        lessonSessionId?: string;
        activityId?: string;
        activityResultId?: string;
        extraInfo?: string;
    },
} | {
    contextType: 'ViewingActivity',
    contextId: string,
    contextData: {
        activityId: string;
        activityResultId?: string;
        extraInfo?: string;
    },
}

class ChatDrawerStateClass {
    isOpenVar = makeVar<boolean>(false);
    chatIdVar = makeVar<string | null>(null);
    suggestedNextMessagesVar = makeVar<string[] | null>(null);

    async resetChat(ac: ApolloClient<any>){
        const result = await ac.mutate({
            mutation: createChatFlatMutDoc,
            variables: {
                objects: [
                    {
                    isPublic: false,
                    },
                ],
            },
        });

        const chatId = result.data?.insertIntoChatCollection?.records?.[0]?.id;

        if (!chatId) {
            throw new Error("Failed to create new chatroom");
        }

        this.chatIdVar(chatId);
        this.isOpenVar(true);
    }

    async upsertContextMessage(ac: ApolloClient<any>, msg: ChatDrawerContextMessage){
        const chatId = this.chatIdVar();

        if (!chatId) {
            console.error("ChatId is not set");
            return;
        }

        await ChatV4UpsertContextRoute.call({
            chatId,
            ...msg
        })
    }

    async updateSuggestedMessages(){
        const chatId = this.chatIdVar();
        if (chatId){
            // TODO: reinstate?
            // const res = await ChatV4SuggestNextMessagesRouteRoute.call({
            //     chatId,
            //     driverConfig: {
            //         type: 'openai',
            //         config: {
            //             model: 'gpt-4o'
            //         }
            //     }
            // });

            // const suggestedNextMessages = res.data?.suggestedNextMessages;

            // if (suggestedNextMessages){
            //     this.suggestedNextMessagesVar(suggestedNextMessages);
            // }
        }
    }

    async openChatDrawerWithContext(ac: ApolloClient<any>, ctx: ChatDrawerContextMessage){ 
        console.debug("openChatDrawerWithContext with context", ctx);
        var chatId = this.chatIdVar();

        if (!chatId){
            // Create a new chatroom
            const result = await ac.mutate({
                mutation: createChatFlatMutDoc,
                variables: {
                    objects: [
                        {
                            isPublic: false,
                        },
                    ],
                },
            });

            const resultChatId = result.data?.insertIntoChatCollection?.records?.[0]?.id;

            if (!resultChatId) {
                console.error("Failed to create new chatroom");
                return;
            }

            this.chatIdVar(resultChatId);
            chatId = resultChatId;
        }

        if (!chatId) {
            console.error("ChatId is not set");
            return;
        }

        await this.upsertContextMessage(ac, ctx);

        this.isOpenVar(true);
        
        await this.updateSuggestedMessages();
    }

    async openChatDrawerNewChat(ac: ApolloClient<any>, ctx: ChatDrawerContextMessage){
        console.debug("openChatDrawerNewChat with context", ctx);
        const result = await ac.mutate({
            mutation: createChatFlatMutDoc,
            variables: {
                objects: [
                    {
                        isPublic: false,
                    },
                ],
            },
        });

        const chatId = result.data?.insertIntoChatCollection?.records?.[0]?.id;

        if (!chatId) {
            throw new Error("Failed to create new chatroom");
        }

        this.chatIdVar(chatId);

        await this.upsertContextMessage(ac, ctx);

        this.isOpenVar(true);
        
        await this.updateSuggestedMessages();
    }
}

export const ChatDrawerState = new ChatDrawerStateClass();