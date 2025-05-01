import { cosineSimilarity } from 'ai';
import { z } from 'zod';

import { AI } from '../AI';
import { DocDB } from '../docdb';
import { DocumentChunk } from '../docdb/types';
import {
  ExtractChunkLearningObjectivesPrompt,
  ExtractReferenceSentencesPrompt,
  FindPrerequisitesPrompt,
  GenerateLearningSummaryPrompt,
  GenerateLessonGroupsPrompt,
  GenerateSkillNamePrompt,
  GroupLearningObjectivesPrompt,
  RankLessonsPrompt,
} from '../prompt/AIPromptObj/DocumentToDag.priompt';
import { priomptRenderToString } from '../prompt/AIPromptObj/PromptComponents';
import { findCycles } from './utils';

export interface CreateDagOptions {
    documentId: string;
    docDB: DocDB;
    summary: {
        summary: string;
        learningObjectives: string[];
    };
    threshold?: number;
    maxClusterSize?: number;
    thresholdIncrement?: number;
}

export interface LearningObjective {
    learningObjective: string;
    chunkIds: string[];
    ids: string[];
    allSubObjectives: string[];
    vector?: number[];
}

export interface ReferenceSentenceWithMetadata {
    sentence: string;
    isExactMatch: boolean;
    sourceChunkId: string;
    sourceDocumentId: string;
}

export interface LearningObjectiveWithReferences extends LearningObjective {
    referenceSentences: ReferenceSentenceWithMetadata[];
}

export interface LearningObjectiveWithPrerequisites extends LearningObjectiveWithReferences {
    prerequisites: string[];
}

export interface LessonGroup {
    lessonName: string;
    cluster: LearningObjectiveWithReferences[];
    chunkIds: string[];
    expectedDurationMinutes: number;
}

export interface LessonGroupWithPrerequisites extends LessonGroup {
    prerequisites: string[];
}
export class DocumentToDag {
    constructor(private readonly ai: AI) { }

    private readonly TOKEN_LIMIT = 100000;

    async generateLearningSummary(chunks: Array<{ content: string, p: number }>): Promise<{ summary: string; learningObjectives: string[] }> {
        console.log('[DocumentToDag] Generating learning-focused summary...');
        if (!chunks || chunks.length === 0) {
            throw new Error('Chunks are required');
        }

        // Validate that at least one chunk has non-whitespace content
        const hasValidContent = chunks.some(chunk => chunk.content.trim().length > 0);
        if (!hasValidContent) {
            throw new Error('At least one chunk must contain non-whitespace content');
        }

        const prompt = await priomptRenderToString(
            GenerateLearningSummaryPrompt({ chunks }),
            { tokenLimit: this.TOKEN_LIMIT }
        );
        const summary = await this.ai.genObject({
            schema: z.object({
                summary: z.string().describe("A learning-focused summary of the document"),
                learningObjectives: z.array(z.string()).describe("The key learning objectives from this document"),
            }),
            prompt: prompt,
            model: "openai:gpt-4o-mini",
            mode: "json",
            providerArgs: {
                structuredOutputs: true,
            },
        });

        console.log('[DocumentToDag] Generated learning-focused summary and broad learning objectives');
        return summary.object;
    }

    async generateSkillName(firstChunkContent: string, summary: string, learningObjectives: string[]): Promise<{ skillName: string; emoji: string }> {
        const prompt = await priomptRenderToString(
            GenerateSkillNamePrompt({ firstChunkContent, summary, learningObjectives }),
            { tokenLimit: this.TOKEN_LIMIT }
        );

        const result = await this.ai.genObject({
            schema: z.object({
                skillName: z.string().describe("A name for the skill that is a single phrase that captures the essence of the learning objectives"),
                emoji: z.string().describe("An emoji that represents the skill"),
            }),
            prompt: prompt,
            model: "openai:gpt-4o-mini",
            mode: "json",
            providerArgs: {
                structuredOutputs: true,
            },
        });

        return result.object;
    }


