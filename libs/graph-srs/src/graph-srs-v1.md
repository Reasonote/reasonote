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
  /** Difficulty factor of the evaluation method */
  evaluationDifficulty: number;
  /** Memory stability after this review (in seconds) */
  stability?: number;
  /** Recall probability at time of review (0-1) */
  retrievability?: number;
}
```

#### First Review Handling

For new material, there's no previous stability to calculate retrievability from:

- **Initial retrievability**: Set to 0.5 (50/50 chance) for first exposure to completely new material
- **Initial stability**: Calculated based on first score and evaluation difficulty
- **Quick follow-up**: Poor initial performance results in rapid re-review scheduling

#### Preprocessing Logic

The system accepts evaluation records that may have missing calculated fields, and fills them in during preprocessing:

```typescript
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
```

### 2.3 Score Normalization

Since evaluation methods vary in difficulty, raw scores must be normalized:

```typescript
private normalizeScore(score: number, evaluationDifficulty: number): number {
  return score * (1 - evaluationDifficulty/2);
}
```

This ensures that a perfect score on a difficult evaluation (e.g., free recall) is weighted more heavily than a perfect score on an easier evaluation (e.g., multiple choice).

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
  /** Set of child node IDs - THESE ARE PREREQUISITES OF THIS NODE */
  children: Set<string>;
  /** Set of parent node IDs - THESE ARE DEPENDENT ON THIS NODE */
  parents: Set<string>;
}

// Edge directions
type GraphSRSV1EdgeDirection = 'to_child' | 'to_parent';
```

### 4.2 Prerequisites vs. Dependents

In GraphSRS, the relationship direction is pedagogically significant:

- **Children are prerequisites of their parents**: You need to master prerequisite concepts (children) before learning dependent concepts (parents)
- `to_child` direction: Node A has Node B as a child, meaning B is a prerequisite of A
- `to_parent` direction: Node A has Node B as a parent, meaning A is a prerequisite of B

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
      if (this.areAllPrerequisitesMastered(nodeId)) {
        readyNodes.push(nodeId);
      }
    }
  });
  
  return readyNodes;
}
```

## 6. Score Propagation and Metrics

GraphSRS analyzes the entire knowledge graph to provide useful metrics:

### 6.1 Descendant Collection

```typescript
private collectAllDescendants(): Map<string, Set<string>> {
  const allDescendants = new Map<string, Set<string>>();
  
  const getDescendants = (nodeId: string, visited = new Set<string>()): Set<string> => {
    // Check for cycles
    if (visited.has(nodeId)) {
      return new Set(); // Break cycles
    }
    
    // If already calculated, return cached result
    if (allDescendants.has(nodeId)) {
      return allDescendants.get(nodeId)!;
    }
    
    // Mark as visited
    visited.add(nodeId);
    
    const node = this.nodes.get(nodeId)!;
    
    // Include self in descendants
    const descendants = new Set<string>([nodeId]);
    
    // Add all children and their descendants
    for (const childId of Array.from(node.children)) {
      const childDescendants = getDescendants(childId, new Set(visited));
      for (const descendant of Array.from(childDescendants)) {
        descendants.add(descendant);
      }
    }
    
    // Cache and return result
    allDescendants.set(nodeId, descendants);
    return descendants;
  };
  
  // Calculate for all nodes
  for (const nodeId of Array.from(this.nodes.keys())) {
    if (!allDescendants.has(nodeId)) {
      getDescendants(nodeId);
    }
  }
  
  return allDescendants;
}
```

### 6.2 Node Score Calculation

```typescript
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

// Support custom taxonomies
export interface CustomTaxonomy {
  name: string;
  levels: string[];
  dependencies: Record<string, string | null>;
}
```

### 7.2 Enhanced Evaluation Record

```typescript
export interface EvalRecord {
  // Existing fields
  timestamp: number;
  score: number;
  evaluationType: string;
  evaluationDifficulty: number;
  stability?: number;
  retrievability?: number;
  
  // New field
  taxonomyLevels: string[]; // Which levels this evaluation targets
}
```

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
  children: Set<string>;
  parents: Set<string>;
  
  // New fields for taxonomy tracking
  masteryByLevel: Record<string, boolean>; // Track mastery per level
  nextReviewTimeByLevel: Record<string, number | null>; // Schedule per level
  prerequisitesMasteredByLevel: Record<string, boolean>; // Precomputed prerequisite status
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
    node.prerequisitesMasteredByLevel = {};
    node.masteryByLevel = {};
    for (const level of this.taxonomyLevels) {
      node.prerequisitesMasteredByLevel[level] = true;
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
  
  // Third pass: Use existing collectAllDescendants to determine prerequisite mastery
  const allDescendants = this.collectAllDescendants();
  
  // For each node, check if all prerequisites have mastered the required levels
  for (const [nodeId, node] of this.nodes.entries()) {
    for (const level of this.taxonomyLevels) {
      // Get all prerequisites (descendants in our graph) excluding self
      const prerequisites = Array.from(allDescendants.get(nodeId) || new Set());
      // Remove self from prerequisites
      const selfIndex = prerequisites.indexOf(nodeId);
      if (selfIndex >= 0) {
        prerequisites.splice(selfIndex, 1);
      }
      
      // Check if ALL prerequisites have mastered this level
      for (const prereqId of prerequisites) {
        const prereq = this.nodes.get(prereqId);
        if (!prereq || !prereq.masteryByLevel[level]) {
          node.prerequisitesMasteredByLevel[level] = false;
          break;
        }
      }
    }
  }
}
```

This implementation takes advantage of the existing `collectAllDescendants()` function which already efficiently handles graph traversal, caching, and cycle detection. This approach offers several benefits:

1. **Reuses existing code**: Leverages the tested graph traversal logic already in place
2. **Efficient computation**: Avoids redundant traversals by using cached descendant data
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
    
    if (isDueForLevel && taxonomyPrereqsMet && node.prerequisitesMasteredByLevel[level]) {
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
- Cache results of common operations like descendant collection

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
