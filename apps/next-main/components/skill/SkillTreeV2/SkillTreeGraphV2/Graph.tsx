import "reactflow/dist/style.css";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {useRouter} from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Handle,
  MarkerType,
  Position,
  ReactFlowInstance,
} from "reactflow";

import {
  FillSubskillTreeRoute,
} from "@/app/api/skills/fill_subskill_tree/routeSchema";
import {
  useSkillEditPermissions,
} from "@/clientOnly/hooks/useSkillEditPermissions";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import Dagre from "@dagrejs/dagre";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  Add,
  SwapHoriz,
  SwapVert,
} from "@mui/icons-material";
import {
  IconButton,
  Theme,
  Tooltip,
  useTheme,
  Zoom,
} from "@mui/material";
import {
  SkillTree,
  SkillTreeNode,
} from "@reasonote/core";

import {SkillTreeV2Props} from "../SkillTreeV2";
import {CustomNode} from "./GraphNode";
import {getColorForScore} from "./helpers";
import {
  MAX_INITIAL_CHILDREN,
  NODE_HEIGHT,
  NODE_WIDTH,
  SkillTreeV2GraphNode,
} from "./interfaces";

const getEdgeStyle = (isSelected: boolean, theme: Theme) => ({
  stroke: isSelected ? theme.palette.primary.main : '#b1b1b7',
  strokeWidth: isSelected ? 2 : 1,
});

const CircularScoreIndicator = ({ score, size }) => {
  const normalizedScore = score > 1 ? score : score * 100;
  const strokeDasharray = 2 * Math.PI * (size / 2 - 2);
  const strokeDashoffset = isNaN(normalizedScore) ? 1 : strokeDasharray * (1 - normalizedScore / 100);
  const color = getColorForScore(score);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: `${size * 0.4}px`,
        fontWeight: 'bold',
        color: 'white',
      }}>
        {isNaN(normalizedScore) ? '?' : Math.round(normalizedScore)}
      </div>
    </div>
  );
};

const ShowMoreNode = ({ data }) => {
  const theme = useTheme();
  const isHorizontal = data.rankDir === 'LR';

  return (
    <div style={{ position: 'relative' }}>
      <Handle type="target" position={isHorizontal ? Position.Left : Position.Top} />
      <div
        style={{
          width: NODE_WIDTH,
          padding: '10px',
          borderRadius: '5px',
          background: theme.palette.gray.light,
          color: theme.palette.text.primary,
          fontSize: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          minHeight: '60px',
        }}
        onClick={(e) => {
          e.stopPropagation();
          data.onShowMore?.();
        }}
      >
        <div style={{
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          Show {data.remainingCount} more...
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
  showMore: ShowMoreNode,
};


const getLayoutedElements = (nodes: SkillTreeV2GraphNode[], edges: Edge[], rankDir: 'TB' | 'LR' = 'TB') => {
  const dagreGraph = new Dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = rankDir === 'LR';
  dagreGraph.setGraph({
    rankdir: rankDir,
    nodesep: isHorizontal ? 80 : 50,  // Space between nodes in same rank
    ranksep: isHorizontal ? 50 : 80,  // Space between ranks
    align: 'DL',  // Down-left alignment
    ranker: 'network-simplex',  // Better for trees
    marginx: 20,
    marginy: 20,
  });

  // Only add non-collapsed nodes and their edges to the graph
  const visibleNodes = nodes.filter(node => {
    if (node.data.type === 'showMore') return true;
    return !node.data.isHidden;
  });
  const visibleNodeIds = new Set(visibleNodes.map(node => node.id));

  const visibleEdges = edges.filter(edge =>
    visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
  );

  visibleNodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT
    });
  });

  // Add edges with equal weight to maintain symmetry
  visibleEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target, {
      weight: 1,
      minlen: 1,
    });
  });

  Dagre.layout(dagreGraph);

  // Get graph dimensions after layout
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const layoutedNodes = nodes.map(node => {
    if (node.data.type === 'showMore') return node;



    const nodeWithPosition = dagreGraph.node(node.id);
    const x = nodeWithPosition.x - NODE_WIDTH / 2;
    const y = nodeWithPosition.y - NODE_HEIGHT / 2;

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x + NODE_WIDTH);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y + NODE_HEIGHT);

    return {
      ...node,
      position: { x, y },
      data: {
        ...node.data,
        rankDir
      }
    };
  });

  // Calculate actual dimensions with minimal padding
  const graphWidth = maxX - minX + 40;
  const graphHeight = maxY - minY + 40;

  return {
    nodes: layoutedNodes,
    edges: visibleEdges,
    dimensions: {
      width: graphWidth,
      height: graphHeight
    }
  };
};

