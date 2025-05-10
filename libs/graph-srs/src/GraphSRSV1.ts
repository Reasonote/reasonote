/**
 * Evaluation types with their corresponding difficulties
 */
export enum EvaluationType {
  FLASHCARD = 'flashcard',
  MULTIPLE_CHOICE = 'multiple_choice',
  FILL_IN_BLANK = 'fill_in_blank',
  SHORT_ANSWER = 'short_answer',
  FREE_RECALL = 'free_recall',
  APPLICATION = 'application'
}

/**
 * Default difficulty values for evaluation types
 */
export const EVALUATION_DIFFICULTY: Record<EvaluationType, number> = {
  [EvaluationType.FLASHCARD]: 0.2,
  [EvaluationType.MULTIPLE_CHOICE]: 0.2,
  [EvaluationType.FILL_IN_BLANK]: 0.4,
  [EvaluationType.SHORT_ANSWER]: 0.6,
  [EvaluationType.FREE_RECALL]: 0.8,
  [EvaluationType.APPLICATION]: 0.9
};

/**
 * Record of a single review/test of a concept
 */
export interface EvalRecord {
  /** When the review occurred (epoch ms) */
  timestamp: number;
  /** Score in 0-1 range (0 = complete failure, 1 = perfect recall) */
  score: number;
  /** Type of evaluation used */
  evaluationType: string;
  /** Difficulty factor of the evaluation method */
  evaluationDifficulty: number;
  /** Memory stability after this review (in seconds) */
  stability?: number;
  /** Recall probability at time of review (0-1) */
  retrievability?: number;
}

/**
 * Parameters for the scheduling algorithm
 */
export interface SchedulingParams {
  /** Target forgetting index (0-100) - default 10% */
  forgettingIndex?: number;
  /** Target retrievability (0-1) - default 0.9 */
  targetRetrievability?: number;
  /** Interval fuzz factor (0-1) - default 0.1 (±10%) */
  fuzzFactor?: number;
  /** Mastery threshold in days - default 21 */
  masteryThresholdDays?: number;
  /** Score threshold below which to use rapid review scheduling - default 0.2 */
  rapidReviewScoreThreshold?: number;
  /** Minimum minutes to wait for rapid review - default 5 */
  rapidReviewMinMinutes?: number;
  /** Maximum minutes to wait for rapid review - default 15 */
  rapidReviewMaxMinutes?: number;
}

/**
 * Default scheduling parameters
 */
const DEFAULT_SCHEDULING_PARAMS: SchedulingParams = {
  forgettingIndex: 10,
  targetRetrievability: 0.9,
  fuzzFactor: 0.1,
  masteryThresholdDays: 21,
  rapidReviewScoreThreshold: 0.2,
  rapidReviewMinMinutes: 5,
  rapidReviewMaxMinutes: 15
};

/**
 * Helper function to convert minutes to milliseconds
 */
function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

/**
 * Internal node representation used within the GraphSRS system
 * Contains both node data and relationship information
 */
interface GraphSRSV1NodeInternal {
  /** Unique identifier for the node */
  id: string;
  /** Complete evaluation history */
  evalHistory: EvalRecord[];
  /** Calculated difficulty (0-1 range) */
  difficulty: number;
  /** Whether this concept is mastered */
  isMastered: boolean;
  /** Optional override for mastery status */
  masteryOverride: boolean | null;
  /** When this concept should be reviewed next */
  nextReviewTime: number | null;
  /** Set of child node IDs - THESE ARE PREREQUISITES OF THIS NODE */
  children: Set<string>;
  /** Set of parent node IDs - THESE ARE DEPENDENT ON THIS NODE */
  parents: Set<string>;
}

/**
 * Public interface for adding nodes to the graph
 * Only requires ID and optional evaluation history
 */
