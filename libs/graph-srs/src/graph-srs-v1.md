# GraphSRS V1 Design Document

## 1. Overview

GraphSRS is a directed acyclic graph (DAG) based spaced repetition system that models knowledge as interconnected concepts with dependencies. Unlike traditional spaced repetition systems that treat each item as independent, GraphSRS recognizes that knowledge exists in a relational structure where understanding prerequisites is essential to mastering dependent concepts.

### Key Distinctions from Traditional SRS

- **Concepts vs. Cards**: Each node represents a broader concept (not just a single question-answer pair)
- **Dependencies**: Concepts have explicit prerequisite relationships
- **Multiple Evaluation Types**: Concepts can be assessed through different mechanisms with varying difficulty
- **Mastery-Based Progression**: Concepts become available for review only when prerequisites are sufficiently mastered
- **Taxonomy Flexibility**: Support for custom learning taxonomies beyond the default Bloom's taxonomy

## 2. Core Memory Model

We adopt a modified version of the two-component memory model from SuperMemo's SM-17 algorithm:

### 2.1 Memory Variables

- **Stability (S)**: How long memory for a concept lasts without review (measured in seconds)
- **Retrievability (R)**: Probability of recall at a given time (0-1 range)
- **Difficulty (D)**: Inherent complexity of the concept (0-1 range)

### 2.2 Evaluation Record Structure

```typescript
interface EvalRecord {
  /** When the review occurred (epoch ms) */
  timestamp: number;
  /** Score in 0-1 range (0 = complete failure, 1 = perfect recall) */
  score: number;
  /** Type of evaluation used - optional if difficulty is provided directly */
  evaluationType?: string;
  /** 
   * How effectively this evaluation tests different taxonomy levels - optional if evaluationType is provided
   * Maps level names to multipliers (0-1 range)
   * Higher multipliers mean this evaluation type more effectively tests the given level
   */
  difficulty?: number | Record<string, number>;
  /** Memory stability after this review (in seconds) */
  stability?: number;
  /** Recall probability at time of review (0-1) */
  retrievability?: number;
}
```

Either `evaluationType` or `difficulty` must be provided for each evaluation record. If both are provided, `difficulty` takes precedence over the default difficulty values for the evaluation type.

#### Taxonomy Level Multipliers

When using the `difficulty` as a Record, the values represent how effectively an evaluation tests each cognitive level:

- A value of 0 means this evaluation doesn't test that level at all
- A value of 1 means this evaluation perfectly tests that level
- Intermediate values represent partial effectiveness

For example, a multiple choice quiz might have these multipliers:
```
{
  "remember": 0.8,    // Tests recall well
  "understand": 0.6,  // Tests understanding moderately
  "apply": 0.3,       // Tests application minimally
  "analyze": 0.2,     // Tests analysis minimally
  "evaluate": 0.1,    // Barely tests evaluation
  "create": 0.0       // Doesn't test creation at all
}
```

This approach eliminates the need for a separate difficulty parameter while providing more expressive power.

### 2.3 Score Normalization

Since evaluation methods vary in effectiveness for different taxonomy levels, raw scores must be normalized:

```typescript
private normalizeScoreForLevel(
  score: number, 
  levelMultiplier: number
): number {
  return score * levelMultiplier;
}
```

This ensures that a perfect score on an evaluation that effectively tests a given level (high multiplier) is weighted more heavily than a perfect score on an evaluation that doesn't effectively test that level (low multiplier).

## 3. Taxonomy Framework

### 3.1 Taxonomy Abstraction

GraphSRS now supports a flexible taxonomy framework:

```typescript
interface LevelTaxonomyConfig {
  /** Unique identifier for this taxonomy */
  id: string;
  /** Human-readable name */
  name: string;
  /** All available levels in this taxonomy */
  levels: string[];
  /** Dependencies between levels (which level must be mastered before another) */
  dependencies: Record<string, string | null>;
  /** Default starting level for new concepts */
  defaultLevel: string;
  /** Description of this taxonomy */
  description?: string;
}

class LevelTaxonomy {
  constructor(config: LevelTaxonomyConfig) {
    // Initialize taxonomy
    // Validate that all dependencies reference valid levels
    // Check for circular dependencies
  }
  
  // Get all prerequisite levels for a given level
  getPrerequisiteLevels(level: string): string[]
  
  // Get all dependent levels for a given level
  getDependentLevels(level: string): string[]
  
  // Get levels ordered by dependency chain (topological sort)
  // with most foundational levels first
  getLevelsByDependencyOrder(reverse: boolean = false): string[]
}
```

