import {
  useEffect,
  useState,
} from "react";

import {
  GenerateRootDAGRoute,
} from "@/app/api/skills/generate_root_dag/routeSchema";
import {
  GenerateSkillModulesRoute,
} from "@/app/api/skills/generate_skill_modules/routeSchema";
import {useSkillModules} from "@/clientOnly/hooks/useSkillModules";
import {
  useSkillProcessingStatus,
} from "@/clientOnly/hooks/useSkillProcessingStatus";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  CheckCircle,
  ExpandLess,
  ExpandMore,
  RadioButtonUnchecked,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  styled,
  Typography,
} from "@mui/material";

// Styled component for tree item container with indent levels
const StyledTreeItem = styled(ListItem)<{ level: number }>(({ theme, level }) => ({
  paddingLeft: theme.spacing(2 * (level + 1)),
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

interface ModuleNode {
  id: string;
  _name: string;
  children_ids: string[] | null;
  position: number;
  root_skill_id: string | null;
  created_by: string | null;
  created_date: string;
  updated_by: string | null;
  updated_date: string;
  completed?: boolean;
  score?: number;
}

interface LessonNode {
  id: string;
  _name: string;
  root_skill_id: string | null;
  metadata: {
    [key: string]: any;
    expected_duration_minutes?: number;
  } | null;
  position?: number;
}

interface ModuleTreeViewProps {
  rootSkillId: string;
  loading?: boolean;
  error?: Error | null;
  activeModuleId?: string | null;
  activeLessonSkillId?: string | null;
  onModuleSelect?: (moduleId: string) => void;
  onLessonSelect?: (lessonSkillId: string) => void;
  selectedActionList?: React.ReactNode;
  lessonActionList?: React.ReactNode;
}

// Recursive tree node component
const TreeNode = ({
  node,
  level = 0,
  expandedNodes,
  setExpandedNodes,
  activeModuleId,
  activeLessonSkillId,
  onModuleSelect,
  onLessonSelect,
  childNodes,
  lessonNodes,
  loading,
  selectedActionList,
  lessonActionList
}: {
  node: ModuleNode;
  level?: number;
  expandedNodes: Set<string>;
  setExpandedNodes: (fn: (prev: Set<string>) => Set<string>) => void;
  activeModuleId?: string | null;
  activeLessonSkillId?: string | null;
  onModuleSelect?: (moduleId: string) => void;
  onLessonSelect?: (lessonSkillId: string) => void;
  childNodes: Map<string, ModuleNode>;
  lessonNodes: Map<string, LessonNode>;
  loading: boolean;
  selectedActionList?: React.ReactNode;
  lessonActionList?: React.ReactNode;
}) => {
  // Ensure node and children_ids exist before checking length
  const hasChildren = node?.children_ids && Array.isArray(node.children_ids) && node.children_ids.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isActive = node.id === activeModuleId;

  // Check if this node's children are lessons
  const childrenAreLessons = hasChildren && node.children_ids?.some(id => lessonNodes.has(id));

  // Toggle node expansion
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(node.id)) {
        newSet.delete(node.id);
      } else {
        newSet.add(node.id);
      }
      return newSet;
    });
  };

  // Handle node click to select
  const handleClick = () => {
    if (hasChildren) {
      if (isExpanded) {
        setExpandedNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(node.id);
          return newSet;
        });
      } else {
        setExpandedNodes(prev => {
          const newSet = new Set(prev);
          newSet.add(node.id);
          return newSet;
        });
      }
    }

    if (onModuleSelect) {
      onModuleSelect(node.id);
    }
  };

  // Handle lesson click
  const handleLessonClick = (lessonSkillId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLessonSelect) {
      onLessonSelect(lessonSkillId);
    }
  };

  // Determine the icon to show based on completion status
  const getStatusIcon = () => {
    if (node.completed) {
      return <CheckCircle fontSize="small" color="success" />;
    }
    if (node.score && node.score > 0.5) {
      return <CheckCircle fontSize="small" color="warning" />;
    }
    return <RadioButtonUnchecked fontSize="small" color="disabled" />;
  };

  return (
    <>
      <StyledTreeItem
        level={level}
        onClick={handleClick}
        selected={isActive}
        sx={{
          backgroundColor: isActive ? 'action.selected' : 'inherit',
          borderRadius: 1
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
          <Stack direction="row" alignItems="center">
            <ListItemIcon sx={{ minWidth: 32 }}>
              {getStatusIcon()}
            </ListItemIcon>

            <ListItemText
              primary={node._name}
              primaryTypographyProps={{
                variant: isActive ? 'body1' : 'body2',
                fontWeight: isActive ? 'bold' : 'normal'
              }}
              secondary={hasChildren ? `${node.children_ids?.length} ${childrenAreLessons ? 'Lessons' : 'Subtopics'}` : null}
            />
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            {isActive && selectedActionList}

            {hasChildren && (
              <IconButton
                edge="end"
                size="small"
                onClick={toggleExpand}
              >
                {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            )}
          </Stack>
        </Stack>
      </StyledTreeItem>

      {hasChildren && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {childrenAreLessons ? (
              // Render lessons
              node.children_ids
                ?.map(lessonId => {
                  const lesson = lessonNodes.get(lessonId);
                  if (!lesson) {
                    console.warn(`Lesson with ID ${lessonId} not found in lessonNodes map`);
                    return null;
                  }
                  return {
                    id: lessonId,
                    lesson,
                    position: lesson.position ?? Number.MAX_SAFE_INTEGER
                  };
                })
                .filter(item => item !== null)
                .sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0))
                .map(item => {
                  if (!item) return null;
                  const { id: lessonId, lesson } = item;
                  const isLessonSelected = lessonId === activeLessonSkillId;

                  return (
                    <StyledTreeItem
                      key={lessonId}
                      level={level + 1}
                      onClick={handleLessonClick(lessonId)}
                      selected={isLessonSelected}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: isLessonSelected ? 'action.selected' : 'inherit',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        borderRadius: 1
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                        <Stack direction="row" alignItems="center">
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <RadioButtonUnchecked fontSize="small" color="disabled" />
                          </ListItemIcon>
                          <ListItemText
                            primary={lesson._name}
                            primaryTypographyProps={{
                              variant: isLessonSelected ? 'body1' : 'body2',
                              fontWeight: isLessonSelected ? 'bold' : 'normal'
                            }}
                            secondary={lesson.metadata?.expected_duration_minutes ? `Expected Duration: ${lesson.metadata.expected_duration_minutes} min` : undefined}
                            secondaryTypographyProps={{
                              variant: 'caption',
                              color: 'text.secondary'
                            }}
                          />
                        </Stack>
                        {isLessonSelected && lessonActionList && (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {lessonActionList}
                          </Stack>
                        )}
                      </Stack>
                    </StyledTreeItem>
                  );
                })
            ) : (
              // Render submodules
              node.children_ids?.filter(childId => childNodes.has(childId))
                .map(childId => {
                  const childNode = childNodes.get(childId);
                  if (!childNode) {
                    console.warn(`Child node with ID ${childId} not found in childNodes map`);
                    return null;
                  }
                  return (
                    <TreeNode
                      key={childId}
                      node={childNode}
                      level={level + 1}
                      expandedNodes={expandedNodes}
                      setExpandedNodes={setExpandedNodes}
                      activeModuleId={activeModuleId}
                      activeLessonSkillId={activeLessonSkillId}
                      onModuleSelect={onModuleSelect}
                      onLessonSelect={onLessonSelect}
                      childNodes={childNodes}
                      lessonNodes={lessonNodes}
                      loading={loading}
                      selectedActionList={selectedActionList}
                      lessonActionList={lessonActionList}
                    />
                  );
                })
                .sort((a, b) => {
                  if (!a || !b) return 0;
                  const nodeA = childNodes.get(a.key as string);
                  const nodeB = childNodes.get(b.key as string);
                  if (!nodeA || !nodeB) return 0;
                  return nodeA.position - nodeB.position;
                })
            )}
          </List>
        </Collapse>
      )}
    </>
  );
};