export interface SkillTreeGraphV2ExtraProps {
  skillTreeData?: SkillTree,
  refetch?: () => void,
  width?: number;
  rootSkillId: string;
  height?: number;
  /** Optional React elements to be displayed in the right side of the header */
  rightHeaderExtras?: React.ReactNode;
}

export function SkillTreeGraphV2({
  skillTreeData,
  rootSkillId,
  showActivityCount,
  showScore,
  width,
  height,
  refetch,
  onPodcastOverride,
  onCreateLessonOverride,
  rightHeaderExtras,
}: SkillTreeV2Props & SkillTreeGraphV2ExtraProps) {
  const theme = useTheme();
  const [nodes, setNodes] = useState<SkillTreeV2GraphNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const nodesRef = useRef<SkillTreeV2GraphNode[]>([]);
  const [showAllRootChildren, setShowAllRootChildren] = useState(false);
  const [graphDimensions, setGraphDimensions] = useState({ width: 0, height: 0 });
  const [rankDir, setRankDir] = useState<'LR' | 'TB'>('TB');
  const [key, setKey] = useState(0);
  const [showLayoutHint, setShowLayoutHint] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  /**What nodes are we deepening? */
  const [nodesDeepening, setNodesDeepening] = useState<Set<string>>(new Set());
  const { sb } = useSupabase();
  const { checkSkillEditPermissions } = useSkillEditPermissions();
  // Add a ref to track previous node count
  const prevNodeCount = useRef(0);
  const [canEdit, setCanEdit] = useState(true);

  // Add this near the other refs
  const seenNodeIds = useRef<Set<string>>(new Set());

  // At the beginning, all nodes but root are collapsed
  useEffect(() => {
    if (skillTreeData && !hasInitialized) {
      const allSkillsButRoot = skillTreeData.skills?.filter(skill => skill.id !== rootSkillId).map(skill => skill.id);
      setCollapsedNodes(new Set(allSkillsButRoot));
      setHasInitialized(true);
    }
  }, [skillTreeData, hasInitialized]);

  // Update the useEffect that checks course access
  useEffect(() => {
    const checkAccess = async () => {
      if (!rootSkillId) return;

      const { canEdit } = await checkSkillEditPermissions(rootSkillId);
      setCanEdit(canEdit);
    };

    checkAccess();
  }, [rootSkillId, checkSkillEditPermissions]);

  useEffect(() => {
    // Hide the hint after 10 seconds
    const timer = setTimeout(() => {
      setShowLayoutHint(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const router = useRouter();


  const centerOnNode = useCallback((nodeId: string) => {
    if (!reactFlowInstance.current) return;

    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;

    // Get the current viewport
    const { zoom } = reactFlowInstance.current.getViewport();

    // Center on the node with animation
    reactFlowInstance.current.setCenter(
      node.position.x + NODE_WIDTH / 2,
      node.position.y + NODE_HEIGHT / 2,
      { zoom, duration: 800 }
    );
  }, []);

  const onAddSubskillByName = useCallback(async (skillName: string, parentId: string) => {
    try {
      // Uncollapse the parent node
      setCollapsedNodes(prev => {
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });


      // Create the skill in the database
      const { data: newSkill, error: skillError } = await sb
        .from('skill')
        .insert([{
          _name: skillName,
        }])
        .select('id')
        .single();

      if (skillError || !newSkill) {
        throw new Error(skillError?.message || 'Failed to create skill');
      }

      // Create the link
      const { error: linkError } = await sb
        .from('skill_link')
        .insert([{
          downstream_skill: parentId,
          upstream_skill: newSkill.id,
          metadata: {
            levelOnParent: "INTRO"
          }
        }]);

      if (linkError) {
        throw new Error(linkError.message);
      }

      await refetch?.();
    } catch (e) {
      console.error('Error adding subskill by name', e);
    }
  }, []);

  const onDelete = useCallback(async (skillId: string) => {
    await sb.from('skill').delete().eq('id', skillId);
    await refetch?.();
  }, [refetch]);

  const onDeepen = useCallback(async (skillId: string) => {
    setNodesDeepening(prev => {
      const next = new Set(prev);
      next.add(skillId);
      return next;
    });

    setNodes(prev => {
      const next = [...prev];
      const node = next.find(n => n.id === skillId);
      if (node) {
        if (node.data.type === 'skill') {
          node.data.isDeepening = true;
        }
      }
      return next;
    });

    // Get the node
    const node = nodes.find(n => n.id === skillId);

    try {
      await FillSubskillTreeRoute.call({
        skill: {
          id: skillId,
          parentSkillIds: node?.parentIds ?? []
        }
      })
      await refetch?.()
    } catch (e) {
      console.error('Error deepening tree', e);
    }
    finally {
      setNodesDeepening(prev => {
        const next = new Set(prev);
        try {
          next.delete(skillId);
        } catch (e) {
          console.error('Error deleting skillId from nodesDeepening', e);
        }
        return next;
      });

      setNodes(prev => {
        const next = [...prev];
        const node = next.find(n => n.id === skillId);
        if (node) {
          if (node.data.type === 'skill') {
            node.data.isDeepening = false;
          }
        }
        return next;
      });
    }
  }, [refetch]);

  const convertToGraphData = useCallback((skillTreeNode: SkillTree) => {
    const nodes: SkillTreeV2GraphNode[] = [];
    const edges: Edge[] = [];
    const visitedNodes = new Set<string>();

    const traverse = (tree: SkillTree, node: SkillTreeNode, parentIds: string[], isRoot: boolean) => {
      // Skip if we've already visited this node
      if (visitedNodes.has(node.id)) {
        // Still create the edge to connect to the existing node
        const parentId = parentIds.at(-1);
        if (parentId) {
          edges.push({
            id: `${parentId}-${node.id}`,
            source: parentId,
            target: node.id,
            type: 'default',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: node.id === selectedNode || parentId === selectedNode
                ? theme.palette.primary.main
                : '#b1b1b7'
            },
            style: getEdgeStyle(
              node.id === selectedNode ||
              parentId === selectedNode ||
              (selectedNode ? parentIds.includes(selectedNode) && !collapsedNodes.has(parentId) : false),
              theme
            ),
          });
        }
        return;
      }

      visitedNodes.add(node.id);
      const parentId = parentIds.at(-1);
      const nodeLinks = tree.edges?.filter(edge => edge.from === node.id) || [];

      // Check if any parent is collapsed
      const isHidden = parentIds.some(id => collapsedNodes.has(id));

      // Only create and add the node if it's not hidden
      if (!isHidden) {
        const newNode: SkillTreeV2GraphNode = {
          id: node.id,
          type: 'custom',
          position: { x: 0, y: 0 },
          parentIds,
          childIds: nodeLinks.map(edge => edge.to).filter(notEmpty) ?? [],
          data: {
            type: 'skill',
            id: node.id,
            label: node.name,
            canEdit,
            isHidden: false,
            // TODO: get activity count
            activityCount: 0,
            // TODO: get score
            score: undefined,
            selected: node.id === selectedNode,
            selectedNodeId: selectedNode,
            parentIds,
            isDeepening: nodesDeepening.has(node.id),
            editDisabled: false,
            isCollapsed: collapsedNodes.has(node.id),
            // isCollapsed: false,
            hasChildren: nodeLinks.length > 0,
            onDeepen,
            onDelete,
            onAddSubskillByName,
            onToggleCollapse: (skillId: string) => {
              setSelectedNode(skillId);
              setCollapsedNodes(prev => {
                const next = new Set(prev);
                if (next.has(skillId)) {
                  next.delete(skillId);
                  setTimeout(() => centerOnNode(skillId), 250);
                } else {
                  next.add(skillId);
                  setTimeout(() => centerOnNode(skillId), 250);
                }
                return next;
              });
            },
            onCreateLesson: (skillId: string) => {
              if (onCreateLessonOverride) {
                onCreateLessonOverride(skillId);
              } else {
                // This does not work: TODO: fix
                router.push(`/app/skills/${skillId}/new_lesson`);
              }
            },
            onPractice: (skillId: string) => {
              router.push(`/app/skills/${rootSkillId}/practice_v2/practice?subtopicIds=${skillId}`);
            },
            onPodcast: (skillId: string) => {
              if (onPodcastOverride) {
                onPodcastOverride(skillId);
              } else {
                router.push(`/app/skills/${skillId}/podcast/new`);
              }
            },
            onRefetchTree: refetch,
            rootNode: skillTreeNode,
            rootSkillId: rootSkillId,
            onClick: (skillId: string) => {
              setSelectedNode(skillId);
            },
            totalChildCount: nodeLinks.length,
            rankDir,
          },
        };
        nodes.push(newNode);

        if (parentId) {
          edges.push({
            id: `${parentId}-${node.id}`,
            source: parentId,
            target: node.id,
            type: 'default',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: node.id === selectedNode || parentId === selectedNode
                ? theme.palette.primary.main
                : '#b1b1b7'
            },
            style: getEdgeStyle(
              node.id === selectedNode ||
              parentId === selectedNode ||
              (selectedNode ? parentIds.includes(selectedNode) && !collapsedNodes.has(parentId) : false),
              theme
            ),
          });
        }
      }

      // Continue traversing children if the node isn't collapsed and isn't hidden
      if (nodeLinks && !collapsedNodes.has(node.id) && !isHidden) {
        let childrenToProcess = nodeLinks;

        if (isRoot && !showAllRootChildren && childrenToProcess.length > MAX_INITIAL_CHILDREN) {
          // Add the "show more" node and process limited children
          const remainingCount = childrenToProcess.length - MAX_INITIAL_CHILDREN;
          const showMoreNode: SkillTreeV2GraphNode = {
            id: 'show-more-node',
            type: 'showMore',
            position: { x: 0, y: 0 },
            data: {
              type: 'showMore',
              remainingCount,
              onShowMore: () => {
                setShowAllRootChildren(true);
                setTimeout(() => {
                  reactFlowInstance.current?.fitView();
                }, 250);
              },
              rankDir,
            },
          };
          nodes.push(showMoreNode);

          // Add an edge from root to show more node
          edges.push({
            id: `${node.id}-show-more`,
            source: node.id,
            target: 'show-more-node',
            type: 'default',
            style: { stroke: theme.palette.gray.light },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: theme.palette.gray.light,
            },
          });

          // Only process the first MAX_INITIAL_CHILDREN children
          childrenToProcess = nodeLinks.slice(0, MAX_INITIAL_CHILDREN);
        }

        childrenToProcess.forEach(child => {
          const childNode = tree.skills?.find(skill => skill.id === child.to);
          if (childNode) {
            traverse(tree, childNode, [...parentIds, node.id], false);
          }
        });
      }
    };

    if (!skillTreeData) return { nodes: [], edges: [] };

    const rootNode = skillTreeData.skills?.find(s => s.id === rootSkillId);
    if (!rootNode) {
      console.error('No root node found!')
      return { nodes: [], edges: [] };
    }

    traverse(skillTreeData, rootNode, [], true);
    const { nodes: layoutedNodes, edges: layoutedEdges, dimensions } = getLayoutedElements(nodes, edges, rankDir);
    setGraphDimensions({
      width: Math.max(300, dimensions.width),
      height: Math.max(300, dimensions.height)
    });
    return { nodes: layoutedNodes, edges: layoutedEdges };
  }, [showActivityCount, showScore, collapsedNodes, selectedNode, router, onCreateLessonOverride, onPodcastOverride, refetch, centerOnNode, showAllRootChildren, rankDir]);

  useEffect(() => {
    if (skillTreeData) {
      const { nodes: newNodes, edges: newEdges } = convertToGraphData(skillTreeData);
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [skillTreeData, convertToGraphData]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const onPaneClick = () => {
    setSelectedNode(null);
  }

  // Modify the useEffect that handles nodes changes to also handle collapsing new nodes
  useEffect(() => {
    // Skip the initial render
    if (prevNodeCount.current === 0) {
      // Initialize seenNodeIds with current nodes
      nodes.forEach(node => {
        if (node.data.type === 'skill') {
          seenNodeIds.current.add(node.id);
        }
      });
      prevNodeCount.current = nodes.length;
      return;
    }

    // Find any new nodes
    const newNodes = nodes.filter(node =>
      node.data.type === 'skill' && !seenNodeIds.current.has(node.id)
    );

    // If there are new nodes, collapse them and update seenNodeIds
    if (newNodes.length > 0) {
      setCollapsedNodes(prev => {
        const next = new Set(prev);
        newNodes.forEach(node => {
          next.add(node.id);
          seenNodeIds.current.add(node.id);
        });
        return next;
      });

      // Wait for nodes to be rendered then zoom out
      setTimeout(() => {
        reactFlowInstance.current?.fitView({
          duration: 800,
          padding: 0.2,
        });
      }, 50);
    }

    prevNodeCount.current = nodes.length;
  }, [nodes]);

  return (
    <div style={{
      width: width ?? graphDimensions.width,
      height: height ?? graphDimensions.height,
      position: 'relative',
      margin: '0 auto',
      overflow: 'hidden',
      touchAction: 'none'
    }}>
      <ReactFlow
        key={key}
        nodes={nodes}
        edges={edges}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        edgesFocusable={false}
        minZoom={0.1}
        maxZoom={1.5}
        fitView
        nodeTypes={nodeTypes}
        onPaneClick={onPaneClick}
        panOnScroll={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
          setTimeout(() => {
            instance.fitView({
              duration: 200
            });
          }, 100);
        }}
        defaultEdgeOptions={{
          type: 'default',
          animated: false,
        }}
        style={{
          background: theme.palette.background.paper,
          touchAction: 'none',
        }}
        fitViewOptions={{
          padding: 0.5,
          minZoom: 0.1,
          maxZoom: 2,
          duration: 200
        }}
      >
        <Controls
          showFitView={true}
          showZoom={false}
          position={'bottom-right'}
        />
        <div
          style={{
            position: 'absolute',
            right: 10,
            top: 10,
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {/* Render custom header elements if provided */}
          {rightHeaderExtras}

          <Zoom in={true}>
            <Tooltip title="Expand all skills">
              <IconButton
                onClick={() => {
                  setShowAllRootChildren(true);
                  setCollapsedNodes(new Set());
                  setTimeout(() => {
                    reactFlowInstance.current?.fitView({
                      duration: 800,
                      padding: 0.2,
                    });
                  }, 250);
                }}
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'background.default',
                  },
                  mr: 1,
                }}
              >
                <Add />
              </IconButton>
            </Tooltip>
          </Zoom>

          <Zoom in={true}>
            <Tooltip title={rankDir === 'LR' ? "Switch to vertical layout" : "Switch to horizontal layout"}>
              <IconButton
                onClick={() => {
                  setRankDir(prev => prev === 'LR' ? 'TB' : 'LR');
                  setKey(k => k + 1);
                  setShowLayoutHint(false);
                }}
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'background.default',
                  },
                  animation: showLayoutHint ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': {
                      boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.4)',
                    },
                    '70%': {
                      boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)',
                    },
                    '100%': {
                      boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)',
                    },
                  },
                }}
              >
                {rankDir === 'LR' ? <SwapVert /> : <SwapHoriz />}
              </IconButton>
            </Tooltip>
          </Zoom>
        </div>
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
}