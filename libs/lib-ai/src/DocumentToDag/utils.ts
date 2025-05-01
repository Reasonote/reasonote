interface ObjectWithPrerequisites {
    object: string;
    prerequisites: string[];
}

/**
 * Detects cycles in a directed graph of learning objectives using depth-first search (DFS).
 * 
 * A cycle exists when there is a path from a node that leads back to itself.
 * For example: A -> B -> C -> A is a cycle.
 * 
 * @param objectives - Array of learning objectives with their prerequisites
 * @returns Array of cycles found, where each cycle is an array of learning objective strings.
 *          Each cycle ends with the same node it started with to make the cycle explicit.
 * 
 * @example
 * const objectives = [
 *   { learningObjective: "A", prerequisites: ["B"] },
 *   { learningObjective: "B", prerequisites: ["C"] },
 *   { learningObjective: "C", prerequisites: ["A"] }
 * ];
 * findCycles(objectives) // Returns [["A", "B", "C", "A"]]
 */
export const findCycles = (objectives: ObjectWithPrerequisites[]): string[][] => {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const visit = (current: string): void => {
        // If node is in recursion stack, we found a cycle
        if (recursionStack.has(current)) {
            const cycleStartIndex = path.indexOf(current);
            const cycle = path.slice(cycleStartIndex).concat(current);
            if (cycle.length > 1) {
                cycles.push(cycle);
            }
            return;
        }

        // If we've already fully explored this node and found no cycles, skip it
        if (visited.has(current)) {
            return;
        }

        // Add to recursion stack and path for cycle detection
        recursionStack.add(current);
        path.push(current);

        // Visit all prerequisites
        const prereqs = objectives.find(o => o.object === current)?.prerequisites ?? [];
        for (const prereq of prereqs) {
            visit(prereq);
        }

        // Remove from recursion stack as we're done exploring this path
        recursionStack.delete(current);
        path.pop();
        // Mark as fully explored
        visited.add(current);
    };

    // Start DFS from each node to ensure we find all cycles
    objectives.forEach(obj => {
        visit(obj.object);
    });

    return cycles;
};

/**
 * Type guard to check if a learning objective has a cycle with itself (self-dependency)
 */
export const hasSelfDependency = (objective: ObjectWithPrerequisites): boolean => {
    return objective.prerequisites.includes(objective.object);
};

/**
 * Checks if a set of learning objectives contains any cycles
 * @returns true if any cycles are found, false otherwise
 */
export const hasCycles = (objectives: ObjectWithPrerequisites[]): boolean => {
    return findCycles(objectives).length > 0;
};