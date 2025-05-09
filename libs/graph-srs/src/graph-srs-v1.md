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

### 2.2 Repetition History Structure

```typescript
interface RepetitionRecord {
  // Required input fields
  timestamp: number;             // When the review occurred (epoch ms)
  score: number;                 // 0-1 range (0 = complete failure, 1 = perfect recall)
  evaluationType: string;        // Identifier for the evaluation method used
  evaluationDifficulty: number;  // Difficulty factor of this evaluation type (0-1)
  
  // Optional calculated fields
  stability?: number;            // Memory stability after this review (in seconds)
  retrievability?: number;       // Recall probability at time of review (0-1)
}
```

#### First Review Handling

For new material, there's no previous stability to calculate retrievability from. We use these guidelines:

- **Initial retrievability**: Set to 0.5 (50/50 chance) for first exposure to completely new material
- **Initial stability**: Calculated based on first score and evaluation difficulty
- **Learning phase**: Consider implementing a separate learning phase for completely new material before scheduling the first review

#### Preprocessing Logic

The system accepts repetition records that may have missing calculated fields, and fills them in during preprocessing:

```typescript
function preprocessRepetitionHistory(history: RepetitionRecord[]): RepetitionRecord[] {
  // Sort by timestamp (earliest first)
  const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);
  
  // Track running stability value
  let prevStability = 0;
  
  // Process each record sequentially
  return sortedHistory.map((record, index) => {
    // Calculate retrievability if missing
    if (record.retrievability === undefined) {
      if (index === 0) {
        // First exposure has no previous stability to base retrievability on
        record.retrievability = 0.5; // Initial 50/50 chance for new material
      } else {
        const elapsed = (record.timestamp - sortedHistory[index-1].timestamp) / 1000;
        record.retrievability = calculateRetrievability(prevStability, elapsed);
      }
    }
    
    // Calculate stability if missing
    if (record.stability === undefined) {
      record.stability = calculateNewStability(
        prevStability, 
        record.retrievability, 
        record.score,
        record.evaluationDifficulty
      );
    }
    
    // Update for next iteration
    prevStability = record.stability;
    
    return record;
  });
}
```

#### Example: Complete Repetition History

```typescript
// Example repetition history for a concept
conceptNode.repetitionHistory = [
  {
    // First exposure to the concept
    timestamp: 1623456789000,             // June 12, 2021
    score: 0.8,                           // 80% correct
    evaluationType: 'multiple_choice',
    evaluationDifficulty: 0.2,
    stability: 172800,                    // 2 days in seconds
    retrievability: 0.5                   // Initial 50/50 chance for new material
  },
  {
    // Review after 4 days
    timestamp: 1623802789000,             // June 16, 2021
    score: 0.6,                           // 60% correct
    evaluationType: 'short_answer',
    evaluationDifficulty: 0.6,
    stability: 345600,                    // 4 days in seconds
    retrievability: 0.67                  // Probability at time of review
  },
  {
    // Review after 7 days
    timestamp: 1624407589000,             // June 23, 2021
    score: 0.9,                           // 90% correct
    evaluationType: 'free_recall',
    evaluationDifficulty: 0.8,
    stability: 1036800,                   // 12 days in seconds
    retrievability: 0.83                  // Probability at time of review
  }
];
```

### 2.3 Score Normalization

Since evaluation methods vary in difficulty, raw scores must be normalized:

```
normalizedScore = rawScore * (1 - evaluationDifficulty/2)
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
function calculateDifficulty(repetitionHistory: RepetitionRecord[]): number {
  if (repetitionHistory.length === 0) return 0.5; // Default medium difficulty
  
  // Calculate normalized scores
  const normalizedScores = repetitionHistory.map(record => 
    normalizeScore(record.score, record.evaluationDifficulty)
  );
  
  // Higher scores mean easier items, so invert
  const avgNormalizedScore = average(normalizedScores);
  
  // Apply scaling to center difficulty values
  const difficulty = 1 - avgNormalizedScore;
  
  // Clamp between 0.1 and 0.9 to avoid extremes
  return Math.max(0.1, Math.min(0.9, difficulty));
}
```

