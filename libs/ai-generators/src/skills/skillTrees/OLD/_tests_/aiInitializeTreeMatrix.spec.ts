import fs from 'fs';
import path from 'path';
import {
  describe,
  it,
} from 'vitest';

import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';

import { AIGenSkillTree } from '../AIGenSkillTree';

// Define our dimensions
const SUBJECTS = [
    'Algebra',
    'Programming',
    'Chemistry',
] as const;

const VARIANTS = [
    'v1',
    'v2',
    'jgf',
] as const;

const PRE_WORK_STAGES = [
    'aiGenerateExpertJourneyMap',
    'aiGenerateCompetencyFramework',
    'aiGenerateProblemCenteredApproach',
] as const;

// Define named configurations of pre-work
const PRE_WORK_CONFIGS = {
    none: [],
    all: [...PRE_WORK_STAGES],
    expertOnly: ['aiGenerateExpertJourneyMap'],
    frameworkOnly: ['aiGenerateCompetencyFramework'],
    problemOnly: ['aiGenerateProblemCenteredApproach'],
    expertAndFramework: ['aiGenerateExpertJourneyMap', 'aiGenerateCompetencyFramework'],
} as const;

type Subject = typeof SUBJECTS[number];
type Variant = typeof VARIANTS[number];
type PreWorkStage = typeof PRE_WORK_STAGES[number];
type PreWorkConfigName = keyof typeof PRE_WORK_CONFIGS;

interface TestMatrixEntry {
    subject: Subject;
    variant: Variant;
    preWork: PreWorkStage[];
    preWorkConfigName: PreWorkConfigName;
    description?: string;
}

// Generate the full test matrix
function generateTestMatrix(): TestMatrixEntry[] {
    const matrix: TestMatrixEntry[] = [];

    // For each subject
    SUBJECTS.forEach(subject => {
        // For each variant
        VARIANTS.forEach(variant => {
            // For each pre-work configuration
            Object.entries(PRE_WORK_CONFIGS).forEach(([configName, stages]) => {
                matrix.push({
                    subject,
                    variant,
                    preWork: [...stages], // Clone the array
                    preWorkConfigName: configName as PreWorkConfigName,
                    description: `${subject} skill tree using ${variant} with ${configName} pre-work`
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
    entry.variant === 'jgf' &&
    entry.preWorkConfigName === 'none'
) : TEST_MATRIX)

describe('AIGenSkillTree Matrix Tests', () => {
    const ai = createDefaultStubAI();

    // Helper function to save output files
    const saveOutput = (entry: TestMatrixEntry, content: string, fname: string) => {
        const dirname = `out-${entry.subject}-${entry.variant}-${entry.preWorkConfigName}`;
        const dirpath = path.join(__dirname, 'test_output', dirname);
        const filepath = path.join(dirpath, fname);
        
        // Create subdir with correct name
        fs.mkdirSync(dirpath, { recursive: true });
        fs.writeFileSync(filepath, content);
    };

    // Run tests for each matrix entry
    filteredMatrix.forEach((entry, idx) => {
        describe(`${entry.subject} -- ${entry.variant} -- ${entry.preWorkConfigName}`, () => {
            let skillTree: AIGenSkillTree;

            beforeEach(async () => {
                skillTree = AIGenSkillTree.fromSkillTreeNode({
                    ai,
                    skillTree: {
                        name: entry.subject,
                        subskills: null
                    }
                });
            });

            it(`should generate a valid skill tree`, async (t) => {
                const result = await skillTree.aiInitializeTree({
                    version: entry.variant,
                    doPreStages: entry.preWork
                });

                // Save the Mermaid diagram
                const mermaidContent = result.toMermaidString();
                saveOutput(entry, mermaidContent, 'tree.mermaid');

                // Save the raw skill tree
                const treeContent = JSON.stringify(result.toAiString(), null, 2);
                saveOutput(entry, treeContent, 'tree.json');

                // Basic validation
                expect(result).toBeDefined();
                expect(result.hasExistingSkillTree).toBe(true);
            }, { timeout: 120_000 });
        });
    });
}); 