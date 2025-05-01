import * as Priompt from '@anysphere/priompt';
import { trimLines } from '@lukebechtel/lab-ts-utils';

import { Block } from './PromptComponents';

export interface ChunkedGroupingPromptProps {
    summary: string;
    lessons: {
        lessonName: string;
        learningObjectives: string[];
        prerequisites: string[];
    }[];
    existingStructure?: {
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
    };
    totalLessonsCount: number;
    unassignedCount: number;
}

export const ChunkedGroupingPrompt = ({
    summary,
    lessons,
    existingStructure,
    totalLessonsCount,
    unassignedCount
}: ChunkedGroupingPromptProps): Priompt.PromptElement => {
    return <>
        <Block name="CONTEXT">
            {trimLines(`
            You are organizing a set of lessons into a logical course structure. A summary of the course is provided below.
            Please use this summary to help you organize the lessons into modules and submodules.
            This is part of an iterative process where you are handling ${lessons.length} lessons out of ${totalLessonsCount} total lessons.
            There are still ${unassignedCount} lessons that need to be assigned after this chunk.

            CRITICAL CONSTRAINTS:
            1. Each submodule can have AT MOST 7 lessons
            2. Every lesson MUST be assigned exactly once
            3. No lesson should be omitted or skipped
            4. Prefer adding to existing submodules when possible and appropriate
            5. Create new submodules only when necessary or when existing ones are full
            6. Keep lessons with prerequisites together in the same submodule where possible
            7. EVERY submodule MUST be assigned to a module via subModuleToModule mapping
            8. The assignments object MUST include BOTH lessonToSubModule AND subModuleToModule arrays

            Your task is to:
            1. Assign each lesson to either an existing or new submodule
            2. Assign each submodule (both new and existing) to a module
            3. Ensure each submodule has a clear theme and logical progression
            4. Track and respect the capacity limits of each submodule
            `)}
        </Block>

        <Block name="EXAMPLES">
            {trimLines(`
            GOOD EXAMPLE:
            Input Lessons:
            Lesson 1: 
                LessonName: "Introduction to Variables"
                Learning Objectives: "Understand the basics of variables"
                Prerequisites: "None"
            Lesson 2: 
                LessonName: "Data Types in Programming"
                Learning Objectives: "Learn about different data types"
                Prerequisites: "Introduction to Variables"
            Lesson 3: 
                LessonName: "Working with Variables"
                Learning Objectives: "Learn how to use variables"
                Prerequisites: "Introduction to Variables, Data Types in Programming"

            Existing Structure:
            - Module: "Programming Basics"
              - Submodule: "Variables and Types" (4/7 lessons used)
                Current lessons: ["Understanding Programming", "Basic Syntax", "Code Structure", "Programming Logic"]

            Good Assignment:
            {
                "assignments": {
                    "lessonToSubModule": [
                        {
                            "lesson": "Introduction to Variables",
                            "subModule": "Variables and Types",
                            "needsNewSubModule": false
                        },
                        {
                            "lesson": "Data Types in Programming",
                            "subModule": "Variables and Types",
                            "needsNewSubModule": false
                        },
                        {
                            "lesson": "Working with Variables",
                            "subModule": "Variables and Types",
                            "needsNewSubModule": false
                        }
                    ],
                    "subModuleToModule": [
                        {
                            "subModule": "Variables and Types",
                            "module": "Programming Basics",
                            "needsNewModule": false
                        }
                    ]
                }
            }

            Why this is good:
            1. Keeps related lessons together
            2. Respects prerequisites by keeping them in the same submodule
            3. Fits within capacity (4 + 3 = 7 lessons)
            4. Uses existing submodule appropriately
            5. Maintains thematic coherence
            6. INCLUDES subModuleToModule mapping for all submodules
            7. Maps both existing and new submodules to modules

            BAD EXAMPLE:
            Same input but bad assignment:
            {
                "assignments": {
                    "lessonToSubModule": [
                        {
                            "lesson": "Introduction to Variables",
                            "subModule": "Variables and Types",
                            "needsNewSubModule": false
                        },
                        {
                            "lesson": "Data Types in Programming",
                            "subModule": "New Data Types",
                            "needsNewSubModule": true
                        },
                        {
                            "lesson": "Working with Variables",
                            "subModule": "Variable Operations",
                            "needsNewSubModule": true
                        }
                    ],
                    "subModuleToModule": []
                }
            }

            Why this is bad:
            1. Splits related lessons across multiple submodules unnecessarily
            2. Creates new submodules when existing one has capacity
            3. Breaks prerequisite chain by separating dependent lessons
            4. Reduces learning coherence
            5. CRITICAL ERROR: Missing subModuleToModule mappings
            6. New submodules are not assigned to any module
            `)}
        </Block>

        <Block name="SUMMARY">
            {trimLines(summary)}
        </Block>

        <Block name="EXISTING_STRUCTURE">
            {existingStructure ?
                trimLines(`
                Current course structure with remaining capacities:
                ${JSON.stringify(existingStructure, null, 2)}

                IMPORTANT CAPACITY INFORMATION:
                ${existingStructure.modules.map(module =>
                    `Module "${module.moduleName}":
                    ${module.subModules.map(subModule =>
                        `- Submodule "${subModule.subModuleName}": ${subModule.remainingCapacity} slots available (${subModule.lessons.length}/7 lessons used)`
                    ).join('\n')}`
                ).join('\n')}
                `)
                :
                'No existing structure. You are starting fresh.'
            }
        </Block>

        <Block name="CURRENT_LESSONS">
            Lessons to assign in this chunk:
            {lessons.map((lesson, i) => (
                <Block name={`LESSON_${i + 1}`} attributes={{ key: i }}>
                    <Block name="LESSON_NAME">
                        {lesson.lessonName}
                    </Block>
                    <Block name="LEARNING_OBJECTIVES">
                        {lesson.learningObjectives.join(', ')}
                    </Block>
                    <Block name="PREREQUISITES">
                        {lesson.prerequisites.length > 0 ? lesson.prerequisites.join(', ') : 'None'}
                    </Block>
                </Block>
            ))}
            CRITICAL: ALL {lessons.length} lessons above MUST be assigned in your response.
        </Block>

        <Block name="VALIDATION_CHECKLIST">
            {trimLines(`
            Before returning your response, verify that:
            1. EVERY lesson from the input is assigned exactly once
            2. No submodule exceeds 7 lessons (including existing lessons)
            3. Each lesson is assigned to a thematically appropriate submodule
            4. Prerequisites are respected in the grouping
            5. You have accounted for ALL ${lessons.length} lessons in this chunk
            6. Your assignments respect the remaining capacity of existing submodules
            7. EVERY submodule (new and existing) has a corresponding subModuleToModule mapping
            8. The subModuleToModule array is not empty and includes all submodules

            Count your assignments:
            - Input lessons: ${lessons.length}
            - Your output MUST assign exactly this many lessons
            - Number of subModules in lessonToSubModule MUST match number of entries in subModuleToModule
            `)}
        </Block>

        <Block name="CRITICAL_WARNINGS">
            {trimLines(`
            YOU WILL BE HEAVILY PENALIZED IF:
            1. Any lesson is missing from your assignments
            2. Any submodule exceeds 7 lessons
            3. You ignore the remaining capacity of existing submodules
            4. You create unnecessary new submodules when existing ones have capacity
            5. You break the prerequisite relationships between lessons
            6. You return an empty subModuleToModule array
            7. Any submodule lacks a module assignment

            FINAL VERIFICATION:
            - Count input lessons: ${lessons.length}
            - Count your assignments before returning
            - Verify each lesson appears exactly once
            - Check all submodule capacities
            - VERIFY subModuleToModule array contains ALL submodules
            `)}
        </Block>
    </>;
};