## 4. Dependency Management

### 4.1 Mastery Determination

A concept is considered "mastered" when:

1. Its stability exceeds a configurable threshold (default ~21-30 days)
2. Recent scores consistently exceed a threshold (e.g., >0.8)
3. A minimum number of successful reviews have been completed

Or when explicitly marked with `masteryOverride = true`.

```typescript
function isMastered(node: GraphSRSNode, masteryThresholdDays = 21): boolean {
  // Check for manual override
  if (node.masteryOverride !== null) return node.masteryOverride;
  
  const { repetitionHistory } = node;
  
  // Need minimum number of reviews
  if (repetitionHistory.length < 3) return false;
  
  // Get current stability from most recent review
  const latestEntry = repetitionHistory[repetitionHistory.length - 1];
  const currentStability = latestEntry.stability || 0;
  
  // Calculate mastery threshold based on importance
  const dependentCount = getDescendantCount(node.id);
  const baseThreshold = masteryThresholdDays * 24 * 60 * 60; // Convert days to seconds
  const adjustedThreshold = baseThreshold * (1 + dependentCount * 0.1);
  
  // Check if stability exceeds threshold
  const hasStability = currentStability >= adjustedThreshold;
  
  // Check if recent scores are consistently high
  const recentRecords = repetitionHistory.slice(-3);
  const recentScores = recentRecords.map(record => 
    normalizeScore(record.score, record.evaluationDifficulty)
  );
  const avgRecentScore = average(recentScores);
  const hasHighScores = avgRecentScore >= 0.8;
  
  return hasStability && hasHighScores;
}
```

### 4.2 Dependency Rules

1. A concept becomes available for review only when all its prerequisite concepts are mastered
2. The mastery threshold is proportional to the number of dependent concepts
3. More critical concepts (those with many dependents) require higher mastery levels

## 5. Scheduling Algorithm

### 5.1 Next Review Time Calculation

```typescript
function calculateNextReviewTime(node: GraphSRSNode): number | null {
  const { repetitionHistory } = node;
  
  // If no history, no review time
  if (repetitionHistory.length === 0) return null;
  
  // Get current stability
  const currentStability = repetitionHistory[repetitionHistory.length - 1].stability || 0;
  if (currentStability === 0) return null;
  
  // Calculate interval based on stability and target retrievability
  // Rearranging the retrievability formula: R = exp(-t/S)
  // To solve for t: t = -S * ln(R)
  const targetRetrievability = 0.9; // Default target
  const interval = -currentStability * Math.log(targetRetrievability);
  
  // Apply interval fuzz to prevent clustering
  const fuzzFactor = 0.1; // ±10%
  const fuzz = 1 + (Math.random() * 2 - 1) * fuzzFactor;
  const fuzzedInterval = interval * fuzz;
  
  return Date.now() + fuzzedInterval;
}
```

### 5.2 Review Selection Rules

When selecting concepts for review:

1. Prioritize concepts whose retrievability has dropped below target threshold
2. Only include concepts whose prerequisites are mastered
3. Prefer concepts that block many other concepts from being available
4. Apply interval fuzz (±10%) to prevent clusters of reviews

## 6. Implementation Considerations

### 6.1 Required Node Data Structure

```typescript
interface GraphSRSNode {
  id: string;
  repetitionHistory: RepetitionRecord[];
  difficulty?: number;        // Calculated from repetition history
  masteryOverride: boolean | null;
  nextReviewTime: number | null;
  children: Set<string>;
  parents: Set<string>;
}
```

### 6.2 Performance Optimization

For large knowledge graphs:

1. Cache mastery status of frequently accessed nodes
2. Pre-compute available nodes for review
3. Use incremental updates to dependency status when nodes change mastery

## 7. Future Extensions

- **Forgetting Propagation**: Model how forgetting a prerequisite concept affects knowledge of dependent concepts
- **Knowledge Decay**: Implement differential decay rates based on concept usage frequency
- **Personalized Difficulty**: Adapt difficulty weights based on user strengths and weaknesses
- **Optimal Learning Path**: Generate recommended concept sequences for efficient learning