    async extractSpecificLearningObjectives(chunks: DocumentChunk[], summary: { summary: string; learningObjectives: string[] }): Promise<LearningObjective[]> {
        console.log('[DocumentToDag] Extracting learning objectives for chunk...');
        const learningObjectivesResults = await Promise.all(
            chunks.map(async (chunk, index) => {
                try {
                    if (chunk.content.trim() === '') {
                        return {
                            chunkId: chunk.id,
                            learningObjectives: [],
                        };
                    }

                    const prompt = await priomptRenderToString(
                        ExtractChunkLearningObjectivesPrompt({ chunk: chunk.content, summary }),
                        { tokenLimit: this.TOKEN_LIMIT }
                    );

                    const result = await this.ai.genObject({
                        schema: z.object({
                            objectives: z.array(z.string()).describe("Specific learning objectives for this chunk"),
                        }),
                        prompt: prompt,
                        model: "openai:gpt-4o-mini",
                        mode: "json",
                        providerArgs: {
                            structuredOutputs: true,
                        },
                    });

                    console.log(`[DocumentToDag] Extracted ${result.object.objectives.length} learning objectives from chunk ${index + 1}/${chunks.length}`);
                    return {
                        chunkId: chunk.id,
                        learningObjectives: result.object.objectives
                    };
                } catch (error) {
                    console.error(`[DocumentToDag] Error extracting learning objectives for chunk ${index + 1}:`, error);
                    throw error;
                }
            })
        );

        const learningObjectives = learningObjectivesResults.flatMap(result =>
            result.learningObjectives.map((objective, index) => ({
                learningObjective: objective,
                chunkIds: [result.chunkId],
                ids: [`${result.chunkId}-${index}`],
                allSubObjectives: [objective]
            }))
        );
        return learningObjectives;
    }

    private async generateLearningObjectiveEmbeddings(learningObjectives: LearningObjective[]): Promise<(LearningObjective & { vector?: number[] })[]> {
        console.log('[DocumentToDag] Embedding learning objectives...');
        const inputs = learningObjectives.map(obj => obj.learningObjective);
        const embeddings = await this.ai.embed.embedItems(inputs);

        return learningObjectives.map((obj, index) => ({
            ...obj,
            vector: embeddings[index]
        }));
    }

    private async generateLearningObjectiveWithReferencesEmbedding(learningObjectives: LearningObjectiveWithReferences[]): Promise<(LearningObjectiveWithReferences & { vector?: number[] })[]> {
        console.log('[DocumentToDag] Embedding learning objectives with references...');
        const inputs = learningObjectives.map(obj => {
            const referencesText = obj.referenceSentences?.map(ref => ref.sentence).join(' ') || '';
            return `${obj.learningObjective} ${referencesText}`;
        });

        const embeddings = await this.ai.embed.embedItems(inputs);

        return learningObjectives.map((obj, index) => ({
            ...obj,
            vector: embeddings[index]
        }));
    }

    computeSimilarityMatrix(learningObjectives: LearningObjective[]): Array<Array<{ learningObjective1: LearningObjective; learningObjective2: LearningObjective; similarity: number }>> {
        console.log('[DocumentToDag] Computing cosine similarity...');
        return learningObjectives.map((learningObjective, index) => {
            return learningObjectives.slice(index + 1).map((otherLearningObjective) => {
                return {
                    learningObjective1: learningObjective,
                    learningObjective2: otherLearningObjective,
                    similarity: cosineSimilarity(learningObjective.vector ?? [], otherLearningObjective.vector ?? [])
                };
            });
        });
    }

