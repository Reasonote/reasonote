# GraphSRS V1 Design Document

## 1. Overview

GraphSRS is a directed acyclic graph (DAG) based spaced repetition system that models knowledge as interconnected concepts with dependencies. Unlike traditional spaced repetition systems that treat each item as independent, GraphSRS recognizes that knowledge exists in a relational structure where understanding prerequisites is essential to mastering dependent concepts.

### Key Distinctions from Traditional SRS

- **Concepts vs. Cards**: Each node represents a broader concept (not just a single question-answer pair)
- **Dependencies**: Concepts have explicit prerequisite relationships
- **Multiple Evaluation Types**: Concepts can be assessed through different mechanisms with varying difficulty
- **Mastery-Based Progression**: Concepts become available for review only when prerequisites are sufficiently mastered

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
  /** Type of evaluation used */
  evaluationType: string;
  /** 
   * How effectively this evaluation tests different taxonomy levels
   * Maps level names to multipliers (0-1 range)
   * Higher multipliers mean this evaluation type more effectively tests the given level
   */
  taxonomyLevels: Record<string, number>;
  /** Memory stability after this review (in seconds) */
  stability?: number;
  /** Recall probability at time of review (0-1) */
  retrievability?: number;
}
```

#### Taxonomy Level Multipliers

Instead of a separate `evaluationDifficulty` value, we use `taxonomyLevels` to represent how effectively an evaluation tests each cognitive level:

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

#### Backward Compatibility

To support backward compatibility with existing evaluation records that use `evaluationDifficulty` instead of `taxonomyLevels`:

1. Default values for each evaluation type are provided
2. When processing an evaluation record with only `evaluationDifficulty`, the system uses the default multipliers for that evaluation type

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

## 3. Concept Evaluation Framework

### 3.1 Evaluation Types

Concepts can be assessed through multiple mechanisms:

| Evaluation Type | Description | Base Difficulty |
|----------------|-------------|----------------|
| Flashcard | Traditional card with question/answer | 0.2 |
| Multiple Choice | Selection from provided options | 0.2 |
| Fill-in-blank | Providing a missing term | 0.4 |
| Short Answer | Brief explanation of concept | 0.6 |
| Free Recall | Complete recall with no prompting | 0.8 |
| Application | Using concept to solve a novel problem | 0.9 |

### 3.2 Concept Difficulty Calculation

Concept difficulty is calculated primarily based on review performance:

```typescript
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
```

## 4. Graph Structure and Dependency Management

### 4.1 Node and Edge Representation

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
}

// Edge directions
type GraphSRSV1EdgeDirection = 'to_prereq' | 'to_postreq';
```

### 4.2 Prerequisites vs. Postrequisites

In GraphSRS, the relationship direction is pedagogically significant:

- **Prereqs are prerequisites of their postreqs**: You need to master prerequisite concepts before learning dependent concepts
- `to_prereq` direction: Node A has Node B as a prereq, meaning B is a prerequisite of A
- `to_postreq` direction: Node A has Node B as a postreq, meaning A is a prerequisite of B

### 4.3 Mastery Determination

A concept is considered "mastered" when:

1. Its stability exceeds a configurable threshold (default 21 days)
2. Recent scores consistently exceed a threshold (≥0.8 normalized score)
3. A minimum of 3 successful reviews have been completed

Or when explicitly marked with `masteryOverride = true`.

```typescript
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
```

### 4.4 Prerequisite Checking

Only concepts whose prerequisites are mastered become available for review:

```typescript
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
```

## 5. Scheduling Algorithm

### 5.1 Retrievability Calculation

```typescript
private calculateRetrievability(stability: number, elapsedSeconds: number): number {
  if (stability === 0) return 0;
  
  // Using exponential forgetting curve from SM-17
  return Math.exp(-elapsedSeconds / stability);
}
```

### 5.2 Stability Update Calculation

```typescript
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
```

### 5.3 Next Review Time Calculation

```typescript
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
```

### 5.4 Review Selection

When selecting concepts for review:

```typescript
getNodesReadyForReview(): string[] {
  const now = Date.now();
  const readyNodes: string[] = [];
  
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
```

## 6. Score Propagation and Metrics

GraphSRS analyzes the entire knowledge graph to provide useful metrics:

### 6.1 Deep Prerequisite Collection

