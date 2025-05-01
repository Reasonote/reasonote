'use client'

import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle,
  ExpandLess,
  ExpandMore,
  RadioButtonUnchecked,
} from "@mui/icons-material";
import {
  Alert,
  Box,
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
import {SimpleSkillTreeNode} from "@reasonote/lib-ai-common";
import {SkillFlatFragFragment} from "@reasonote/lib-sdk-apollo-client";
import {
  UseFragmentDataLoaderResult,
  useSkillFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";

interface SkillNode {
  id: string;
  name: string;
  children?: SkillNode[];
  completed?: boolean;
  score?: number;
}

interface SkillTreeViewProps {
  skillTree: SimpleSkillTreeNode; // From useSkillSimpleTree
  loading?: boolean;
  error?: Error | null;
  activeSkillId?: string;
  onSkillSelect?: (skillId: string) => void;
  selectedActionList?: React.ReactNode; // New prop for actions to show when a skill is selected
}

// Styled component for tree item container with indent levels
const StyledTreeItem = styled(ListItem)<{ level: number }>(({ theme, level }) => ({
  paddingLeft: theme.spacing(2 * (level + 1)),
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

// Skill item component that fetches and displays skill details
const SkillItem = ({ 
  skillId, 
  isActive, 
  fallbackName, 
  getChildren 
}: { 
  skillId: string;
  isActive?: boolean;
  fallbackName: string;
  getChildren?: (skillFrag: UseFragmentDataLoaderResult<SkillFlatFragFragment>) => React.ReactNode;
}) => {
  const result = useSkillFlatFragLoader(skillId);
  
  return (
    <ListItemText 
      primary={result.data?.name || fallbackName}
      primaryTypographyProps={{ 
        variant: isActive ? 'body1' : 'body2',
        fontWeight: isActive ? 'bold' : 'normal'
      }}
      secondary={getChildren ? getChildren(result) : result.data?.description}
    />
  );
};

// Recursive tree node component
const TreeNode = ({ 
  node, 
  level = 0, 
  expandedNodes, 
  setExpandedNodes,
  activeSkillId,
  onSkillSelect,
  selectedActionList
}: { 
  node: SkillNode; 
  level?: number; 
  expandedNodes: Set<string>;
  setExpandedNodes: (fn: (prev: Set<string>) => Set<string>) => void;
  activeSkillId?: string;
  onSkillSelect?: (skillId: string) => void;
  selectedActionList?: React.ReactNode;
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isActive = node.id === activeSkillId;

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
    // If the node has children and is not expanded, expand it
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
    
    if (onSkillSelect) {
      onSkillSelect(node.id);
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
            
                <SkillItem 
                  skillId={node.id}
                  isActive={isActive}
                  fallbackName={node.name}
                  getChildren={(skillFrag: UseFragmentDataLoaderResult<SkillFlatFragFragment>) => {
                    return hasChildren ? `${node.children?.length} Subtopics` : null
                  }}
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
        <>
          
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List disablePadding>
              {node.children?.map(child => (
              <TreeNode 
                key={child.id} 
                node={child} 
                level={level + 1} 
                expandedNodes={expandedNodes}
                setExpandedNodes={setExpandedNodes}
                activeSkillId={activeSkillId}
                onSkillSelect={onSkillSelect}
                selectedActionList={selectedActionList}
              />
            ))}
            </List>
          </Collapse>
        </>
      )}
    </>
  );
};

export const SkillTreeView = ({ 
  skillTree, 
  loading, 
  error,
  activeSkillId,
  onSkillSelect,
  selectedActionList
}: SkillTreeViewProps) => {
  // Track expanded nodes
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

  // Auto expand the first node
  useEffect(() => {
    if (skillTree && skillTree.upstream_skills.length > 0 && !hasAutoExpanded) {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.add(skillTree.skill_id);
        setHasAutoExpanded(true);
        return newSet;
      });
    }
  }, [skillTree]);

  // Transform skill tree data from useSkillSimpleTree into the format we need
  const transformSkillNode = (node: any): any => {
    if (!node) return null;
    return {
      id: node.skill_id,
      name: node.skill_name,
      completed: false,
      score: 0,
      children: node.upstream_skills?.map((child: any) => transformSkillNode(child)) || []
    };
  };

  const transformedTree = skillTree ? transformSkillNode(skillTree) : null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load skill tree: {error.message}
      </Alert>
    );
  }

  if (!transformedTree) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No skill tree data available.
      </Alert>
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
        <TreeNode 
          node={transformedTree} 
          expandedNodes={expandedNodes}
          setExpandedNodes={setExpandedNodes}
          activeSkillId={activeSkillId}
          onSkillSelect={onSkillSelect}
          selectedActionList={selectedActionList}
        />
      </List>
    </Paper>
  );
}; 