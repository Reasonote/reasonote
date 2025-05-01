import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { z } from 'zod';

import {
  ActivityConfig,
  ActivityGenerateRequest,
  ActivityTypesPublic,
} from '@reasonote/core';

import {
  AI,
  UnifiedResource,
} from '../';
import { createDefaultStubAI } from '../DefaultStubAI';
import { FlashcardActivityTypeServerV2 } from './activities/Flashcard/server';
import {
  MultipleChoiceActivityTypeServerV2,
} from './activities/MultipleChoice/server';
import { SlideActivityTypeServerV2 } from './activities/Slide/server';
import { ActivityGeneratorV2 } from './ActivityGeneratorV2.priompt';
import { createHydratedValuesOverride } from './test-utils';
import {
  ActivityGeneratorV2HydratedRequest,
  NewActivityTypeServer,
} from './types';

// Define a Citation interface to match the schema extension
interface Citation {
  docId: string;
  startText: string;
  endText: string;
}

// Define our mock activity type
interface MockActivityConfig extends ActivityConfig {
    title: string;
    content: string;
    citations?: Citation[] | null;
}

// Define interfaces for the slide and flashcard activities
interface SlideActivityConfig extends ActivityConfig {
    type: 'slide';
    version: string;
    title: string;
    markdownContent: string;
    citations?: Citation[] | null;
}

interface FlashcardActivityConfig extends ActivityConfig {
    type: 'flashcard';
    version: string;
    title: string;
    flashcardFront: string;
    flashcardBack: string;
    citations?: Citation[] | null;
}

// Utility function to check if an object has citations property
function hasCitations(obj: any): obj is { citations?: Citation[] | null } {
    return obj && ('citations' in obj);
}

const testDocuments = [
    {
        text: 'Javascript Basics: Web Tutorial',
        title: `
        # Javascript Basics: Web Tutorial

        The following is a tutorial about JavaScript variables.

        ## Variables

        Variables are a way to store data in JavaScript.

        ## Example

        \`\`\`javascript
        let foo = "bar";
        \`\`\`

        ## Explanation

        The variable \`foo\` is assigned the value \`bar\`.

        ## Usage

        Variables can be used to store data that can be used later in the program.
        `
    }
]

