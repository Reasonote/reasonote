/**
 * Internal node representation used within the GraphSRS system
 * Contains both node data and relationship information
 */
interface GraphSRSV1NodeInternal {
  /** Unique identifier for the node */
  id: string;
  /** Array of score values associated with this node */
  scores: number[];
  /** Set of child node IDs */
  children: Set<string>;
  /** Set of parent node IDs */
  parents: Set<string>;
}

/**
 * Public interface for adding nodes to the graph
 * Only requires ID and optional scores
 */
export interface GraphSRSV1Node {
  /** Unique identifier for the node */
  id: string;
  /** Optional array of score values */
  scores?: number[];
}

/**
 * Configuration options for node addition
 */
export interface GraphSRSV1NodeConfig {
  /** Whether to overwrite an existing node with the same ID */
  overwriteIfExists?: boolean;
}

/**
 * Default configuration for node addition
 */
const DEFAULT_NODE_CONFIG: GraphSRSV1NodeConfig = {
  overwriteIfExists: true
};

/**
 * Edge direction type defining relationship orientation
 * - to_child: fromNode is parent of toNode
 * - to_parent: fromNode is child of toNode
 */
export type GraphSRSV1EdgeDirection = 'to_child' | 'to_parent';

/**
 * Parameters required for adding a single edge to the graph
 */
export interface GraphSRSV1EdgeParams {
  /** ID of the source node */
  fromId: string;
  /** ID of the target node */
  toId: string;
  /** Direction of the relationship */
  direction: GraphSRSV1EdgeDirection;
  /** Unique identifier for the edge */
  id: string;
  /** Optional configuration for edge creation */
  config?: GraphSRSV1EdgeConfig;
}

/**
 * Configuration options for edge addition
 */
export interface GraphSRSV1EdgeConfig {
  /** Whether to create nodes if they don't exist */
  createRefsIfNotExistent?: boolean;
}

/**
 * Default configuration for edge addition
 */
const DEFAULT_EDGE_CONFIG: GraphSRSV1EdgeConfig = {
  createRefsIfNotExistent: true
};

/**
 * Result interface containing node score calculations and relationships
 */
interface NodeResult {
  /** Node identifier */
  id: string;
  /** All scores from this node and its descendants */
  all_scores: number[];
  /** Average of this node's own scores */
  direct_score: number;
  /** Average of all scores from this node and its descendants */
  full_score: number;
  /** List of all descendants (including self) */
  descendants: string[];
}

/**
 * GraphSRSV1Runner implements a directed acyclic graph (DAG) for a spaced repetition system
 * It manages nodes with scores and their parent-child relationships, and provides
 * methods to calculate various metrics based on the graph structure.
 */
export class GraphSRSV1Runner {
  /** Map of node IDs to their internal representation */
  private nodes: Map<string, GraphSRSV1NodeInternal>;
  /** Map of edge keys ("fromId->toId") to edge IDs */
  private edgeIds: Map<string, string>;

  /**
   * Creates a new instance of GraphSRSV1Runner with empty nodes and edges
   */
  constructor() {
    this.nodes = new Map();
    this.edgeIds = new Map();
  }

  /**
   * Adds a node to the graph without any relationships
   * If the node already exists, its relationships are preserved
   * 
   * @param node - The node to add
   * @param config - Configuration options for node addition
   */
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
  
  /**
   * Adds an edge between two nodes in the graph
   * Creates nodes if they don't exist (based on configuration)
   * 
   * @param params - Parameters for edge creation including source, target, direction, and ID
   */
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
  
  /**
   * Adds multiple edges from one source node to multiple target nodes
   * 
   * @param fromId - ID of the source node
   * @param toIds - Array of target node IDs
   * @param direction - Direction of the relationships
   * @param edgeIds - Array of edge IDs (must match length of toIds)
   * @param config - Configuration options for edge addition
   */
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
  
  /**
   * Gets the ID of an edge between two nodes
   * 
   * @param fromId - ID of the source node
   * @param toId - ID of the target node
   * @returns The edge ID if found, otherwise undefined
   */
  getEdgeId(fromId: string, toId: string): string | undefined {
    return this.edgeIds.get(`${fromId}->${toId}`);
  }

  /**
   * Gets the number of root nodes in the graph
   * Root nodes are defined as nodes with no parents
   * 
   * @returns Number of root nodes
   */
  getNumRoots(): number {
    return Array.from(this.nodes.values()).filter(node => node.parents.size === 0).length;
  }

  /**
   * Gets the IDs of all root nodes in the graph
   * Root nodes are defined as nodes with no parents
   * 
   * @returns Array of root node IDs
   */
  getRootIds(): string[] {
    return Array.from(this.nodes.values()).filter(node => node.parents.size === 0).map(node => node.id);
  }

  /**
   * Calculates the first path to a top-level parent by recursively getting the first parent
   * Returns a path from the root ancestor to the specified node
   * 
   * @param fromId - ID of the starting node
   * @returns Array representing the path from root ancestor to the node
   */
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

  /**
   * Calculates the average of an array of scores
   * Returns 0 if array is empty
   * 
   * @param scores - Array of numerical scores
   * @returns Average of the scores, or 0 if empty
   */
  private calculateAverage(scores: number[]): number {
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Phase 1 of score calculation: Collects all descendants for each node
   * Handles cycles in the graph by returning empty sets for visited nodes
   * 
   * @returns Map of node IDs to their descendant sets (including self)
   */
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
  
  /**
   * Phase 2 of score calculation: Aggregates scores from descendants
   * For each node, collects scores from all its descendants
   * 
   * @param allDescendants - Map of node IDs to their descendant sets
   * @returns Map of node IDs to arrays of all relevant scores
   */
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

  /**
   * Collects all scores for each node from itself and all its descendants
   * This is a two-phase process:
   * 1. Collect all descendants for each node
   * 2. Collect scores from all descendants
   * 
   * @returns Map of node IDs to arrays of all relevant scores
   */
  collectAllScores(): Map<string, number[]> {
    // Phase 1: Collect all descendants
    const allDescendants = this.collectAllDescendants();
    
    // Phase 2: Calculate scores based on descendants
    return this.calculateScores(allDescendants);
  }
  
  /**
   * Calculates comprehensive score metrics for each node in the graph
   * For each node, calculates:
   * - direct_score: Average of the node's own scores
   * - full_score: Average of all scores from the node and its descendants
   * - Also includes the complete list of descendants and all scores
   * 
   * @returns Map of node IDs to NodeResult objects containing the metrics
   */
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