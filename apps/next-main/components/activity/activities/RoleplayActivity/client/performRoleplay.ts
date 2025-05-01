import {z} from "zod";

import {aib} from "@/clientOnly/ai/aib";
import {trimAllLines} from "@lukebechtel/lab-ts-utils";
import {RoleplayActivityConfig} from "@reasonote/activity-definitions";

import {EphMessageWithCharacterInfo} from "../../../components/EphemeralChat";

export interface PerformRoleplayArgs {
    config: RoleplayActivityConfig
    messages: EphMessageWithCharacterInfo[];
}

export async function performRoleplay({messages, config}: PerformRoleplayArgs){
    try {
        // Combined approach: determine next speaker and generate message in one call
        const result = await aib.genObject({
            system: trimAllLines(`
                <TASK>
                You have two responsibilities:
                1. Determine which character should speak next in this roleplay
                2. Generate an authentic message from that character
                </TASK>

                <ROLEPLAY_CONTEXT>
                    <SETTING>
                        <NAME>${config.setting.name}</NAME>
                        <DESCRIPTION>${config.setting.description}</DESCRIPTION>
                    </SETTING>

                    <CHARACTERS>
                        ${config.characters.map(c => `
                            <CHARACTER>
                                <NAME>${c.public.name}</NAME>
                                <DESCRIPTION>${c.public.description}</DESCRIPTION>
                                <PERSONALITY>${c.private.personality}</PERSONALITY>
                                <MOTIVATION>${c.private.motivation}</MOTIVATION>
                            </CHARACTER>
                        `).join("\n\n")}
                    </CHARACTERS>

                    <CONVERSATION_HISTORY>
                        ${messages.map((m, index) => `
                            <MESSAGE index="${index}">
                                <SPEAKER>${m.characterName}</SPEAKER>
                                <CONTENT>${m.content}</CONTENT>
                            </MESSAGE>
                        `).join("\n")}
                    </CONVERSATION_HISTORY>
                </ROLEPLAY_CONTEXT>

                <INSTRUCTIONS>
                    <STEP>First, determine which character would most naturally speak next based on the conversation flow</STEP>
                    <STEP>Then, generate a message as that character, staying true to their personality and motivation</STEP>
                    <STEP>The character should respond authentically - if they wouldn't be helpful, DON'T BE HELPFUL</STEP>
                    <STEP>You can use emotes by italicizing them, and appropriate emojis for expressions</STEP>
                </INSTRUCTIONS>

                <EDGE_CASES>
                    <CASE>If multiple characters could reasonably speak next, choose the one who has spoken least recently</CASE>
                    <CASE>If a character would realistically remain silent in this situation, don't force them to speak</CASE>
                    <CASE>If the conversation has stalled, choose a character who would naturally move it forward</CASE>
                </EDGE_CASES>

                <OUTPUT_FORMAT>
                    You will output:
                    1. The exact name of the character who will speak next
                    2. The message content that character would say
                </OUTPUT_FORMAT>
            `),
            schema: z.object({
                characterToSpeak: z.string().describe("The EXACT name of the character that would most likely speak next."),
                messageContent: z.string().describe("The message that the character should speak, in their authentic voice."),
            }),
            model: "openai:gpt-4o-mini",
            mode: 'json',
            providerArgs: {
                structuredOutputs: true,
            },
        });

        return result.object;
    } catch (e) {
        console.error('Error performing roleplay:', e);
        return null;
    }
}