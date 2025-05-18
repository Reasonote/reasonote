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
 * Taxonomy levels (based on Bloom's taxonomy)
 */
export enum TaxonomyLevel {
  REMEMBER = 'remember',
  UNDERSTAND = 'understand',
  APPLY = 'apply',
  ANALYZE = 'analyze',
  EVALUATE = 'evaluate',
  CREATE = 'create'
}

/**
 * Maps taxonomy levels to their hierarchical dependencies
 */
export const TAXONOMY_LEVEL_DEPENDENCIES: Record<string, string | null> = {
  [TaxonomyLevel.REMEMBER]: null, // Base level
  [TaxonomyLevel.UNDERSTAND]: TaxonomyLevel.REMEMBER,
  [TaxonomyLevel.APPLY]: TaxonomyLevel.UNDERSTAND,
  [TaxonomyLevel.ANALYZE]: TaxonomyLevel.APPLY,
  [TaxonomyLevel.EVALUATE]: TaxonomyLevel.ANALYZE,
  [TaxonomyLevel.CREATE]: TaxonomyLevel.EVALUATE
};

/**
 * Maps taxonomy levels to their complexity (higher value = more complex)
 */
export const TAXONOMY_LEVEL_COMPLEXITY: Record<string, number> = {
  [TaxonomyLevel.REMEMBER]: 1,
  [TaxonomyLevel.UNDERSTAND]: 2,
  [TaxonomyLevel.APPLY]: 3,
  [TaxonomyLevel.ANALYZE]: 4,
  [TaxonomyLevel.EVALUATE]: 5,
  [TaxonomyLevel.CREATE]: 6
};

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
 * Default difficulty multipliers for each evaluation type and taxonomy level
 * These values represent how effectively each evaluation type tests each taxonomy level
 * 0 = not applicable, 1 = perfectly measures the level
 */
export const DEFAULT_DIFFICULTIES: Record<EvaluationType, Record<string, number>> = {
  [EvaluationType.FLASHCARD]: {
    [TaxonomyLevel.REMEMBER]: 0.9,
    [TaxonomyLevel.UNDERSTAND]: 0.4,
    [TaxonomyLevel.APPLY]: 0.1,
    [TaxonomyLevel.ANALYZE]: 0.0,
    [TaxonomyLevel.EVALUATE]: 0.0,
    [TaxonomyLevel.CREATE]: 0.0
  },
  [EvaluationType.MULTIPLE_CHOICE]: {
    [TaxonomyLevel.REMEMBER]: 0.8,
    [TaxonomyLevel.UNDERSTAND]: 0.6,
    [TaxonomyLevel.APPLY]: 0.3,
    [TaxonomyLevel.ANALYZE]: 0.2,
    [TaxonomyLevel.EVALUATE]: 0.1,
    [TaxonomyLevel.CREATE]: 0.0
  },
  [EvaluationType.FILL_IN_BLANK]: {
    [TaxonomyLevel.REMEMBER]: 0.9,
    [TaxonomyLevel.UNDERSTAND]: 0.7,
    [TaxonomyLevel.APPLY]: 0.4,
    [TaxonomyLevel.ANALYZE]: 0.2,
    [TaxonomyLevel.EVALUATE]: 0.1,
    [TaxonomyLevel.CREATE]: 0.0
  },
  [EvaluationType.SHORT_ANSWER]: {
    [TaxonomyLevel.REMEMBER]: 0.7,
    [TaxonomyLevel.UNDERSTAND]: 0.8,
    [TaxonomyLevel.APPLY]: 0.7,
    [TaxonomyLevel.ANALYZE]: 0.5,
    [TaxonomyLevel.EVALUATE]: 0.4,
    [TaxonomyLevel.CREATE]: 0.2
  },
  [EvaluationType.FREE_RECALL]: {
    [TaxonomyLevel.REMEMBER]: 0.9,
    [TaxonomyLevel.UNDERSTAND]: 0.8,
    [TaxonomyLevel.APPLY]: 0.6,
    [TaxonomyLevel.ANALYZE]: 0.5,
    [TaxonomyLevel.EVALUATE]: 0.3,
    [TaxonomyLevel.CREATE]: 0.1
  },
  [EvaluationType.APPLICATION]: {
    [TaxonomyLevel.REMEMBER]: 0.5,
    [TaxonomyLevel.UNDERSTAND]: 0.7,
    [TaxonomyLevel.APPLY]: 0.9,
    [TaxonomyLevel.ANALYZE]: 0.7,
    [TaxonomyLevel.EVALUATE]: 0.5,
    [TaxonomyLevel.CREATE]: 0.4
  }
};

/**
 * Interface for custom taxonomy definitions
 */
export interface CustomTaxonomy {
  name: string;
  levels: string[];
  dependencies: Record<string, string | null>;
  complexities: Record<string, number>;
}

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
  /** 
   * Difficulty factor of the evaluation method
   * Can be either:
   * - A single number (0-1) representing overall difficulty
   * - A record mapping taxonomy levels to difficulty multipliers (0-1)
   * Higher values mean the evaluation more effectively tests the given level
   */
  difficulty: number | Record<string, number>;
  /** Memory stability after this review (in seconds) */
  stability?: number;
  /** Recall probability at time of review (0-1) */
  retrievability?: number;
  
  // Legacy fields - kept for backward compatibility
  evaluationDifficulty?: number;
  taxonomyLevels?: Record<string, number>;
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
  /** Target taxonomy levels to aim for - default is just REMEMBER */
  targetTaxonomyLevels?: string[];
  /** Custom taxonomy definition - default is Bloom's taxonomy */
  customTaxonomy?: CustomTaxonomy;
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
  rapidReviewMaxMinutes: 15,
  targetTaxonomyLevels: [TaxonomyLevel.REMEMBER]
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
  /** Set of prerequisite node IDs - THESE ARE PREREQUISITES OF THIS NODE */
  prereqs: Set<string>;
  /** Set of postrequisite node IDs - THESE ARE DEPENDENT ON THIS NODE */
  postreqs: Set<string>;
  /** Direct mastery by taxonomy level (without inference) */
  directMasteryByLevel?: Record<string, boolean>;
  /** Mastery status by taxonomy level (with inference) */
  masteryByLevel?: Record<string, boolean>;
  /** Whether prerequisites are mastered for each taxonomy level */
  prereqsMasteredByLevel?: Record<string, boolean>;
  /** When to review this node next for each taxonomy level */
  nextReviewTimeByLevel?: Record<string, number | null>;
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
  /** Optional mastery override by taxonomy level */
  masteryOverrideByLevel?: Record<string, boolean>;
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
 * - to_prereq: fromNode is postreq of toNode, toNode is a prerequisite of fromNode
 * - to_postreq: fromNode is prereq of toNode, fromNode is a prerequisite of toNode
 */
export type GraphSRSV1EdgeDirection = 'to_prereq' | 'to_postreq';

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
  /** All normalized scores from this node and its prerequisites */
  all_scores: number[];
  /** Average of this node's own scores */
  direct_score: number;
  /** Average of all scores from the node and its prerequisites */
  full_score: number;
  /** List of all deep prerequisites (including self) */
  deepPrereqs: string[];
  /** Current memory stability in seconds */
  stability: number;
  /** Current retrievability (0-1) */
  retrievability: number;
  /** Whether this node is considered mastered */
  isMastered: boolean;
  /** Time when this node should be reviewed next */
  nextReviewTime: number | null;
  /** Mastery status by taxonomy level */
  masteryByLevel?: Record<string, boolean>;
  /** Whether prerequisites are mastered for each taxonomy level */
  prereqsMasteredByLevel?: Record<string, boolean>;
  /** When to review this node next for each taxonomy level */
  nextReviewTimeByLevel?: Record<string, number | null>;
  /** Recommended taxonomy level for review */
  recommendedTaxonomyLevel?: string | null;
}