```typescript
private collectAllDeepPrereqs(): Map<string, Set<string>> {
  const allDeepPrereqs = new Map<string, Set<string>>();
  
  const getDeepPrereqs = (nodeId: string, visited = new Set<string>()): Set<string> => {
    // Check for cycles
    if (visited.has(nodeId)) {
      return new Set(); // Break cycles
    }
    
    // If already calculated, return cached result
    if (allDeepPrereqs.has(nodeId)) {
      return allDeepPrereqs.get(nodeId)!;
    }
    
    // Mark as visited
    visited.add(nodeId);
    
    const node = this.nodes.get(nodeId)!;
    
    // Include self in deep prerequisites
    const deepPrereqs = new Set<string>([nodeId]);
    
    // Add all prereqs and their deep prereqs
    for (const prereqId of Array.from(node.prereqs)) {
      const prereqDeepPrereqs = getDeepPrereqs(prereqId, new Set(visited));
      for (const deepPrereq of Array.from(prereqDeepPrereqs)) {
        deepPrereqs.add(deepPrereq);
      }
    }
    
    // Cache and return result
    allDeepPrereqs.set(nodeId, deepPrereqs);
    return deepPrereqs;
  };
  
  // Calculate for all nodes
  for (const nodeId of Array.from(this.nodes.keys())) {
    if (!allDeepPrereqs.has(nodeId)) {
      getDeepPrereqs(nodeId);
    }
  }
  
  return allDeepPrereqs;
}
```

### 6.2 Node Score Calculation

```typescript
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
    
    nodeResults.set(nodeId, {
      id: nodeId,
      all_scores: scores,
      direct_score: directScore,
      full_score: fullScore,
      deepPrereqs,
      stability,
      retrievability,
      isMastered: node.isMastered,
      nextReviewTime: node.nextReviewTime
    });
  }
  
  return nodeResults;
}
```

## 7. Taxonomy Level Integration (Planned)

### 7.1 Taxonomy Level Definition

```typescript
export enum TaxonomyLevel {
  REMEMBER = 'remember',
  UNDERSTAND = 'understand',
  APPLY = 'apply',
  ANALYZE = 'analyze',
  EVALUATE = 'evaluate',
  CREATE = 'create'
}

// Define level dependencies (hierarchical relationship)
export const TAXONOMY_LEVEL_DEPENDENCIES: Record<string, string | null> = {
  'remember': null, // Base level
  'understand': 'remember',
  'apply': 'understand',
  'analyze': 'apply',
  'evaluate': 'analyze',
  'create': 'evaluate'
};

// Map evaluation types to their default taxonomy level multipliers
export const DEFAULT_TAXONOMY_MULTIPLIERS: Record<string, Record<string, number>> = {
  'flashcard': {
    'remember': 0.9,
    'understand': 0.4,
    'apply': 0.1,
    'analyze': 0.0,
    'evaluate': 0.0,
    'create': 0.0
  },
  'multiple_choice': {
    'remember': 0.8,
    'understand': 0.6,
    'apply': 0.3,
    'analyze': 0.2,
    'evaluate': 0.1,
    'create': 0.0
  },
  'fill_in_blank': {
    'remember': 0.9,
    'understand': 0.7,
    'apply': 0.4,
    'analyze': 0.2,
    'evaluate': 0.1,
    'create': 0.0
  },
  'short_answer': {
    'remember': 0.7,
    'understand': 0.8,
    'apply': 0.7,
    'analyze': 0.5,
    'evaluate': 0.4,
    'create': 0.2
  },
  'free_recall': {
    'remember': 0.9,
    'understand': 0.8,
    'apply': 0.6,
    'analyze': 0.5,
    'evaluate': 0.3,
    'create': 0.1
  },
  'application': {
    'remember': 0.5,
    'understand': 0.7,
    'apply': 0.9,
    'analyze': 0.7,
    'evaluate': 0.5,
    'create': 0.4
  }
};

// Support custom taxonomies
export interface CustomTaxonomy {
  name: string;
  levels: string[];
  dependencies: Record<string, string | null>;
  complexities: Record<string, number>;
}
```

### 7.2 Enhanced Evaluation Record

```typescript
export interface EvalRecord {
  // Existing fields
  timestamp: number;
  score: number;
  evaluationType: string;
  stability?: number;
  retrievability?: number;
  
  // Legacy field (kept for backward compatibility)
  evaluationDifficulty?: number;
  
  // New field with more expressive power
  taxonomyLevels?: Record<string, number>; // Maps levels to effectiveness multipliers
}
```

When processing evaluation records, if `taxonomyLevels` is missing, the system will:
1. Use the default multipliers for the specified `evaluationType`
2. If no default exists, fall back to using `evaluationDifficulty` to generate a simple level mapping

### 7.3 Enhanced Node Structure

