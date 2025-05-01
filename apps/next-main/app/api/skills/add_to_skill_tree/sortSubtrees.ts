type Graph = Map<string, { outNodes: string[], inDegree: number }>;

function identifySubtrees(graph: Graph): string[][] {
  const visited = new Set<string>();
  const result: string[][] = [];

  const dfs = (node: string, path: string[] = []) => {
    path.push(node);
    visited.add(node);
    graph.get(node)?.outNodes.forEach((next) => {
      if (!visited.has(next)) {
        dfs(next, path);
      }
    });
  };

  graph.forEach((value, node) => {
    if (value.inDegree === 0) { // Starting node of a subtree
      const path: string[] = [];
      dfs(node, path);
      result.push(path);
    }
  });

  return result;
}

function createGraph(paths: string[][]): Graph {
  const graph = new Map<string, { outNodes: string[], inDegree: number }>();

  paths.forEach(path => {
    for (let i = 0; i < path.length; i++) {
      if (!graph.has(path[i])) {
        graph.set(path[i], { outNodes: [], inDegree: 0 });
      }
      if (i < path.length - 1) {
        graph.get(path[i])!.outNodes.push(path[i + 1]);
        if (!graph.has(path[i + 1])) {
          graph.set(path[i + 1], { outNodes: [], inDegree: 0 });
        }
        graph.get(path[i + 1])!.inDegree += 1;
      }
    }
  });

  return graph;
}

export function sortSubtrees(paths: string[][]): string[][] {
  const graph = createGraph(paths);
  return identifySubtrees(graph);
}
