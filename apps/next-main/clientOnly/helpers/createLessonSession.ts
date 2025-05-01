"use client";
import { ApolloClient } from "@apollo/client";
import { createLessonSessionFlatMutDoc } from "@reasonote/lib-sdk-apollo-client";

interface CreateLessonSessionOptions {
    lessonId: string;
    rsnUserId: string;
    ac: ApolloClient<any>;
}

export async function createLessonSession({ 
    lessonId, 
    rsnUserId,
    ac
}: CreateLessonSessionOptions) {
    try {
        const sessionCreateRes = await ac.mutate({
            mutation: createLessonSessionFlatMutDoc,
            variables: {
                objects: [
                    {
                        lesson: lessonId,
                        user: rsnUserId,
                    }
                ]
            }
        });

        const sessionId = sessionCreateRes.data?.insertIntoLessonSessionCollection?.records?.[0]?.id;
        if (!sessionId) {
            console.error("Failed to create lesson session");
            return;
        }

        return sessionId;
    } catch (error) {
        console.error('Error creating lesson session:', error);
        throw error;
    }
} 