```typescript
interface GraphSRSV1NodeInternal {
  // Existing fields
  id: string;
  evalHistory: EvalRecord[];
  difficulty: number;
  isMastered: boolean;
  masteryOverride: boolean | null;
  nextReviewTime: number | null;
  prereqs: Set<string>;
  postreqs: Set<string>;
  
  // New fields for taxonomy tracking
  masteryByLevel: Record<string, boolean>; // Track mastery per level
  nextReviewTimeByLevel: Record<string, number | null>; // Schedule per level
  prereqsMasteredByLevel: Record<string, boolean>; // Precomputed prerequisite status
}
```

### 7.4 Updated Constructor Parameters

```typescript
export interface SchedulingParams {
  // Existing params
  forgettingIndex?: number;
  targetRetrievability?: number;
  fuzzFactor?: number;
  masteryThresholdDays?: number;
  rapidReviewScoreThreshold?: number;
  rapidReviewMinMinutes?: number;
  rapidReviewMaxMinutes?: number;
  
  // New params
  targetTaxonomyLevels?: string[]; // Which levels to aim for
  customTaxonomy?: CustomTaxonomy; // Optional custom taxonomy
}
```

### 7.5 Mastery Calculation Per Level

```typescript
private calculateIsMasteredByLevel(evalHistory: EvalRecord[], level: string): boolean {
  // Filter history to only include evaluations targeting this level
  const levelHistory = evalHistory.filter(record => 
    record.taxonomyLevels?.includes(level)
  );
  
  if (levelHistory.length < 3) return false;
  
  // Similar to regular mastery calculation, but using only level-specific records
  const latestEntry = levelHistory[levelHistory.length - 1];
  const currentStability = latestEntry.stability || 0;
  
  const { masteryThresholdDays = 21 } = this.schedulingParams;
  const baseThreshold = masteryThresholdDays * 24 * 60 * 60;
  
  const hasStability = currentStability >= baseThreshold;
  
  const recentRecords = levelHistory.slice(-3);
  const recentScores = recentRecords.map(record => 
    this.normalizeScore(record.score, record.evaluationDifficulty)
  );
  const avgRecentScore = this.calculateAverage(recentScores);
  const hasHighScores = avgRecentScore >= 0.8;
  
  return hasStability && hasHighScores;
}
```

### 7.6 Precomputation of Mastery Status

```typescript
precomputeMasteryStatus() {
  // First, compute individual node mastery by level
  for (const [nodeId, node] of this.nodes.entries()) {
    for (const level of this.taxonomyLevels) {
      // Calculate direct mastery
      node.directMasteryByLevel[level] = this.calculateIsMasteredByLevel(node.evalHistory, level);
    }
    
    // Initialize prerequisite status for each level
    node.prereqsMasteredByLevel = {};
    node.masteryByLevel = {};
    for (const level of this.taxonomyLevels) {
      node.prereqsMasteredByLevel[level] = true;
    }
  }
  
  // Second pass: Apply "harder → easier" inference for each node
  for (const node of this.nodes.values()) {
    // Start with direct mastery
    node.masteryByLevel = {...node.directMasteryByLevel};
    
    // Infer from higher levels to lower levels
    for (const level of [...this.taxonomyLevels].sort((a, b) => 
      // Sort from highest to lowest cognitive complexity
      this.taxonomyLevelComplexity[b] - this.taxonomyLevelComplexity[a]
    )) {
      if (node.masteryByLevel[level]) {
        // If this level is mastered, all prerequisite levels are also mastered
        let prereqLevel = TAXONOMY_LEVEL_DEPENDENCIES[level];
        while (prereqLevel) {
          node.masteryByLevel[prereqLevel] = true;
          prereqLevel = TAXONOMY_LEVEL_DEPENDENCIES[prereqLevel];
        }
      }
    }
  }
  
  // Third pass: Use existing collectAllDeepPrereqs to determine prerequisite mastery
  const allDeepPrereqs = this.collectAllDeepPrereqs();
  
  // For each node, check if all prerequisites have mastered the required levels
  for (const [nodeId, node] of this.nodes.entries()) {
    for (const level of this.taxonomyLevels) {
      // Get all prerequisites (deep prereqs in our graph) excluding self
      const allPrereqs = Array.from(allDeepPrereqs.get(nodeId) || new Set());
      // Remove self from prerequisites
      const selfIndex = allPrereqs.indexOf(nodeId);
      if (selfIndex >= 0) {
        allPrereqs.splice(selfIndex, 1);
      }
      
      // Check if ALL prerequisites have mastered this level
      for (const prereqId of allPrereqs) {
        const prereq = this.nodes.get(prereqId);
        if (!prereq || !prereq.masteryByLevel[level]) {
          node.prereqsMasteredByLevel[level] = false;
          break;
        }
      }
    }
  }
}
```

This implementation takes advantage of the existing `collectAllDeepPrereqs()` function which already efficiently handles graph traversal, caching, and cycle detection. This approach offers several benefits:

