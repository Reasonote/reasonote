import {useState} from "react";

import {
  Headphones,
  Trash2,
} from "lucide-react";
import {useRouter} from "next/navigation";
import {
  Handle,
  Position,
} from "reactflow";

import {IconBtn} from "@/components/buttons/IconBtn";
import {SkillIcon} from "@/components/icons/SkillIcon";
import {
  AccountTree,
  Add,
  AutoFixHigh,
} from "@mui/icons-material";
import {
  Badge,
  Box,
  Button,
  ClickAwayListener,
  Divider,
  IconButton,
  Paper,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

import {getColorForScore} from "./helpers";
import {
  NODE_WIDTH,
  SkillTreeV2GraphNodeDataSkill,
} from "./interfaces";

interface AddSkillTooltipProps {
  onClose: () => void;
  onManualAdd: (skillName: string) => void;
  onAutoGenerate: (e: React.MouseEvent) => void;
  parentSkillId: string;
  isDeepening: boolean;
}

const getHighlightColor = (isMainSelected: boolean) => {
  const theme = useTheme();
  return isMainSelected
    ? theme.palette.primary.main
    : theme.palette.primary.light;
};

const AddSkillTooltip = ({ onClose, onManualAdd, onAutoGenerate, parentSkillId, isDeepening }: AddSkillTooltipProps) => {
  const [skillName, setSkillName] = useState('');

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillName.trim()) {
      onManualAdd(skillName.trim());
      setSkillName('');
    }
  };

  return (
    <ClickAwayListener onClickAway={onClose}>
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: '-120px',
          left: '50%',
          transform: 'translateX(-50%)',
          p: 2,
          zIndex: 1000,
          width: '300px',
        }}
      >
        <Stack spacing={1}>
          <TextField
            autoFocus
            size="small"
            placeholder="Type skill name and press Enter"
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
          />
          <Button
            startIcon={<AutoFixHigh />}
            variant="outlined"
            onClick={onAutoGenerate}
            fullWidth
            disabled={isDeepening}
          >
            Auto-generate skills
          </Button>
        </Stack>
      </Paper>
    </ClickAwayListener>
  );
};

