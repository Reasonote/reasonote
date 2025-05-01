
import {
  PushPin,
  PushPinOutlined,
} from "@mui/icons-material";
import {
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";

export interface PinnedSkillIconButtonDumbProps {
    pinState?: 'pinned-direct' | 'pinned-indirect';
    disabled?: boolean;
    onPin?: () => void;
    onUnpin?: () => void;
    tooltipOverride?: string;
}


export function PinnedSkillIconButtonDumb({disabled, pinState, tooltipOverride, onPin, onUnpin}: PinnedSkillIconButtonDumbProps) {
    const theme = useTheme();
    const isPinned = pinState === 'pinned-direct' || pinState === 'pinned-indirect';
    const isDirectlyPinned = pinState === 'pinned-direct';
    const isIndirectlyPinned = pinState === 'pinned-indirect';

    return <Tooltip title={tooltipOverride ?? (
        isPinned ? (
            isDirectlyPinned ? 
            "Unpin Skill" : 
            "Pin Skill"
        )
        : "Pin Skill")}>
        <IconButton
            // color={isPinned ? "primary" : "default"}
            disabled={disabled}
            size="small"
            // color={isDirectlyPinned ? "primary" : "default"}
            sx={{opacity: isIndirectlyPinned ? .5 : 1}}
            onClick={() => {
                if (isPinned) {
                    onUnpin?.();
                }
                else{
                    onPin?.();
                }
            }}
        >
            {
                isPinned ?
                    <PushPin htmlColor={disabled ? "gray" : theme.palette.primary.main}/>
                    :
                    <PushPinOutlined htmlColor="gray" sx={{opacity: .5}}/>
            }
        </IconButton>
    </Tooltip>
}