    async clusterChunkLearningObjectives(
        learningObjectives: LearningObjective[],
        similarityMatrix: Array<Array<{ learningObjective1: LearningObjective; learningObjective2: LearningObjective; similarity: number }>>,
        threshold: number,
        maxClusterSize: number,
        thresholdIncrement: number,
        maxThreshold: number = 1.0
    ): Promise<LearningObjective[][]> {
        console.log('[DocumentToDag] Efficiently combining similar learning objectives using threshold:', threshold);
        // Helper function to perform clustering with a given threshold and matrix
        const clusterWithThreshold = (
            objectives: LearningObjective[],
            matrix: Array<Array<{ learningObjective1: LearningObjective; learningObjective2: LearningObjective; similarity: number }>>,
            currentThreshold: number
        ): LearningObjective[][] => {
            // Step 1: Map each unique ID to its learning objective
            const idToObjective = new Map<string, LearningObjective>();
            const allIds: string[] = [];

            objectives.forEach(obj => {
                obj.ids.forEach(id => {
                    idToObjective.set(id, obj);
                    allIds.push(id);
                });
            });

            // Step 2: Union-Find setup
            const parent = new Map<string, string>();
            const rank = new Map<string, number>();  // Add rank for union by rank

            function find(x: string): string {
                if (parent.get(x) !== x) {
                    parent.set(x, find(parent.get(x)!)); // Path compression
                }
                return parent.get(x)!;
            }

            function union(x: string, y: string) {
                const rootX = find(x);
                const rootY = find(y);

                if (rootX === rootY) return;  // Already in same set

                const rankX = rank.get(rootX) || 0;
                const rankY = rank.get(rootY) || 0;

                // Union by rank
                if (rankX < rankY) {
                    parent.set(rootX, rootY);
                } else if (rankX > rankY) {
                    parent.set(rootY, rootX);
                } else {
                    parent.set(rootY, rootX);
                    rank.set(rootX, rankX + 1);
                }
            }

            // Initialize parent and rank maps
            allIds.forEach(id => {
                parent.set(id, id);
                rank.set(id, 0);
            });

            // Step 3: Process similarity matrix with current threshold
            for (const row of matrix) {
                for (const { learningObjective1, learningObjective2, similarity } of row) {
                    if (similarity >= currentThreshold) {
                        for (const id1 of learningObjective1.ids) {
                            for (const id2 of learningObjective2.ids) {
                                union(id1, id2);
                            }
                        }
                    }
                }
            }

            // Step 4: Group IDs by root
            const clusters = new Map<string, Set<string>>();
            for (const id of allIds) {
                const root = find(id);
                if (!clusters.has(root)) clusters.set(root, new Set());
                clusters.get(root)!.add(id);
            }

            // Step 5: Create groups of learning objectives, ensuring no duplicates
            const seenObjectives = new Set<string>();
            const objectiveGroups: LearningObjective[][] = [];

            for (const ids of clusters.values()) {
                const groupObjectives: LearningObjective[] = [];
                for (const id of ids) {
                    const objective = idToObjective.get(id)!;
                    // Only add if we haven't seen this objective in this group
                    if (!seenObjectives.has(objective.learningObjective)) {
                        groupObjectives.push(objective);
                        seenObjectives.add(objective.learningObjective);
                    }
                }
                if (groupObjectives.length > 0) {
                    objectiveGroups.push(groupObjectives);
                }
            }

            return objectiveGroups;
        };

        // Recursively cluster until all groups are within size limit
        const recursiveCluster = (groups: LearningObjective[][], currentThreshold: number): LearningObjective[][] => {
            // Check if any group exceeds the maximum size
            const hasLargeGroup = groups.some(group => group.length > maxClusterSize);

            if (!hasLargeGroup || currentThreshold >= maxThreshold) {
                return groups;
            }

            // Recluster large groups with a higher threshold
            const newGroups: LearningObjective[][] = [];
            const seenObjectives = new Set<string>();

            for (const group of groups) {
                if (group.length > maxClusterSize) {
                    console.log('[DocumentToDag] Found large group of size ', group.length, '. Recombining this group with a higher threshold...');
                    // Create a new similarity matrix for just this group
                    const subMatrix = similarityMatrix.filter(row =>
                        row.some(cell =>
                            group.some(objective => objective.learningObjective === cell.learningObjective1.learningObjective) &&
                            group.some(objective => objective.learningObjective === cell.learningObjective2.learningObjective)
                        )
                    );

                    // Recursively cluster this group with a higher threshold
                    const subGroups = clusterWithThreshold(group, subMatrix, currentThreshold + thresholdIncrement);

                    // Only add objectives we haven't seen before
                    for (const subGroup of subGroups) {
                        const uniqueSubGroup = subGroup.filter(obj => !seenObjectives.has(obj.learningObjective));
                        if (uniqueSubGroup.length > 0) {
                            newGroups.push(uniqueSubGroup);
                            uniqueSubGroup.forEach(obj => seenObjectives.add(obj.learningObjective));
                        }
                    }

                    console.log('[DocumentToDag] Found ', subGroups.length, ' groups of learning objectives for this group');
                } else {
                    // For smaller groups, only add objectives we haven't seen
                    const uniqueGroup = group.filter(obj => !seenObjectives.has(obj.learningObjective));
                    if (uniqueGroup.length > 0) {
                        newGroups.push(uniqueGroup);
                        uniqueGroup.forEach(obj => seenObjectives.add(obj.learningObjective));
                    }
                }
            }

            return recursiveCluster(newGroups, currentThreshold + thresholdIncrement);
        };

        // Initial clustering with provided threshold
        const initialGroups = clusterWithThreshold(learningObjectives, similarityMatrix, threshold);
        const finalGroups = recursiveCluster(initialGroups, threshold);

        console.log('[DocumentToDag] Found', finalGroups.length, 'groups of learning objectives after size constraint');

        return finalGroups;
    }

