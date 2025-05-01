import {PropsOf} from "@emotion/react";
import {isEmoji} from "@reasonote/core";

import {SkillIcon} from "../icons/SkillIcon";

export interface SkillFullIconDumbProps extends PropsOf<typeof SkillIcon> {
  /** The emoji to display, if any */
  emoji?: string | null;
}

export function SkillFullIconDumb({
  emoji,
  ...rest
}: SkillFullIconDumbProps) {
  return emoji && isEmoji(emoji) ? (
    <>{emoji}</>
  ) : (
    <SkillIcon fontSize="small"
      data-testid="skill-icon"
      {...rest}
    />
  );
} 