export interface GraphSRSV1Node {
  /** Unique identifier for the node */
  id: string;
  /** Optional evaluation  history */
  evalHistory?: EvalRecord[];
  /** Optional mastery override */
  masteryOverride?: boolean;
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
 * - to_child: fromNode is parent of toNode, toNode is a prerequisite of fromNode
 * - to_parent: fromNode is child of toNode, fromNode is a prerequisite of toNode
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
export interface NodeResult {
  /** Node identifier */
  id: string;
  /** All normalized scores from this node and its descendants */
  all_scores: number[];
  /** Average of this node's own scores */
  direct_score: number;
  /** Average of all scores from the node and its descendants */
  full_score: number;
  /** List of all descendants (including self) */
  descendants: string[];
  /** Current memory stability in seconds */
  stability: number;
  /** Current retrievability (0-1) */
  retrievability: number;
  /** Whether this node is considered mastered */
  isMastered: boolean;
  /** Time when this node should be reviewed next */
  nextReviewTime: number | null;
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
  /** Scheduling parameters */
  private schedulingParams: SchedulingParams;

  /**
   * Creates a new instance of GraphSRSV1Runner with empty nodes and edges
   * @param params - Optional scheduling parameters
   */
  constructor(params?: SchedulingParams) {
    this.nodes = new Map();
    this.edgeIds = new Map();
    this.schedulingParams = { ...DEFAULT_SCHEDULING_PARAMS, ...params };
  }

  /**
   * Adds a node to the graph without any relationships
   * If the node already exists, its relationships are preserved
   * 
   * @param node - The node to add
   * @param config - Configuration options for node addition
   */
  addNode(node: GraphSRSV1Node, config: GraphSRSV1NodeConfig = DEFAULT_NODE_CONFIG): void {
    const { id, evalHistory = [], masteryOverride = null } = node;
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
    
    // Process history to fill in calculated fields
    const processedHistory = this.preprocessEvaluationHistory(evalHistory);
    
    // Calculate difficulty
    const difficulty = this.calculateDifficulty(processedHistory);
    
    // Calculate mastery status
    const isMastered = masteryOverride !== null
      ? masteryOverride
      : this.calculateIsMastered(processedHistory);
    
    // Calculate next review time
    const nextReviewTime = this.calculateNextReviewTime(processedHistory);
    
    // Create or update the node
    this.nodes.set(id, {
      id,
      evalHistory: processedHistory,
      difficulty,
      isMastered,
      masteryOverride,
      nextReviewTime,
      children,
      parents
    });
  }
  
  /**
   * Preprocesses evaluation history to ensure all calculated fields are present
   * 
   * @param history - Raw evaluation history
   * @returns Processed evaluation history with all calculated fields
   */
  private preprocessEvaluationHistory(history: EvalRecord[]): EvalRecord[] {
    if (history.length === 0) return [];
    
    // Sort by timestamp (earliest first)
    const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);
    
    // Track running stability value
    let prevStability = 0;
    
    // Process each record sequentially
    return sortedHistory.map((record, index) => {
      // Clone the record to avoid mutating the input
      const processedRecord = { ...record };
      
      // Calculate retrievability if missing
      if (processedRecord.retrievability === undefined) {
        if (index === 0) {
          // First exposure has no previous stability to base retrievability on
          processedRecord.retrievability = 0.5; // Initial 50/50 chance for new material
        } else {
          const elapsed = (processedRecord.timestamp - sortedHistory[index-1].timestamp) / 1000;
          processedRecord.retrievability = this.calculateRetrievability(prevStability, elapsed);
        }
      }
      
      // Calculate stability if missing
      if (processedRecord.stability === undefined) {
        processedRecord.stability = this.calculateNewStability(
          prevStability, 
          processedRecord.retrievability, 
          processedRecord.score,
          processedRecord.evaluationDifficulty
        );
      }
      
      // Update for next iteration
      prevStability = processedRecord.stability;
      
      return processedRecord;
    });
  }

  /**
   * Normalizes a score based on the evaluation difficulty
   * @param score Raw score (0-1)
   * @param evaluationDifficulty Difficulty factor of evaluation (0-1)
   * @returns Normalized score (0-1)
   */
  private normalizeScore(score: number, evaluationDifficulty: number): number {
    return score * (1 - evaluationDifficulty/2);
  }

