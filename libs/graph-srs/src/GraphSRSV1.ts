// Internal node representation
interface GraphSRSV1NodeInternal {
  id: string;
  scores: number[];
  children: Set<string>;
  parents: Set<string>;
}

// Public interface for adding nodes
export interface GraphSRSV1Node {
  id: string;
  scores?: number[];
}

// Configuration for node addition
export interface GraphSRSV1NodeConfig {
  overwriteIfExists?: boolean;
}

// Default node configuration
const DEFAULT_NODE_CONFIG: GraphSRSV1NodeConfig = {
  overwriteIfExists: true
};

// Edge direction type
export type GraphSRSV1EdgeDirection = 'to_child' | 'to_parent';

// Edge parameters for adding a single edge
export interface GraphSRSV1EdgeParams {
  fromId: string;
  toId: string;
  direction: GraphSRSV1EdgeDirection;
  id: string;
  config?: GraphSRSV1EdgeConfig;
}

// Configuration for edge addition
export interface GraphSRSV1EdgeConfig {
  createRefsIfNotExistent?: boolean;
}

// Default edge configuration
const DEFAULT_EDGE_CONFIG: GraphSRSV1EdgeConfig = {
  createRefsIfNotExistent: true
};

// Result interface
interface NodeResult {
  id: string;
  all_scores: number[];
  direct_score: number;
  full_score: number;
  descendants: string[]; // List of all descendants (including self)
}

export class GraphSRSV1Runner {
  private nodes: Map<string, GraphSRSV1NodeInternal>;
  private edgeIds: Map<string, string>; // Map of "fromId->toId" to edge ID

  constructor() {
    this.nodes = new Map();
    this.edgeIds = new Map();
  }

  // Add a node to the DAG (no relationships)
  addNode(node: GraphSRSV1Node, config: GraphSRSV1NodeConfig = DEFAULT_NODE_CONFIG): void {
    const { id, scores = [] } = node;
    const { overwriteIfExists } = { ...DEFAULT_NODE_CONFIG, ...config };
    
    // Check if node already exists
    if (this.nodes.has(id) && !overwriteIfExists) {
      console.warn(`Node ${id} already exists and overwriteIfExists is false, skipping`);
      return; // Skip if node exists and overwrite is not enabled
    }
    
    // If node exists, preserve its relationships
    const existingNode = this.nodes.get(id);
    const children = existingNode ? existingNode.children : new Set<string>();
    const parents = existingNode ? existingNode.parents : new Set<string>();
    
    // Create or update the node
    this.nodes.set(id, {
      id,
      scores,
      children,
      parents
    });
  }
  
  // Add an edge between two nodes
  addEdge(params: GraphSRSV1EdgeParams): void {
    const { fromId, toId, direction, id, config = DEFAULT_EDGE_CONFIG } = params;
    const { createRefsIfNotExistent } = { ...DEFAULT_EDGE_CONFIG, ...config };
    
    // Create nodes if they don't exist and createRefsIfNotExistent is true
    if (!this.nodes.has(fromId)) {
      if (createRefsIfNotExistent) {
        this.addNode({ id: fromId });
      } else {
        throw new Error(`Node ${fromId} not found and createRefsIfNotExistent is false`);
      }
    }
    
    if (!this.nodes.has(toId)) {
      if (createRefsIfNotExistent) {
        this.addNode({ id: toId });
      } else {
        throw new Error(`Node ${toId} not found and createRefsIfNotExistent is false`);
      }
    }
    
    // Get the nodes
    const fromNode = this.nodes.get(fromId)!;
    const toNode = this.nodes.get(toId)!;
    
    // Set up the relationship based on direction
    if (direction === 'to_child') {
      // fromNode has toNode as a child
      fromNode.children.add(toId);
      toNode.parents.add(fromId);
      
      // Store the edge ID
      this.edgeIds.set(`${fromId}->${toId}`, id);
    } else {
      // fromNode has toNode as a parent
      fromNode.parents.add(toId);
      toNode.children.add(fromId);
      
      // Store the edge ID
      this.edgeIds.set(`${toId}->${fromId}`, id);
    }
  }
  
  // Add multiple edges from one source node
  addEdges(fromId: string, toIds: string[], direction: GraphSRSV1EdgeDirection, edgeIds: string[], config: GraphSRSV1EdgeConfig = DEFAULT_EDGE_CONFIG): void {
    if (toIds.length !== edgeIds.length) {
      throw new Error(`Number of target nodes (${toIds.length}) does not match number of edge IDs (${edgeIds.length})`);
    }
    
    for (let i = 0; i < toIds.length; i++) {
      this.addEdge({
        fromId,
        toId: toIds[i],
        direction,
        id: edgeIds[i],
        config
      });
    }
  }
  
