'use client'
import "reactflow/dist/style.css";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import ReactFlow, {
  addEdge,
  MarkerType,
  OnConnect,
  OnConnectEnd,
  OnConnectStart,
  Panel,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";

import {ConceptWithPrerequisites} from "@/components/exercise/PracticeSession";
import Dagre from "@dagrejs/dagre";

import {SkillTreeNode} from "./SkillTreeNode";

const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

/**
 * If a concept has prerequisites, then we need to add edges to the graph
 * that connect the concept to its prerequisites.
 * @param concepts
 */
export function conceptsToGraph(concepts: ConceptWithPrerequisites[]) {
  const allConceptNames = concepts.map((c) => c.conceptName);
  allConceptNames.push(...concepts.flatMap((c) => c.prerequisites ?? []));

  const nodes = allConceptNames.map((c) => {
    return {
      type: 'conceptNode',
      id: c,
      position: { x: 0, y: 0 },
      data: {
        label: c,
      },
    };
  });

  const edges = concepts.flatMap((c) => {
    return (
      c.prerequisites?.map((p) => {
        return {
          id: `${c.conceptName}-${p}`,
          source: c.conceptName,
          target: p,
          markerStart: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: "#FF0072",
          },
        };
      }) ?? []
    );
  });

  return {
    nodes,
    edges,
  };
}

const nodeTypes = {
  conceptNode: SkillTreeNode,
};

const getLayoutedElements = (nodes: any, edges: any, options: any) => {
  g.setGraph({ rankdir: options.direction });

  edges.forEach((edge: any) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node: any) => g.setNode(node.id, node));

  Dagre.layout(g);

  return {
    nodes: nodes.map((node: any) => {
      const { x, y } = g.node(node.id);

      return { ...node, position: { x, y } };
    }),
    edges,
  };
};

const LayoutFlow = ({
  initialNodes,
  initialEdges,
  onConnectStart,
  onConnectEnd,
  onConnect
}: {
  initialNodes: any;
  initialEdges: any;
  onConnectStart: OnConnectStart;
  onConnectEnd: OnConnectEnd;
  onConnect: OnConnect;
}) => {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onLayout = useCallback(
    (direction: any) => {
      if (!nodes.length || !edges.length) {
        return;
      }

      const layouted = getLayoutedElements(nodes, edges, { direction });

      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);

      window.requestAnimationFrame(() => {
        fitView();
      });
    },
    [nodes, edges]
  );

  // useEffect to handle the initialNodes or initialEdges changing. Should reset
  useEffect(() => {
    // First, remove any nodes that are no longer in the list of initial nodes
    // or edges
    setNodes((nodes) => nodes.filter((n) => initialNodes.find((n2) => n2.id === n.id)));
    setEdges((edges) => edges.filter((e) => initialEdges.find((e2) => e2.id === e.id)));

    // Now, add nodes if they don't already exist
    setNodes((nodes) => nodes.concat(initialNodes.filter((n) => !nodes.find((n2) => n2.id === n.id))));
    setEdges((edges) => edges.concat(initialEdges.filter((e) => !edges.find((e2) => e2.id === e.id))));
  }, [initialNodes, initialEdges]);

  const [connectingNode, setConnectingNode] = useState<string|null>(null)

  return (
    <>
      {/* @ts-ignore */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        nodeTypes={nodeTypes}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onConnect={onConnect}
      >
        <Panel position="top-right">
          <button onClick={() => onLayout("TB")}>vertical layout</button>
          <button onClick={() => onLayout("LR")}>horizontal layout</button>
        </Panel>
      </ReactFlow>
    </>
  );
};

var id = 0;
const getId = () => `${id++}`;

export function SkillSetTree({
    concepts
}: {
    concepts: ConceptWithPrerequisites[];
}){
    const { nodes: conceptNodes, edges: conceptEdges } = useMemo(() => {
        return conceptsToGraph(concepts);
    }, [concepts]);

    const reactFlowWrapper = useRef(null);
    const connectingNodeId = useRef(null);
    const [extraNodes, setExtraNodes, onExtraNodesChange] = useNodesState([]);
    const [extraEdges, setExtraEdges, onExtraEdgesChange] = useEdgesState([]);
    const { screenToFlowPosition } = useReactFlow();

    const connectingFromType = useRef(null);

    const onConnect = useCallback(
      (params) => {
        // reset the start node on connections
        connectingNodeId.current = null;
        connectingFromType.current = null;
        setExtraEdges((eds) => addEdge(params, eds))
      },
      [],
    );
  
    const onConnectStart = useCallback((_, { nodeId, ...rest }) => {
      connectingNodeId.current = nodeId;
      connectingFromType.current = rest.handleType;
    }, []);
  
    const onConnectEnd = useCallback(
      (event) => {
        if (!connectingNodeId.current) return;
  
        const targetIsPane = event.target.classList.contains('react-flow__pane');

        if (targetIsPane) {
            // we need to remove the wrapper bounds, in order to get the correct position
            const id = getId();
            const newNode = {
                type: 'conceptNode',
                id,
                position: screenToFlowPosition({
                    x: event.clientX - 50,
                    y: event.clientY - 50,
                }),
                data: { label: `Node ${id}` },
                origin: [0.5, 0.0],
            };

            const isTargetInput = connectingFromType.current === 'target';
  
            setExtraNodes((nds) => nds.concat(newNode));
            setExtraEdges((eds) => {
                if (isTargetInput){
                    //@ts-ignore
                    return eds.concat({ id, source: id, target: connectingNodeId.current, markerStart: {
                        type: MarkerType.ArrowClosed,
                        width: 20,
                        height: 20,
                        color: "#FF0072",
                      }, })
                }
                else {
                    //@ts-ignore
                    return eds.concat({ id, source: connectingNodeId.current, target: id, markerStart: {
                        type: MarkerType.ArrowClosed,
                        width: 20,
                        height: 20,
                        color: "#FF0072",
                      }, }) 
                }
            });
        }
      },
      [screenToFlowPosition],
    );

    return <SkillSetTreeDumb 
        conceptNodes={[...conceptNodes, ...extraNodes]}
        conceptEdges={[...conceptEdges, ...extraEdges]}
        onConnect={onConnect} 
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd} 
    />
}

export function SkillSetTreeDumb({
  conceptNodes,
  conceptEdges,
  onConnect,
  onConnectStart,
  onConnectEnd,
}: {
  conceptNodes: any;
  conceptEdges: any;
  onConnect: OnConnect;
  onConnectStart: OnConnectStart;
  onConnectEnd: OnConnectEnd;
}) {
    return (
        <LayoutFlow 
            initialNodes={conceptNodes} 
            initialEdges={conceptEdges} 
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
        />
    );
}