1. **Reuses existing code**: Leverages the tested graph traversal logic already in place
2. **Efficient computation**: Avoids redundant traversals by using cached deep prerequisite data
3. **Clear logic separation**: Handles taxonomy level inference and prerequisite mastery as distinct steps
4. **Handles cycles gracefully**: Inherits the cycle detection from the underlying traversal function

By first applying the within-node level inference (a higher level mastery implies lower level mastery) and then checking prerequisite mastery across nodes, we get the complete picture of what taxonomy levels are available for review for each concept.

### 7.7 Enhanced Review Selection

```typescript
getNodesReadyForReviewAtLevel(level: string): string[] {
  const now = Date.now();
  const readyNodes: string[] = [];
  
  this.nodes.forEach((node, nodeId) => {
    // Check if the node is ready for review at this level
    const levelReviewTime = node.nextReviewTimeByLevel[level] || null;
    const isDueForLevel = (levelReviewTime !== null && levelReviewTime <= now);
    
    // Check taxonomy prerequisite levels
    const taxonomyPrereqLevel = TAXONOMY_LEVEL_DEPENDENCIES[level];
    const taxonomyPrereqsMet = !taxonomyPrereqLevel || node.masteryByLevel[taxonomyPrereqLevel];
    
    if (isDueForLevel && taxonomyPrereqsMet && node.prereqsMasteredByLevel[level]) {
      readyNodes.push(nodeId);
    }
  });
  
  return readyNodes;
}
```

### 7.8 Caveats and Considerations

#### Mastery Inference from Higher Levels

The current implementation processes each taxonomy level independently, with a notable limitation:

- **No automatic inference of lower-level mastery**: If a user demonstrates mastery at a higher level (e.g., "create"), the system does not automatically infer mastery at lower levels (e.g., "remember", "understand").
  
For example, if a student successfully creates a valid derivative problem (CREATE level), it logically implies they remember and understand derivatives. However, the current design requires explicit evaluations at each level to determine mastery.

This could be addressed with modifications:

```typescript
// Pseudocode for enhanced mastery calculation
private enhancedMasteryByLevel(node: GraphSRSV1NodeInternal): Record<string, boolean> {
  // First calculate direct mastery per level
  const directMastery = this.calculateDirectMasteryByLevel(node);
  
  // Then propagate mastery downward from higher levels
  const enhancedMastery = {...directMastery};
  
  // Process levels from highest to lowest cognitive complexity
  for (const level of [...this.taxonomyLevels].reverse()) {
    if (enhancedMastery[level]) {
      // If this level is mastered, all prerequisite levels should be considered mastered
      let prereqLevel = TAXONOMY_LEVEL_DEPENDENCIES[level];
      while (prereqLevel) {
        enhancedMastery[prereqLevel] = true;
        prereqLevel = TAXONOMY_LEVEL_DEPENDENCIES[prereqLevel];
      }
    }
  }
  
  return enhancedMastery;
}
```

A future implementation should consider this logical inference to prevent redundant assessments and provide a more accurate representation of a learner's mastery across taxonomy levels.

## 8. Implementation Notes and Future Work

### 8.1 Performance Considerations

- Precompute values where possible to avoid expensive runtime calculations
- Use topological sorting to efficiently process the DAG
- Cache results of common operations like deep prerequisite collection

### 8.2 Future Extensions

- **Knowledge Decay**: Model differential forgetting rates based on concept connectedness
- **Personalization**: Adapt difficulty and scheduling based on individual learning patterns
- **Learning Path Generation**: Recommend optimal sequences of concepts to study
- **Enhanced Taxonomy Support**: Allow for domain-specific taxonomy customization
- **Forgetting Propagation**: Model how forgetting a concept affects dependent knowledge

### 8.3 Edge Cases and Handling

- **Cycles in the Knowledge Graph**: Detected and handled to prevent infinite recursion
- **Inconsistent Evaluations**: Weighted by recency and evaluation difficulty
- **Incomplete Prerequisites**: Prevented from appearing in review selection

### 8.4 Taxonomy Level Multiplier Design

Rather than treating taxonomy level inclusion as binary (included/excluded), we now use multipliers to represent how effectively an evaluation tests each level:

- This is a more accurate model of real-world assessments
- Provides smooth transitions between levels
- Allows precise customization of evaluation types

For example, a short answer question might test REMEMBER at 0.7 effectiveness and UNDERSTAND at 0.8 effectiveness, showing that it's slightly better for testing understanding than pure recall.

To support both models:
1. Legacy code can treat multipliers > 0 as binary inclusion
2. Enhanced code can use the actual multiplier values for more precise calculations