  // Get an edge ID by its from and to node IDs
  getEdgeId(fromId: string, toId: string): string | undefined {
    return this.edgeIds.get(`${fromId}->${toId}`);
  }

  getNumRoots(): number {
    return Array.from(this.nodes.values()).filter(node => node.parents.size === 0).length;
  }

  getRootIds(): string[] {
    return Array.from(this.nodes.values()).filter(node => node.parents.size === 0).map(node => node.id);
  }

  // Calculate the first path to a top-level parent, by recursively getting the first parent 
  firstParentPath(fromId: string): string[] {
    const node = this.nodes.get(fromId);
    if (!node) {
      throw new Error(`Node ${fromId} not found`);
    }

    const firstParent = node.parents.values()?.next()?.value;

    if (!firstParent) {
      return [fromId];
    }

    return [...this.firstParentPath(firstParent), fromId];
  }

  private calculateAverage(scores: number[]): number {
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  // Phase 1: Collect all descendants for each node
  private collectAllDescendants(): Map<string, Set<string>> {
    // Validate all nodes exist
    for (const node of Array.from(this.nodes.values())) {
      for (const childId of Array.from(node.children)) {
        if (!this.nodes.has(childId)) {
          throw new Error(`Node ${childId} not found`);
        }
      }
    }

    const allDescendants = new Map<string, Set<string>>();
    
    const getDescendants = (nodeId: string, visited = new Set<string>()): Set<string> => {
      // Check for cycles
      if (visited.has(nodeId)) {
        return new Set(); // In case of cycle, return empty set
      }
      
      // If we've already calculated descendants for this node, return them
      if (allDescendants.has(nodeId)) {
        return allDescendants.get(nodeId)!;
      }
      
      // Mark this node as visited in current path
      visited.add(nodeId);
      
      const node = this.nodes.get(nodeId)!;
      
      // Start with just this node
      const descendants = new Set<string>([nodeId]);
      
      // Add all children and their descendants
      for (const childId of Array.from(node.children)) {
        const childDescendants = getDescendants(childId, new Set(visited));
        for (const descendant of Array.from(childDescendants)) {
          descendants.add(descendant);
        }
      }
      
      // Store and return the result
      allDescendants.set(nodeId, descendants);
      return descendants;
    };
    
    // Process all nodes
    for (const nodeId of Array.from(this.nodes.keys())) {
      if (!allDescendants.has(nodeId)) {
        getDescendants(nodeId);
      }
    }
    
    return allDescendants;
  }
  
  // Phase 2: Calculate scores based on descendants
  private calculateScores(allDescendants: Map<string, Set<string>>): Map<string, number[]> {
    const allScores = new Map<string, number[]>();
    
    for (const [nodeId, descendants] of Array.from(allDescendants.entries())) {
      // Collect scores from all descendants
      const scores: number[] = [];
      
      for (const descendantId of Array.from(descendants)) {
        const descendantNode = this.nodes.get(descendantId);
        if (descendantNode) {
          scores.push(...descendantNode.scores);
        }
      }
      
      allScores.set(nodeId, scores);
    }
    
    return allScores;
  }

  collectAllScores(): Map<string, number[]> {
    // Phase 1: Collect all descendants
    const allDescendants = this.collectAllDescendants();
    
    // Phase 2: Calculate scores based on descendants
    return this.calculateScores(allDescendants);
  }
  
  // Calculate both direct_score and full_score
  calculateNodeScores(): Map<string, NodeResult> {
    const allScores = this.collectAllScores();
    const allDescendants = this.collectAllDescendants();
    const nodeResults = new Map<string, NodeResult>();
    
    for (const [nodeId, scores] of Array.from(allScores.entries())) {
      const node = this.nodes.get(nodeId)!;
      const directScore = this.calculateAverage(node.scores);
      const fullScore = this.calculateAverage(scores);
      const descendants = Array.from(allDescendants.get(nodeId) || new Set<string>());
      
      nodeResults.set(nodeId, {
        id: nodeId,
        all_scores: scores,
        direct_score: directScore,
        full_score: fullScore,
        descendants
      });
    }
    
    return nodeResults;
  }
}