### 3.2 Bloom's Taxonomy Implementation

Bloom's Taxonomy is provided as the default implementation:

```typescript
// Bloom's Taxonomy levels
export const BLOOMS_REMEMBER = 'remember';
export const BLOOMS_UNDERSTAND = 'understand';
export const BLOOMS_APPLY = 'apply';
export const BLOOMS_ANALYZE = 'analyze';
export const BLOOMS_EVALUATE = 'evaluate';
export const BLOOMS_CREATE = 'create';

export const bloomsTaxonomyConfig: LevelTaxonomyConfig = {
  id: 'blooms',
  name: "Bloom's Taxonomy",
  description: "Bloom's Taxonomy is a hierarchical model used to classify educational learning objectives into levels of complexity and specificity.",
  levels: [
    BLOOMS_REMEMBER,
    BLOOMS_UNDERSTAND,
    BLOOMS_APPLY,
    BLOOMS_ANALYZE,
    BLOOMS_EVALUATE,
    BLOOMS_CREATE
  ],
  dependencies: {
    [BLOOMS_REMEMBER]: null, // Base level
    [BLOOMS_UNDERSTAND]: BLOOMS_REMEMBER,
    [BLOOMS_APPLY]: BLOOMS_UNDERSTAND,
    [BLOOMS_ANALYZE]: BLOOMS_APPLY,
    [BLOOMS_EVALUATE]: BLOOMS_ANALYZE,
    [BLOOMS_CREATE]: BLOOMS_EVALUATE
  },
  defaultLevel: BLOOMS_REMEMBER
};
```

### 3.3 Dynamic Taxonomy Level Prioritization

Rather than using fixed complexity values, the system now prioritizes levels based on the actual dependency structure:

```typescript
// Prioritize taxonomy levels based on the dependency graph
function prioritizeLevels(taxonomy: LevelTaxonomy): string[] {
  // Perform a topological sort of the taxonomy levels
  // This ensures that prerequisites come before their dependent levels
  return taxonomy.getLevelsByDependencyOrder();
}
```