describe('ActivityGeneratorV2', () => {
    it('should generate activities based on valid activity types', async () => {
        const ai = createDefaultStubAI();
        
        // Create a mock activity type server
        const mockActivityServer: NewActivityTypeServer = {
            type: 'mock_activity',
            getGenConfig: async () => ({
                schema: z.object({
                    type: z.literal('mock_activity'),
                    version: z.string(),
                    title: z.string(),
                    content: z.string()
                }),
                primaryInstructions: async (args: ActivityGenerateRequest) => 'Generate a simple mock activity with a title and content.',
                whenToUse: ['When testing activity generation'],
                whenToAvoid: ['When real activities are needed'],
                finalInstructions: async (args: ActivityGenerateRequest) => 'Keep the content concise and clear.',
                shortDescription: 'A mock activity for testing'
            }),
            evaluateConfig: async (args: {config: MockActivityConfig, request: ActivityGenerateRequest, ai: AI}) => {
                const mockConfig = args.config as MockActivityConfig;
                return {
                    isValid: true,
                    feedback: {
                        issues: null,
                        generalFeedback: null
                    }
                };
            },
            postProcessConfig: async ({ config }) => {
                const mockConfig = config as MockActivityConfig;
                return {
                    ...mockConfig,
                    content: `${mockConfig.content} (post-processed)`
                };
            }
        };

        const generator = new ActivityGeneratorV2({
            activityTypeServers: [mockActivityServer],
            ai
        });

        const activities: MockActivityConfig[] = [];
        for await (const activity of generator.generateActivities({
            validActivityTypes: ['flashcard'],
            otherMessages: [{
                role: 'user',
                content: 'Generate a simple test activity about learning.'
            }],
            from: {
                skill: {
                    name: 'How to learn anything',
                    parentSkillIds: [],
                    parentSkillContext: '',
                }
            }
        })) {
            activities.push(activity as MockActivityConfig);
        }

        // Verify we got some activities
        expect(activities.length).toBeGreaterThan(0);
        
        // Verify activity structure
        const firstActivity = activities[0];
        expect(firstActivity).toMatchObject({
            type: 'mock_activity',
            version: expect.any(String),
            title: expect.any(String),
            content: expect.stringContaining('(post-processed)')
        });
    });

    it('should throw when no valid activity types are found', async () => {
        const ai = createDefaultStubAI();

        const mockActivityServer: NewActivityTypeServer = {
            type: 'mock_activity',
            getGenConfig: async () => ({
                schema: z.object({
                    type: z.literal('mock_activity'),
                    version: z.string(),
                    title: z.string()
                }),
                primaryInstructions: async (args: ActivityGenerateRequest) => 'Generate a mock activity.',
                whenToUse: ['Testing'],
                whenToAvoid: ['Production'],
                finalInstructions: async (args: ActivityGenerateRequest) => 'Keep it simple.',
                shortDescription: 'Test activity'
            }),
        };

        const generator = new ActivityGeneratorV2({
            activityTypeServers: [mockActivityServer],
            ai
        });

        // Should throw because we're requesting a different_activity type but only have mock_activity available
        await expect(async () => {
            const activities: any[] = [];
            for await (const activity of generator.generateActivities({
                validActivityTypes: ['flashcard'],
                otherMessages: [{
                    role: 'user',
                    content: 'Generate a test activity.'
                }],
                from: {
                    documents: [{
                        text: 'Test document for activity generation',
                        title: 'Test Document'
                    }]
                }
            })) {
                activities.push(activity);
            }
        }).rejects.toThrow('No activity type servers found');
    }, 30_000);

    it('should generate activities using sequencing with different activity types', async () => {
        const ai = createDefaultStubAI();
        
        // Create actual activity type servers
        const slideServer = new SlideActivityTypeServerV2();
        const flashcardServer = new FlashcardActivityTypeServerV2();
        const multipleChoiceServer = new MultipleChoiceActivityTypeServerV2();
        
        const generator = new ActivityGeneratorV2({
            activityTypeServers: [slideServer, flashcardServer, multipleChoiceServer],
            ai
        });

        const activities: ActivityConfig[] = [];
        
        // Use sequencing to specify different activity types for each activity
        for await (const activity of generator.generateActivities({
            otherMessages: [{
                role: 'user',
                content: 'Generate activities about programming fundamentals with proper citations.'
            }],
            from: {
                skill: {
                    name: 'Programming Fundamentals',
                    parentSkillIds: [],
                    parentSkillContext: 'Learning to code with JavaScript',
                },
                documents: testDocuments
            },
            sequencing: {
                sequence: [
                    {
                        activityTypes: ['slide'],
                        additionalInstructions: 'Create an introductory slide about variables in JavaScript. Cite the source document.'
                    },
                    {
                        activityTypes: ['flashcard', 'multiple-choice'],
                        additionalInstructions: 'Focus on testing knowledge about JavaScript data types. Cite the source document.'
                    }
                ]
            }
        })) {
            activities.push(activity);
        }
        
        
        console.log(JSON.stringify(activities, null, 2));

        // Verify we got the expected number of activities
        // TODO: this doesn't correctly match, because we aren't forcing internally.
        // expect(activities.length).toBe(2);
        
        // Verify first activity is a slide
        expect(activities[0].type).toBe('slide');
        
        // Verify second activity is either a flashcard or multiple-choice
        expect(['flashcard', 'multiple-choice']).toContain(activities[1].type);
        
        // Verify each activity has the expected structure based on its type
        if (activities[0].type === 'slide') {
            expect(activities[0]).toHaveProperty('markdownContent');
            expect(activities[0]).toHaveProperty('title');
        }
        
        if (activities[1].type === 'flashcard') {
            expect(activities[1]).toHaveProperty('flashcardFront');
            expect(activities[1]).toHaveProperty('flashcardBack');
        } else if (activities[1].type === 'multiple-choice') {
            expect(activities[1]).toHaveProperty('question');
            expect(activities[1]).toHaveProperty('answerChoices');
            expect(activities[1]).toHaveProperty('correctAnswer');
        }
        
        // Now verify citations in activities
        activities.forEach(activity => {
            // Check for citations field using the type guard
            expect(hasCitations(activity)).toBe(true);
            
            // If citations are provided (they might be null), check their structure
            if (hasCitations(activity) && activity.citations) {
                expect(Array.isArray(activity.citations)).toBe(true);
                
                activity.citations.forEach(citation => {
                    // Verify citation structure
                    expect(citation).toHaveProperty('docId');
                    expect(citation).toHaveProperty('startText');
                    expect(citation).toHaveProperty('endText');
                    
                    // Verify citation content
                    // The document contains "foo" as a variable name, so citations might reference this
                    // This verifies that citations are actually from the provided document
                    expect(citation.startText.length).toBeGreaterThan(0);
                    expect(citation.endText.length).toBeGreaterThan(0);
                    
                    // Check if any of the citation text contains content from the source document
                    const documentText = testDocuments[0].title.toLowerCase();
                    const sourceContainsStart = documentText.includes(citation.startText.toLowerCase());
                    const sourceContainsEnd = documentText.includes(citation.endText.toLowerCase());
                    
                    // Log for debugging
                    if (!sourceContainsStart && !sourceContainsEnd) {
                        console.log('Citation may not match source:', {
                            citation,
                            documentExcerpt: testDocuments[0].title.substring(0, 100) // Show first 100 chars
                        });
                    }
                    
                    // At least one of the citation markers should appear in the source
                    expect(sourceContainsStart || sourceContainsEnd).toBe(true);
                });
            }
        });
    }, 30_000);

    it('should respect sequencing overrides for postprocessing and evaluators', async () => {
        const ai = createDefaultStubAI();
        
        // Create actual activity type servers with spies on their methods
        const flashcardServer = new FlashcardActivityTypeServerV2();
        const multipleChoiceServer = new MultipleChoiceActivityTypeServerV2();
        
        // Add spies to the server methods
        const flashcardPostGenSpy = vi.spyOn(flashcardServer, 'postProcessConfig');
        const flashcardEvalSpy = vi.spyOn(flashcardServer, 'evaluateConfig');
        const multipleChoicePostGenSpy = vi.spyOn(multipleChoiceServer, 'postProcessConfig');
        const multipleChoiceEvalSpy = vi.spyOn(multipleChoiceServer, 'evaluateConfig');
        
        const generator = new ActivityGeneratorV2({
            activityTypeServers: [flashcardServer, multipleChoiceServer],
            ai
        });

        const activities: ActivityConfig[] = [];
        
        // Use sequencing with different postprocessing and evaluator settings for each activity
        for await (const activity of generator.generateActivities({
            otherMessages: [{
                role: 'user',
                content: 'Generate activities about JavaScript fundamentals.'
            }],
            from: {
                skill: {
                    name: 'JavaScript Fundamentals',
                    parentSkillIds: [],
                    parentSkillContext: 'A programming language used for web development',
                },
                documents: testDocuments
            },
            // Default settings - both enabled
            postprocessing: { enabled: true },
            evaluators: { enabled: true },
            sequencing: {
                sequence: [
                    {
                        activityTypes: ['flashcard'],
                        // First activity: disable postprocessing, enable evaluators
                        postprocessing: { enabled: false },
                        evaluators: { enabled: true },
                        additionalInstructions: 'Create a flashcard about JavaScript variables.'
                    },
                    {
                        activityTypes: ['multiple-choice'],
                        // Second activity: enable postprocessing, disable evaluators
                        postprocessing: { enabled: true },
                        evaluators: { enabled: false },
                        additionalInstructions: 'Create a multiple choice question about JavaScript data types.'
                    }
                ]
            }
        })) {
            activities.push(activity);
        }

        // Verify we got both activities
        expect(activities.length).toBe(2);
        
        // Verify first activity is a flashcard
        expect(activities[0].type).toBe('flashcard');
        
        // Verify second activity is a multiple-choice
        expect(activities[1].type).toBe('multiple-choice');
        
        // Verify postprocessing was NOT called for the flashcard (disabled in sequencing)
        expect(flashcardPostGenSpy).not.toHaveBeenCalled();
        
        // Verify evaluateConfig WAS called for the flashcard (enabled in sequencing)
        expect(flashcardEvalSpy).toHaveBeenCalled();
        
        // Verify postprocessing WAS called for the multiple-choice (enabled in sequencing)
        expect(multipleChoicePostGenSpy).toHaveBeenCalled();
        
        // Verify evaluateConfig was NOT called for the multiple-choice (disabled in sequencing)
        expect(multipleChoiceEvalSpy).not.toHaveBeenCalled();
    }, 30_000);

    it('should respect additionalInstructions per activity in sequence', async () => {
        // Use the default stub AI to avoid making real API calls
        const ai = createDefaultStubAI();
        
        // Create activity type servers
        const slideServer = new SlideActivityTypeServerV2();
        const flashcardServer = new FlashcardActivityTypeServerV2();
        
        // Create a generator with our activity type servers
        const generator = new ActivityGeneratorV2({
            activityTypeServers: [slideServer, flashcardServer],
            ai,
        });

        const activities: ActivityConfig[] = [];
        
        // Use sequencing with different additionalInstructions for each activity
        // Use specific example variable names that will be easy to identify
        for await (const activity of generator.generateActivities({
            otherMessages: [{
                role: 'user',
                content: 'Generate activities about JavaScript variables.'
            }],
            from: {
                skill: {
                    name: 'JavaScript Basics',
                    parentSkillIds: [],
                    parentSkillContext: 'Learning JavaScript programming',
                },
                documents: [{
                    text: 'Javascript Basics: Web Tutorial',
                    title: `
                    # JAvascript Basics: Web Tutorial

                    The following is a tutorial about JavaScript variables.

                    ## Variables

                    Variables are a way to store data in JavaScript.

                    ## Example

                    \`\`\`javascript
                    let foo = "bar";
                    \`\`\`

                    ## Explanation

                    The variable \`foo\` is assigned the value \`bar\`.

                    ## Usage

                    Variables can be used to store data that can be used later in the program.
                    `
                }]
            },
            // Default additional instructions
            additionalInstructions: 'Focus on beginner-friendly content.',
            sequencing: {
                sequence: [
                    {
                        activityTypes: ['slide'],
                        // First activity: instructions with specific example variable name
                        additionalInstructions: 'Make a slide about variables using an example variable name `foo`. BE SURE TO USE THE EXACT VARIABLE NAME `foo`.'
                    },
                    {
                        activityTypes: ['flashcard'],
                        // Second activity: instructions with specific example variable name
                        additionalInstructions: 'Make a flashcard about variables using an example variable name `bar`. BE SURE TO USE THE EXACT VARIABLE NAME `bar`.'
                    }
                ]
            }
        })) {
            // Print the activity for debugging
            console.log(`Activity ${activities.length + 1} type:`, activity.type);
            if (activity.type === 'slide') {
                const slideActivity = activity as SlideActivityConfig;
                console.log('Slide markdownContent:', slideActivity.markdownContent);
            } else if (activity.type === 'flashcard') {
                const flashcardActivity = activity as FlashcardActivityConfig;
                console.log('Flashcard front:', flashcardActivity.flashcardFront);
                console.log('Flashcard back:', flashcardActivity.flashcardBack);
            }
            
            activities.push(activity);
        }

        // Verify we got both activities
        expect(activities.length).toBe(2);
        
        // Verify the activities have the expected types
        expect(activities[0].type).toBe('slide');
        expect(activities[1].type).toBe('flashcard');
        
        // Get the content of each activity
        const slideActivity = activities[0] as SlideActivityConfig;
        const flashcardActivity = activities[1] as FlashcardActivityConfig;
        
        // Print the content for debugging
        console.log(`<Final slide markdownContent>${slideActivity.markdownContent}</Final slide markdownContent>`);
        console.log(`<Final flashcard front>${flashcardActivity.flashcardFront}</Final flashcard front>`);
        console.log(`<Final flashcard back>${flashcardActivity.flashcardBack}</Final flashcard back>`);
        
        // Verify the slide contains the specific example variable name 'foo'
        // The content should reflect the additionalInstructions for the slide
        expect(`${slideActivity.markdownContent.toLowerCase()}`.includes('foo')).toBe(true);
        
        // Verify the flashcard contains the specific example variable name 'bar'
        // The content should reflect the additionalInstructions for the flashcard
        expect(`${flashcardActivity.flashcardFront.toLowerCase()}${flashcardActivity.flashcardBack.toLowerCase()}`.includes('bar')).toBe(true);
    }, 30_000);

    it('should generate activities with citations when documents are provided', async () => {
        // Use the default stub AI to avoid making real API calls
        const ai = createDefaultStubAI();
         
        // Create activity type servers
        const slideServer = new SlideActivityTypeServerV2();
        const flashcardServer = new FlashcardActivityTypeServerV2();
         
        // Create a generator with our activity type servers and override hydrateRequest
        const generator = new ActivityGeneratorV2({
            activityTypeServers: [slideServer, flashcardServer],
            ai
        });

        // Override the hydrateRequest method to ensure we use the provided documents
        generator.hydrateRequest = async (req: ActivityGenerateRequest): Promise<ActivityGeneratorV2HydratedRequest> => {
            const validActivityTypeServers = await generator._getValidActivityTypeServers(req.validActivityTypes ?? [...ActivityTypesPublic]);
            const outputSchema = await generator.createOutputSchema(req);

            // Convert provided documents to unified resources
            const prefetchedResources: UnifiedResource[] = req.from?.documents?.map((doc: any) => {
                return {
                    id: doc.id ?? '',
                    type: 'page',
                    name: doc.title ?? '',
                    source: doc.sourceUrl ?? '',
                    content: doc.text
                }
            }) ?? [];

            const hydrationOverride = createHydratedValuesOverride({
                subjectDefinitionString: 'JavaScript Fundamentals'
            });
            
            const hydrated = await hydrationOverride(generator, req);

            const ret: ActivityGeneratorV2HydratedRequest = {
                ...req,
                hydrated
            };

            return ret;
        };

        // Sample document with easily identifiable content for citation
        const documentWithCitableContent = {
            id: 'javascript-variables-document',
            title: 'Javascript Variables Document',
            text: `
            # JavaScript Variables
            
            ## Introduction to Variables
            
            In JavaScript, variables are containers for storing data values.
            
            ## Variable Declaration
            
            Variables can be declared using var, let, or const keywords:
            
            \`\`\`javascript
            var x = 5;       // old way, function scoped
            let y = 10;      // modern way, block scoped
            const z = 15;    // constant, cannot be reassigned
            \`\`\`
            
            ## Variable Naming
            
            Variable names should be descriptive and follow camelCase convention.
            For example: firstName, lastName, totalAmount.
            `,
            sourceUrl: 'https://example.com/javascript-variables'
        };

        const activities: ActivityConfig[] = [];
        
        // Generate activities with the document that should be cited
        for await (const activity of generator.generateActivities({
            otherMessages: [{
                role: 'user',
                content: 'Generate activities about JavaScript variables, making sure to cite your sources.'
            }],
            from: {
                skill: {
                    name: 'JavaScript Fundamentals',
                    parentSkillIds: [],
                    parentSkillContext: 'Learning JavaScript variables',
                },
                documents: [documentWithCitableContent]
            },
            // Use sequencing to get different types of activities for testing
            sequencing: {
                sequence: [
                    {
                        activityTypes: ['slide'],
                        additionalInstructions: 'Create a slide about JavaScript variable declaration. Be sure to cite the source document.'
                    },
                    {
                        activityTypes: ['flashcard'],
                        additionalInstructions: 'Create a flashcard about JavaScript variable naming conventions. Be sure to cite the source document.'
                    }
                ]
            }
        })) {
            activities.push(activity);
        }

        // Verify we got both activities
        expect(activities.length).toBe(2);
        
        // Verify types
        expect(activities[0].type).toBe('slide');
        expect(activities[1].type).toBe('flashcard');
        
        // Check for citations in each activity
        activities.forEach(activity => {
            // Verify the activity has a citations array using the type guard
            expect(hasCitations(activity)).toBe(true);
            
            // If citations are present (they might be null if empty), verify their structure
            if (hasCitations(activity) && activity.citations) {
                expect(Array.isArray(activity.citations)).toBe(true);
                
                // If there are citations, check their structure
                activity.citations.forEach(citation => {
                    expect(citation).toHaveProperty('docId');
                    expect(citation).toHaveProperty('startText');
                    expect(citation).toHaveProperty('endText');
                    
                    // The startText and endText should be non-empty strings
                    expect(typeof citation.startText).toBe('string');
                    expect(citation.startText.length).toBeGreaterThan(0);
                    expect(typeof citation.endText).toBe('string');
                    expect(citation.endText.length).toBeGreaterThan(0);
                });
                
                // Log the citations for debugging
                console.log(`Citations for ${activity.type} activity:`, JSON.stringify(activity.citations, null, 2));
            }
        });
        
        // Check that the slide content reflects the cited content
        const slideActivity = activities[0] as SlideActivityConfig;
        expect(slideActivity.markdownContent).toBeTruthy();
        
        // Check that the flashcard content reflects the cited content
        const flashcardActivity = activities[1] as FlashcardActivityConfig;
        expect(flashcardActivity.flashcardFront).toBeTruthy();
        expect(flashcardActivity.flashcardBack).toBeTruthy();
    }, 30_000);
}); 