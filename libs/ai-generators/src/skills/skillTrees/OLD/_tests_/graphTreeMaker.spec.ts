import fs from 'fs';
import path from 'path';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';

import { GraphTreeMaker } from '../GraphTreeMaker';

// Define our dimensions
const SUBJECTS = [
    'Algebra',
    'Programming',
    'Chemistry',
] as const;

const THREAD_CONFIGS = {
    minimal: {
        numNodeThreads: 1,
        numEdgeThreads: 1,
        maxNodesPerThread: 5,
        maxEdgesPerThread: 5,
    },
    balanced: {
        numNodeThreads: 3,
        numEdgeThreads: 2,
        maxNodesPerThread: 10,
        maxEdgesPerThread: 15,
    },
    nodeHeavy: {
        numNodeThreads: 5,
        numEdgeThreads: 2,
        maxNodesPerThread: 15,
        maxEdgesPerThread: 10,
    },
    edgeHeavy: {
        numNodeThreads: 2,
        numEdgeThreads: 5,
        maxNodesPerThread: 10,
        maxEdgesPerThread: 20,
    }
} as const;

const TEMPERATURES = [0.3, 0.7, 1.0] as const;

type Subject = typeof SUBJECTS[number];
type ThreadConfigName = keyof typeof THREAD_CONFIGS;
type Temperature = typeof TEMPERATURES[number];

interface TestMatrixEntry {
    subject: Subject;
    threadConfig: ThreadConfigName;
    temperature: Temperature;
    description?: string;
}

// Generate the full test matrix
function generateTestMatrix(): TestMatrixEntry[] {
    const matrix: TestMatrixEntry[] = [];

    SUBJECTS.forEach(subject => {
        Object.keys(THREAD_CONFIGS).forEach(configName => {
            TEMPERATURES.forEach(temperature => {
                matrix.push({
                    subject,
                    threadConfig: configName as ThreadConfigName,
                    temperature,
                    description: `${subject} graph using ${configName} config at temperature ${temperature}`
                });
            });
        });
    });

    return matrix;
}

const TEST_MATRIX = generateTestMatrix();

// Optional: Filter the matrix for specific test cases
const FILTER_MATRIX = false; // Set to true to enable filtering
const filteredMatrix = (FILTER_MATRIX ? TEST_MATRIX.filter(entry => 
    // Add your filter conditions here
    entry.subject === 'Programming' && 
    entry.threadConfig === 'balanced' &&
    entry.temperature === 0.7
) : TEST_MATRIX);

describe('GraphTreeMaker Matrix Tests', () => {
    const ai = createDefaultStubAI();

    // Helper function to save output files
    const saveOutput = (entry: TestMatrixEntry, content: string, fname: string) => {
        const dirname = `out-${entry.subject}-${entry.threadConfig}-${entry.temperature}`;
        const dirpath = path.join(__dirname, 'test_output/graph-maker', dirname);
        const filepath = path.join(dirpath, fname);
        
        fs.mkdirSync(dirpath, { recursive: true });
        fs.writeFileSync(filepath, content);
    };

    // Run tests for each matrix entry
    filteredMatrix.forEach((entry) => {
        describe(`${entry.subject} -- ${entry.threadConfig} -- temp:${entry.temperature}`, () => {
            let graphMaker: GraphTreeMaker;

            beforeEach(() => {
                graphMaker = new GraphTreeMaker({
                    ai,
                    rootSkill: entry.subject
                });
            });

            it(`should generate a valid graph`, async () => {
                const config = THREAD_CONFIGS[entry.threadConfig];
                const result = await graphMaker.aiInitialize({
                    ...config,
                    temperature: entry.temperature
                });

                // Save the Mermaid diagram using the class method
                saveOutput(entry, result.toMermaidString(), 'graph.mermaid');

                // Save the raw graph
                saveOutput(entry, result.toAIString(), 'graph.json');

                // Basic validation
                expect(result.nodes).toBeDefined();
                expect(result.nodes.length).toBeGreaterThan(1); // At least root + 1 node
                expect(result.edges).toBeDefined();
                expect(result.edges.length).toBeGreaterThan(0); // At least 1 edge

                // Validate root node exists
                expect(result.nodes.some(n => n.id === entry.subject)).toBe(true);

                // Validate edge consistency
                result.edges.forEach(edge => {
                    // Both nodes in each edge should exist
                    expect(result.nodes.some(n => n.id === edge.prereq)).toBe(true);
                    expect(result.nodes.some(n => n.id === edge.enables)).toBe(true);
                });

                // Validate no self-loops
                result.edges.forEach(edge => {
                    expect(edge.prereq).not.toBe(edge.enables);
                });

                // Additional metrics to save
                const metrics = {
                    totalNodes: result.nodes.length,
                    totalEdges: result.edges.length,
                    averageEdgesPerNode: result.edges.length / result.nodes.length,
                    rootNodeOutDegree: result.edges.filter(e => e.prereq === entry.subject).length,
                    leafNodes: result.nodes.filter(n => 
                        !result.edges.some(e => e.prereq === n.id)
                    ).length,
                };
                saveOutput(entry, JSON.stringify(metrics, null, 2), 'metrics.json');
            }, { timeout: 120_000 });
        });
    });
}); 