/**
 * GraphSRSV1Runner implements a directed acyclic graph (DAG) for a spaced repetition system
 * It manages nodes with scores and their prerequisite/postrequisite relationships, and provides
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
   * Gets the taxonomy levels to use, either from custom taxonomy or default Bloom's
   */
  private getTaxonomyLevels(): string[] {
    const { customTaxonomy } = this.schedulingParams;
    return customTaxonomy ? customTaxonomy.levels : Object.values(TaxonomyLevel);
  }

  /**
   * Gets taxonomy level dependencies based on settings
   */
  private getTaxonomyLevelDependencies(): Record<string, string | null> {
    const { customTaxonomy } = this.schedulingParams;
    return customTaxonomy ? customTaxonomy.dependencies : TAXONOMY_LEVEL_DEPENDENCIES;
  }
  
  /**
   * Gets taxonomy level complexities based on settings
   */
  private getTaxonomyLevelComplexities(): Record<string, number> {
    const { customTaxonomy } = this.schedulingParams;
    return customTaxonomy ? customTaxonomy.complexities : TAXONOMY_LEVEL_COMPLEXITY;
  }

  /**
   * Normalizes difficulty to a standard taxonomy level map
   * Handles all input formats:
   * - Number (converts to equal values for all levels)
   * - Record (uses as is)
   * - Legacy format (converts from evaluationDifficulty + taxonomyLevels)
   * 
   * @param record - Evaluation record to normalize
   * @returns Record mapping taxonomy levels to difficulty values
   */
  private normalizeDifficulty(record: EvalRecord): Record<string, number> {
    const taxonomyLevels = this.getTaxonomyLevels();
    
    // Case 1: difficulty is already a record
    if (record.difficulty && typeof record.difficulty === 'object') {
      return {...record.difficulty};
    }
    
    // Case 2: difficulty is a number
    if (record.difficulty !== undefined && typeof record.difficulty === 'number') {
      // Create a record with the same value for all levels
      const result: Record<string, number> = {};
      for (const level of taxonomyLevels) {
        result[level] = record.difficulty;
      }
      return result;
    }
    
    // Case 3: Legacy format with taxonomyLevels
    if (record.taxonomyLevels) {
      return {...record.taxonomyLevels};
    }
    
    // Case 4: Legacy format with only evaluationDifficulty
    if (record.evaluationDifficulty !== undefined) {
      // Use default mapping for this evaluation type
      if (record.evaluationType in DEFAULT_DIFFICULTIES) {
        return {...DEFAULT_DIFFICULTIES[record.evaluationType as EvaluationType]};
      }
      
      // Fallback to same value for REMEMBER only
      return { [TaxonomyLevel.REMEMBER]: 0.9 };
    }
    
    // Case 5: Default - use defaults for evaluation type or safe fallback
    if (record.evaluationType in DEFAULT_DIFFICULTIES) {
      return {...DEFAULT_DIFFICULTIES[record.evaluationType as EvaluationType]};
    }
    
    // Final fallback - medium difficulty for REMEMBER only
    return { [TaxonomyLevel.REMEMBER]: 0.5 };
  }

  /**
   * Normalizes a score for a specific taxonomy level based on difficulty
   * @param score Raw score (0-1)
   * @param difficultyMultiplier How effectively this evaluation tests this taxonomy level (0-1)
   * @returns Normalized score for the taxonomy level (0-1)
   */
  private normalizeScoreForLevel(
    score: number, 
    difficultyMultiplier: number
  ): number {
    // Apply difficulty adjustment
    return score * difficultyMultiplier;
  }

  /**
   * Adds a node to the graph without any relationships
   * If the node already exists, its relationships are preserved
   * 
   * @param node - The node to add
   * @param config - Configuration options for node addition
   */
  addNode(node: GraphSRSV1Node, config: GraphSRSV1NodeConfig = DEFAULT_NODE_CONFIG): void {
    const { id, evalHistory = [], masteryOverride = null, masteryOverrideByLevel = {} } = node;
    const { overwriteIfExists } = { ...DEFAULT_NODE_CONFIG, ...config };
    
    // Check if node already exists
    if (this.nodes.has(id) && !overwriteIfExists) {
      console.warn(`Node ${id} already exists and overwriteIfExists is false, skipping`);
      return; // Skip if node exists and overwrite is not enabled
    }
    
    // If node exists, preserve its relationships
    const existingNode = this.nodes.get(id);
    const prereqs = existingNode ? existingNode.prereqs : new Set<string>();
    const postreqs = existingNode ? existingNode.postreqs : new Set<string>();
    
    // Preserve taxonomy level data if existing
    const existingDirectMasteryByLevel = existingNode?.directMasteryByLevel || {};
    const existingMasteryByLevel = existingNode?.masteryByLevel || {};
    const existingPrereqsMasteredByLevel = existingNode?.prereqsMasteredByLevel || {};
    const existingNextReviewTimeByLevel = existingNode?.nextReviewTimeByLevel || {};
    
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
    
    // Calculate taxonomy level masteries
    const directMasteryByLevel = this.calculateDirectMasteryByLevel(
      processedHistory, 
      existingDirectMasteryByLevel,
      masteryOverrideByLevel
    );
    
    // Calculate inferred masteries (harder to easier)
    const masteryByLevel = this.calculateInferredMasteryByLevel(
      directMasteryByLevel,
      existingMasteryByLevel,
      masteryOverrideByLevel
    );
    
    // Calculate next review times by level
    const nextReviewTimeByLevel = this.calculateNextReviewTimeByLevel(
      processedHistory,
      existingNextReviewTimeByLevel
    );
    
    // Create or update the node
    this.nodes.set(id, {
      id,
      evalHistory: processedHistory,
      difficulty,
      isMastered,
      masteryOverride,
      nextReviewTime,
      prereqs,
      postreqs,
      directMasteryByLevel,
      masteryByLevel,
      prereqsMasteredByLevel: existingPrereqsMasteredByLevel,
      nextReviewTimeByLevel
    });
    
    // Update prerequisite mastery for all nodes
    this.updatePrerequisiteMasteries();
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
      
      // Ensure difficulty is normalized
      // First check if we need to handle legacy fields
      if (processedRecord.difficulty === undefined) {
        // Convert from legacy format if needed
        processedRecord.difficulty = this.normalizeDifficulty(processedRecord);
      }
      
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
        // Get difficulty for REMEMBER level as a basic difficulty measure
        const difficultyMap = this.normalizeDifficulty(processedRecord);
        const rememberDifficulty = difficultyMap[TaxonomyLevel.REMEMBER] || 0.5;
        
        processedRecord.stability = this.calculateNewStability(
          prevStability, 
          processedRecord.retrievability, 
          processedRecord.score,
          rememberDifficulty
        );
      }
      
      // Update for next iteration
      prevStability = processedRecord.stability;
      
      return processedRecord;
    });
  }
  
  /**
   * Updates prerequisite masteries for all nodes based on current mastery status
   * This should be called whenever node mastery changes
   */
  private updatePrerequisiteMasteries(): void {
    const taxonomyLevels = this.getTaxonomyLevels();
    
    // Get all prerequisites
    const allDeepPrereqs = this.collectAllDeepPrereqs();
    
    // For each node, check if all prerequisites have mastered the required levels
    for (const nodeId of Array.from(this.nodes.keys())) {
      const node = this.nodes.get(nodeId)!;
      
      // Initialize prerequisite mastery tracking
      if (!node.prereqsMasteredByLevel) {
        node.prereqsMasteredByLevel = {};
      }
      
      for (const level of taxonomyLevels) {
        // Start by assuming prerequisites are met
        node.prereqsMasteredByLevel[level] = true;
        
        // Get all prerequisites (excluding self)
        const prerequisites = Array.from(allDeepPrereqs.get(nodeId) || new Set<string>());
        const selfIndex = prerequisites.indexOf(nodeId);
        if (selfIndex >= 0) {
          prerequisites.splice(selfIndex, 1);
        }
        
        // No prerequisites = automatically met
        if (prerequisites.length === 0) continue;
        
        // Check if ALL prerequisites have mastered this level
        for (const prereqId of prerequisites) {
          const prereq = this.nodes.get(prereqId);
          // If the prerequisite doesn't exist or isn't mastered at this level, mark as not ready
          if (!prereq || !prereq.masteryByLevel || !prereq.masteryByLevel[level]) {
            node.prereqsMasteredByLevel[level] = false;
            break;
          }
        }
      }
    }
  }

  /**
   * Adds a score record for a node and updates its memory model
   * @param nodeId Node identifier
   * @param score Score value (0-1)
   * @param evaluationType Type of evaluation used
   * @param timestamp Optional timestamp (defaults to now)
   * @param difficulty Optional difficulty value (number or level map)
   */
  addScore(
    nodeId: string, 
    score: number, 
    evaluationType: string = EvaluationType.MULTIPLE_CHOICE,
    timestamp: number = Date.now(),
    difficulty?: number | Record<string, number>
  ): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    
    // Determine difficulty - use defaults if not specified
    let difficultyValue = difficulty;
    
    if (difficultyValue === undefined) {
      // If not specified, use defaults for the evaluation type
      if (evaluationType in DEFAULT_DIFFICULTIES) {
        difficultyValue = {...DEFAULT_DIFFICULTIES[evaluationType as EvaluationType]};
      } else {
        // Fallback to just REMEMBER level with full multiplier
        difficultyValue = { [TaxonomyLevel.REMEMBER]: 1.0 };
      }
    }
    
    // Create new record
    const newRecord: EvalRecord = {
      timestamp,
      score,
      evaluationType,
      difficulty: difficultyValue
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
    
    // Update taxonomy level properties
    if (!node.directMasteryByLevel) node.directMasteryByLevel = {};
    if (!node.masteryByLevel) node.masteryByLevel = {};
    if (!node.nextReviewTimeByLevel) node.nextReviewTimeByLevel = {};
    
    const masteryOverrideByLevel = {};
    
    // Recalculate mastery by level
    node.directMasteryByLevel = this.calculateDirectMasteryByLevel(
      processedHistory,
      node.directMasteryByLevel,
      masteryOverrideByLevel
    );
    
    // Apply inference
    node.masteryByLevel = this.calculateInferredMasteryByLevel(
      node.directMasteryByLevel,
      node.masteryByLevel,
      masteryOverrideByLevel
    );
    
    // Update review times by level
    node.nextReviewTimeByLevel = this.calculateNextReviewTimeByLevel(
      processedHistory,
      node.nextReviewTimeByLevel
    );
    
    // Update prerequisite masteries for all nodes
    this.updatePrerequisiteMasteries();
  }
  
  /**
   * Adds an edge between two nodes in the graph
   * Creates nodes if they don't exist (based on configuration)
   * 
   * IMPORTANT: In our knowledge graph, prereqs are PREREQUISITES of their postreqs.
   * This means:
   * - A postreq node depends on its prereqs being mastered first
   * - A prereq must be mastered before its postreqs can be effectively learned
   * - When using 'to_prereq' direction, you're saying the toId node is a prerequisite of fromId
   * - When using 'to_postreq' direction, you're saying the fromId node is a prerequisite of toId
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
    if (direction === 'to_prereq') {
      // fromNode has toNode as a prereq
      fromNode.prereqs.add(toId);
      toNode.postreqs.add(fromId);
      
      // Store the edge ID
      this.edgeIds.set(`${fromId}->${toId}`, id);
    } else {
      // fromNode has toNode as a postreq
      fromNode.postreqs.add(toId);
      toNode.prereqs.add(fromId);
      
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
   * Root nodes are defined as nodes with no postreqs
   * 
   * @returns Number of root nodes
   */
  getNumRoots(): number {
    return Array.from(this.nodes.values()).filter(node => node.postreqs.size === 0).length;
  }

  /**
   * Gets the IDs of all root nodes in the graph
   * Root nodes are defined as nodes with no postreqs
   * 
   * @returns Array of root node IDs
   */
  getRootIds(): string[] {
    return Array.from(this.nodes.values()).filter(node => node.postreqs.size === 0).map(node => node.id);
  }

  /**
   * Calculates the first path to a top-level postreq by recursively getting the first postreq
   * Returns a path from the root ancestor to the specified node
   * 
   * @param fromId - ID of the starting node
   * @param visited - Set of already visited node IDs to prevent infinite cycles
   * @returns Array representing the path from root ancestor to the node
   */
  firstPostreqPath(fromId: string, visited: Set<string> = new Set()): string[] {
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

    const firstPostreq = Array.from(node.postreqs)[0];

    if (!firstPostreq) {
      return [fromId];
    }

    return [...this.firstPostreqPath(firstPostreq, visited), fromId];
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
    evaluationDifficulty: number | undefined
  ): number {
    // Ensure we have a valid difficulty value
    const difficulty = evaluationDifficulty !== undefined ? 
      evaluationDifficulty : 0.5;
    
    // Normalize score based on evaluation difficulty
    const normalizedScore = this.normalizeScoreForLevel(score, difficulty);
    
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
    
    // Get primary taxonomy level for normalization (default to REMEMBER)
    const primaryLevel = (this.schedulingParams.targetTaxonomyLevels || [TaxonomyLevel.REMEMBER])[0];
    
    // Calculate normalized scores for the primary taxonomy level
    const normalizedScores = evalHistory.map(record => {
      // Get normalized difficulty map
      const difficultyMap = this.normalizeDifficulty(record);
      const levelDifficulty = difficultyMap[primaryLevel] || 0.5;
      
      // Use our helper to normalize the score
      return this.normalizeScoreForLevel(record.score, levelDifficulty);
    });
    
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
    const baseThreshold = masteryThresholdDays * 24 * 60 * 60;
    
    // Check if stability exceeds threshold
    const hasStability = currentStability >= baseThreshold;
    
    // Check if recent scores are consistently high
    const recentRecords = evalHistory.slice(-3);
    
    // Get primary taxonomy level for mastery check (default to REMEMBER)
    const primaryLevel = (this.schedulingParams.targetTaxonomyLevels || [TaxonomyLevel.REMEMBER])[0];
    
    const recentScores = recentRecords.map(record => {
      // Get normalized difficulty map
      const difficultyMap = this.normalizeDifficulty(record);
      const levelDifficulty = difficultyMap[primaryLevel] || 0.5;
      
      // Use our helper to normalize the score
      return this.normalizeScoreForLevel(record.score, levelDifficulty);
    });
    
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
        if (this.areAllPrereqsMastered(nodeId)) {
          readyNodes.push(nodeId);
        }
      }
    });
    
    return readyNodes;
  }

  /**
   * Checks if all prerequisites of a node are mastered
   * 
   * IMPORTANT: In our model, a node's PREREQS are its prerequisites.
   * 
   * @param nodeId Node identifier
   * @returns True if all prerequisites are mastered
   */
  areAllPrereqsMastered(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    
    // Check if all prereqs are mastered
    for (const prereqId of Array.from(node.prereqs)) {
      const prereq = this.nodes.get(prereqId);
      if (prereq && !prereq.isMastered) {
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
   * Phase 1 of score calculation: Collects all deep prereqs for each node
   * Handles cycles in the graph by returning empty sets for visited nodes
   * 
   * @returns Map of node IDs to their deep prereq sets (including self)
   */
  private collectAllDeepPrereqs(): Map<string, Set<string>> {
    // Validate all nodes exist
    for (const node of Array.from(this.nodes.values())) {
      for (const prereqId of Array.from(node.prereqs)) {
        if (!this.nodes.has(prereqId)) {
          throw new Error(`Node ${prereqId} not found`);
        }
      }
    }

    const allDeepPrereqs = new Map<string, Set<string>>();
    
    const getDeepPrereqs = (nodeId: string, visited = new Set<string>()): Set<string> => {
      // Check for cycles
      if (visited.has(nodeId)) {
        return new Set(); // In case of cycle, return empty set
      }
      
      // If we've already calculated deep prereqs for this node, return them
      if (allDeepPrereqs.has(nodeId)) {
        return allDeepPrereqs.get(nodeId)!;
      }
      
      // Mark this node as visited in current path
      visited.add(nodeId);
      
      const node = this.nodes.get(nodeId)!;
      
      // Start with just this node
      const deepPrereqs = new Set<string>([nodeId]);
      
      // Add all prereqs and their deep prereqs
      for (const prereqId of Array.from(node.prereqs)) {
        const prereqDeepPrereqs = getDeepPrereqs(prereqId, new Set(visited));
        for (const deepPrereq of Array.from(prereqDeepPrereqs)) {
          deepPrereqs.add(deepPrereq);
        }
      }
      
      // Store and return the result
      allDeepPrereqs.set(nodeId, deepPrereqs);
      return deepPrereqs;
    };
    
    // Process all nodes
    for (const nodeId of Array.from(this.nodes.keys())) {
      if (!allDeepPrereqs.has(nodeId)) {
        getDeepPrereqs(nodeId);
      }
    }
    
    return allDeepPrereqs;
  }
  
  /**
   * Phase 2 of score calculation: Aggregates scores from deep prereqs
   * For each node, collects scores from all its deep prereqs
   * 
   * @param allDeepPrereqs - Map of node IDs to their deep prereq sets
   * @returns Map of node IDs to arrays of all relevant scores
   */
  private calculateScores(allDeepPrereqs: Map<string, Set<string>>): Map<string, number[]> {
    const allScores = new Map<string, number[]>();
    
    for (const [nodeId, deepPrereqs] of Array.from(allDeepPrereqs.entries())) {
      // Collect scores from all deep prereqs
      const scores: number[] = [];
      
      for (const deepPrereqId of Array.from(deepPrereqs)) {
        const deepPrereqNode = this.nodes.get(deepPrereqId);
        if (deepPrereqNode) {
          scores.push(...deepPrereqNode.evalHistory.map(r => r.score));
        }
      }
      
      allScores.set(nodeId, scores);
    }
    
    return allScores;
  }

  /**
   * Collects all scores for each node from itself and all its deep prereqs
   * This is a two-phase process:
   * 1. Collect all deep prereqs for each node
   * 2. Collect scores from all deep prereqs
   * 
   * @returns Map of node IDs to arrays of all relevant scores
   */
  collectAllScores(): Map<string, number[]> {
    // Phase 1: Collect all deep prereqs
    const allDeepPrereqs = this.collectAllDeepPrereqs();
    
    // Phase 2: Calculate scores based on deep prereqs
    return this.calculateScores(allDeepPrereqs);
  }
  
  /**
   * Calculates comprehensive score metrics for each node in the graph
   * For each node, calculates:
   * - direct_score: Average of the node's own scores
   * - full_score: Average of all scores from the node and its deep prereqs
   * - Also includes memory model metrics and the complete list of deep prereqs
   * 
   * @returns Map of node IDs to NodeResult objects containing the metrics
   */
  calculateNodeScores(): Map<string, NodeResult> {
    const allScores = this.collectAllScores();
    const allDeepPrereqs = this.collectAllDeepPrereqs();
    const nodeResults = new Map<string, NodeResult>();
    
    for (const [nodeId, scores] of Array.from(allScores.entries())) {
      const node = this.nodes.get(nodeId)!;
      const directScore = this.calculateAverage(
        node.evalHistory.map(r => r.score)
      );
      const fullScore = this.calculateAverage(scores);
      const deepPrereqs = Array.from(allDeepPrereqs.get(nodeId) || new Set<string>());
      
      // Get current stability
      const stability = node.evalHistory.length > 0
        ? (node.evalHistory[node.evalHistory.length - 1].stability || 0)
        : 0;
      
      // Get current retrievability
      const retrievability = this.getCurrentRetrievability(nodeId) || 0;
      
      // Get recommended taxonomy level for review
      const recommendedTaxonomyLevel = this.getRecommendedTaxonomyLevelForNode(nodeId);
      
      nodeResults.set(nodeId, {
        id: nodeId,
        all_scores: scores,
        direct_score: directScore,
        full_score: fullScore,
        deepPrereqs,
        stability,
        retrievability,
        isMastered: node.isMastered,
        nextReviewTime: node.nextReviewTime,
        masteryByLevel: node.masteryByLevel,
        prereqsMasteredByLevel: node.prereqsMasteredByLevel,
        nextReviewTimeByLevel: node.nextReviewTimeByLevel,
        recommendedTaxonomyLevel
      });
    }
    
    return nodeResults;
  }

  /**
   * Calculates direct mastery by taxonomy level without inference
   * 
   * @param evalHistory - Evaluation history
   * @param existingMasteryByLevel - Existing mastery data if available
   * @param masteryOverrideByLevel - Optional overrides by level
   * @returns Record of mastery status by taxonomy level
   */
  private calculateDirectMasteryByLevel(
    evalHistory: EvalRecord[],
    existingMasteryByLevel: Record<string, boolean> = {},
    masteryOverrideByLevel: Record<string, boolean> = {}
  ): Record<string, boolean> {
    const taxonomyLevels = this.getTaxonomyLevels();
    const result: Record<string, boolean> = { ...existingMasteryByLevel };
    
    // Initialize any missing levels
    for (const level of taxonomyLevels) {
      if (result[level] === undefined) {
        result[level] = false;
      }
    }
    
    // Apply direct mastery calculation for each level
    for (const level of taxonomyLevels) {
      // Check for override first
      if (masteryOverrideByLevel[level] !== undefined) {
        result[level] = masteryOverrideByLevel[level];
        continue;
      }
      
      // Calculate mastery based on performance
      result[level] = this.calculateIsMasteredByLevel(evalHistory, level);
    }
    
    return result;
  }
  
  /**
   * Determines if a node is mastered at a specific taxonomy level
   * 
   * @param evalHistory - Evaluation history
   * @param level - Taxonomy level to check
   * @returns Whether the node is mastered at this level
   */
  private calculateIsMasteredByLevel(evalHistory: EvalRecord[], level: string): boolean {
    // Filter history to only include evaluations targeting this level with meaningful multiplier
    const levelHistory = evalHistory.filter(record => {
      const difficulties = this.normalizeDifficulty(record);
      return difficulties[level] > 0;
    });
    
    // Need at least 3 reviews to determine mastery
    if (levelHistory.length < 3) return false;
    
    // Get current stability from most recent review
    const latestEntry = levelHistory[levelHistory.length - 1];
    const currentStability = latestEntry.stability || 0;
    
    // Calculate mastery threshold
    const { masteryThresholdDays = 21 } = this.schedulingParams;
    const baseThreshold = masteryThresholdDays * 24 * 60 * 60; // Convert days to seconds
    

    const diff = currentStability - baseThreshold;


    // Check if stability exceeds threshold
    const hasStability = diff > 0;
    
    // Check if recent scores are consistently high
    const recentRecords = levelHistory.slice(-3);
    const recentScores = recentRecords.map(record => {
      const difficulties = this.normalizeDifficulty(record);
      
      return this.normalizeScoreForLevel(
        record.score,
        // TODO figure out if 0 is a good default..
        difficulties[level] || 0
      );
    });
    
    const avgRecentScore = this.calculateAverage(recentScores);
    const hasHighScores = avgRecentScore >= 0.8;

    console.log('hasStability', hasStability);
    console.log('hasHighScores', hasHighScores);
    
    return hasStability && hasHighScores;
  }
  
  /**
   * Apply inference from harder to easier taxonomy levels
   * 
   * @param directMasteryByLevel - Raw mastery by level
   * @param existingMasteryByLevel - Existing inferred mastery if available
   * @param masteryOverrideByLevel - Optional mastery overrides
   * @returns Record of mastery with inference applied
   */
  private calculateInferredMasteryByLevel(
    directMasteryByLevel: Record<string, boolean>,
    existingMasteryByLevel: Record<string, boolean> = {},
    masteryOverrideByLevel: Record<string, boolean> = {}
  ): Record<string, boolean> {
    const taxonomyLevels = this.getTaxonomyLevels();
    const taxonomyDependencies = this.getTaxonomyLevelDependencies();
    const complexities = this.getTaxonomyLevelComplexities();
    
    // Start with direct mastery
    const result: Record<string, boolean> = { ...directMasteryByLevel };
    
    // Sort levels by complexity (highest to lowest)
    const sortedLevels = [...taxonomyLevels].sort((a, b) => 
      complexities[b] - complexities[a]
    );
    
    // Apply mastery inference (harder to easier)
    for (const level of sortedLevels) {
      // If overridden or directly mastered
      if (masteryOverrideByLevel[level] === true || result[level] === true) {
        // Ensure all prerequisite levels are marked as mastered
        let prerequisiteLevel = taxonomyDependencies[level];
        while (prerequisiteLevel) {
          result[prerequisiteLevel] = true;
          prerequisiteLevel = taxonomyDependencies[prerequisiteLevel];
        }
      }
    }
    
    return result;
  }

  /**
   * Calculate next review times for each taxonomy level
   * 
   * @param evalHistory - Evaluation history
   * @param existingReviewTimes - Existing review times if available
   * @returns Record of next review times by level
   */
  private calculateNextReviewTimeByLevel(
    evalHistory: EvalRecord[],
    existingReviewTimes: Record<string, number | null> = {}
  ): Record<string, number | null> {
    const taxonomyLevels = this.getTaxonomyLevels();
    const result: Record<string, number | null> = { ...existingReviewTimes };
    
    // Initialize any missing levels
    for (const level of taxonomyLevels) {
      if (result[level] === undefined) {
        result[level] = null;
      }
    }
    
    // Calculate next review time for each level
    for (const level of taxonomyLevels) {
      // Filter history to only include evaluations targeting this level with non-zero multiplier
      const levelHistory = evalHistory.filter(record => {
        const difficultyMap = this.normalizeDifficulty(record);
        return difficultyMap[level] > 0;
      });
      
      // Calculate next review time based on this level's history
      result[level] = this.calculateNextReviewTime(levelHistory);
    }
    
    return result;
  }

  /**
   * Gets nodes that are ready for review at a specific taxonomy level
   * @param level Taxonomy level to check (defaults to REMEMBER)
   * @returns Array of node IDs ready for review at the specified level
   */
  getNodesReadyForReviewAtLevel(level: string = TaxonomyLevel.REMEMBER): string[] {
    const now = Date.now();
    const readyNodes: string[] = [];
    
    // Use direct key access instead of entries() iterator
    this.nodes.forEach((node, nodeId) => {
      // Check if the node has taxonomy level data
      if (!node.masteryByLevel || !node.prereqsMasteredByLevel || !node.nextReviewTimeByLevel) {
        return; // Skip nodes without taxonomy data
      }
      
      // Check taxonomy prerequisite levels are mastered
      const taxonomyPrereqLevel = this.getTaxonomyLevelDependencies()[level];
      if (taxonomyPrereqLevel && !node.masteryByLevel[taxonomyPrereqLevel]) {
        return; // Lower taxonomy level not mastered yet
      }
      
      // Check if node is due for review at this level
      const isDueForLevel = 
        // 1. It has never been reviewed at this level OR
        (!node.nextReviewTimeByLevel[level]) ||
        // 2. Its next review time for this level has passed
        (node.nextReviewTimeByLevel[level] !== null && node.nextReviewTimeByLevel[level]! <= now);
      
      if (isDueForLevel) {
        // Check if all prerequisites are mastered at this level
        if (node.prereqsMasteredByLevel[level]) {
          readyNodes.push(nodeId);
        }
      }
    });
    
    return readyNodes;
  }
  
  /**
   * Gets nodes that are ready for review at any of the target taxonomy levels
   * @param targetLevels Optional array of taxonomy levels to check (defaults to from settings)
   * @returns Array of node IDs ready for review at any of the specified levels
   */
  getNodesReadyForReviewAtTargetLevels(targetLevels?: string[]): string[] {
    const levels = targetLevels || this.schedulingParams.targetTaxonomyLevels || [TaxonomyLevel.REMEMBER];
    const result = new Set<string>();
    
    // Get nodes ready for review at each level
    for (const level of levels) {
      const readyNodes = this.getNodesReadyForReviewAtLevel(level);
      for (const nodeId of readyNodes) {
        result.add(nodeId);
      }
    }
    
    return Array.from(result);
  }
  
  /**
   * Gets the recommended taxonomy level for review for a specific node
   * Returns the most complex level that is ready for review
   * 
   * @param nodeId Node identifier
   * @returns The recommended taxonomy level or null if none are ready
   */
  getRecommendedTaxonomyLevelForNode(nodeId: string): string | null {
    const node = this.nodes.get(nodeId);
    if (!node || !node.masteryByLevel || !node.prereqsMasteredByLevel) {
      return null;
    }
    
    const now = Date.now();
    const taxonomyLevels = this.getTaxonomyLevels();
    const complexities = this.getTaxonomyLevelComplexities();
    
    // Sort levels by complexity (highest to lowest)
    const sortedLevels = [...taxonomyLevels].sort((a, b) => 
      complexities[b] - complexities[a]
    );
    
    // Check each level from most to least complex
    for (const level of sortedLevels) {
      // Check if this level is configured as a target
      if (!(this.schedulingParams.targetTaxonomyLevels || [TaxonomyLevel.REMEMBER]).includes(level)) {
        continue; // Skip levels that aren't targets
      }
      
      // Check taxonomy prerequisites
      const taxonomyPrereqLevel = this.getTaxonomyLevelDependencies()[level];
      if (taxonomyPrereqLevel && !node.masteryByLevel[taxonomyPrereqLevel]) {
        continue; // Lower taxonomy level not mastered yet
      }
      
      // Check if due for review at this level
      const isDueForLevel = 
        (!node.nextReviewTimeByLevel?.[level]) ||
        (node.nextReviewTimeByLevel?.[level] !== null && node.nextReviewTimeByLevel?.[level]! <= now);
      
      if (isDueForLevel && node.prereqsMasteredByLevel[level]) {
        return level;
      }
    }
    
    return null;
  }
  
  /**
   * Sets the mastery override for a node at a specific taxonomy level
   * @param nodeId Node identifier
   * @param level Taxonomy level
   * @param isMastered Whether to consider the node mastered at this level
   */
  setMasteryOverrideAtLevel(nodeId: string, level: string, isMastered: boolean): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    
    // Ensure mastery tracking objects exist
    if (!node.directMasteryByLevel) node.directMasteryByLevel = {};
    if (!node.masteryByLevel) node.masteryByLevel = {};
    
    // Set override at this level
    node.directMasteryByLevel[level] = isMastered;
    
    // Recalculate inferred mastery with this override
    const masteryOverrideByLevel: Record<string, boolean> = { [level]: isMastered };
    node.masteryByLevel = this.calculateInferredMasteryByLevel(
      node.directMasteryByLevel,
      node.masteryByLevel,
      masteryOverrideByLevel
    );
    
    // Update prerequisites for all nodes
    this.updatePrerequisiteMasteries();
  }
}