import { z } from 'zod';

import { AI } from '../AI';
import {
  AssignRemainingSubModulesPrompt,
  ChunkedGroupingPrompt,
} from '../prompt/AIPromptObj/groupLessons.priompt';
import { priomptRenderToString } from '../prompt/priomptUtils';

const CHUNK_SIZE = 20;
const MAX_SUBMODULE_SIZE = 7;
const MAX_EXTRA_ITERATIONS = 5;

export interface LessonGroup {
    lessonName: string;
    learningObjectives: string[];
    prerequisites: string[];
}

export interface LessonGroupWithPosition extends LessonGroup {
    position: number;
}

export interface SubModule {
    subModuleName: string;
    lessons: LessonGroupWithPosition[];
    position?: number;
}

export interface Module {
    moduleName: string;
    subModules: SubModule[];
    position: number;
}

const TOKEN_LIMIT = 100000

interface Assignment {
    lessonToSubModule: {
        lesson: string;
        needsNewSubModule: boolean;
        subModule: string;
    }[];
    subModuleToModule: {
        subModule: string;
        needsNewModule: boolean;
        module: string;
    }[];
}

interface CourseStructure {
    modules: {
        moduleName: string;
        subModules: {
            subModuleName: string;
            lessons: {
                lessonName: string;
            }[];
            remainingCapacity?: number;
        }[];
    }[];
}

interface SplitSubModuleResult {
    subModules: {
        subModuleName: string;
        lessons: LessonGroupWithPosition[];
    }[];
}

interface SubModuleWithOrder {
    subModuleName: string;
    lessons: LessonGroup[];
    earliestLessonIndex: number;
    position?: number;
}

interface ModuleWithOrder {
    moduleName: string;
    subModules: SubModuleWithOrder[];
    earliestLessonIndex: number;
}

async function createTopologicalOrdering(lessons: LessonGroup[]): Promise<LessonGroup[]> {
    // Create a map of lesson names to their prerequisites
    const graph = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    // Initialize graph and inDegree
    lessons.forEach(lesson => {
        graph.set(lesson.lessonName, new Set(lesson.prerequisites));
        inDegree.set(lesson.lessonName, lesson.prerequisites.length);
    });

    // Find all nodes with no prerequisites (inDegree = 0)
    const queue: string[] = [];
    lessons.forEach(lesson => {
        if ((inDegree.get(lesson.lessonName) || 0) === 0) {
            queue.push(lesson.lessonName);
        }
    });

    const result: LessonGroup[] = [];

    // Process queue
    while (queue.length > 0) {
        const current = queue.shift()!;
        const lesson = lessons.find(l => l.lessonName === current)!;
        result.push(lesson);

        // Update inDegree for all lessons that have this as a prerequisite
        lessons.forEach(l => {
            if (l.prerequisites.includes(current)) {
                const newDegree = (inDegree.get(l.lessonName) || 0) - 1;
                inDegree.set(l.lessonName, newDegree);
                if (newDegree === 0) {
                    queue.push(l.lessonName);
                }
            }
        });
    }

    // Check for cycles and handle them
    if (result.length !== lessons.length) {
        console.warn('[GroupLessons] Cycle detected in lesson prerequisites. Breaking cycles arbitrarily.');

        // Find remaining lessons (those in cycles) and add them in arbitrary order
        const remainingLessons = lessons.filter(l => !result.includes(l));
        if (remainingLessons.length > 0) {
            console.warn(`[GroupLessons] Still have ${remainingLessons.length} lessons in complex cycles. Adding them at the end of the list.`);
            result.push(...remainingLessons);
        }
    }

    return result;
}

function convertAssignmentsToStructure(assignments: Assignment): CourseStructure {
    // Create a map of submodules to their lessons
    const subModuleLessons = new Map<string, { lessonName: string }[]>();
    assignments.lessonToSubModule.forEach(assignment => {
        const lessons = subModuleLessons.get(assignment.subModule) || [];
        lessons.push({ lessonName: assignment.lesson });
        subModuleLessons.set(assignment.subModule, lessons);
    });

    // Create a map of modules to their submodules
    const moduleSubModules = new Map<string, { subModuleName: string; lessons: { lessonName: string }[] }[]>();
    assignments.subModuleToModule.forEach(assignment => {
        const subModules = moduleSubModules.get(assignment.module) || [];
        const lessons = subModuleLessons.get(assignment.subModule) || [];
        subModules.push({
            subModuleName: assignment.subModule,
            lessons
        });
        moduleSubModules.set(assignment.module, subModules);
    });

    // Convert the maps to the final structure
    return {
        modules: Array.from(moduleSubModules.entries()).map(([moduleName, subModules]) => ({
            moduleName,
            subModules
        }))
    };
}