    async generateGroupedObjectives(objectives: LearningObjective[]): Promise<Array<{ representative: string, group: string[] }>> {
        const nonEmptyObjectives = objectives.filter(o => o.learningObjective.trim() !== '');
        if (nonEmptyObjectives.length === 0) {
            return [];
        }

        const prompt = await priomptRenderToString(
            GroupLearningObjectivesPrompt({ objectiveNames: nonEmptyObjectives.map(o => o.learningObjective) }),
            { tokenLimit: this.TOKEN_LIMIT }
        );

        const result = await this.ai.genObject({
            schema: z.object({
                groups: z.array(z.object({
                    representative: z.string().describe("A comprehensive learning objective that represents this group"),
                    group: z.array(z.string()).describe("The exact learning objectives that belong to this group")
                }))
            }),
            prompt: prompt,
            model: "openai:gpt-4o-mini",
            mode: "json",
            providerArgs: {
                structuredOutputs: true,
            },
        });

        return result.object.groups;
    }

    async combineGroupedObjectives(objectiveGroups: LearningObjective[][]): Promise<LearningObjective[]> {
        // Process each group and flatten the results
        const processedGroups = await Promise.all(objectiveGroups.map(async (group, index) => {
            console.log('[DocumentToDag] Combining grouped objectives for group ', index + 1, '/', objectiveGroups.length);

            // For single-objective groups, return as is
            if (group.length === 1) {
                console.log('[DocumentToDag] Single-objective group, returning as is for group ', index + 1, '/', objectiveGroups.length);
                return group[0];
            }

            // For multiple objectives, use AI to generate representative objectives
            const groupResults = await this.generateGroupedObjectives(group);
            console.log('[DocumentToDag] Found ', groupResults.length, ' results for group ', index + 1, '/', objectiveGroups.length);

            // Convert each group result into a learning objective
            return groupResults.map(result => {
                // Find the original objectives that match this group
                const matchingObjectives = group.filter(
                    obj => result.group.includes(obj.learningObjective)
                );

                return {
                    learningObjective: result.representative,
                    ids: Array.from(new Set(matchingObjectives.flatMap(o => o.ids))),
                    chunkIds: Array.from(new Set(matchingObjectives.flatMap(o => o.chunkIds))),
                    allSubObjectives: result.group
                } satisfies LearningObjective;
            });
        }));

        // Flatten the results into a single array of learning objectives
        return processedGroups.flat();
    }

    async deduplicateLearningObjectives(learningObjectives: LearningObjective[], threshold: number, maxClusterSize: number, thresholdIncrement: number): Promise<LearningObjective[]> {
        const objectivesWithEmbeddings = await this.generateLearningObjectiveEmbeddings(learningObjectives);
        const similarityMatrix = this.computeSimilarityMatrix(objectivesWithEmbeddings);
        const objectiveClusters = await this.clusterChunkLearningObjectives(learningObjectives, similarityMatrix, threshold, maxClusterSize, thresholdIncrement);

        console.log('[DocumentToDag] Found ', objectiveClusters.length, ' groups of learning objectives');
        const mergedObjectives = await this.combineGroupedObjectives(objectiveClusters);

        console.log('[DocumentToDag] Found ', mergedObjectives.length, ' deduplicated learning objectives');
        return mergedObjectives;
    }

