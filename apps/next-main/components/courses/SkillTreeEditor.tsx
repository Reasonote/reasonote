'use client'
import "reactflow/dist/style.css";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  MarkerType,
  Node,
  Panel,
  ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "reactflow";

import {GetCourseRoute} from "@/app/api/courses/get/routeSchema";
import {Course} from "@/app/api/courses/get/types";
import {
  FillSubskillTreeRoute,
} from "@/app/api/skills/fill_subskill_tree/routeSchema";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useSkillScores} from "@/clientOnly/hooks/useSkillScores";
import {useSkillSimpleTree} from "@/clientOnly/hooks/useSkillSimpleTree";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {
  AccountTree,
  Add,
  AutoAwesome,
  Delete,
  Link,
  Redo as RedoIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  useTheme,
} from "@mui/material";
import {SimpleSkillTreeNode} from "@reasonote/lib-ai-common";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {LessonPlannerLesson} from "./LessonPlanner";

interface SkillTreeEditorProps {
    rootSkillId: string;
    onSkillTreeChange?: () => void;
    disableEditing?: boolean;
    initialSelectedNodes?: string[];
    onSelectionChange?: (selectedNodes: string[]) => void;
    courseId?: string;
    existingLessons?: LessonPlannerLesson[];
}

interface AddSkillDialogProps {
    open: boolean;
    onClose: () => void;
    onAdd: (name: string, description: string) => void;
}