This approach:
- Adapts to any taxonomy structure automatically
- Respects the pedagogical progression inherent in the level dependencies
- Works with both linear taxonomies (like Bloom's) and more complex branching taxonomies
- Eliminates the need for arbitrary complexity values

## 4. Evaluation Type Framework

### 4.1 Evaluation Type Abstraction

```typescript
interface EvaluationTypeConfig {
  /** Unique name for this evaluation type */
  name: string;
  /** Difficulty multipliers by taxonomy level */
  difficultyByLevel: Record<string, number>;
  /** Description of this evaluation type */
  description?: string;
}

class EvaluationType {
  readonly name: string;
  readonly difficultyByLevel: Record<string, number>;
  readonly description?: string;
  
  constructor(config: EvaluationTypeConfig, taxonomy: LevelTaxonomy) {
    // Initialize and validate with the given taxonomy
  }
}

class EvaluationTypeRegistry {
  constructor(taxonomy: LevelTaxonomy, initialTypes?: EvaluationTypeConfig[])
  
  // Register a new evaluation type
  register(config: EvaluationTypeConfig): EvaluationType
  
  // Get a registered evaluation type
  get(name: string): EvaluationType
  
  // Check if an evaluation type is registered
  has(name: string): boolean
  
  // Get all registered evaluation types
  getAll(): EvaluationType[]
  
  // Update the taxonomy (revalidates all types)
  setTaxonomy(taxonomy: LevelTaxonomy): void
}
```

### 4.2 Default Evaluation Types

```typescript
// Default evaluation types for Bloom's taxonomy
const defaultBloomsEvaluationTypes: EvaluationTypeConfig[] = [
  {
    name: 'flashcard',
    description: 'Basic flashcard review',
    difficultyByLevel: {
      [bloomsTaxonomy.REMEMBER]: 0.9,
      [bloomsTaxonomy.UNDERSTAND]: 0.4,
      [bloomsTaxonomy.APPLY]: 0.1,
      [bloomsTaxonomy.ANALYZE]: 0.0,
      [bloomsTaxonomy.EVALUATE]: 0.0,
      [bloomsTaxonomy.CREATE]: 0.0
    }
  },
  {
    name: 'multiple_choice',
    description: 'Multiple choice questions',
    difficultyByLevel: {
      [bloomsTaxonomy.REMEMBER]: 0.8,
      [bloomsTaxonomy.UNDERSTAND]: 0.6,
      [bloomsTaxonomy.APPLY]: 0.3,
      [bloomsTaxonomy.ANALYZE]: 0.2,
      [bloomsTaxonomy.EVALUATE]: 0.1,
      [bloomsTaxonomy.CREATE]: 0.0
    }
  },
  // ... other evaluation types
];
```

### 4.3 Usage With Custom Taxonomies

When using custom taxonomies, evaluation types must be registered that support the custom levels:

```typescript
// Example with a custom medical knowledge taxonomy
const medicalTaxonomy = new LevelTaxonomy({
  id: 'medical',
  name: 'Medical Knowledge Taxonomy',
  levels: ['facts', 'mechanisms', 'diagnostics', 'treatments', 'integration'],
  // ... other configuration
});

// Create evaluation types for the medical taxonomy
const medicalEvaluationTypes = [
  {
    name: 'mcq',
    description: 'Medical multiple choice questions',
    difficultyByLevel: {
      'facts': 0.9,
      'mechanisms': 0.7,
      'diagnostics': 0.4,
      'treatments': 0.2,
      'integration': 0.1
    }
  },
  // ... other evaluation types
];

// Initialize the SRS with the custom taxonomy and evaluation types
const medicalSRS = new GraphSRSV1Runner(
  {/* scheduling params */},
  medicalTaxonomy,
  medicalEvaluationTypes
);
```

## 5. Graph Structure and Dependency Management

### 5.1 Node and Edge Representation

```typescript
// Internal node representation
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
  /** Set of prerequisite node IDs - DIRECT PREREQUISITES OF THIS NODE */
  prereqs: Set<string>;
  /** Set of postrequisite node IDs - NODES THAT DIRECTLY DEPEND ON THIS NODE */
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

// Edge directions
type GraphSRSV1EdgeDirection = 'to_prereq' | 'to_postreq';
```

### 5.2 Prerequisites vs. Postrequisites

In GraphSRS, the relationship direction is pedagogically significant:

- **Prereqs are prerequisites of their postreqs**: You need to master prerequisite concepts before learning dependent concepts
- `to_prereq` direction: Node A has Node B as a prereq, meaning B is a prerequisite of A
- `to_postreq` direction: Node A has Node B as a postreq, meaning A is a prerequisite of B

### 5.3 Difficulty Normalization

When normalizing difficulty from evaluation records, we now use a more flexible approach:

```typescript
private normalizeDifficulty(record: EvalRecord): Record<string, number> {
  const taxonomyLevels = this.taxonomy.levels;
  
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
  
  // Case 3: Look up from registered evaluation types
  if (record.evaluationType) {
    if (!this.evaluationTypeRegistry.has(record.evaluationType)) {
      throw new Error(`EvaluationType "${record.evaluationType}" not registered`);
    }
    
    return {...this.evaluationTypeRegistry.get(record.evaluationType).difficultyByLevel};
  }
  
  // If we get here, neither evaluationType nor difficulty was provided
  throw new Error('Either evaluationType or difficulty must be provided for EvalRecord');
}
```

## 6. Scheduling Algorithm

### 6.1 Retrievability Calculation

The core retrievability formula remains unchanged, but now works with the abstracted taxonomy:

```typescript
private calculateRetrievability(stability: number, elapsedSeconds: number): number {
  if (stability === 0) return 0;
  
  // Using exponential forgetting curve from SM-17
  return Math.exp(-elapsedSeconds / stability);
}
```

### 6.2 Stability Update Calculation

```typescript
private calculateNewStability(
  prevStability: number, 
  retrievability: number, 
  score: number,
  difficultyForLevel: number
): number {
  // Normalize score based on evaluation difficulty
  const normalizedScore = this.normalizeScoreForLevel(score, difficultyForLevel);
  
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
```

## 7. Enhanced Mastery Determination

To support mastery tracking at multiple taxonomy levels:

### 7.1 Direct Mastery Calculation

```typescript
private calculateDirectMasteryByLevel(
  evalHistory: EvalRecord[],
  existingMasteryByLevel: Record<string, boolean> = {},
  masteryOverrideByLevel: Record<string, boolean> = {}
): Record<string, boolean> {
  const result: Record<string, boolean> = { ...existingMasteryByLevel };
  
  // Initialize any missing levels
  for (const level of this.taxonomy.levels) {
    if (result[level] === undefined) {
      result[level] = false;
    }
  }
  
  // Apply direct mastery calculation for each level
  for (const level of this.taxonomy.levels) {
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
```

### 7.2 Inferring Mastery Across Levels

```typescript
private calculateInferredMasteryByLevel(
  directMasteryByLevel: Record<string, boolean>,
  existingMasteryByLevel: Record<string, boolean> = {},
  masteryOverrideByLevel: Record<string, boolean> = {}
): Record<string, boolean> {
  const result: Record<string, boolean> = { ...directMasteryByLevel };
  
  // Sort levels by complexity (highest to lowest)
  const sortedLevels = this.taxonomy.getLevelsByDependencyOrder(false);
  
  // Apply mastery inference (harder to easier)
  for (const level of sortedLevels) {
    // If overridden or directly mastered
    if (masteryOverrideByLevel[level] === true || result[level] === true) {
      // Ensure all prerequisite levels are marked as mastered
      const prerequisites = this.taxonomy.getPrerequisiteLevels(level);
      for (const prereqLevel of prerequisites) {
        result[prereqLevel] = true;
      }
    }
  }
  
  return result;
}
```

### 7.3 Updating Prerequisite Masteries

```typescript
private updatePrerequisiteMasteries(): void {
  // For each node, check if all prerequisites have mastered each level
  for (const nodeId of Array.from(this.nodes.keys())) {
    const node = this.nodes.get(nodeId)!;
    
    // Initialize prerequisite mastery tracking
    if (!node.prereqsMasteredByLevel) {
      node.prereqsMasteredByLevel = {};
    }
    
    for (const level of this.taxonomy.levels) {
      // Start by assuming prerequisites are met
      node.prereqsMasteredByLevel[level] = true;
      
      // Get all prerequisites (excluding self)
      const prerequisites = this.getDeepPrereqs(nodeId).filter(id => id !== nodeId);
      
      // No prerequisites = automatically met
      if (prerequisites.length === 0) continue;
      
      // Check if ALL prerequisites have mastered this level
      for (const prereqId of prerequisites) {
        const prereq = this.nodes.get(prereqId);
        if (!prereq || !prereq.masteryByLevel || !prereq.masteryByLevel[level]) {
          node.prereqsMasteredByLevel[level] = false;
          break;
        }
      }
    }
  }
}
```

## 8. Enhanced Constructor and Configuration

The constructor now supports custom taxonomies and evaluation type registration:

```typescript
export interface SchedulingParams {
  // ... existing parameters
  
  /** Target taxonomy levels to aim for - default is just the base level */
  targetTaxonomyLevels?: string[];
}

class GraphSRSV1Runner {
  constructor(
    params?: SchedulingParams,
    taxonomy: LevelTaxonomy = bloomsTaxonomy,
    evaluationTypes?: EvaluationTypeConfig[]
  ) {
    this.nodes = new Map();
    this.edgeIds = new Map();
    this.schedulingParams = { ...DEFAULT_SCHEDULING_PARAMS, ...params };
    this.taxonomy = taxonomy;
    
    // Create evaluation type registry with provided types or defaults
    const defaultTypes = createDefaultBloomsEvaluationTypes();
    this.evaluationTypeRegistry = new EvaluationTypeRegistry(
      taxonomy,
      evaluationTypes || defaultTypes
    );
    
    // Ensure target taxonomy levels are valid
    if (this.schedulingParams.targetTaxonomyLevels) {
      this.schedulingParams.targetTaxonomyLevels = 
        this.schedulingParams.targetTaxonomyLevels.filter(level => 
          taxonomy.levels.includes(level)
        );
      
      // If empty after filtering, use default level
      if (this.schedulingParams.targetTaxonomyLevels.length === 0) {
        this.schedulingParams.targetTaxonomyLevels = [taxonomy.defaultLevel];
      }
    } else {
      // Default to base level of taxonomy
      this.schedulingParams.targetTaxonomyLevels = [taxonomy.defaultLevel];
    }
  }
}
```

## 9. Implementation Notes and Future Work

### 9.1 Performance Considerations

- Precompute values where possible to avoid expensive runtime calculations
- Use topological sorting to efficiently process the DAG
- Cache results of common operations like deep prerequisite collection

### 9.2 Future Extensions

- **Knowledge Decay**: Model differential forgetting rates based on concept connectedness
- **Personalization**: Adapt difficulty and scheduling based on individual learning patterns
- **Learning Path Generation**: Recommend optimal sequences of concepts to study
- **Enhanced Taxonomy Support**: Add more built-in taxonomies for specialized domains


### 9.3 Edge Cases and Handling

- **Cycles in the Knowledge Graph**: Detected and handled to prevent infinite recursion
- **Inconsistent Evaluations**: Weighted by recency and evaluation difficulty
- **Incomplete Prerequisites**: Prevented from appearing in review selection
- **Missing Evaluation Types**: Will throw explicit errors instead of using defaults