export const ModuleTreeView = ({
  rootSkillId,
  loading: propsLoading,
  error: propsError,
  activeModuleId,
  activeLessonSkillId,
  onModuleSelect,
  onLessonSelect,
  selectedActionList,
  lessonActionList
}: ModuleTreeViewProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const { data: skillModulesData, loading, error, refetch } = useSkillModules({ skillId: rootSkillId });
  const { sb } = useSupabase();
  const {
    isProcessing,
    error: processingError,
    currentStep
  } = useSkillProcessingStatus({ skillId: rootSkillId });
  const [hasRefetched, setHasRefetched] = useState(false);

  useEffect(() => {
    console.log('skillModulesData', skillModulesData);
  }, [skillModulesData]);

  // Effect to refetch when processing completes
  useEffect(() => {
    if (currentStep === 'SUCCESS' && !hasRefetched) {
      setHasRefetched(true);
      refetch();
    }
  }, [currentStep, refetch, hasRefetched]);

  // Reset hasRefetched when processing starts again
  useEffect(() => {
    if (isProcessing) {
      setHasRefetched(false);
    }
  }, [isProcessing]);

  const handleGroupLessons = async () => {
    try {      
      // Create DAG if not already created or if it failed
      if (currentStep === null || currentStep === 'DAG_CREATION_FAILED') {
        await GenerateRootDAGRoute.call({ rootSkillId });
        await GenerateSkillModulesRoute.call({ rootSkillId });
      } 
      // If DAG is already generated or module creation failed, just create modules
      else if (currentStep === 'DAG_GENERATED' || currentStep === 'MODULE_CREATION_FAILED') {
        await GenerateSkillModulesRoute.call({ rootSkillId });
      }
    } catch (err) {
      console.error('Error in lesson processing:', err);
    }
  };

  if (propsLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (propsError || error) {
    return (
      <Typography color="error" sx={{ p: 2 }}>
        Failed to load module tree: {(propsError || error)?.message}
      </Typography>
    );
  }

  // Show loading state if processing is happening, regardless of existing data
  if (isProcessing) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ p: 2 }}>
        <Typography>
          {currentStep === 'CREATING_DAG' && 'Breaking down the document into topics...'}
          {currentStep === 'CREATING_MODULES' && 'Creating course structure...'}
          {currentStep === null && 'Initializing...'}
        </Typography>
        <CircularProgress size={24} />
      </Stack>
    );
  }

  // Show error state if processing failed, regardless of existing data
  if (processingError || currentStep === null || currentStep === 'DAG_CREATION_FAILED' || currentStep === 'MODULE_CREATION_FAILED' || currentStep === 'DAG_GENERATED') {
    return (
      <Stack spacing={2} alignItems="center" sx={{ p: 2 }}>
        <Alert severity={currentStep === 'DAG_GENERATED' ? "info" : "error"} sx={{ width: '100%' }}>
          {processingError || ((currentStep === 'DAG_CREATION_FAILED' || currentStep === null)
            ? 'Failed to extract topics from document'
            : currentStep === 'MODULE_CREATION_FAILED'
              ? 'Failed to create course structure from topics'
              : currentStep === 'DAG_GENERATED'
                ? 'Topics have been extracted. Now create your course structure.'
                : 'Processing failed')}
        </Alert>
        <Button
          variant="contained"
          onClick={handleGroupLessons}
          color="primary"
        >
          {currentStep === 'DAG_GENERATED' ? 'Create Course Structure' : 'Retry Processing'}
        </Button>
      </Stack>
    );
  }

  if (!skillModulesData?.modules.length) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ p: 2 }}>
        <Typography>No modules available.</Typography>
        <Button
          variant="contained"
          onClick={handleGroupLessons}
          disabled={isProcessing}
        >
          Create Module Structure
        </Button>
      </Stack>
    );
  }

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        height: '100%',
        overflow: 'auto',
        borderRadius: 2,
        maxHeight: '600px'
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Topics
        </Typography>
      </Box>

      <List dense disablePadding>
        {skillModulesData.modules.map(module => (
          <TreeNode
            key={module.id}
            node={module}
            expandedNodes={expandedNodes}
            setExpandedNodes={setExpandedNodes}
            activeModuleId={activeModuleId}
            activeLessonSkillId={activeLessonSkillId}
            onModuleSelect={onModuleSelect}
            onLessonSelect={onLessonSelect}
            childNodes={skillModulesData.moduleMap}
            lessonNodes={skillModulesData.lessonMap}
            loading={loading}
            selectedActionList={selectedActionList}
            lessonActionList={lessonActionList}
          />
        ))}
      </List>
    </Paper>
  );
}; 