function mergeStructures(existing: CourseStructure, newStructure: CourseStructure): CourseStructure {
    const merged: CourseStructure = { modules: [...existing.modules] };

    // Track which lessons have been merged to avoid duplicates
    const mergedLessons = new Set<string>();
    merged.modules.forEach(module => {
        module.subModules.forEach(subModule => {
            subModule.lessons.forEach(lesson => {
                mergedLessons.add(lesson.lessonName);
            });
        });
    });

    newStructure.modules.forEach(newModule => {
        const existingModule = merged.modules.find(m => m.moduleName === newModule.moduleName);
        if (existingModule) {
            // Merge submodules into existing module
            newModule.subModules.forEach(newSubModule => {
                const existingSubModule = existingModule.subModules.find(
                    sm => sm.subModuleName === newSubModule.subModuleName
                );
                if (existingSubModule) {
                    // Add new lessons to existing submodule if they haven't been merged yet
                    const lessonsToAdd = newSubModule.lessons.filter(
                        lesson => !mergedLessons.has(lesson.lessonName)
                    );
                    existingSubModule.lessons.push(...lessonsToAdd);
                    lessonsToAdd.forEach(lesson => mergedLessons.add(lesson.lessonName));
                } else {
                    // Add new submodule to existing module
                    existingModule.subModules.push(newSubModule);
                    newSubModule.lessons.forEach(lesson => mergedLessons.add(lesson.lessonName));
                }
            });
        } else {
            // Add new module with all its lessons
            newModule.subModules.forEach(subModule => {
                subModule.lessons.forEach(lesson => mergedLessons.add(lesson.lessonName));
            });
            merged.modules.push(newModule);
        }
    });

    return merged;
}

function findUnassignedLessons(orderedLessons: LessonGroup[], structure: CourseStructure): LessonGroup[] {
    const assignedLessons = new Set<string>();
    structure.modules.forEach(module => {
        module.subModules.forEach(subModule => {
            subModule.lessons.forEach(lesson => {
                assignedLessons.add(lesson.lessonName);
            });
        });
    });

    return orderedLessons.filter(lesson => !assignedLessons.has(lesson.lessonName));
}

function findUnassignedSubModules(structure: CourseStructure): {
    subModuleName: string;
    lessons: { lessonName: string; }[];
}[] {
    const assignedSubModules = new Set<string>();
    const allSubModules = new Set<string>();

    // Find all assigned submodules
    structure.modules.forEach(module => {
        module.subModules.forEach(subModule => {
            assignedSubModules.add(subModule.subModuleName);
        });
    });

    // Find all submodules referenced in lesson assignments
    structure.modules.forEach(module => {
        module.subModules.forEach(subModule => {
            allSubModules.add(subModule.subModuleName);
        });
    });

    // Get unassigned submodules
    const unassignedSubModules: {
        subModuleName: string;
        lessons: { lessonName: string; }[];
    }[] = [];

    structure.modules.forEach(module => {
        module.subModules.forEach(subModule => {
            if (!assignedSubModules.has(subModule.subModuleName)) {
                unassignedSubModules.push({
                    subModuleName: subModule.subModuleName,
                    lessons: subModule.lessons
                });
            }
        });
    });

    return unassignedSubModules;
}

function cleanupStructure(structure: CourseStructure, originalLessons: LessonGroup[]): CourseStructure {
    // Create a set of valid lesson names for quick lookup
    const validLessonNames = new Set(originalLessons.map(l => l.lessonName));

    // Clean up the structure
    const cleanedModules = structure.modules
        .map(module => ({
            ...module,
            // Filter out submodules with no lessons or invalid lessons
            subModules: module.subModules
                .map(subModule => ({
                    ...subModule,
                    // Filter out any lessons that don't exist in the original set
                    lessons: subModule.lessons.filter(lesson =>
                        validLessonNames.has(lesson.lessonName)
                    )
                }))
                // Remove submodules with no lessons
                .filter(subModule => subModule.lessons.length > 0)
        }))
        // Remove modules with no submodules
        .filter(module => module.subModules.length > 0);

    return {
        modules: cleanedModules
    };
}

