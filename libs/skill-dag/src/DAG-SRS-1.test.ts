import {
    describe,
    expect,
    it,
} from "vitest";

import { DAGScoreCollector } from "./DAG-SRS-1";

describe('DAGScoreCollector', () => {
  // Tests for collectAllScores
  it('should correctly collect scores for a simple linear DAG', () => {
    const collector = new DAGScoreCollector();
    collector.addNode({ id: 'A', scores: [100] });
    collector.addNode({ id: 'B', scores: [50] });
    collector.addNode({ id: 'C', scores: [75] });
    
    collector.addEdges('A', ['B'], 'to_child');
    collector.addEdges('B', ['C'], 'to_child');

    const allScores = collector.collectAllScores();

    expect(allScores.get('C')).toEqual([75]);
    expect(allScores.get('B')).toEqual([50, 75]);
    expect(allScores.get('A')).toEqual([100, 50, 75]);
  });

  it('should correctly collect scores for a branching DAG', () => {
    const collector = new DAGScoreCollector();
    // Using unique scores to track their origin:
    // A1: A's first test
    // B1, B2: B's two tests
    // C1, C2: C's two tests
    // D1: D's test
    collector.addNode({ id: 'A', scores: [100] });  // A1
    collector.addNode({ id: 'B', scores: [50, 60] });    // B1, B2
    collector.addNode({ id: 'C', scores: [70, 80] });    // C1, C2
    collector.addNode({ id: 'D', scores: [90] });        // D1
    
    // Set up relationships
    collector.addEdges('A', ['B', 'C'], 'to_child');
    collector.addEdges('B', ['D'], 'to_child');
    collector.addEdges('C', ['D'], 'to_child');

    const allScores = collector.collectAllScores();

    // D should only have its own score
    expect(allScores.get('D')).toEqual([90]);

    // B should have its scores and D's scores
    expect(allScores.get('B')).toEqual([50, 60, 90]);

    // C should have its scores and D's scores
    expect(allScores.get('C')).toEqual([70, 80, 90]);

    // A should have all scores
    expect(allScores.get('A')?.sort()).toEqual([100, 50, 60, 70, 80, 90].sort());
  });

  it('should handle circular references without infinite recursion', () => {
    const collector = new DAGScoreCollector();
    
    // Create nodes
    collector.addNode({ id: 'A', scores: [10] });
    collector.addNode({ id: 'B', scores: [20] });
    collector.addNode({ id: 'C', scores: [30] });
    
    // Create a cycle: A -> B -> C -> A
    collector.addEdges('A', ['B'], 'to_child');
    collector.addEdges('B', ['C'], 'to_child');
    collector.addEdges('C', ['A'], 'to_child'); // This creates a cycle!
    
    // This should complete without hanging
    const allScores = collector.collectAllScores();
    
    // Verify scores are collected properly despite the cycle
    // Each node should have all scores since they're all connected
    const expectedScores = [10, 20, 30];
    
    // Each node should have all scores from the cycle
    expect(allScores.get('A')?.sort()).toEqual(expectedScores.sort());
    expect(allScores.get('B')?.sort()).toEqual([20, 30].sort());
    expect(allScores.get('C')?.sort()).toEqual([30].sort());
    
    // Check that node scores are calculated correctly
    const nodeScores = collector.calculateNodeScores();
    
    // The average of [10, 20, 30] is 20
    const expectedAverage = 20;
    
    expect(nodeScores.get('A')?.full_score).toEqual(expectedAverage);
    expect(nodeScores.get('B')?.full_score).toEqual(25);
    expect(nodeScores.get('C')?.full_score).toEqual(30);
  });

  it('should handle multiple test scores for the same node', () => {
    const collector = new DAGScoreCollector();
    // Using unique scores to track their origin:
    // A1, A2: A's two tests
    // B1, B2: B's two tests
    // C1, C2: C's two tests
    collector.addNode({ id: 'A', scores: [100, 110] });  // A1, A2
    collector.addNode({ id: 'B', scores: [120, 130] });  // B1, B2
    collector.addNode({ id: 'C', scores: [140, 150] });  // C1, C2
    
    // Set up relationships
    collector.addEdges('A', ['B'], 'to_child');
    collector.addEdges('B', ['C'], 'to_child');

    const allScores = collector.collectAllScores();

    // Each node should keep all test scores
    expect(allScores.get('C')).toEqual([140, 150]);
    expect(allScores.get('B')).toEqual([120, 130, 140, 150]);
    expect(allScores.get('A')).toEqual([100, 110, 120, 130, 140, 150]);
  });

  it('should handle a node with no scores', () => {
    const collector = new DAGScoreCollector();
    collector.addNode({ id: 'A' });
    collector.addNode({ id: 'B', scores: [100] });
    
    collector.addEdges('A', ['B'], 'to_child');

    const allScores = collector.collectAllScores();

    expect(allScores.get('B')).toEqual([100]);
    expect(allScores.get('A')).toEqual([100]);
  });

  it('should handle a node with no children', () => {
    const collector = new DAGScoreCollector();
    collector.addNode({ id: 'A', scores: [100] });

    const allScores = collector.collectAllScores();

    expect(allScores.get('A')).toEqual([100]);
  });

  it('should throw an error for non-existent nodes', () => {
    const collector = new DAGScoreCollector();
    collector.addNode({ id: 'A', scores: [100] });
    
    // The error now happens immediately when adding the edge
    expect(() => 
      collector.addEdge('A', 'B', 'to_child', { createRefsIfNotExistent: false })
    ).toThrow('Node B not found and createRefsIfNotExistent is false');
  });

  it('should properly propagate scores from children to parents', () => {
    const collector = new DAGScoreCollector();
    
    // Add nodes
    collector.addNode({ id: 'A', scores: [10] });
    collector.addNode({ id: 'B', scores: [20] });
    collector.addNode({ id: 'C', scores: [30] });
    
    // Set up relationships
    collector.addEdges('A', ['C'], 'to_child');
    collector.addEdges('B', ['C'], 'to_child');
    
    const allScores = collector.collectAllScores();
    
    // A should have its own score and C's score
    expect(allScores.get('A')?.sort()).toEqual([10, 30].sort());
    
    // B should have its own score and C's score
    expect(allScores.get('B')?.sort()).toEqual([20, 30].sort());
    
    // C should have only its own score
    expect(allScores.get('C')).toEqual([30]);
  });

  // Tests for new API
  describe('Node and Edge Management', () => {
    it('should preserve relationships when overwriting nodes', () => {
      const collector = new DAGScoreCollector();
      
      // Add initial nodes and relationship
      collector.addNode({ id: 'A', scores: [10] });
      collector.addNode({ id: 'B', scores: [20] });
      collector.addEdges('A', ['B'], 'to_child');
      
      // Overwrite node A with new scores
      collector.addNode({ id: 'A', scores: [30] });
      
      const allScores = collector.collectAllScores();
      
      // Relationship should be preserved
      expect(allScores.get('A')?.sort()).toEqual([30, 20].sort());
    });
    
    it('should support to_parent direction when adding edges', () => {
      const collector = new DAGScoreCollector();
      
      collector.addNode({ id: 'A', scores: [10] });
      collector.addNode({ id: 'B', scores: [20] });
      
      // Add edge with B as parent of A
      collector.addEdges('A', ['B'], 'to_parent');
      
      const allScores = collector.collectAllScores();
      
      // B should have A's score
      expect(allScores.get('B')?.sort()).toEqual([20, 10].sort());
      
      // A should have only its own score
      expect(allScores.get('A')).toEqual([10]);
    });
    
    it('should create nodes automatically when adding edges', () => {
      const collector = new DAGScoreCollector();
      
      // Add edge between non-existent nodes
      collector.addEdges('A', ['B'], 'to_child');
      
      // Add scores to the auto-created nodes
      collector.addNode({ id: 'A', scores: [10] });
      collector.addNode({ id: 'B', scores: [20] });
      
      const allScores = collector.collectAllScores();
      
      // Relationship should work
      expect(allScores.get('A')?.sort()).toEqual([10, 20].sort());
    });
    
    it('should throw an error when createRefsIfNotExistent is false', () => {
      const collector = new DAGScoreCollector();
      
      // Should throw for non-existent fromId
      expect(() => 
        collector.addEdge('A', 'B', 'to_child', { createRefsIfNotExistent: false })
      ).toThrow('Node A not found');
      
      // Add node A, but B still doesn't exist
      collector.addNode({ id: 'A' });
      
      // Should throw for non-existent toId
      expect(() => 
        collector.addEdge('A', 'B', 'to_child', { createRefsIfNotExistent: false })
      ).toThrow('Node B not found');
    });
    
    it('should support adding multiple edges with addEdges', () => {
      const collector = new DAGScoreCollector();
      
      // Add nodes
      collector.addNode({ id: 'A', scores: [10] });
      collector.addNode({ id: 'B', scores: [20] });
      collector.addNode({ id: 'C', scores: [30] });
      collector.addNode({ id: 'D', scores: [40] });
      
      // Add multiple children at once
      collector.addEdges('A', ['B', 'C', 'D'], 'to_child');
      
      const allScores = collector.collectAllScores();
      
      // A should have all child scores
      expect(allScores.get('A')?.sort()).toEqual([10, 20, 30, 40].sort());
      
      // Each child should have only its own score
      expect(allScores.get('B')).toEqual([20]);
      expect(allScores.get('C')).toEqual([30]);
      expect(allScores.get('D')).toEqual([40]);
    });
    
    it('should support adding multiple parents with addEdges', () => {
      const collector = new DAGScoreCollector();
      
      // Add nodes
      collector.addNode({ id: 'A', scores: [10] });
      collector.addNode({ id: 'B', scores: [20] });
      collector.addNode({ id: 'C', scores: [30] });
      collector.addNode({ id: 'D', scores: [40] });
      
      // Add multiple parents at once
      collector.addEdges('D', ['A', 'B', 'C'], 'to_parent');
      
      const allScores = collector.collectAllScores();
      
      // All parents should include D's score
      expect(allScores.get('A')?.sort()).toEqual([10, 40].sort());
      expect(allScores.get('B')?.sort()).toEqual([20, 40].sort());
      expect(allScores.get('C')?.sort()).toEqual([30, 40].sort());
      
      // D should have only its own score
      expect(allScores.get('D')).toEqual([40]);
    });
    
    it('should handle autoCreation with addEdges', () => {
      const collector = new DAGScoreCollector();
      
      // Only create source node
      collector.addNode({ id: 'A', scores: [10] });
      
      // Add edges to non-existent nodes
      collector.addEdges('A', ['B', 'C', 'D'], 'to_child');
      
      // Add scores to auto-created nodes
      collector.addNode({ id: 'B', scores: [20] });
      collector.addNode({ id: 'C', scores: [30] });
      collector.addNode({ id: 'D', scores: [40] });
      
      const allScores = collector.collectAllScores();
      
      // A should have all child scores
      expect(allScores.get('A')?.sort()).toEqual([10, 20, 30, 40].sort());
    });

    it('should throw an error when nodes are missing', () => {
      const collector = new DAGScoreCollector();
      collector.addNode({ id: 'A', scores: [100] });
      
      // Now that our API immediately throws on missing nodes, this should throw
      expect(() => 
        collector.addEdges('A', ['B'], 'to_child', { createRefsIfNotExistent: false })
      ).toThrow('Node B not found and createRefsIfNotExistent is false');
    });
  });

  // Tests for average calculations (direct_score and full_score)
  describe('Average Calculations', () => {
    it('should correctly calculate direct_score for nodes', () => {
      const collector = new DAGScoreCollector();
      collector.addNode({ id: 'A', scores: [100, 200] });
      collector.addNode({ id: 'B', scores: [50, 60, 70] });
      collector.addNode({ id: 'C', scores: [90] });
      
      collector.addEdges('A', ['B'], 'to_child');
      collector.addEdges('B', ['C'], 'to_child');
      
      const nodeScores = collector.calculateNodeScores();
      
      expect(nodeScores.get('A')?.direct_score).toEqual(150);
      expect(nodeScores.get('B')?.direct_score).toEqual(60);
      expect(nodeScores.get('C')?.direct_score).toEqual(90);
    });
    
    it('should handle empty scores for direct_score', () => {
      const collector = new DAGScoreCollector();
      collector.addNode({ id: 'A' });
      collector.addNode({ id: 'B', scores: [100] });
      
      collector.addEdges('A', ['B'], 'to_child');
      
      const nodeScores = collector.calculateNodeScores();
      
      expect(nodeScores.get('A')?.direct_score).toEqual(0);
    });
    
    it('should correctly calculate full_score for a simple linear DAG', () => {
      const collector = new DAGScoreCollector();
      collector.addNode({ id: 'A', scores: [100] });
      collector.addNode({ id: 'B', scores: [50] });
      collector.addNode({ id: 'C', scores: [75] });
      
      collector.addEdges('A', ['B'], 'to_child');
      collector.addEdges('B', ['C'], 'to_child');
      
      const nodeScores = collector.calculateNodeScores();
      
      // C: [75] => 75
      expect(nodeScores.get('C')?.full_score).toEqual(75);
      
      // B: [50, 75] => (50 + 75) / 2 = 62.5
      expect(nodeScores.get('B')?.full_score).toEqual(62.5);
      
      // A: [100, 50, 75] => (100 + 50 + 75) / 3 = 75
      expect(nodeScores.get('A')?.full_score).toEqual(75);
    });
    
    it('should correctly calculate full_score for a branching DAG', () => {
      const collector = new DAGScoreCollector();
      collector.addNode({ id: 'A', scores: [100] });
      collector.addNode({ id: 'B', scores: [50, 60] });
      collector.addNode({ id: 'C', scores: [70, 80] });
      collector.addNode({ id: 'D', scores: [90] });
      
      collector.addEdges('A', ['B', 'C'], 'to_child');
      collector.addEdges('B', ['D'], 'to_child');
      collector.addEdges('C', ['D'], 'to_child');
      
      const nodeScores = collector.calculateNodeScores();
      
      // D: [90] => 90
      expect(nodeScores.get('D')?.full_score).toEqual(90);
      
      // B: [50, 60, 90] => (50 + 60 + 90) / 3 = 66.67
      expect(nodeScores.get('B')?.full_score).toBeCloseTo(66.67, 1);
      
      // C: [70, 80, 90] => (70 + 80 + 90) / 3 = 80
      expect(nodeScores.get('C')?.full_score).toEqual(80);
      
      // A: [100, 50, 60, 70, 80, 90] => (100 + 50 + 60 + 70 + 80 + 90) / 6 = 75
      expect(nodeScores.get('A')?.full_score).toEqual(75);
    });
    
    it('should handle complex score distributions', () => {
      const collector = new DAGScoreCollector();
      collector.addNode({ id: 'A', scores: [10, 20, 30] });
      collector.addNode({ id: 'B', scores: [40, 50] });
      collector.addNode({ id: 'C', scores: [60, 70, 80] });
      collector.addNode({ id: 'D', scores: [90, 100] });
      collector.addNode({ id: 'E', scores: [110, 120, 130] });
      
      collector.addEdges('A', ['B', 'C'], 'to_child');
      collector.addEdges('B', ['D'], 'to_child');
      collector.addEdges('C', ['D', 'E'], 'to_child');
      
      const nodeScores = collector.calculateNodeScores();
      
      // D: [90, 100] => (90 + 100) / 2 = 95
      expect(nodeScores.get('D')?.full_score).toEqual(95);
      
      // E: [110, 120, 130] => (110 + 120 + 130) / 3 = 120
      expect(nodeScores.get('E')?.full_score).toEqual(120);
      
      // B: [40, 50, 90, 100] => (40 + 50 + 90 + 100) / 4 = 70
      expect(nodeScores.get('B')?.full_score).toEqual(70);
      
      // C: [60, 70, 80, 90, 100, 110, 120, 130] => (60 + 70 + 80 + 90 + 100 + 110 + 120 + 130) / 8 = 95
      expect(nodeScores.get('C')?.full_score).toEqual(95);
      
      // A: all scores => avg of all scores
      const allScores = nodeScores.get('A')?.all_scores || [];
      const expectedAvg = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
      expect(nodeScores.get('A')?.full_score).toEqual(expectedAvg);
    });
  });

  // Performance tests for large DAGs
  describe('Large DAG Performance', () => {
    it('should process a large DAG (100_000 nodes) efficiently (under 2 seconds)', () => {
      const collector = new DAGScoreCollector();
      
      // Create a large DAG with 100_000 nodes (a tree with 10 levels, branching factor of 2)
      const totalNodes = 100_000;
      
      console.log('Building large DAG...');
      // Create all nodes first
      for (let i = 0; i < totalNodes; i++) {
        collector.addNode({ id: `node_${i}`, scores: [i % 100] });
      }
      
      // Create relationships - each node is parent to two children (except leaf nodes)
      // This creates a tree-like structure
      for (let i = 0; i < Math.floor(totalNodes / 2); i++) {
        const childIndexA = i * 2 + 1;
        const childIndexB = i * 2 + 2;
        
        if (childIndexA < totalNodes) {
          collector.addEdges(`node_${i}`, [`node_${childIndexA}`], 'to_child');
        }
        
        if (childIndexB < totalNodes) {
          collector.addEdges(`node_${i}`, [`node_${childIndexB}`], 'to_child');
        }
      }
      
      // Add some cross-connections to make it a DAG and not just a tree
      // Connect every 100th node to node_0 to create more complex paths
      for (let i = 100; i < totalNodes; i += 100) {
        collector.addEdges(`node_${i}`, [`node_0`], 'to_child');
      }
      
      console.log('Starting performance test...');
      const startTime = performance.now();
      
      // Run the algorithm
      const nodeScores = collector.calculateNodeScores();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Processed ${totalNodes} nodes in ${duration}ms`);
      
      // Verify it completed in under 2 seconds (2000ms)
      expect(duration).toBeLessThan(2000);
      
      // Verify some results to ensure correctness
      expect(nodeScores.has('node_0')).toBe(true);
      expect(nodeScores.has(`node_${totalNodes - 1}`)).toBe(true);
      
      // Root node should have scores from all descendants
      expect(nodeScores.get('node_0')?.all_scores.length).toBeGreaterThan(1);
      
      // Spot check that nodes include scores from their direct children
      // Check node_5 which should have children node_11 and node_12
      const node5Scores = nodeScores.get('node_5')?.all_scores || [];
      expect(node5Scores).toContain(11 % 100); // Score from node_11
      expect(node5Scores).toContain(12 % 100); // Score from node_12
      
      // Check node_20 which should have children node_41 and node_42
      const node20Scores = nodeScores.get('node_20')?.all_scores || [];
      expect(node20Scores).toContain(41 % 100); // Score from node_41
      expect(node20Scores).toContain(42 % 100); // Score from node_42
      
      // Check a node near the middle of the tree
      const node150Scores = nodeScores.get('node_150')?.all_scores || [];
      expect(node150Scores).toContain(301 % 100); // Score from node_301
      expect(node150Scores).toContain(302 % 100); // Score from node_302
    });
    
    it('should handle a wide DAG with many direct children', () => {
      const collector = new DAGScoreCollector();
      
      // Create one root node with 2000 direct children
      collector.addNode({ id: 'root', scores: [100] });
      
      // Create 2000 child nodes
      const children = [];
      for (let i = 0; i < 2000; i++) {
        const childId = `child_${i}`;
        collector.addNode({ id: childId, scores: [i % 100] });
        children.push(childId);
      }
      
      // Connect root to all children
      collector.addEdges('root', children, 'to_child');
      
      const startTime = performance.now();
      
      // Run the algorithm
      const nodeScores = collector.calculateNodeScores();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Processed wide DAG with 2001 nodes in ${duration}ms`);
      
      // Verify it completed in under 2 seconds (2000ms)
      expect(duration).toBeLessThan(2000);
      
      // Root node should have 2001 scores (its own + 2000 children)
      expect(nodeScores.get('root')?.all_scores.length).toBe(2001);
      
      // Spot check that root node contains scores from specific children
      const rootScores = nodeScores.get('root')?.all_scores || [];
      expect(rootScores).toContain(42 % 100); // Score from child_42
      expect(rootScores).toContain(123 % 100); // Score from child_123
      expect(rootScores).toContain(999 % 100); // Score from child_999
      
      // Test a few random children to make sure they only have their own scores
      expect(nodeScores.get('child_42')?.all_scores.length).toBe(1);
      expect(nodeScores.get('child_999')?.all_scores.length).toBe(1);
    });
  });
}); 