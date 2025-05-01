import "reactflow/dist/style.css";

import React, {
  useCallback,
  useEffect,
  useMemo,
} from "react";

import ReactFlow, {
  MarkerType,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";

import Dagre from "@dagrejs/dagre";

import {ConceptWithPrerequisites} from "../exercise/PracticeSession";
import {ConceptTreeNode} from "./ConceptTreeNode";

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
      // type: 'conceptNode',
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
  conceptNode: ConceptTreeNode,
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
}: {
  initialNodes: any;
  initialEdges: any;
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
    if (!initialEdges.length || !initialEdges.length) {
      return;
    }

    const layouted = getLayoutedElements(initialNodes, initialEdges, {
      direction: "TB",
    });

    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);

    window.requestAnimationFrame(() => {
      fitView();
    });
  }, [initialNodes, initialEdges]);

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
      >
        <Panel position="top-right">
          <button onClick={() => onLayout("TB")}>vertical layout</button>
          <button onClick={() => onLayout("LR")}>horizontal layout</button>
        </Panel>
      </ReactFlow>
    </>
  );
};

export function ConceptTree({
  concepts,
}: {
  concepts: ConceptWithPrerequisites[];
}) {
  const { nodes: conceptNodes, edges: conceptEdges } = useMemo(() => {
    return conceptsToGraph(concepts);
  }, [concepts]);

  return (
    // @ts-ignore
    <ReactFlowProvider>
      <LayoutFlow initialNodes={conceptNodes} initialEdges={conceptEdges} />
    </ReactFlowProvider>
  );
}