export const CustomNode = ({ data }: { data: SkillTreeV2GraphNodeDataSkill }) => {
  const theme = useTheme();
  const router = useRouter();

  const isHorizontal = data.rankDir === 'LR';

  const handleCreateLesson = (e) => {
    e.stopPropagation();
    data.onCreateLesson?.(data.id);
  };

  const handleStartPodcast = (e) => {
    e.stopPropagation();
    data.onPodcast?.(data.id);
  };

  const handleStartPractice = (e) => {
    e.stopPropagation();
    data.onPractice?.(data.id);
  };

  const handleDeepenTree = async (e) => {
    e.stopPropagation();
    data.onDeepen?.(data.id);
  }

  const handleCollapse = (e) => {
    e.stopPropagation();
    data.onToggleCollapse?.(data.id);
  };

  const normalizedScore = data.score ?? 0;
  const showScore = !isNaN(normalizedScore) && normalizedScore !== null;
  const backgroundColor = showScore && data.activityCount && data.activityCount > 0 && data.score ? getColorForScore(data.score) : theme.palette.gray.dark;

  const totalChildCount = data.totalChildCount || 0;

  const isChildOfSelected = data.parentIds?.includes(data.selectedNodeId ?? '') && !data.isCollapsed;
  const highlightColor = getHighlightColor(data.selected);

  const [showAddSkillTooltip, setShowAddSkillTooltip] = useState(false);

  const handleManualAddSkill = async (skillName: string) => {
    await data.onAddSubskillByName?.(skillName, data.id);
  };

  const handleAutoGenerateSkills = async (e) => {
    e.stopPropagation();
    await handleDeepenTree(e);
    setShowAddSkillTooltip(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    data.onDelete?.(data.id);
  };

  const isDeepening = !!data.isDeepening;

  const [deleteAnchorEl, setDeleteAnchorEl] = useState<HTMLElement | null>(null);

  const handleDeleteClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setDeleteAnchorEl(event.currentTarget);
  };

  const handleDeleteCancel = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setDeleteAnchorEl(null);
  };

  const handleDeleteConfirm = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setDeleteAnchorEl(null);
    handleDelete(event);
  };

  return (
    <div style={{ position: 'relative' }}>
      <Handle type="target" position={isHorizontal ? Position.Left : Position.Top} />
      {data.selected && (
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: theme.palette.gray.light,
          borderRadius: '20px',
          padding: '5px 10px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          zIndex: 10,
        }}>
          {/* <Tooltip title="Start lesson">
            <IconButton onClick={handleCreateLesson} size="small">
              <LessonIcon />
            </IconButton>
          </Tooltip> */}
          <Tooltip title="Start Practice">  
            <IconButton onClick={handleStartPractice} size="small">  
              <SkillIcon sx={{width: 20, height: 20}} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Start podcast">
            <IconButton onClick={handleStartPodcast} size="small">
              <Headphones size={20} />
            </IconButton>
          </Tooltip>
          {data.canEdit && (
            <>
              <Tooltip title="Add Skills">
                <IconBtn
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddSkillTooltip(true);
                  }}
                  size="small"
                  isWorking={isDeepening}
                >
                  <AccountTree />
                </IconBtn>
              </Tooltip>
              <div style={{ width: '10px' }} />
              <Divider orientation="vertical" flexItem />
              <div style={{ width: '10px' }} />
              <Tooltip title={data.id === data.rootSkillId ? "Cannot delete root skill" : "Delete"}>
                <span>
                  <IconBtn 
                    onClick={data.id === data.rootSkillId ? undefined : handleDeleteClick} 
                    size="small"
                    disabled={data.id === data.rootSkillId}
                  >
                    <Trash2 color={data.id === data.rootSkillId ? theme.palette.gray.main : theme.palette.text.primary} />
                  </IconBtn>
                </span>
              </Tooltip>
            </>
          )}
          <Popover
            open={Boolean(deleteAnchorEl)}
            anchorEl={deleteAnchorEl}
            onClose={handleDeleteCancel}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
            PaperProps={{
              sx: {
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                borderRadius: '8px',
              }
            }}
          >
            <Box sx={{ p: 2.5, maxWidth: 280 }}>
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                  }}
                >
                  Are you sure you want to delete <br /><b>"{data.label}"</b> <br />{data.totalChildCount > 0 ? `and all ${data.totalChildCount} subskills` : ''}?
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.error.main,
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  This action cannot be undone.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  onClick={handleDeleteCancel}
                  sx={{
                    color: theme.palette.gray.main,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                    textTransform: 'uppercase',
                    minWidth: '80px',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  onClick={handleDeleteConfirm}
                  startIcon={<Trash2 size={16} />}
                  sx={{
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    minWidth: '80px',
                  }}
                  color="error"
                  variant="contained"
                >
                  Delete
                </Button>
              </Stack>
            </Box>
          </Popover>
          {/* {showScore && data.activityCount && data.activityCount > 0 && data.score && (
              <CircularScoreIndicator score={data.score * 100} size={24} />
            )} */}
        </div>
      )}
      <div
        style={{
          width: NODE_WIDTH,
          padding: '10px',
          borderRadius: '5px',
          background: backgroundColor,
          color: theme.palette.text.primary,
          fontSize: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: (data.selected || isChildOfSelected) ? '1px solid #ddd' : '1px solid transparent',
          boxShadow: (data.selected || isChildOfSelected)
            ? `0 0 5px 5px ${highlightColor}`
            : 'none',
          minHeight: '60px',
          position: 'relative',
        }}
        onClick={(e) => {
          e.stopPropagation();
          data.onClick?.(data.id);
        }}
      >
        <div style={{
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          {data.label}
        </div>

        {data.hasChildren && data.id !== data.rootSkillId && (
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}>
            <Badge
              badgeContent={totalChildCount}
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  right: -3,
                  top: 0,
                  opacity: data.isCollapsed ? 1.0 : 0.0,
                },

              }}
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  console.debug('toggle collapse', data.id, data.isCollapsed)
                  data.onToggleCollapse?.(data.id);
                }}
                sx={{
                  backgroundColor: theme.palette.gray.light,
                  '&:hover': {
                    backgroundColor: theme.palette.gray.main,
                  },
                  transform: data.isCollapsed ? 'none' : 'rotate(45deg)',
                  transition: 'transform 0.2s',
                }}
              >
                <Add fontSize="small" />
              </IconButton>
            </Badge>
          </div>
        )}
      </div>
      <Handle type="source" position={isHorizontal ? Position.Right : Position.Bottom} />
      {showAddSkillTooltip && data.canEdit && (
        <AddSkillTooltip
          onClose={() => setShowAddSkillTooltip(false)}
          onManualAdd={handleManualAddSkill}
          onAutoGenerate={handleAutoGenerateSkills}
          parentSkillId={data.id}
          isDeepening={!!data.isDeepening}
        />
      )}
    </div>
  );
};