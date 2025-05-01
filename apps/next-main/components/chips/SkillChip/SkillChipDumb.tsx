import {
  useRef,
  useState,
} from "react";

import {SkillFullIcon} from "@/components/skill/SkillAvatar";
import {
  AddCircle,
  Cancel,
  Check,
} from "@mui/icons-material";
import {
  Chip,
  ChipProps,
  CircularProgress,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {SkillLevel} from "@reasonote/core";

import {SkillLevelIndicatorDumb} from "./SkillChip";

export interface SkillChipDumbProps extends ChipProps {
    skillName: string;
    skillId?: string;
    onAddSkill?: (args: { topic: string }) => void;
    onRemoveSkill?: (args: { topic: string }) => void;
    onDetailsClick?: (args: { topic: string }) => void;
    disableAddDelete?: boolean;
    isAlreadyAdded?: boolean;
    isLoading?: boolean;
    hideLevelIndicator?: boolean;
    level?: SkillLevel | undefined;
    addSkillIconOverride?: React.ReactElement;
    onSimpleClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
    /**
     * Override the emoji displayed for this skill
     */
    emojiOverride?: string | null;
    /**
     * Whether the emoji is currently loading
     */
    emojiLoadingOverride?: boolean;
  }
  
  export function SkillChipDumb({
    onAddSkill,
    onRemoveSkill,
    disableAddDelete,
    isAlreadyAdded,
    isLoading,
    onDetailsClick,
    hideLevelIndicator,
    level,
    skillName,
    skillId,
    addSkillIconOverride,
    onSimpleClick,
    emojiOverride,
    emojiLoadingOverride,
    ...rest
  }: SkillChipDumbProps) {
    const theme = useTheme();
    const [wasClickedRecently, setWasClickedRecently] = useState(false);
    const [chipIsHovered, setChipIsHovered] = useState(false);
  
    const timeout = useRef(null as any);
  
    const onAddClick = () => {
      if (disableAddDelete) return;
      
      setWasClickedRecently(true);
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        setWasClickedRecently(false);
      }, 1000);
    };

    // Determine text size based on length
    const getTextSize = () => {
      if (!skillName) return '0.875rem'; // Default body2
      
      if (skillName.length > 40) return '0.75rem';  // xs
      if (skillName.length > 30) return '0.8125rem'; // smaller
      return '0.875rem'; // Default body2
    };
  
    return (
      <div
        onMouseEnter={() => setChipIsHovered(true)}
        onMouseLeave={() => setChipIsHovered(false)}
        style={{ width: '100%' }}
      >
        <Chip
          size="medium"
          icon={
            <Stack direction="row" gap={1} flexShrink={0}>
              {emojiLoadingOverride ? (
                <CircularProgress size={20} />
              ) : emojiOverride ? (
                <div>{emojiOverride}</div>
              ) : (
                <SkillFullIcon skillId={skillId ?? ''} />
              )}
              {!hideLevelIndicator && <SkillLevelIndicatorDumb level={level} />}
            </Stack>
          }
          label={
            <Typography
              variant="body2"
              component="span"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-word',
                lineHeight: '1.2em',
                maxHeight: '2.4em',
                fontSize: getTextSize(),
                width: '100%',
                paddingRight: '12px'
              }}
            >
              {skillName || 'Unnamed Skill'}
            </Typography>
          }
          onDelete={disableAddDelete ? undefined : () => {
            if (!skillName) return;
            
            onAddClick();
            
            if (isAlreadyAdded) {
              onRemoveSkill?.({ topic: skillName });
            } else {
              onAddSkill?.({ topic: skillName });
            }
          }}
          onClick={onSimpleClick}
          deleteIcon={
            <Stack className="rsn-skill-chip-add-button" flexShrink={0}>
              {isLoading ? (
                <CircularProgress size={20} />
              ) :
                isAlreadyAdded ? (
                  <Tooltip title="Remove From Skill Library" enterDelay={1000}>
                    {onSimpleClick && chipIsHovered ? <Cancel /> : <Check />}
                  </Tooltip>
                ) : (
                  <Tooltip title="Add To Skill Library" enterDelay={1000}>
                    {
                        addSkillIconOverride ? addSkillIconOverride : <AddCircle />
                    }
                  </Tooltip>
                )
              }
            </Stack>
          }
          {...rest}
          sx={{
            maxWidth: '100%',
            width: '100%',
            height: 'auto',
            minHeight: '32px',
            whiteSpace: 'normal',
            boxSizing: 'border-box',
            paddingRight: 1,
            '& .MuiChip-label': {
              display: 'block',
              whiteSpace: 'normal',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              padding: '6px 8px 6px 0',
              width: 'calc(100% - 16px)',
              flexGrow: 1
            },
            '& .MuiChip-icon': {
              marginLeft: 1,
              marginRight: 0
            },
            '& .MuiChip-deleteIcon': {
              marginLeft: 0,
              marginRight: 0,
              color: isAlreadyAdded
                ? wasClickedRecently
                  ? theme.palette.gray.main
                  : onSimpleClick && chipIsHovered
                  ? theme.palette.gray.dark
                  : theme.palette.primary.main
                : onSimpleClick && chipIsHovered
                ? theme.palette.primary.main
                : "#fcfcfc",
              "&:hover": {
                color: isAlreadyAdded
                  ? theme.palette.gray.dark
                  : theme.palette.primary.main,
              },
            },
            backgroundColor: isAlreadyAdded
              ? wasClickedRecently
                ? theme.palette.primary.light
                : theme.palette.gray.dark
              : theme.palette.gray.main,
            "&:hover": onSimpleClick ? {
              backgroundColor: isAlreadyAdded
                ? theme.palette.gray.main
                : theme.palette.gray.dark,
            } : {},
            ...rest?.sx,
          }}
        />
      </div>
    );
  }