export interface AssignRemainingSubModulesPromptProps {
    unassignedSubModules: {
        subModuleName: string;
        lessons: {
            lessonName: string;
        }[];
    }[];
    existingStructure: {
        modules: {
            subModules: {
                lessons: {
                    lessonName: string;
                }[];
            }[];
        }[];
    };
}

export const AssignRemainingSubModulesPrompt = ({
    unassignedSubModules,
    existingStructure
}: AssignRemainingSubModulesPromptProps): Priompt.PromptElement => {
    const schemaExample = trimLines(`{
    "assignments": [{
        "subModule": "string", // Exact submodule name
        "needsNewModule": boolean,
        "module": "string", // Either an existing module name or a new one
    }]
}`);

    return <>
        <Block name="CONTEXT">
            {trimLines(`
            Some submodules in the course structure have not been assigned to modules.
            Your task is to either assign them to existing modules or create new ones when appropriate.
            
            CRITICAL GUIDELINES:
            1. Module Coherence:
               - Group related submodules together
               - Consider the progression of concepts
               - Maintain clear pedagogical relationships
            
            2. Module Size:
               - Aim for 2-4 submodules per module
               - Create new modules when needed to maintain balance
            
            3. Thematic Alignment:
               - Consider the content and objectives of each submodule
               - Look for common themes or skill progressions
               - Ensure logical sequencing of topics
            `)}
        </Block>

        <Block name="EXAMPLES">
            {trimLines(`
            GOOD EXAMPLE:
            Unassigned Submodules:
            1. "Basic Variables" (lessons about variable basics)
            2. "Data Types" (lessons about different data types)
            3. "Type Conversion" (lessons about converting between types)

            Existing Structure:
            - Module: "Programming Fundamentals"
              - Submodule: "Introduction to Programming"
              - Submodule: "Basic Syntax"

            Good Assignment:
            {
                "assignments": [
                    {
                        "subModule": "Basic Variables",
                        "needsNewModule": false,
                        "module": "Programming Fundamentals"
                    },
                    {
                        "subModule": "Data Types",
                        "needsNewModule": false,
                        "module": "Programming Fundamentals"
                    },
                    {
                        "subModule": "Type Conversion",
                        "needsNewModule": false,
                        "module": "Programming Fundamentals"
                    }
                ]
            }

            Why this is good:
            1. Groups related submodules in the same module
            2. Maintains logical progression of concepts
            3. Uses existing module appropriately
            4. Keeps module size reasonable (5 submodules total)
            5. Preserves thematic coherence

            BAD EXAMPLE:
            Same input but bad assignment:
            {
                "assignments": [
                    {
                        "subModule": "Basic Variables",
                        "needsNewModule": true,
                        "module": "Variable Module"
                    },
                    {
                        "subModule": "Data Types",
                        "needsNewModule": true,
                        "module": "Types Module"
                    },
                    {
                        "subModule": "Type Conversion",
                        "needsNewModule": true,
                        "module": "Conversion Module"
                    }
                ]
            }

            Why this is bad:
            1. Creates unnecessary new modules
            2. Splits closely related concepts across modules
            3. Makes the course structure too fragmented
            4. Ignores existing appropriate module
            5. Creates too many small modules
            `)}
        </Block>

        <Block name="UNASSIGNED_SUBMODULES">
            Submodules to assign:
            {unassignedSubModules.map((subModule, i) => (
                <Block name={`SUBMODULE_${i + 1}`} attributes={{ key: i }}>
                    <Block name="SUBMODULE_NAME">
                        {subModule.subModuleName}
                    </Block>
                    <Block name="LESSONS">
                        {subModule.lessons.map((lesson, j) => (
                            <Block name={`LESSON_${j + 1}`} attributes={{ key: j }}>
                                {lesson.lessonName}
                            </Block>
                        ))}
                    </Block>
                </Block>
            ))}
        </Block>

        <Block name="EXISTING_STRUCTURE">
            Current course structure:
            {JSON.stringify(existingStructure, null, 2)}
        </Block>

        <Block name="FORMAT">
            {trimLines(`
            Return a JSON object containing your assignments:
            - assignments: Array of submodule assignments
              - subModule: Exact submodule name
              - needsNewModule: Whether this is a new module
              - module: Name of the module (existing or new)

            The output must be valid JSON matching this schema:
            `)}
            <br />
            {schemaExample}
        </Block>

        <Block name="VALIDATION_CHECKLIST">
            {trimLines(`
            Before returning your response, verify that:
            1. Every unassigned submodule has been assigned to a module
            2. Names match exactly for existing modules
            3. The assignments maintain thematic coherence
            4. The JSON structure matches the schema exactly
            `)}
        </Block>
    </>;
}; 