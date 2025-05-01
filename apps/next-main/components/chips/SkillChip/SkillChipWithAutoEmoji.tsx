import {useState} from "react";

import {z} from "zod";

import {aib} from "@/clientOnly/ai/aib";
import {
  Chip,
  ChipProps,
  CircularProgress,
} from "@mui/material";
import {
  useAsyncEffect,
  useStateWithRef,
} from "@reasonote/lib-utils-frontend";

export interface SimpleSkillChipWithAutoEmojiProps extends ChipProps {
  skillName: string;
}

export function SimpleSkillChipWithAutoEmoji({skillName, ...rest}: SimpleSkillChipWithAutoEmojiProps) {
    const [emoji, setEmoji] = useState<string | null>(null);
    const [generationState, setGenerationState, generationStateRef] = useStateWithRef<'idle' | 'generating' | 'generated'>('idle');

    useAsyncEffect(async () => {
        if (generationStateRef.current === 'generating' || generationStateRef.current === 'generated') {
            return;
        }

        setGenerationState('generating');
        const result = await aib.genObject({
            prompt: `
            Output a single-character emoji that represents this skill best: "${skillName}"

            <EXAMPLES>
                
                <GOOD_EXAMPLE>
                    <INPUT>Output a single-character emoji that represents this skill best: "Cooking"</INPUT>
                    <OUTPUT>🍳</OUTPUT>
                </GOOD_EXAMPLE>
                
                <GOOD_EXAMPLE>
                    <INPUT>Output a single-character emoji that represents this skill best: "Painting"</INPUT>
                    <OUTPUT>🎨</OUTPUT>
                </GOOD_EXAMPLE>
                
                <GOOD_EXAMPLE>
                    <INPUT>Output a single-character emoji that represents this skill best: "Coding"</INPUT>
                    <OUTPUT>💻</OUTPUT>
                </GOOD_EXAMPLE>
                
                <GOOD_EXAMPLE>
                    <INPUT>Output a single-character emoji that represents this skill best: "Gardening"</INPUT>
                    <OUTPUT>🌱</OUTPUT>
                </GOOD_EXAMPLE>
                
                <GOOD_EXAMPLE>
                    <INPUT>Output a single-character emoji that represents this skill best: "Writing"</INPUT>
                    <OUTPUT>✍️</OUTPUT>
                </GOOD_EXAMPLE>
            </EXAMPLES>

            `,
            functionName: 'outputEmoji',
            functionDescription: 'Output a single-character emoji that represents this skill best',
            schema: z.object({
                emoji: z.string(),
            }),
            // llama3-8b is bad here.
            models: ['openai:fastest'],
            // maxFeedbackLoops: 1,
        });

        setEmoji(result.object.emoji);
        setGenerationState('generated');
    }, [skillName, generationStateRef]);

    return <Chip icon={
        generationState === 'generating' ? <CircularProgress size={10} /> : <div>{emoji}</div>
    } label={skillName} {...rest} />
}