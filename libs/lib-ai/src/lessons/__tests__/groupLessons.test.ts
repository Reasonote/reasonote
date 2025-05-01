import {
  describe,
  expect,
  it,
} from 'vitest';

import { createDefaultStubAI } from '../../DefaultStubAI';
import {
  generateCourseStructure,
  LessonGroup,
  Module,
} from '../groupLessons';

const TOKEN_LIMIT = 100000;

describe.concurrent('groupLessons', () => {
    const ai = createDefaultStubAI();

    // Helper function to verify no duplicate lessons exist
    function verifyNoDuplicateLessons(modules: Module[]) {
        const seenLessons = new Set<string>();
        let duplicates: string[] = [];

        modules.forEach(module => {
            module.subModules.forEach(subModule => {
                subModule.lessons.forEach(lesson => {
                    if (seenLessons.has(lesson.lessonName)) {
                        duplicates.push(lesson.lessonName);
                    }
                    seenLessons.add(lesson.lessonName);
                });
            });
        });

        expect(duplicates).toEqual([]);
    }

    // Helper function to verify all original lessons are present
    function verifyAllLessonsPresent(originalLessons: LessonGroup[], modules: Module[]) {
        const originalLessonNames = new Set(originalLessons.map(l => l.lessonName));
        const resultLessonNames = new Set<string>();

        modules.forEach(module => {
            module.subModules.forEach(subModule => {
                subModule.lessons.forEach(lesson => {
                    resultLessonNames.add(lesson.lessonName);
                });
            });
        });

        // Check if all original lessons are in the result
        originalLessonNames.forEach(name => {
            expect(resultLessonNames.has(name)).toBe(true);
        });

        // Check if result has any extra lessons
        expect(resultLessonNames.size).toBe(originalLessonNames.size);
    }

    // Helper function to verify positions are sequential and valid
    function verifyPositions(modules: Module[]) {
        modules.forEach((module, moduleIndex) => {
            expect(module.position).toBe(moduleIndex + 1);

            module.subModules.forEach((subModule, subModuleIndex) => {
                if (subModule.position !== undefined) {
                    expect(subModule.position).toBe(subModuleIndex + 1);
                }

                const lessonPositions = subModule.lessons.map(l => l.position);
                expect(new Set(lessonPositions).size).toBe(lessonPositions.length); // No duplicate positions
                expect(Math.min(...lessonPositions)).toBe(1); // Starts at 1
                expect(Math.max(...lessonPositions)).toBe(lessonPositions.length); // Sequential up to length
            });
        });
    }

    // Helper function to verify submodule structure
    function verifyModuleStructure(modules: Module[]) {
        // Each module should have a reasonable number of submodules (not too many, not too few)
        modules.forEach(module => {
            expect(module.subModules.length).toBeGreaterThan(0);
            expect(module.subModules.length).toBeLessThanOrEqual(10); // Assuming max 10 lessons per submodule is reasonable
            expect(module.moduleName.length).toBeGreaterThan(0);
        });

        // Verify no duplicate module names
        const moduleNames = modules.map(m => m.moduleName);
        expect(new Set(moduleNames).size).toBe(moduleNames.length);

        // Verify lesson positions within each submodule
        modules.forEach(module => {
            module.subModules.forEach(subModule => {
                // Each submodule should have a reasonable number of lessons (not too many, not too few)
                expect(subModule.lessons.length).toBeGreaterThan(0);
                expect(subModule.lessons.length).toBeLessThanOrEqual(10); // Assuming max 10 lessons per submodule is reasonable
                expect(subModule.subModuleName.length).toBeGreaterThan(0);

                // Verify lesson positions within each submodule
                const lessonPositions = subModule.lessons.map(l => l.position);
                expect(new Set(lessonPositions).size).toBe(lessonPositions.length); // No duplicate positions
                expect(Math.min(...lessonPositions)).toBe(1); // Starts at 1
                expect(Math.max(...lessonPositions)).toBe(lessonPositions.length); // Sequential up to length
            });
        });
    }

    // Helper function to generate a large set of realistic computer science lessons
    function generateRealisticLessonSet(): LessonGroup[] {
        return [
            {
                lessonName: "Introduction to Programming Fundamentals",
                learningObjectives: [
                    "Understand basic programming concepts and terminology",
                    "Write and execute simple programs",
                    "Explain the software development lifecycle"
                ],
                prerequisites: []
            },
            {
                lessonName: "Variables, Data Types, and Memory Management",
                learningObjectives: [
                    "Understand different data types and their memory requirements",
                    "Declare and initialize variables correctly",
                    "Explain stack vs heap memory allocation"
                ],
                prerequisites: ["Introduction to Programming Fundamentals"]
            },
            {
                lessonName: "Control Flow and Decision Making",
                learningObjectives: [
                    "Implement conditional statements effectively",
                    "Design and use loops for iteration",
                    "Handle program flow with break and continue statements"
                ],
                prerequisites: ["Variables, Data Types, and Memory Management"]
            },
            {
                lessonName: "Functions and Modular Programming",
                learningObjectives: [
                    "Create and call functions with parameters",
                    "Understand function scope and return values",
                    "Apply modular programming principles"
                ],
                prerequisites: ["Control Flow and Decision Making"]
            },
            {
                lessonName: "Arrays and Basic Data Structures",
                learningObjectives: [
                    "Work with one-dimensional and multi-dimensional arrays",
                    "Implement basic array operations",
                    "Understand array memory allocation"
                ],
                prerequisites: ["Functions and Modular Programming"]
            },
            {
                lessonName: "Introduction to Object-Oriented Programming",
                learningObjectives: [
                    "Understand OOP principles and concepts",
                    "Create classes and objects",
                    "Implement encapsulation and data hiding"
                ],
                prerequisites: ["Arrays and Basic Data Structures"]
            },
            {
                lessonName: "Inheritance and Polymorphism",
                learningObjectives: [
                    "Implement inheritance hierarchies",
                    "Use method overriding and polymorphism",
                    "Design class relationships effectively"
                ],
                prerequisites: ["Introduction to Object-Oriented Programming"]
            },
            {
                lessonName: "Exception Handling and Debugging",
                learningObjectives: [
                    "Implement try-catch blocks",
                    "Create custom exceptions",
                    "Debug programs systematically"
                ],
                prerequisites: ["Inheritance and Polymorphism"]
            },
            {
                lessonName: "File I/O and Stream Processing",
                learningObjectives: [
                    "Read from and write to files",
                    "Work with different file formats",
                    "Handle stream operations efficiently"
                ],
                prerequisites: ["Exception Handling and Debugging"]
            },
            {
                lessonName: "Basic Algorithms and Problem Solving",
                learningObjectives: [
                    "Analyze algorithm complexity",
                    "Implement common sorting algorithms",
                    "Solve programming problems systematically"
                ],
                prerequisites: ["Arrays and Basic Data Structures"]
            },
            {
                lessonName: "Introduction to Data Structures",
                learningObjectives: [
                    "Understand common data structure types",
                    "Implement linked lists and stacks",
                    "Choose appropriate data structures for different scenarios"
                ],
                prerequisites: ["Basic Algorithms and Problem Solving"]
            },
            {
                lessonName: "Trees and Graphs",
                learningObjectives: [
                    "Implement binary trees and tree traversal",
                    "Work with basic graph algorithms",
                    "Solve tree and graph problems"
                ],
                prerequisites: ["Introduction to Data Structures"]
            },
            {
                lessonName: "Introduction to Databases",
                learningObjectives: [
                    "Understand database fundamentals",
                    "Write basic SQL queries",
                    "Design simple database schemas"
                ],
                prerequisites: ["File I/O and Stream Processing"]
            },
            {
                lessonName: "Web Development Basics",
                learningObjectives: [
                    "Understand client-server architecture",
                    "Create simple web pages with HTML/CSS",
                    "Implement basic JavaScript functionality"
                ],
                prerequisites: ["Introduction to Programming Fundamentals"]
            },
            {
                lessonName: "API Development and REST",
                learningObjectives: [
                    "Design RESTful APIs",
                    "Implement HTTP methods",
                    "Handle API authentication and security"
                ],
                prerequisites: ["Web Development Basics", "Introduction to Databases"]
            },
            {
                lessonName: "Version Control with Git",
                learningObjectives: [
                    "Use basic Git commands",
                    "Manage branches and merging",
                    "Collaborate using Git workflows"
                ],
                prerequisites: ["Introduction to Programming Fundamentals"]
            },
            {
                lessonName: "Testing and Test-Driven Development",
                learningObjectives: [
                    "Write unit tests",
                    "Apply TDD principles",
                    "Use testing frameworks effectively"
                ],
                prerequisites: ["Functions and Modular Programming"]
            },
            {
                lessonName: "Software Design Patterns",
                learningObjectives: [
                    "Understand common design patterns",
                    "Implement creational and structural patterns",
                    "Apply patterns to solve design problems"
                ],
                prerequisites: ["Inheritance and Polymorphism"]
            },
            {
                lessonName: "Concurrent Programming",
                learningObjectives: [
                    "Understand threading and processes",
                    "Implement synchronization mechanisms",
                    "Handle race conditions and deadlocks"
                ],
                prerequisites: ["Exception Handling and Debugging"]
            },
            {
                lessonName: "Software Architecture Principles",
                learningObjectives: [
                    "Understand architectural patterns",
                    "Apply SOLID principles",
                    "Design scalable software systems"
                ],
                prerequisites: ["Software Design Patterns"]
            }
        ];
    }

    describe.concurrent('groupLessonsChunked', () => {
        const sampleLessons: LessonGroup[] = [
            {
                lessonName: "Introduction to Programming",
                learningObjectives: ["Understand basic programming concepts", "Write simple programs"],
                prerequisites: []
            },
            {
                lessonName: "Variables and Data Types",
                learningObjectives: ["Understand different data types", "Declare and use variables"],
                prerequisites: ["Introduction to Programming"]
            },
            {
                lessonName: "Control Flow",
                learningObjectives: ["Use if-else statements", "Implement loops"],
                prerequisites: ["Variables and Data Types"]
            },
            {
                lessonName: "Functions",
                learningObjectives: ["Define functions", "Use parameters and return values"],
                prerequisites: ["Control Flow"]
            }
        ];

        it.concurrent('should generate complete course structure without duplicates', { timeout: 30000 }, async () => {
            const result = await generateCourseStructure(ai, '', sampleLessons);

            // Verify no duplicates exist
            verifyNoDuplicateLessons(result);

            // Verify all lessons are present
            verifyAllLessonsPresent(sampleLessons, result);

            // Verify positions are valid
            verifyPositions(result);

            // Verify module structure
            verifyModuleStructure(result);
        });

        it.concurrent('should handle empty input gracefully', { timeout: 30000 }, async () => {
            const result = await generateCourseStructure(ai, '', []);
            expect(result).toEqual([]);
        });

        it.concurrent('should maintain lesson metadata throughout the hierarchy', { timeout: 30000 }, async () => {
            const result = await generateCourseStructure(ai, '', sampleLessons);

            result.forEach(module => {
                module.subModules.forEach(subModule => {
                    subModule.lessons.forEach(lesson => {
                        const originalLesson = sampleLessons.find(l => l.lessonName === lesson.lessonName);
                        expect(originalLesson).toBeDefined();
                        expect(lesson.learningObjectives).toEqual(originalLesson!.learningObjectives);
                        expect(lesson.prerequisites).toEqual(originalLesson!.prerequisites);
                    });
                });
            });
        });

        it.concurrent('should handle single lesson input', { timeout: 30000 }, async () => {
            const singleLesson = [sampleLessons[0]];
            const result = await generateCourseStructure(ai, '', singleLesson);

            expect(result.length).toBeGreaterThan(0);
            verifyNoDuplicateLessons(result);
            verifyAllLessonsPresent(singleLesson, result);
            verifyPositions(result);
            verifyModuleStructure(result);
        });

        it.concurrent('should handle large number of lessons', { timeout: 60000 }, async () => {
            const largeLessonSet = generateRealisticLessonSet();
            const result = await generateCourseStructure(ai, '', largeLessonSet);

            verifyNoDuplicateLessons(result);
            verifyAllLessonsPresent(largeLessonSet, result);
            verifyPositions(result);
            verifyModuleStructure(result);
        });

        it.concurrent('should not produce empty submodules', { timeout: 30000 }, async () => {
            const result = await generateCourseStructure(ai, '', sampleLessons);

            // Verify no empty submodules exist
            result.forEach(module => {
                module.subModules.forEach(subModule => {
                    expect(subModule.lessons.length).toBeGreaterThan(0);
                });
                // Verify no empty modules exist
                expect(module.subModules.length).toBeGreaterThan(0);
            });
        });

        it.concurrent('should process lessons in chunks correctly', { timeout: 30000 }, async () => {
            const largeLessonSet = generateRealisticLessonSet();
            const chunkSize = 3; // Small chunk size for testing

            const result = await generateCourseStructure(ai, '', largeLessonSet, TOKEN_LIMIT, chunkSize);

            // Verify all lessons are present
            verifyAllLessonsPresent(largeLessonSet, result);

            // Verify no duplicates
            verifyNoDuplicateLessons(result);

            // Verify positions
            verifyPositions(result);

            // Verify module structure
            verifyModuleStructure(result);
        });

        it.concurrent('should maintain prerequisite relationships within chunks', { timeout: 30000 }, async () => {
            const result = await generateCourseStructure(ai, '', sampleLessons, TOKEN_LIMIT, 2);

            // Helper function to find a lesson's submodule
            const findSubModule = (lessonName: string) => {
                for (const module of result) {
                    for (const subModule of module.subModules) {
                        if (subModule.lessons.some(l => l.lessonName === lessonName)) {
                            return subModule;
                        }
                    }
                }
                return null;
            };

            // Verify prerequisites are in same or earlier submodules
            result.forEach(module => {
                module.subModules.forEach(subModule => {
                    subModule.lessons.forEach(lesson => {
                        const originalLesson = sampleLessons.find(l => l.lessonName === lesson.lessonName);
                        if (originalLesson && originalLesson.prerequisites.length > 0) {
                            originalLesson.prerequisites.forEach(prereq => {
                                const prereqSubModule = findSubModule(prereq);
                                const currentSubModule = findSubModule(lesson.lessonName);
                                expect(prereqSubModule).not.toBeNull();
                                expect(currentSubModule).not.toBeNull();
                                
                                // If in different submodules, prerequisite should come first
                                if (prereqSubModule !== currentSubModule) {
                                    expect(prereqSubModule!.position).toBeLessThanOrEqual(currentSubModule!.position ?? 0);
                                }
                                // If in same submodule, prerequisite should have lower position
                                else {
                                    const prereqLesson = prereqSubModule!.lessons.find(l => l.lessonName === prereq)!;
                                    const currentLesson = currentSubModule!.lessons.find(l => l.lessonName === lesson.lessonName)!;
                                    expect(prereqLesson.position).toBeLessThan(currentLesson.position);
                                }
                            });
                        }
                    });
                });
            });
        });

        it.concurrent('should handle submodules with remaining capacity correctly', { timeout: 30000 }, async () => {
            const result = await generateCourseStructure(ai, '', sampleLessons, TOKEN_LIMIT, 2);

            // Verify each submodule respects the maximum capacity of 7 lessons
            result.forEach(module => {
                module.subModules.forEach(subModule => {
                    expect(subModule.lessons.length).toBeLessThanOrEqual(7);
                });
            });

            // Verify lessons are distributed efficiently
            const totalSubModules = result.reduce((count, module) => count + module.subModules.length, 0);
            const minExpectedSubModules = Math.ceil(sampleLessons.length / 7); // Minimum number of submodules needed
            expect(totalSubModules).toBeGreaterThanOrEqual(minExpectedSubModules);
        });
    });
});