function AddSkillDialog({ open, onClose, onAdd }: AddSkillDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleAdd = () => {
        onAdd(name, description || name);
        setName('');
        setDescription('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Add New Subskill</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField
                        label="Skill Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleAdd} disabled={!name}>
                    Add Subskill
                </Button>
            </DialogActions>
        </Dialog>
    );
}

type ChangeType = 'add_node' | 'delete_node' | 'add_edge' | 'delete_edge';

interface Change {
    type: ChangeType;
    data: {
        nodes?: Node[];
        edges?: Edge[];
        skillIds?: string[];
        sourceId?: string;
        targetId?: string;
        tempId?: string;
        parentId?: string;
        name?: string;
        description?: string;
        node?: Node;
        edge?: Edge;
    };
    undo: () => void;
    redo: () => void;
}

export function SkillTreeEditor({
    rootSkillId,
    onSkillTreeChange,
    disableEditing = false,
    initialSelectedNodes,
    onSelectionChange,
    courseId,
    existingLessons
}: SkillTreeEditorProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
    const [isAddingSkill, setIsAddingSkill] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [selectedNodes, setSelectedNodes] = useState<string[]>(initialSelectedNodes ?? []);
    const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
    const { sb } = useSupabase();
    const user = useRsnUser();
    const { data: skillTreeData, refetch: refetchSkillTreeData } = useSkillSimpleTree({ topicOrId: rootSkillId });
    const { data: skillScores } = useSkillScores({ topicOrId: rootSkillId });
    const [changes, setChanges] = useState<Change[]>([]);
    const [currentChangeIndex, setCurrentChangeIndex] = useState(-1);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isGeneratingFullTree, setIsGeneratingFullTree] = useState(false);
    const [courseData, setCourseData] = useState<Course | null>(null);
    const theme = useTheme();
    const DEFAULT_COLOR = 'rgb(200, 200, 200)';
    const HIGHLIGHT_COLOR = theme.palette.primary.main;
    const LEVEL_HEIGHT = 200;
    const LINKING_COLOR = theme.palette.secondary.main;

    useAsyncEffect(async () => {
        if (courseId) {
            const { data } = await GetCourseRoute.call({ courseId });

            if (data?.courses && data.courses.length > 0) {
                setCourseData(data.courses[0]);
            }
        }
    }, [courseId]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle keyboard shortcuts if we're in an input field
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if ((e.ctrlKey || e.metaKey)) {
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        handleRedo();
                    } else {
                        handleUndo();
                    }
                } else if (e.key === 's') {
                    e.preventDefault();
                    if (hasUnsavedChanges && !isSaving) {
                        handleSaveChanges();
                    }
                }
            }
            else if (e.key === 'Backspace' || e.key === 'Delete') {
                // Only handle delete if we have selections and we're not in an input
                if (selectedNodes.length > 0 || selectedEdges.length > 0) {
                    e.preventDefault();
                    if (selectedNodes.length > 0) {
                        handleDeleteSelected();
                    } else if (selectedEdges.length > 0) {
                        handleDeleteEdges();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentChangeIndex, selectedNodes, selectedEdges, hasUnsavedChanges, isSaving]);

    const addChange = useCallback((change: Change) => {
        setChanges(prev => [...prev.slice(0, currentChangeIndex + 1), change]);
        setCurrentChangeIndex(prev => prev + 1);
        setHasUnsavedChanges(true);
        change.redo();
    }, [currentChangeIndex]);

    const handleUndo = useCallback(() => {
        if (currentChangeIndex >= 0) {
            changes[currentChangeIndex].undo();
            setCurrentChangeIndex(prev => prev - 1);
            setHasUnsavedChanges(currentChangeIndex > 0);
        }
    }, [changes, currentChangeIndex]);

    const handleRedo = useCallback(() => {
        if (currentChangeIndex < changes.length - 1) {
            changes[currentChangeIndex + 1].redo();
            setCurrentChangeIndex(prev => prev + 1);
            setHasUnsavedChanges(true);
        }
    }, [changes, currentChangeIndex]);

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setSaveError(null);

        try {
            // Find orphaned nodes (nodes without any connections)
            const connectedNodes = new Set<string>();
            edges.forEach(edge => {
                connectedNodes.add(edge.source);
                connectedNodes.add(edge.target);
            });
            connectedNodes.add(rootSkillId); // Always keep root node

            const orphanedNodes = nodes
                .filter(node => !connectedNodes.has(node.id))
                .map(node => node.id);

            // Add orphaned nodes to deletion queue if they exist
            if (orphanedNodes.length > 0) {
                const { error: deleteError } = await sb.from('skill')
                    .delete()
                    .in('id', orphanedNodes);

                if (deleteError) {
                    console.error('Error deleting orphaned skills:', deleteError);
                }
            }

            // Process all other changes
            for (let i = 0; i <= currentChangeIndex; i++) {
                const change = changes[i];
                switch (change.type) {
                    case 'add_node':
                        if (change.data.tempId) {
                            if (!change.data.name) {
                                throw new Error("Skill name is required");
                            }

                            // Create the skill in the database
                            const { data: newSkill, error: skillError } = await sb
                                .from('skill')
                                .insert([{
                                    _name: change.data.name,
                                    _description: change.data.description,
                                    root_skill_id: rootSkillId
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
                                    downstream_skill: change.data.parentId,
                                    upstream_skill: newSkill.id,
                                    metadata: {
                                        levelOnParent: "INTRO"
                                    }
                                }]);

                            if (linkError) {
                                throw new Error(linkError.message);
                            }

                            // Update the node and edge IDs in the graph
                            setNodes(nds => nds.map(n =>
                                n.id === change.data.tempId
                                    ? { ...n, id: newSkill.id, data: { ...n.data, isTemp: false } }
                                    : n
                            ));
                            setEdges(eds => eds.map(e =>
                                e.target === change.data.tempId
                                    ? { ...e, target: newSkill.id, id: `${e.source}-${newSkill.id}` }
                                    : e
                            ));
                        }
                        break;
                    case 'delete_node':
                        console.log(`Deleting skill: ${change.data.skillIds}`);
                        if (change.data.skillIds) {
                            // Cannot delete skills created by someone else due to RLS
                            // const { error } = await sb.from('skill')
                            //     .delete()
                            //     .in('id', change.data.skillIds);
                            // if (error) {
                            //     console.error('Error deleting skill:', error);
                            // }
                            // HACK: Only delete the skill links instead
                            const { error: upstreamError } = await sb.from('skill_link')
                                .delete()
                                .eq('upstream_skill', change.data.skillIds);

                            const { error: downstreamError } = await sb.from('skill_link')
                                .delete()
                                .eq('downstream_skill', change.data.skillIds);
                            if (upstreamError || downstreamError) {
                                console.error('Error deleting skill:', upstreamError || downstreamError);
                            }
                        }
                        break;
                    case 'add_edge':
                        if (change.data.sourceId && change.data.targetId) {
                            const { error } = await sb.from('skill_link').insert({
                                downstream_skill: change.data.sourceId,
                                upstream_skill: change.data.targetId,
                                metadata: {
                                    levelOnParent: "INTRO"
                                }
                            });
                            if (error) {
                                console.error('Error adding skill link:', error);
                            }
                        }
                        break;
                    case 'delete_edge':
                        if (change.data.sourceId && change.data.targetId) {
                            const { error } = await sb.from('skill_link')
                                .delete()
                                .eq('downstream_skill', change.data.sourceId)
                                .eq('upstream_skill', change.data.targetId);
                            if (error) {
                                console.error('Error deleting skill link:', error);
                            }
                        }
                        break;
                }
            }

            setChanges([]);
            setCurrentChangeIndex(-1);
            setHasUnsavedChanges(false);
            refetchSkillTreeData();
            if (onSkillTreeChange) onSkillTreeChange();

        } catch (error) {
            console.error('Error saving changes:', error);
            setSaveError(error instanceof Error ? error.message : 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    function calculateNodeDepth(
        skill_id: string
    ): number {
        if (!skillScores) {
            return 0;
        }

        const skillPaths = skillScores.filter(skill => skill.skill_id === skill_id);
        if (!skillPaths || skillPaths.length === 0) {
            return 0;
        }

        // Return the maximum path length for this skill
        // TODO: this is a hack, and is inaccurate, because a skill can have multiple parents.
        // Ultimately, this entire component needs to be refactored to consider the fact that this is not a TREE but a DAG.
        return Math.max(...skillPaths.map(skill => skill.num_upstream_skills));
    }

    function convertSkillTreeToNodesAndEdges(
        skill: SimpleSkillTreeNode,
        parentId: string | null = null,
        index: number = 0,
        depthMap: Map<number, number> = new Map()
    ): { nodes: Node[], edges: Edge[] } {
        // First pass: count nodes at each depth level
        function countNodesAtDepth(node: SimpleSkillTreeNode) {
            const depth = calculateNodeDepth(node.skill_id);
            const currentCount = depthMap.get(depth) || 0;
            depthMap.set(depth, currentCount + 1);

            node.upstream_skills.forEach(child => {
                countNodesAtDepth(child);
            });
        }

        // Count all nodes first
        countNodesAtDepth(skill);

        // Calculate the maximum width needed
        const NODE_WIDTH = 200;
        const NODE_SPACING = 100;
        let maxWidth = 0;
        depthMap.forEach((count) => {
            const levelWidth = (count * NODE_WIDTH) + ((count - 1) * NODE_SPACING);
            maxWidth = Math.max(maxWidth, levelWidth);
        });

        // Second pass: create nodes with positions
        function createNodesAndEdges(
            node: SimpleSkillTreeNode,
            parentId: string | null,
            currentCounts: Map<number, number>
        ): { nodes: Node[], edges: Edge[] } {
            const depth = calculateNodeDepth(node.skill_id);
            const nodesAtThisDepth = depthMap.get(depth) || 1;
            const currentCount = currentCounts.get(depth) || 0;
            currentCounts.set(depth, currentCount + 1);

            // Center this level within the maxWidth
            const levelWidth = (nodesAtThisDepth * NODE_WIDTH) + ((nodesAtThisDepth - 1) * NODE_SPACING);
            const startX = -(maxWidth / 2) + ((maxWidth - levelWidth) / 2);
            const xPosition = startX + (currentCount * (NODE_WIDTH + NODE_SPACING));

            const newNode: Node = {
                id: node.skill_id,
                data: {
                    label: node.skill_name,
                    description: node.skill_name
                },
                position: {
                    x: xPosition,
                    y: depth * LEVEL_HEIGHT
                },
                type: 'default',
                style: {
                    borderRadius: '8px',
                    padding: '10px',
                    border: '2px solid',
                    backgroundColor: selectedNodes.includes(node.skill_id) ?
                        HIGHLIGHT_COLOR :
                        DEFAULT_COLOR,
                    transition: 'all 0.2s ease',
                    width: NODE_WIDTH,
                }
            };

            let nodes = [newNode];
            let edges: Edge[] = [];

            if (parentId) {
                edges.push({
                    id: `${parentId},${node.skill_id}`,
                    source: parentId,
                    target: node.skill_id,
                    style: { stroke: '#b1b1b7' },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#b1b1b7'
                    }
                });
            }

            // Process children
            node.upstream_skills.forEach(child => {
                const { nodes: childNodes, edges: childEdges } = createNodesAndEdges(
                    child,
                    node.skill_id,
                    currentCounts
                );
                nodes = [...nodes, ...childNodes];
                edges = [...edges, ...childEdges];
            });

            return { nodes, edges };
        }

        return createNodesAndEdges(skill, parentId, new Map());
    }

    // Add this function to compute node color
    const getNodeColor = useCallback((nodeId: string, isSelected: boolean) => {
        if (isSelected) {
            return theme.palette.primary.light;
        }
        if (existingLessons?.some(lesson => lesson?.rootSkillId === nodeId)) {
            return theme.palette.success.light;
        }
        return DEFAULT_COLOR;
    }, [existingLessons]);

    useEffect(() => {
        if (!skillTreeData) return;

        const { nodes: initialNodes, edges: initialEdges } = convertSkillTreeToNodesAndEdges(
            skillTreeData,
            null,
            0,
            new Map()
        );
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [skillTreeData]);

    if (disableEditing) {
        useEffect(() => {
            setNodes(nodes.map(node => ({
                ...node,
                style: { ...node.style, backgroundColor: getNodeColor(node.id, selectedNodes.includes(node.id)) }
            })));
        }, [getNodeColor, selectedNodes]);
    }

    const onConnect = useCallback((params: Connection) => {
        if (!params.source || !params.target) return;

        const newEdge: Edge = {
            id: `${params.source},${params.target}`,
            source: params.source,
            target: params.target,
            type: 'default',
            style: { stroke: LINKING_COLOR },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: LINKING_COLOR
            },
        };

        setNodes(nds => nds.map(n => ({
            ...n,
            style: {
                ...n.style,
                backgroundColor: n.id === params.source || n.id === params.target ? LINKING_COLOR : DEFAULT_COLOR
            }
        })));
        // Add to changes history
        const change: Change = {
            type: 'add_edge',
            data: {
                edges: [newEdge],
                sourceId: params.source,
                targetId: params.target
            },
            undo: () => {
                setEdges(eds => eds.filter(e => e.id !== newEdge.id));
            },
            redo: () => {
                setEdges(eds => addEdge(newEdge, eds));
            }
        };

        addChange(change);

        // Flash effect - remove animation and linking color after a delay
        setTimeout(() => {
            setNodes(nds => nds.map(n => ({
                ...n,
                style: {
                    ...n.style,
                    backgroundColor: DEFAULT_COLOR
                }
            })));
            setEdges(eds =>
                eds.map(e => e.id === newEdge.id ? {
                    ...e,
                    animated: false,
                    style: undefined
                } : e)
            );
        }, 1000);
    }, [addChange]);

    const handleAddSkill = async (name: string, description: string) => {
        if (selectedNodes.length !== 1) {
            setErrorMessage("Please select a parent skill first");
            return;
        }

        const tempId = `temp_${Date.now()}`;
        const parentId = selectedNodes[0];
        const parentNode = nodes.find(n => n.id === parentId);

        if (!parentNode) {
            setErrorMessage("Parent node not found");
            return;
        }

        // Create temporary node with highlight color
        const newNode = {
            id: tempId,
            data: {
                label: name,
                description: description,
                isTemp: true
            },
            position: {
                x: parentNode.position.x,
                y: parentNode.position.y + LEVEL_HEIGHT,
            },
            type: 'default',
            style: {
                borderRadius: '8px',
                padding: '10px',
                border: '2px solid',
                backgroundColor: theme.palette.secondary.main,
                transition: 'all 0.5s ease',
            }
        };

        const newEdge = {
            id: `${parentId}-${tempId}`,
            source: parentId,
            target: tempId,
            type: 'default',
            style: {
                stroke: theme.palette.secondary.main,
                transition: 'all 0.5s ease',
            },
            markerEnd: { type: MarkerType.ArrowClosed }
        };

        // Add to change history
        addChange({
            type: 'add_node',
            data: {
                tempId,
                parentId,
                name,
                description,
                node: newNode,
                edge: newEdge
            },
            undo: () => {
                setNodes(nds => nds.filter(n => n.id !== tempId));
                setEdges(eds => eds.filter(e => e.id !== newEdge.id));
            },
            redo: () => {
                // Add elements with highlight color
                setNodes(nds => [
                    ...nds.map(n => n.id === parentId ? {
                        ...n,
                        style: {
                            ...n.style,
                            backgroundColor: theme.palette.secondary.main,
                            transition: 'all 0.5s ease',
                        }
                    } : n),
                    newNode
                ]);
                setEdges(eds => [...eds, newEdge]);

                // Transition back to default colors after delay
                setTimeout(() => {
                    setNodes(nds => nds.map(n =>
                        (n.id === tempId || n.id === parentId) ? {
                            ...n,
                            style: {
                                ...n.style,
                                backgroundColor: DEFAULT_COLOR,
                            }
                        } : n
                    ));
                    setEdges(eds => eds.map(e =>
                        e.id === newEdge.id ? {
                            ...e,
                            style: {
                                ...e.style,
                                stroke: '#b1b1b7',
                            }
                        } : e
                    ));
                }, 1000);
            }
        });

        // Clear selection and set unsaved changes
        setSelectedNodes([]);
        setHasUnsavedChanges(true);
    };

    const handleLinkSkills = async () => {
        setIsLinking(!isLinking);
        if (!isLinking && selectedNodes.length === 1) {
            // Keep the selection
            setNodes(nds => nds.map(n => ({
                ...n,
                style: { ...n.style, backgroundColor: selectedNodes[0] === n.id ? LINKING_COLOR : DEFAULT_COLOR }
            })));
            setEdges(eds => eds.map(e => ({
                ...e,
                style: { ...e.style, stroke: DEFAULT_COLOR }
            })));
        } else {
            setSelectedNodes([]);
        }
    };

    const handleDeleteSelected = () => {
        // Don't allow deleting the root skill
        if (selectedNodes.includes(rootSkillId)) {
            setErrorMessage("Cannot delete the root skill");
            return;
        }

        if (selectedNodes.length > 0) {
            const nodesToDelete = nodes.filter(n => selectedNodes.includes(n.id));
            const connectedEdges = edges.filter(e =>
                selectedNodes.includes(e.source) ||
                selectedNodes.includes(e.target)
            );

            addChange({
                type: 'delete_node',
                data: {
                    nodes: nodesToDelete,
                    edges: connectedEdges,
                    skillIds: selectedNodes
                },
                undo: () => {
                    setNodes(nds => [...nds, ...nodesToDelete]);
                    setEdges(eds => [...eds, ...connectedEdges]);
                },
                redo: () => {
                    setNodes(nds => nds.filter(n => !selectedNodes.includes(n.id)));
                    setEdges(eds => eds.filter(e =>
                        !selectedNodes.includes(e.source) &&
                        !selectedNodes.includes(e.target)
                    ));
                }
            });

            setSelectedNodes([]);
            setHasUnsavedChanges(true);
        }
    };

    const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (isLinking) {
            if (selectedNodes.length === 0) {
                setSelectedNodes([node.id]);
                setNodes(nds => nds.map(n => ({
                    ...n,
                    style: {
                        ...n.style,
                        backgroundColor: n.id === node.id ? LINKING_COLOR : DEFAULT_COLOR
                    }
                })));
            } else {
                const sourceId = selectedNodes[0];
                const targetId = node.id;

                // Check for self-linking
                if (sourceId === targetId) {
                    setErrorMessage("Cannot link a skill to itself");
                    // Flash the node in red
                    setNodes(nds => nds.map(n => ({
                        ...n,
                        style: {
                            ...n.style,
                            backgroundColor: n.id === node.id ? '#ff6b6b' : n.style?.backgroundColor
                        }
                    })));
                    setTimeout(() => {
                        setNodes(nds => nds.map(n => ({
                            ...n,
                            style: {
                                ...n.style,
                                backgroundColor: n.id === sourceId ? LINKING_COLOR : DEFAULT_COLOR
                            }
                        })));
                        setErrorMessage(null);
                    }, 1000);
                    return;
                }

                // Check for existing link
                if (edges.some(e => e.source === sourceId && e.target === targetId)) {
                    setErrorMessage("This link already exists");
                    // Flash both nodes in red

                    setNodes(nds => nds.map(n => ({
                        ...n,
                        style: {
                            ...n.style,
                            backgroundColor: [sourceId, targetId].includes(n.id) ? '#ff6b6b' : n.style?.backgroundColor
                        }
                    })));
                    setTimeout(() => {
                        setNodes(nds => nds.map(n => ({
                            ...n,
                            style: {
                                ...n.style,
                                backgroundColor: n.id === sourceId ? LINKING_COLOR : DEFAULT_COLOR
                            }
                        })));
                        setErrorMessage(null);
                    }, 1000);
                    return;
                }

                const newEdge = {
                    id: `${sourceId},${targetId}`,
                    source: sourceId,
                    target: targetId,
                    style: { stroke: LINKING_COLOR },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: LINKING_COLOR
                    }
                };

                addChange({
                    type: 'add_edge',
                    data: {
                        edges: [newEdge],
                        sourceId,
                        targetId
                    },
                    undo: () => {
                        setEdges(eds => eds.filter(e => e.id !== newEdge.id));
                    },
                    redo: () => {
                        setEdges(eds => [...eds, newEdge]);
                    }
                });

                // Flash effect on both nodes
                setNodes(nds => nds.map(n => ({
                    ...n,
                    style: {
                        ...n.style,
                        backgroundColor: [sourceId, targetId].includes(n.id)
                            ? LINKING_COLOR
                            : DEFAULT_COLOR
                    }
                })));

                // Reset colors after 1 second
                setTimeout(() => {
                    setNodes(nds => nds.map(n => ({
                        ...n,
                        style: {
                            ...n.style,
                            backgroundColor: DEFAULT_COLOR
                        }
                    })));

                    // Reset edge color
                    setEdges(eds => eds.map(e => ({
                        ...e,
                        style: {
                            ...e.style,
                            stroke: e.id === newEdge.id ? '#b1b1b7' : e.style?.stroke
                        },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: e.id === newEdge.id ? '#b1b1b7' : (e.markerEnd as any).color
                        }
                    })));
                }, 1000);

                setIsLinking(false);
                setSelectedNodes([]);
            }
        } else {
            if (event.shiftKey) {
                const newSelection = selectedNodes.includes(node.id)
                    ? selectedNodes.filter(id => id !== node.id)
                    : [...selectedNodes, node.id];
                setSelectedNodes(newSelection);

                // Update node colors
                setNodes(nds => nds.map(n => ({
                    ...n,
                    style: {
                        ...n.style,
                        backgroundColor: getNodeColor(n.id, newSelection.includes(n.id))
                    }
                })));

                // Highlight connected edges
                setEdges(eds => eds.map(e => ({
                    ...e,
                    style: {
                        ...e.style,
                        stroke: (newSelection.includes(e.source) || newSelection.includes(e.target))
                            ? theme.palette.primary.light
                            : '#b1b1b7'
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: (newSelection.includes(e.source) || newSelection.includes(e.target))
                            ? theme.palette.primary.light
                            : '#b1b1b7'
                    }
                })));
            } else {
                const newSelection = [node.id];
                setSelectedNodes(newSelection);

                // Update node colors
                setNodes(nds => nds.map(n => ({
                    ...n,
                    style: {
                        ...n.style,
                        backgroundColor: getNodeColor(n.id, newSelection.includes(n.id))
                    }
                })));

                // Highlight connected edges
                setEdges(eds => eds.map(e => ({
                    ...e,
                    style: {
                        ...e.style,
                        stroke: (e.source === node.id || e.target === node.id)
                            ? theme.palette.primary.light
                            : '#b1b1b7'
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: (e.source === node.id || e.target === node.id)
                            ? theme.palette.primary.light
                            : '#b1b1b7'
                    }
                })));
            }
            // Notify parent of selection change	
            onSelectionChange?.(selectedNodes);
        }
    }, [isLinking, selectedNodes, nodes, onSelectionChange, getNodeColor]);

    const onEdgeClick = (event: React.MouseEvent, edge: Edge) => {
        setSelectedEdges([edge.id]);
        setNodes((nds) => nds.map(n => ({
            ...n,
            style: {
                ...n.style,
                backgroundColor: [edge.source, edge.target].includes(n.id) ?
                    theme.palette.primary.light :
                    DEFAULT_COLOR,
            }
        })));
        setEdges((eds) => eds.map(e => ({
            ...e,
            style: {
                ...e.style,
                stroke: e.id === edge.id ? HIGHLIGHT_COLOR : '#b1b1b7',
            },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: e.id === edge.id ? HIGHLIGHT_COLOR : '#b1b1b7'
            }
        })));
    };

    // Add this effect to sync selections	
    useEffect(() => {
        if (onSelectionChange) {
            onSelectionChange(selectedNodes);
        }
    }, [selectedNodes, onSelectionChange]);

    const onPaneClick = () => {
        setSelectedNodes([]);
        setSelectedEdges([]);
        setIsLinking(false);
        setNodes((nds) => nds.map(n => ({
            ...n,
            style: {
                ...n.style,
                backgroundColor: DEFAULT_COLOR,
            }
        })));
        setEdges((eds) => eds.map(e => ({
            ...e,
            style: {
                ...e.style,
                stroke: '#b1b1b7',
            },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#b1b1b7'
            }
        })));
    };

    const handleDeleteEdges = () => {
        if (selectedEdges.length > 0) {
            const edgesToDelete = edges.filter(e => selectedEdges.includes(e.id));
            addChange({
                type: 'delete_edge',
                data: {
                    edges: edgesToDelete,
                    // We need to store all source/target pairs for database operations
                    sourceId: edgesToDelete[0].source,
                    targetId: edgesToDelete[0].target
                },
                undo: () => {
                    setEdges(eds => [...eds, ...edgesToDelete]);
                },
                redo: () => {
                    setEdges(eds => eds.filter(e => !selectedEdges.includes(e.id)));
                }
            });
            setSelectedEdges([]);
        }
    };

    // Add this effect to handle edge case when currentChangeIndex becomes -1
    useEffect(() => {
        if (currentChangeIndex === -1) {
            setHasUnsavedChanges(false);
        }
    }, [currentChangeIndex]);

    const handleAutoFill = async () => {
        if (selectedNodes.length !== 1) return;
        setIsAutoFilling(true);
        try {
            await FillSubskillTreeRoute.call({
                skill: {
                    id: selectedNodes[0],
                    rootSkillId
                },
                maxDepth: 1,
                maxSubskillsPerSkill: 5,
                relevantDocuments: courseData ? [{
                    name: "Course Description",
                    content: courseData.description ?? ""
                },
                // TODO: Should the whole page be added to the context? Seems like this would blow up the context window.
                ...(courseData.resources.map(resource => ({
                    name: resource.name,
                    content: resource.body
                })))
                ] : undefined,
            });
            await refetchSkillTreeData();
        } catch (error) {
            console.error('Error auto-filling skill tree:', error);
            setErrorMessage("Failed to auto-fill skill tree");
        } finally {
            setIsAutoFilling(false);
        }
    };

    const handleGenerateFullTree = async () => {
        setIsGeneratingFullTree(true);
        try {
            await FillSubskillTreeRoute.call({
                skill: {
                    id: rootSkillId,
                    rootSkillId: rootSkillId
                },
                maxDepth: 3,
                maxSubskillsPerSkill: 5,
                relevantDocuments: courseData ? [{
                    name: "Course Description",
                    content: courseData.description ?? ""
                },
                // TODO: Should the whole page be added to the context? Seems like this would blow up the context window.
                ...(courseData.resources.map(resource => ({
                    name: resource.name,
                    content: resource.body
                })))
                ] : undefined,
            });
            await refetchSkillTreeData();
        } catch (error) {
            console.error('Error generating full skill tree:', error);
            setErrorMessage("Failed to generate full skill tree");
        } finally {
            setIsGeneratingFullTree(false);
        }
    };

    const hasOnlyRootNode = nodes.length === 1 && nodes[0].id === rootSkillId;

    // Update selectedNodes when initialSelectedNodes changes
    useEffect(() => {
        setSelectedNodes(initialSelectedNodes ?? []);
    }, [initialSelectedNodes]);

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                fitView
                minZoom={0.1} // Allow zooming out further
                maxZoom={1.5}
                onInit={(instance) => {
                    reactFlowInstance.current = instance;
                    setTimeout(() => {
                        instance.fitView({
                            duration: 200,
                            padding: 0.2 // Add some padding around the graph
                        });
                    }, 100);
                }}
            >
                <Background color="#aaa" gap={16} />
                <Controls
                    showFitView={true}
                    showZoom={false}
                    position="bottom-right"
                />
                {!disableEditing && (
                    <Panel position="top-right">
                        <Stack direction="row" spacing={1}>
                            {hasOnlyRootNode ? (
                                <>
                                    <Button
                                        variant="contained"
                                        startIcon={<Add />}
                                        onClick={() => setIsAddingSkill(true)}
                                        disabled={selectedNodes.length !== 1}
                                    >
                                        Add Subskill
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={isGeneratingFullTree ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
                                        onClick={handleGenerateFullTree}
                                        disabled={isGeneratingFullTree}
                                        sx={{
                                            position: 'relative',
                                            minWidth: '140px'
                                        }}
                                    >
                                        {isGeneratingFullTree ? 'Generating...' : 'Generate Full Tree'}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="contained"
                                        startIcon={<Add />}
                                        onClick={() => setIsAddingSkill(true)}
                                        disabled={selectedNodes.length !== 1}
                                    >
                                        Add Subskill
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<Link />}
                                        onClick={handleLinkSkills}
                                        color={isLinking ? 'secondary' : 'primary'}
                                    >
                                        Link Skills
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<Delete />}
                                        onClick={handleDeleteSelected}
                                        disabled={selectedNodes.length === 0}
                                        color="error"
                                    >
                                        Delete Skill
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<Delete />}
                                        onClick={handleDeleteEdges}
                                        disabled={selectedEdges.length === 0}
                                        color="error"
                                    >
                                        Delete Link
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="contained"
                                startIcon={isAutoFilling ? <CircularProgress size={20} color="inherit" /> : <AccountTree />}
                                onClick={handleAutoFill}
                                disabled={selectedNodes.length !== 1 || isAutoFilling}
                                sx={{
                                    position: 'relative',
                                    minWidth: '160px'
                                }}
                            >
                                {isAutoFilling ? 'Generating...' : 'Auto-Expand One Level'}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                onClick={handleSaveChanges}
                                disabled={!hasUnsavedChanges || isSaving}
                                color={saveError ? "error" : "primary"}
                                sx={{
                                    minWidth: '120px',
                                    position: 'relative',
                                    '&:hover': {
                                        '& .error-tooltip': {
                                            opacity: 1,
                                            visibility: 'visible'
                                        }
                                    }
                                }}
                            >
                                {isSaving ? 'Saving...' : (saveError ? 'Save Failed' : 'Save Tree')}
                                {saveError && (
                                    <Box
                                        className="error-tooltip"
                                        sx={{
                                            position: 'absolute',
                                            bottom: '-30px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            backgroundColor: 'error.main',
                                            color: 'error.contrastText',
                                            padding: '4px 8px',
                                            borderRadius: 1,
                                            fontSize: '0.75rem',
                                            whiteSpace: 'nowrap',
                                            opacity: 0,
                                            visibility: 'hidden',
                                            transition: 'all 0.2s ease',
                                            zIndex: 1000,
                                        }}
                                    >
                                        {saveError}
                                    </Box>
                                )}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<UndoIcon />}
                                onClick={handleUndo}
                                disabled={currentChangeIndex < 0}
                            >
                                Undo
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<RedoIcon />}
                                onClick={handleRedo}
                                disabled={currentChangeIndex >= changes.length - 1}
                            >
                                Redo
                            </Button>
                        </Stack>
                    </Panel>
                )}
                <Panel position="top-left">
                    <Stack spacing={1}>
                        <Txt variant="caption" color="text.secondary">
                            {isLinking
                                ? selectedNodes.length === 0
                                    ? 'Select a source skill to start linking'
                                    : 'Now select a target skill to create the link'
                                : 'Hold Shift to select multiple skills'}
                        </Txt>
                        {errorMessage && (
                            <Txt
                                variant="caption"
                                color="error"
                                sx={{
                                    backgroundColor: 'error.light',
                                    color: 'error.contrastText',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1
                                }}
                            >
                                {errorMessage}
                            </Txt>
                        )}
                    </Stack>
                </Panel>
            </ReactFlow>

            <AddSkillDialog
                open={isAddingSkill}
                onClose={() => setIsAddingSkill(false)}
                onAdd={handleAddSkill}
            />
        </div>
    );
} 