async function splitOversizedSubModule(
    ai: AI,
    subModule: {
        subModuleName: string;
        lessons: LessonGroup[];
    },
    maxLessonsPerSubModule: number,
    lessonMap: Map<string, LessonGroup>,
    tokenLimit: number = TOKEN_LIMIT,
): Promise<SplitSubModuleResult> {
    // Keep lessons in their original order
    const orderedLessons = [...subModule.lessons];
    const totalLessons = orderedLessons.length;
    const numParts = Math.ceil(totalLessons / maxLessonsPerSubModule);

    // Calculate base size and remainder for even distribution
    const baseSize = Math.floor(totalLessons / numParts);
    const remainder = totalLessons % numParts;

    // Create balanced splits while preserving order
    const splitSubModules = Array.from({ length: numParts }, (_, partIndex) => {
        // Calculate start and end indices for this part
        let startIdx = partIndex * baseSize + Math.min(partIndex, remainder);
        let endIdx = startIdx + baseSize + (partIndex < remainder ? 1 : 0);

        // Get lessons for this part, maintaining their original order
        const partLessons = orderedLessons.slice(startIdx, endIdx);

        return {
            subModuleName: `${subModule.subModuleName} (Part ${partIndex + 1})`,
            lessons: partLessons.map((lesson, idx) => ({
                ...lesson,
                position: idx + 1
            }))
        };
    });

    // Validate the split result
    const allAssignedLessons = new Set(
        splitSubModules.flatMap(sm => sm.lessons.map(l => l.lessonName))
    );

    // Ensure all original lessons are assigned
    for (const originalLesson of subModule.lessons) {
        if (!allAssignedLessons.has(originalLesson.lessonName)) {
            throw new Error(`Lesson ${originalLesson.lessonName} was not assigned in split result`);
        }
    }

    return {
        subModules: splitSubModules
    };
}