    async extractReferenceSentences(learningObjectives: LearningObjective[], chunks: DocumentChunk[]): Promise<LearningObjectiveWithReferences[]> {
        console.log('[DocumentToDag] Extracting reference sentences...');
        return Promise.all(learningObjectives.map(async (learningObjective, index) => {
            console.log(`[DocumentToDag] Extracting reference sentences for learning objective ${index + 1}/${learningObjectives.length}`);
            const relevantContent = chunks
                .filter(chunk => learningObjective.chunkIds.includes(chunk.id))
                .map(chunk => chunk.content)
                .join("\n");

            if (relevantContent.trim() === '') {
                return {
                    ...learningObjective,
                    referenceSentences: []
                };
            }

            const prompt = await priomptRenderToString(
                ExtractReferenceSentencesPrompt({
                    content: relevantContent,
                    learningObjective: learningObjective.learningObjective,
                    subObjectives: learningObjective.allSubObjectives
                }),
                { tokenLimit: this.TOKEN_LIMIT }
            );

            const result = await this.ai.genObject({
                schema: z.object({
                    referenceSentences: z.array(z.string()).describe("The reference sentences for the key term")
                }),
                prompt: prompt,
                model: "openai:gpt-4o-mini",
                mode: "json",
                providerArgs: {
                    structuredOutputs: true,
                },
            });

            // Process each reference sentence to find exact matches and source chunks
            const processedReferenceSentences: ReferenceSentenceWithMetadata[] = result.object.referenceSentences.map(sentence => {
                let isExactMatch = false;
                let sourceChunkId = '';
                let sourceDocumentId = '';
                let matchedOriginalSentence = sentence;

                // Normalize the reference sentence by removing spaces and punctuation
                const normalizeText = (text: string) => {
                    return text.toLowerCase()
                        .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
                        .trim();
                };

                const normalizedReferenceSentence = normalizeText(sentence);

                // Look for the sentence in each chunk
                for (const chunk of chunks) {
                    const normalizedChunkContent = normalizeText(chunk.content);
                    const normalizedSentenceIndex = normalizedChunkContent.indexOf(normalizedReferenceSentence);

                    if (normalizedSentenceIndex !== -1) {
                        isExactMatch = true;
                        sourceChunkId = chunk.id;
                        sourceDocumentId = chunk.documentId;
                        // Find the original text by locating the boundaries in the original content
                        // First, count the number of actual characters up to our normalized match
                        const normalizedPrefix = normalizedChunkContent.substring(0, normalizedSentenceIndex);
                        let originalIndex = 0;
                        let normalizedPos = 0;

                        // Walk through the original text until we find where our normalized match starts
                        while (normalizedPos < normalizedPrefix.length && originalIndex < chunk.content.length) {
                            const normalizedChar = normalizeText(chunk.content[originalIndex]);
                            if (normalizedChar) {
                                normalizedPos++;
                            }
                            originalIndex++;
                        }

                        // Skip any leading whitespace or punctuation
                        while (originalIndex < chunk.content.length && /^[\s\p{P}]/u.test(chunk.content[originalIndex])) {
                            originalIndex++;
                        }

                        // Now find the end by counting normalized characters
                        let matchEnd = originalIndex;
                        let matchedNormalizedChars = 0;

                        while (matchedNormalizedChars < normalizedReferenceSentence.length && matchEnd < chunk.content.length) {
                            const normalizedChar = normalizeText(chunk.content[matchEnd]);
                            if (normalizedChar) {
                                matchedNormalizedChars++;
                            }
                            matchEnd++;
                        }

                        // Include any immediate punctuation after the match
                        while (matchEnd < chunk.content.length && /[.!?,;]|\.{3}/.test(chunk.content[matchEnd])) {
                            matchEnd++;
                        }

                        matchedOriginalSentence = chunk.content.slice(originalIndex, matchEnd).trim();
                        break;
                    }
                }

                // If no exact match was found, assign it to the first chunk (as a fallback)
                if (!sourceChunkId && learningObjective.chunkIds.length > 0) {
                    sourceChunkId = learningObjective.chunkIds[0];
                }

                return {
                    sentence: isExactMatch ? matchedOriginalSentence : sentence,
                    isExactMatch,
                    sourceChunkId,
                    sourceDocumentId
                };
            });

            console.log(`[DocumentToDag] Extracted ${processedReferenceSentences.length} reference sentences for learning objective ${index + 1}/${learningObjectives.length}`);
            return {
                ...learningObjective,
                referenceSentences: processedReferenceSentences
            };
        }));
    }

    async findPrerequisites(lessonGroups: LessonGroup[], chunks: DocumentChunk[]): Promise<LessonGroupWithPrerequisites[]> {
        console.log('[DocumentToDag] Finding prerequisites...');
        const connections = await Promise.all(lessonGroups.map(async (lessonGroup) => {
            console.log(`[DocumentToDag] Finding prerequisites for lesson group ${lessonGroup.lessonName}...`);
            const relevantChunks = chunks
                .filter(chunk => lessonGroup.chunkIds.includes(chunk.id))
                .map(chunk => chunk.content);

            const prompt = await priomptRenderToString(
                FindPrerequisitesPrompt({
                    lessonGroup: {
                        lessonName: lessonGroup.lessonName,
                        cluster: lessonGroup.cluster.map(lo => ({
                            learningObjective: lo.learningObjective,
                            referenceSentences: lo.referenceSentences.map(ref => ref.sentence)
                        }))
                    },
                    lessonGroups: lessonGroups.filter(lg => lg.lessonName !== lessonGroup.lessonName).map(lg => ({
                        lessonName: lg.lessonName,
                        cluster: lg.cluster.map(lo => ({
                            learningObjective: lo.learningObjective,
                            referenceSentences: lo.referenceSentences.map(ref => ref.sentence)
                        }))
                    })),
                    chunks: relevantChunks,
                    maxPrerequisites: 5,
                }),
                { tokenLimit: this.TOKEN_LIMIT }
            );

            const result = await this.ai.genObject({
                schema: z.object({
                    prerequisites: z.array(z.string()).describe("The prerequisites for the key term")
                }),
                prompt: prompt,
                model: "openai:gpt-4o-mini",
                mode: "json",
                providerArgs: {
                    structuredOutputs: true,
                },
            });

            console.log(`[DocumentToDag] Found ${result.object.prerequisites.length} prerequisites for lesson group ${lessonGroup.lessonName}`);
            return {
                ...lessonGroup,
                prerequisites: result.object.prerequisites
            };
        }));

        console.log('[DocumentToDag] Done finding prerequisites...');
        return connections;
    }