  /**
   * Adds a score record for a node and updates its memory model
   * @param nodeId Node identifier
   * @param score Score value (0-1)
   * @param evaluationType Type of evaluation used
   * @param timestamp Optional timestamp (defaults to now)
   */
  addScore(
    nodeId: string, 
    score: number, 
    evaluationType: string = EvaluationType.MULTIPLE_CHOICE,
    timestamp: number = Date.now()
  ): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    
    // Determine evaluation difficulty
    const evaluationDifficulty = EVALUATION_DIFFICULTY[evaluationType as EvaluationType] || 0.5;
    
    // Create new record
    const newRecord: EvalRecord = {
      timestamp,
      score,
      evaluationType,
      evaluationDifficulty
    };
    
    // Add to history
    const updatedHistory = [...node.evalHistory, newRecord];
    
    // Process history
    const processedHistory = this.preprocessEvaluationHistory(updatedHistory);
    
    // Update node properties
    node.evalHistory = processedHistory;
    node.difficulty = this.calculateDifficulty(processedHistory);
    node.isMastered = node.masteryOverride !== null
      ? node.masteryOverride
      : this.calculateIsMastered(processedHistory);
    node.nextReviewTime = this.calculateNextReviewTime(processedHistory);
  }
  
  /**
   * Adds an edge between two nodes in the graph
   * Creates nodes if they don't exist (based on configuration)
   * 
   * IMPORTANT: In our knowledge graph, children are PREREQUISITES of their parents.
   * This means:
   * - A parent node depends on its children being mastered first
   * - A child must be mastered before its parents can be effectively learned
   * - When using 'to_child' direction, you're saying the toId node is a prerequisite of fromId
   * - When using 'to_parent' direction, you're saying the fromId node is a prerequisite of toId
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
   * @param visited - Set of already visited node IDs to prevent infinite cycles
   * @returns Array representing the path from root ancestor to the node
   */
  firstParentPath(fromId: string, visited: Set<string> = new Set()): string[] {
    const node = this.nodes.get(fromId);
    if (!node) {
      throw new Error(`Node ${fromId} not found`);
    }

    // Check for cycles
    if (visited.has(fromId)) {
      return [fromId]; // Break the cycle by returning just this node
    }

    // Add current node to visited set
    visited.add(fromId);

    const firstParent = Array.from(node.parents)[0];

    if (!firstParent) {
      return [fromId];
    }

    return [...this.firstParentPath(firstParent, visited), fromId];
  }

  /**
   * Calculates retrievability based on stability and time elapsed
   * @param stability Stability in seconds
   * @param elapsedSeconds Time elapsed since last review
   * @returns Retrievability (0-1)
   */
  private calculateRetrievability(stability: number, elapsedSeconds: number): number {
    if (stability === 0) return 0;
    
    // Using exponential forgetting curve from SM-17
    return Math.exp(-elapsedSeconds / stability);
  }

  /**
   * Calculates new stability based on previous stability, retrievability, and score
   * @param prevStability Previous stability in seconds
   * @param retrievability Retrievability at time of review
   * @param score Raw score (0-1)
   * @param evaluationDifficulty Difficulty of evaluation method
   * @returns New stability in seconds
   */
  private calculateNewStability(
    prevStability: number, 
    retrievability: number, 
    score: number,
    evaluationDifficulty: number
  ): number {
    // Normalize score based on evaluation difficulty
    const normalizedScore = this.normalizeScore(score, evaluationDifficulty);
    
    // For first review with no previous stability
    if (prevStability === 0) {
      // Convert score to days, then to seconds
      // A perfect normalized score gives ~5 days
      const startupStabilityDays = normalizedScore * 5;
      return startupStabilityDays * 24 * 60 * 60;
    }
    
    // Calculate stability increase factor
    const stabilityIncrease = this.calculateStabilityIncrease(
      retrievability,
      normalizedScore
    );
    
    return prevStability * stabilityIncrease;
  }

  /**
   * Calculates stability increase factor
   * @param retrievability Retrievability at time of review
   * @param normalizedScore Normalized score (0-1)
   * @returns Stability increase factor
   */
  private calculateStabilityIncrease(
    retrievability: number,
    normalizedScore: number
  ): number {
    // If item was forgotten (score < 0.6), small increase or reset
    if (normalizedScore < 0.6) {
      return normalizedScore / 0.6; // Linear scale from 0 to 1
    }
    
    // If retrievability was too high (premature review), smaller increase
    if (retrievability > 0.9) {
      return 1 + (normalizedScore * 0.5);
    }
    
    // Optimal review timing
    // Maximum increase based on optimal retrievability
    const optimalR = 0.7; // Optimum retrievability for maximum memory strengthening
    const rFactor = 1 - Math.abs(retrievability - optimalR) / optimalR;
    const maxIncrease = 5;
    
    // Scale by score and retrievability factor
    return 1 + (normalizedScore * rFactor * (maxIncrease - 1));
  }

  /**
   * Calculates difficulty based on review performance
   * @param evalHistory Array of repetition records
   * @returns Difficulty value (0-1)
   */
  private calculateDifficulty(evalHistory: EvalRecord[]): number {
    if (evalHistory.length === 0) return 0.5; // Default medium difficulty
    
    // Calculate normalized scores
    const normalizedScores = evalHistory.map(record => 
      this.normalizeScore(record.score, record.evaluationDifficulty)
    );
    
    // Higher scores mean easier items, so invert
    const avgNormalizedScore = this.calculateAverage(normalizedScores);
    
    // Apply scaling to center difficulty values
    const difficulty = 1 - avgNormalizedScore;
    
    // Clamp between 0.1 and 0.9 to avoid extremes
    return Math.max(0.1, Math.min(0.9, difficulty));
  }

  /**
   * Determines if a node is mastered based on stability and recent scores
   * @param evalHistory Array of repetition records
   * @returns Whether the node is mastered
   */
  private calculateIsMastered(evalHistory: EvalRecord[]): boolean {
    // Need at least 3 reviews to determine mastery
    if (evalHistory.length < 3) return false;
    
    // Get current stability from most recent review
    const latestEntry = evalHistory[evalHistory.length - 1];
    const currentStability = latestEntry.stability || 0;
    
    // Calculate mastery threshold
    const { masteryThresholdDays = 21 } = this.schedulingParams;
    const baseThreshold = masteryThresholdDays * 24 * 60 * 60; // Convert days to seconds
    
    // Check if stability exceeds threshold
    const hasStability = currentStability >= baseThreshold;
    
    // Check if recent scores are consistently high
    const recentRecords = evalHistory.slice(-3);
    const recentScores = recentRecords.map(record => 
      this.normalizeScore(record.score, record.evaluationDifficulty)
    );
    const avgRecentScore = this.calculateAverage(recentScores);
    const hasHighScores = avgRecentScore >= 0.8;
    
    return hasStability && hasHighScores;
  }

  /**
   * Calculates the next review time for repetition history
   * @param evalHistory Array of repetition records
   * @returns Next review time as epoch ms or null if no history
   */
  private calculateNextReviewTime(evalHistory: EvalRecord[]): number | null {
    // No history = no review time
    if (evalHistory.length === 0) return null;
    
    // Get current stability
    const latestEntry = evalHistory[evalHistory.length - 1];
    const currentStability = latestEntry.stability || 0;
    
    // If no stability yet, no review time
    if (currentStability === 0) return null;
    
    // Calculate interval based on stability and target retrievability
    const { 
      targetRetrievability = 0.9, 
      fuzzFactor = 0.1,
      rapidReviewScoreThreshold = 0.2,
      rapidReviewMinMinutes = 5,
      rapidReviewMaxMinutes = 15
    } = this.schedulingParams;
    
    // Get the latest score
    const latestScore = latestEntry.score;
    
    // If score is very poor (close to 0), schedule a very short interval
    // This ensures quick reinforcement of struggling concepts
    if (latestScore <= rapidReviewScoreThreshold) {
      // Schedule review in rapidReviewMinMinutes to rapidReviewMaxMinutes
      const minutes = rapidReviewMinMinutes + Math.random() * (rapidReviewMaxMinutes - rapidReviewMinMinutes);
      return latestEntry.timestamp + minutesToMs(minutes);
    }
    
    // For better scores, use the normal stability-based scheduling
    // Rearranging the retrievability formula: R = exp(-t/S)
    // To solve for t: t = -S * ln(R)
    const interval = -currentStability * Math.log(targetRetrievability);
    
    // Apply interval fuzz to prevent clustering
    const fuzz = 1 + (Math.random() * 2 - 1) * fuzzFactor;
    const fuzzedInterval = interval * fuzz;
    
    return latestEntry.timestamp + fuzzedInterval;
  }

  /**
   * Sets the mastery override for a node
   * @param nodeId Node identifier
   * @param isMastered Whether to consider the node mastered
   */
  setMasteryOverride(nodeId: string, isMastered: boolean): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    
    node.masteryOverride = isMastered;
    node.isMastered = isMastered;
  }

  /**
   * Clears the mastery override for a node
   * @param nodeId Node identifier
   */
  clearMasteryOverride(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    
    node.masteryOverride = null;
    node.isMastered = this.calculateIsMastered(node.evalHistory);
  }

  /**
   * Gets nodes that are ready for review
   * @returns Array of node IDs ready for review
   */
  getNodesReadyForReview(): string[] {
    const now = Date.now();
    const readyNodes: string[] = [];
    
    // Use direct key access instead of entries() iterator
    this.nodes.forEach((node, nodeId) => {
      // A node is ready for review if:
      // 1. It has never been reviewed (empty evalHistory) OR
      // 2. Its next review time has passed
      const isDueForReview = node.evalHistory.length === 0 || 
        (node.nextReviewTime !== null && node.nextReviewTime <= now);
      
      if (isDueForReview) {
        // Check if all prerequisites are mastered
        if (this.areAllPrerequisitesMastered(nodeId)) {
          readyNodes.push(nodeId);
        }
      }
    });
    
    return readyNodes;
  }

  /**
   * Checks if all prerequisites of a node are mastered
   * 
   * IMPORTANT: In our model, a node's CHILDREN are its prerequisites.
   * This is the opposite of many traditional tree structures where parents
   * come before children, but it makes sense in a learning context:
   * you need to master prerequisites (children) before learning advanced concepts (parents).
   * 
   * @param nodeId Node identifier
   * @returns True if all prerequisites (children) are mastered
   */
  areAllPrerequisitesMastered(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    
    // Check if all children (prerequisites) are mastered
    for (const childId of Array.from(node.children)) {
      const child = this.nodes.get(childId);
      if (child && !child.isMastered) {
        return false;
      }
    }
    
    return true;
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
   * Gets the current retrievability for a node
   * @param nodeId Node identifier
   * @returns Current retrievability or null if no history
   */
  getCurrentRetrievability(nodeId: string): number | null {
    const node = this.nodes.get(nodeId);
    if (!node || node.evalHistory.length === 0) {
      return null;
    }
    
    const latestRecord = node.evalHistory[node.evalHistory.length - 1];
    const stability = latestRecord.stability || 0;
    
    if (stability === 0) return null;
    
    const elapsed = (Date.now() - latestRecord.timestamp) / 1000;
    return this.calculateRetrievability(stability, elapsed);
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
          scores.push(...descendantNode.evalHistory.map(r => r.score));
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
   * - Also includes memory model metrics and the complete list of descendants
   * 
   * @returns Map of node IDs to NodeResult objects containing the metrics
   */
  calculateNodeScores(): Map<string, NodeResult> {
    const allScores = this.collectAllScores();
    const allDescendants = this.collectAllDescendants();
    const nodeResults = new Map<string, NodeResult>();
    
    for (const [nodeId, scores] of Array.from(allScores.entries())) {
      const node = this.nodes.get(nodeId)!;
      const directScore = this.calculateAverage(
        node.evalHistory.map(r => r.score)
      );
      const fullScore = this.calculateAverage(scores);
      const descendants = Array.from(allDescendants.get(nodeId) || new Set<string>());
      
      // Get current stability
      const stability = node.evalHistory.length > 0
        ? (node.evalHistory[node.evalHistory.length - 1].stability || 0)
        : 0;
      
      // Get current retrievability
      const retrievability = this.getCurrentRetrievability(nodeId) || 0;
      
      nodeResults.set(nodeId, {
        id: nodeId,
        all_scores: scores,
        direct_score: directScore,
        full_score: fullScore,
        descendants,
        stability,
        retrievability,
        isMastered: node.isMastered,
        nextReviewTime: node.nextReviewTime
      });
    }
    
    return nodeResults;
  }
}