export async function generateCourseStructure(
    ai: AI,
    summary: string,
    lessons: LessonGroup[],
    tokenLimit: number = TOKEN_LIMIT,
    chunkSize: number = CHUNK_SIZE,
    maxExtraIterations: number = MAX_EXTRA_ITERATIONS
): Promise<Module[]> {
    if (!lessons || lessons.length === 0) {
        return [];
    }

    console.log('[GroupLessons] Generating course structure...');

    // Step 1: Create topological ordering of lessons
    console.log('[GroupLessons] Creating topological ordering...');
    const orderedLessons = await createTopologicalOrdering(lessons);

    // Create a map of lesson names to their position in the topological order
    const lessonToOrderIndex = new Map<string, number>();
    orderedLessons.forEach((lesson, index) => {
        lessonToOrderIndex.set(lesson.lessonName, index);
    });

    // Step 2: Process lessons in chunks
    let currentStructure: CourseStructure = { modules: [] };
    let unassignedLessons = [...orderedLessons];
    let iterationCount = 0;
    const MAX_ITERATIONS = Math.ceil(lessons.length / chunkSize) + maxExtraIterations; // Add buffer for retries

    while (unassignedLessons.length > 0 && iterationCount < MAX_ITERATIONS) {
        console.log(`[GroupLessons] Processing chunk ${iterationCount + 1} (${unassignedLessons.length} lessons remaining)...`);

        // Take next chunk of lessons, maintaining their order
        const currentChunk = unassignedLessons.slice(0, chunkSize);

        // Add capacity information to existing structure
        if (currentStructure.modules.length > 0) {
            currentStructure.modules.forEach(module => {
                module.subModules.forEach(subModule => {
                    subModule.remainingCapacity = 7 - subModule.lessons.length;
                });
            });
        }

        // Generate assignments for current chunk
        const prompt = await priomptRenderToString(
            ChunkedGroupingPrompt({
                summary,
                lessons: currentChunk,
                existingStructure: currentStructure.modules.length > 0 ? currentStructure : undefined,
                totalLessonsCount: lessons.length,
                unassignedCount: unassignedLessons.length
            }),
            { tokenLimit }
        );

        const result = await ai.genObject({
            schema: z.object({
                assignments: z.object({
                    lessonToSubModule: z.array(z.object({
                        lesson: z.string(),
                        needsNewSubModule: z.boolean(),
                        subModule: z.string(),
                    })),
                    subModuleToModule: z.array(z.object({
                        subModule: z.string(),
                        needsNewModule: z.boolean(),
                        module: z.string(),
                    }))
                })
            }),
            prompt: prompt,
            model: "openai:gpt-4o-mini",
            mode: "json",
            providerArgs: {
                structuredOutputs: true,
            },
        });

        // Convert assignments to structure and merge
        const newStructure = convertAssignmentsToStructure(result.object.assignments);
        currentStructure = mergeStructures(currentStructure, newStructure);

        // Find remaining unassigned lessons
        unassignedLessons = findUnassignedLessons(orderedLessons, currentStructure);
        iterationCount++;
    }

    if (unassignedLessons.length > 0) {
        throw new Error(`Failed to assign all lessons after ${MAX_ITERATIONS} iterations. ${unassignedLessons.length} lessons remain unassigned.`);
    }

    // Step 3: Check for unassigned submodules
    const unassignedSubModules = findUnassignedSubModules(currentStructure);
    if (unassignedSubModules.length > 0) {
        console.log(`[GroupLessons] Found ${unassignedSubModules.length} unassigned submodules, assigning them to modules...`);

        const prompt = await priomptRenderToString(
            AssignRemainingSubModulesPrompt({
                unassignedSubModules,
                existingStructure: currentStructure
            }),
            { tokenLimit }
        );

        const result = await ai.genObject({
            schema: z.object({
                assignments: z.array(z.object({
                    subModule: z.string(),
                    module: z.string(),
                    needsNewModule: z.boolean()
                }))
            }),
            prompt: prompt,
            model: "openai:gpt-4o-mini",
            mode: "json",
            providerArgs: {
                structuredOutputs: true,
            },
        });

        // Convert assignments to structure and merge
        const finalAssignments: Assignment = {
            lessonToSubModule: unassignedSubModules.flatMap(sm =>
                sm.lessons.map(l => ({
                    lesson: l.lessonName,
                    subModule: sm.subModuleName,
                    needsNewSubModule: false
                }))
            ),
            subModuleToModule: result.object.assignments
        };

        const finalStructure = convertAssignmentsToStructure(finalAssignments);
        currentStructure = mergeStructures(currentStructure, finalStructure);
    }

    // Final cleanup before converting to Module[] format
    currentStructure = cleanupStructure(currentStructure, lessons);

    // Create a map for lesson lookup
    const lessonMap = new Map(lessons.map(lesson => [lesson.lessonName, lesson]));

    // Helper function to get the earliest lesson index for a collection of lessons
    const getEarliestLessonIndex = (lessons: { lessonName: string }[]) => {
        return Math.min(...lessons.map(l => lessonToOrderIndex.get(l.lessonName) ?? Infinity));
    };

    // Step 4: Order everything before splitting
    const modulesWithOrder: ModuleWithOrder[] = currentStructure.modules.map(module => {
        // Sort lessons within each submodule by their topological order
        const sortedSubModules: SubModuleWithOrder[] = module.subModules.map(subModule => {
            const sortedLessons = subModule.lessons
                .map(lesson => ({
                    lesson,
                    orderIndex: lessonToOrderIndex.get(lesson.lessonName) ?? Infinity
                }))
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map(({ lesson }, index) => ({
                    ...lessonMap.get(lesson.lessonName)!,
                    position: index + 1
                }));

            return {
                subModuleName: subModule.subModuleName,
                lessons: sortedLessons,
                earliestLessonIndex: getEarliestLessonIndex(subModule.lessons)
            };
        });

        // Sort submodules within the module based on their earliest lesson
        sortedSubModules.sort((a, b) => a.earliestLessonIndex - b.earliestLessonIndex);
        sortedSubModules.forEach((subModule, index) => {
            subModule.position = index + 1;
        });

        return {
            moduleName: module.moduleName,
            subModules: sortedSubModules,
            earliestLessonIndex: Math.min(...sortedSubModules.map(sm => sm.earliestLessonIndex))
        };
    });

    // Sort modules based on their earliest lesson
    modulesWithOrder.sort((a, b) => a.earliestLessonIndex - b.earliestLessonIndex);

    // Step 5: Split oversized submodules while preserving order
    const modulesWithSplitSubmodules = await Promise.all(modulesWithOrder.map(async (module, moduleIndex) => {
        const splitSubModulesPromises = module.subModules.map(async (subModule, subModuleIndex) => {
            if (subModule.lessons.length > MAX_SUBMODULE_SIZE) {
                console.log(`[GroupLessons] Splitting oversized submodule ${subModule.subModuleName} with ${subModule.lessons.length} lessons`);
                const splitResult = await splitOversizedSubModule(
                    ai,
                    {
                        subModuleName: subModule.subModuleName,
                        lessons: subModule.lessons
                    },
                    MAX_SUBMODULE_SIZE,
                    lessonMap,
                    tokenLimit
                );

                // Preserve the original submodule's position by adjusting split parts
                return splitResult.subModules.map((split, splitIndex) => ({
                    ...split,
                    position: subModule.position! + (splitIndex / (splitResult.subModules.length + 1))
                }));
            }
            return [{
                ...subModule,
                position: subModule.position!
            }];
        });

        const splitSubModules = (await Promise.all(splitSubModulesPromises)).flat();

        return {
            moduleName: module.moduleName,
            position: moduleIndex + 1,
            subModules: splitSubModules.sort((a, b) => a.position - b.position).map((subModule, finalIndex) => ({
                subModuleName: subModule.subModuleName,
                position: finalIndex + 1,
                lessons: subModule.lessons.map((lesson, lessonIndex) => ({
                    ...lesson,
                    position: lessonIndex + 1
                }))
            }))
        };
    }));

    return modulesWithSplitSubmodules;
}