    async removeCyclicDependencies(lessonGroups: LessonGroupWithPrerequisites[], chunks: DocumentChunk[]): Promise<LessonGroupWithPrerequisites[]> {
        console.log('[DocumentToDag] Removing cyclic dependencies...');

        // Helper function that applies one round of cycle removal
        const removeOneCyclePass = async (lessonGroups: LessonGroupWithPrerequisites[]): Promise<{
            lessonGroups: LessonGroupWithPrerequisites[],
            hadCycles: boolean
        }> => {
            // First, remove any self-dependencies
            const lessonGroupsWithoutSelfDeps = lessonGroups.map(lg => ({
                ...lg,
                prerequisites: lg.prerequisites.filter(prereq => prereq !== lg.lessonName)
            }));

            // Find all cycles in the dependency graph
            const cyclicDependencies = findCycles(lessonGroupsWithoutSelfDeps.map(lg => ({
                object: lg.lessonName,
                prerequisites: lg.prerequisites
            })));

            // If no cycles found, return lesson groups without self-dependencies
            if (cyclicDependencies.length === 0) {
                console.log('[DocumentToDag] No cycles found, returning lesson groups without self-dependencies');
                return { lessonGroups: lessonGroupsWithoutSelfDeps, hadCycles: false };
            }

            console.log('[DocumentToDag] Found ', cyclicDependencies.length, ' cycles in the dependency graph');

            // Partition nodes into groups of intersecting cycles
            const cycleGroups: Set<string>[] = [];
            const nodeToGroup = new Map<string, number>();

            cyclicDependencies.forEach((cycle: string[]) => {
                const cycleSet = new Set<string>(cycle);
                const intersectingGroups: number[] = [];

                // Find all groups that intersect with this cycle
                cycleGroups.forEach((group, index) => {
                    for (const node of cycleSet) {
                        if (group.has(node)) {
                            intersectingGroups.push(index);
                            break;
                        }
                    }
                });

                if (intersectingGroups.length === 0) {
                    // Create a new group
                    cycleGroups.push(cycleSet);
                    cycle.forEach((node: string) => nodeToGroup.set(node, cycleGroups.length - 1));
                } else {
                    // Merge all intersecting groups and add this cycle
                    const mergedGroupIndex = intersectingGroups[0];
                    const mergedGroup = cycleGroups[mergedGroupIndex];

                    // Merge other intersecting groups into the first one
                    for (let i = 1; i < intersectingGroups.length; i++) {
                        const groupIndex = intersectingGroups[i];
                        cycleGroups[groupIndex].forEach((node: string) => {
                            mergedGroup.add(node);
                            nodeToGroup.set(node, mergedGroupIndex);
                        });
                        cycleGroups[groupIndex] = new Set<string>(); // Clear the merged group
                    }

                    // Add nodes from this cycle
                    cycle.forEach((node: string) => {
                        mergedGroup.add(node);
                        nodeToGroup.set(node, mergedGroupIndex);
                    });
                }
            });

            // Remove empty groups
            const nonEmptyGroups = cycleGroups.filter(group => group.size > 0);

            console.log('[DocumentToDag] Found ', nonEmptyGroups.length, ' non-empty groups of intersecting cycles');

            // For each group of intersecting cycles, use AI to rank the lesson groups
            const groupRankings = await Promise.all(nonEmptyGroups.map(async (group) => {
                const groupLessons = Array.from(group).map(lessonName => {
                    const lg = lessonGroupsWithoutSelfDeps.find(lg => lg.lessonName === lessonName);

                    return {
                        lessonName,
                        cluster: lg?.cluster.map(lo => ({
                            learningObjective: lo.learningObjective,
                            referenceSentences: lo.referenceSentences.map(ref => ref.sentence),
                            prerequisites: lg?.prerequisites ?? []
                        })) ?? [],
                        prerequisites: lg?.prerequisites ?? []
                    };
                });

                const prompt = await priomptRenderToString(
                    RankLessonsPrompt({
                        lessonGroups: groupLessons,
                    }),
                    { tokenLimit: this.TOKEN_LIMIT }
                );

                const result = await this.ai.genObject({
                    schema: z.object({
                        rankedObjectives: z.array(z.string())
                    }),
                    prompt: prompt,
                    model: "openai:gpt-4o-mini",
                    mode: "json",
                    providerArgs: {
                        structuredOutputs: true,
                    },
                });

                return result.object.rankedObjectives;
            }));

            // Create a map of lesson name to its rank within its group
            const lessonRanks = new Map<string, number>();
            groupRankings.forEach((ranking) => {
                ranking.forEach((lessonName, index) => {
                    lessonRanks.set(lessonName, index);
                });
            });

            // Apply the rankings to break cycles
            const finalLessonGroups = lessonGroupsWithoutSelfDeps.map(lg => {
                // If this lesson group is not part of any cycle group, return it unchanged
                if (!lessonRanks.has(lg.lessonName)) {
                    return lg;
                }

                // Get this lesson's rank
                const lgRank = lessonRanks.get(lg.lessonName)!;

                // Keep prerequisites that either:
                // 1. Aren't part of any cycle, OR
                // 2. Have a lower rank than the current lesson (proper learning sequence)
                const newPrereqs = lg.prerequisites.filter(prereq => {
                    if (!lessonRanks.has(prereq)) {
                        // Keep dependencies that aren't part of any cycle
                        return true;
                    }

                    // For prerequisites in cycles, only keep those with a lower rank
                    const prereqRank = lessonRanks.get(prereq)!;
                    return prereqRank < lgRank;
                });

                return {
                    ...lg,
                    prerequisites: newPrereqs
                };
            });

            return { lessonGroups: finalLessonGroups, hadCycles: true };
        };

        // Keep removing cycles until none remain
        let currentLessonGroups = lessonGroups;
        let iterations = 0;
        const MAX_ITERATIONS = 5; // Safety limit to prevent infinite loops

        while (iterations < MAX_ITERATIONS) {
            const { lessonGroups: newLessonGroups, hadCycles } = await removeOneCyclePass(currentLessonGroups);
            if (!hadCycles) {
                console.log(`[DocumentToDag] All cycles removed after ${iterations + 1} iterations`);
                return newLessonGroups;
            }
            currentLessonGroups = newLessonGroups;
            iterations++;
        }

        console.warn(`[DocumentToDag] Reached maximum iterations (${MAX_ITERATIONS}). Arbitrarily breaking remaining cycles...`);

        // Find any remaining cycles
        const remainingCycles = findCycles(currentLessonGroups.map(lg => ({
            object: lg.lessonName,
            prerequisites: lg.prerequisites
        })));

        if (remainingCycles.length > 0) {
            console.log(`[DocumentToDag] Found ${remainingCycles.length} remaining cycles. Breaking them arbitrarily...`);

            // For each cycle, break it by removing one prerequisite relationship
            remainingCycles.forEach(cycle => {
                // Choose the first two nodes in the cycle and break their relationship
                const [node1, node2] = cycle;

                // Find the lesson group that has node2 as a prerequisite and remove it
                currentLessonGroups = currentLessonGroups.map(lg => {
                    if (lg.lessonName === node1) {
                        return {
                            ...lg,
                            prerequisites: lg.prerequisites.filter(prereq => prereq !== node2)
                        };
                    }
                    return lg;
                });
            });

            console.log('[DocumentToDag] Finished breaking remaining cycles arbitrarily');
        }

        return currentLessonGroups;
    }

