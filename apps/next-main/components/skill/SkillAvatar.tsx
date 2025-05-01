import {z} from "zod";

import {aib} from "@/clientOnly/ai/aib";
import {PropsOf} from "@emotion/react";
import {isEmoji} from "@reasonote/core";
import {useSkillFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {useSupabase} from "../supabase/SupabaseProvider";
import {SkillFullIconDumb} from "./SkillFullIconDumb";

export interface SkillFullIconProps extends PropsOf<typeof SkillFullIconDumb> {
  skillId: string;
}

export function SkillFullIcon({skillId, ...rest}: SkillFullIconProps) {
  const {data: skill, loading: skillLoading, refetch} = useSkillFlatFragLoader(skillId);
  const {sb} = useSupabase();

  // When this skill loads, if it doesn't have an emoji,
  // try to create one with a fast ai.
  useAsyncEffect(async () => {
    const skillName = skill?.name;
    const skillEmoji = skill?.emoji;
    if (!skillLoading && !skillEmoji && skillName) {
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
        models: ['openai:fastest'],
      });

      if (result.object.emoji.length > 0 && isEmoji(result.object.emoji)) {
        await sb.from('skill').update({
          emoji: result.object.emoji
        }).eq('id', skillId).single();

        await refetch();
      }

      await refetch();
    }
  }, [skillId, skillLoading]);

  return <SkillFullIconDumb emoji={skill?.emoji} {...rest} />;
}