import {
  Avatar,
  AvatarProps,
  useTheme,
} from "@mui/material";

import {
  SkillFullIcon,
  SkillFullIconProps,
} from "./SkillAvatar";

interface SkillEmojiAvatarProps extends AvatarProps {
    skillId: string;
    skillFullIconProps?: Partial<SkillFullIconProps>;
    size?: number | string;
    emojiSizeRatio?: number; // New prop to control emoji size relative to avatar size
}

export function SkillEmojiAvatar({ 
    skillId, 
    skillFullIconProps, 
    size, 
    emojiSizeRatio = 0.6, // Default ratio
    ...rest 
}: SkillEmojiAvatarProps) {
    const theme = useTheme();
    const avatarStyle = size ? { width: size, height: size } : {};
    const iconStyle = size ? { 
        fontSize: `${Number(size) * emojiSizeRatio}px`,
        lineHeight: 1, // Ensure the emoji is vertically centered
    } : {};

    return (
        <Avatar style={avatarStyle} {...rest} sx={{ backgroundColor: theme.palette.gray.light, '&:hover': { backgroundColor: theme.palette.gray.main } }}>
            <SkillFullIcon skillId={skillId} style={iconStyle} {...skillFullIconProps} />
        </Avatar>
    );
}