    async createDag(options: CreateDagOptions): Promise<LessonGroupWithPrerequisites[]> {
        const { documentId, docDB, summary, threshold = 0.6, maxClusterSize = 20, thresholdIncrement = 0.05 } = options;

        try {
            // Step 1: Wait for document to be vectorized
            await docDB.waitForVectors([documentId]);
            const { chunks, documents } = await docDB.getAllChunks({
                documentIds: [documentId]
            });
            const document = documents.get(documentId);
            if (!document) {
                throw new Error(`Document with ID ${documentId} not found`);
            }

            // Step 2: Extract learning objectives from chunks
            const learningObjectives = await this.extractSpecificLearningObjectives(chunks, summary)

            // Step 3: Process and combine similar learning objectives
            const objectivesDeduplicated = await this.deduplicateLearningObjectives(learningObjectives, threshold, maxClusterSize, thresholdIncrement);

            // Step 4: Extract reference sentences
            const objectivesWithReferences = await this.extractReferenceSentences(objectivesDeduplicated, chunks);

            // Step 5: Generate lesson groups
            const lessonGroups = await this.generateLessonGroups(objectivesWithReferences);

            // Step 6: Find prerequisites
            const lessonGroupsWithPrerequisites = await this.findPrerequisites(lessonGroups, chunks);

            // Step 7: Remove cyclic dependencies
            const lessonGroupsWithPrerequisitesNoCycles = await this.removeCyclicDependencies(lessonGroupsWithPrerequisites, chunks);

            // Return final result
            return lessonGroupsWithPrerequisitesNoCycles;

        } catch (error) {
            console.error('[DocumentToDag] Error during processing:', error);
            throw error;
        }
    }

    async generateLessonGroups(learningObjectives: LearningObjectiveWithReferences[]): Promise<LessonGroup[]> {
        if (!learningObjectives || learningObjectives.length === 0) {
            return [];
        }

        const objectivesWithEmbeddings = await this.generateLearningObjectiveWithReferencesEmbedding(learningObjectives);
        const similarityMatrix = this.computeSimilarityMatrix(objectivesWithEmbeddings);
        const clusterObjectives = await this.clusterChunkLearningObjectives(learningObjectives, similarityMatrix, 0.4, 5, 0.02, 0.8);

        // Filter out any empty clusters
        const nonEmptyClusters = clusterObjectives.filter(cluster => cluster.length > 0);

        console.log('[DocumentToDag] Found ', nonEmptyClusters.length, ' initial groups of learning objectives');

        // Get AI suggestions for lesson grouping
        const clusterResults = await Promise.all(nonEmptyClusters.map(async (cluster) => {
            const prompt = await priomptRenderToString(
                GenerateLessonGroupsPrompt({
                    learningObjectives: cluster.map(lo => ({
                        learningObjective: lo.learningObjective,
                        // @ts-ignore
                        referenceSentences: lo.referenceSentences.map(ref => ref.sentence)
                    })),
                }),
                { tokenLimit: this.TOKEN_LIMIT }
            );

            const result = await this.ai.genObject({
                schema: z.object({
                    lessons: z.array(z.object({
                        lessonName: z.string().describe("A name for the lesson that is a single phrase that captures the essence of the learning objectives"),
                        expectedDurationMinutes: z.number().describe("The expected duration of the lesson in minutes"),
                        learningObjectives: z.array(z.string()).describe("The learning objectives that belong in this lesson")
                    }))
                }),
                prompt: prompt,
                model: "openai:gpt-4o-mini",
                mode: "json",
                providerArgs: {
                    structuredOutputs: true,
                },
            });

            return result.object;
        }));

        // Flatten and process all lessons
        const lessons: LessonGroup[] = clusterResults.flatMap((result, clusterIndex) => {
            const originalCluster = nonEmptyClusters[clusterIndex];

            const mappedLessons = result.lessons.map(lessonGroup => {
                // Find the learning objectives that belong to this lesson
                const lessonObjectives = originalCluster.filter(
                    lo => lessonGroup.learningObjectives.includes(lo.learningObjective)
                ) as LearningObjectiveWithPrerequisites[];

                // Skip empty lessons
                if (lessonObjectives.length === 0) {
                    return null;
                }

                const uniqueChunkIds = Array.from(new Set(lessonObjectives.flatMap(lo => lo.chunkIds)));
                const totalChunks = uniqueChunkIds.length;

                // Each chunk is ~2000 chars, which should take no more than 5 minutes to process
                // We use a gentler diminishing returns formula for multiple chunks
                const chunkBasedEstimate = Math.min(
                    // Base time: 2 minutes per objective for comprehension
                    lessonObjectives.length * 2 +
                    // Additional time based on chunks: max 5 mins per chunk with diminishing returns
                    Math.ceil(Math.pow(totalChunks, 0.8) * 5),
                    // Hard cap at 45 minutes total
                    45
                );

                // Take the minimum between the AI's estimate and our chunk-based estimate
                const finalDuration = Math.min(
                    lessonGroup.expectedDurationMinutes,
                    chunkBasedEstimate
                );

                const lesson: LessonGroup = {
                    cluster: lessonObjectives,
                    lessonName: lessonGroup.lessonName,
                    chunkIds: uniqueChunkIds,
                    expectedDurationMinutes: finalDuration,
                };
                return lesson;
            });

            return mappedLessons.filter((lesson): lesson is NonNullable<typeof lesson> => lesson !== null);
        });

        console.log('[DocumentToDag] AI split into ', lessons.length, ' total lessons');

        return lessons;
    }
}
