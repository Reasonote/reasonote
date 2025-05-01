import { cosineSimilarity } from 'ai';
import { expect } from 'vitest';

import { AI } from '../AI';

/**
 * Extends Vitest's expect with a custom matcher for text similarity
 * @param ai - AI instance to use for embeddings
 */
export function setupTextSimilarityMatchers(ai: AI) {
    expect.extend({
        /**
         * Checks if two texts are semantically similar using embeddings
         * @param received - The text to check
         * @param expected - The expected text
         * @param threshold - Similarity threshold (0-1), defaults to 0.8
         */
        async toBeTextSimilarTo(received: string, expected: string, threshold = 0.8) {
            if (typeof received !== 'string' || typeof expected !== 'string') {
                return {
                    pass: false,
                    message: () => `Expected both values to be strings, but got ${typeof received} and ${typeof expected}`
                };
            }
            
            try {
                // Get embeddings for both texts
                const [receivedEmbedding, expectedEmbedding] = await Promise.all([
                    ai.embed.embedItem(received),
                    ai.embed.embedItem(expected)
                ]);
                
                // Calculate similarity
                const similarity = cosineSimilarity(receivedEmbedding, expectedEmbedding);
                
                const pass = similarity >= threshold;
                
                return {
                    pass,
                    message: () => pass
                        ? `Expected "${received}" not to be semantically similar to "${expected}" (similarity: ${similarity.toFixed(4)})`
                        : `Expected "${received}" to be semantically similar to "${expected}" (similarity: ${similarity.toFixed(4)}, threshold: ${threshold})`
                };
            } catch (error) {
                return {
                    pass: false,
                    message: () => `Error calculating text similarity: ${error}`
                };
            }
        },
        
        /**
         * Checks if a text contains key concepts by comparing semantic similarity of individual phrases
         * @param received - The text to check
         * @param expectedConcepts - Array of key concepts that should be present
         * @param threshold - Similarity threshold (0-1), defaults to 0.75
         */
        async toContainKeyConcepts(received: string, expectedConcepts: string[], threshold = 0.75) {
            if (typeof received !== 'string') {
                return {
                    pass: false,
                    message: () => `Expected received value to be string, but got ${typeof received}`
                };
            }
            
            if (!Array.isArray(expectedConcepts)) {
                return {
                    pass: false,
                    message: () => `Expected concepts to be an array, but got ${typeof expectedConcepts}`
                };
            }
            
            try {
                // Get embedding for the received text
                const receivedEmbedding = await ai.embed.embedItem(received);
                
                // Check each concept
                const results = await Promise.all(
                    expectedConcepts.map(async (concept) => {
                        const conceptEmbedding = await ai.embed.embedItem(concept);
                        const similarity = cosineSimilarity(receivedEmbedding, conceptEmbedding);
                        return { concept, similarity, pass: similarity >= threshold };
                    })
                );
                
                const failedConcepts = results.filter(r => !r.pass);
                const pass = failedConcepts.length === 0;
                
                return {
                    pass,
                    message: () => {
                        if (pass) {
                            return `Expected text not to contain concepts: ${expectedConcepts.join(', ')}`;
                        } else {
                            const failedDetails = failedConcepts
                                .map(f => `"${f.concept}" (similarity: ${f.similarity.toFixed(4)})`)
                                .join(', ');
                            return `Expected text to contain concepts: ${failedDetails}. Threshold: ${threshold}`;
                        }
                    }
                };
            } catch (error) {
                return {
                    pass: false,
                    message: () => `Error checking for key concepts: ${error}`
                };
            }
        },
        
        /**
         * Checks if an object's text properties contain expected concepts
         * @param received - The object with text properties to check
         * @param expectedConceptsByField - Map of field names to expected concepts
         * @param threshold - Similarity threshold (0-1), defaults to 0.75
         */
        async toHaveFieldsWithConcepts(
            received: Record<string, any>,
            expectedConceptsByField: Record<string, string[]>,
            threshold = 0.75
        ) {
            if (typeof received !== 'object' || received === null) {
                return {
                    pass: false,
                    message: () => `Expected received value to be an object, but got ${typeof received}`
                };
            }
            
            try {
                const results = await Promise.all(
                    Object.entries(expectedConceptsByField).map(async ([field, concepts]) => {
                        if (!(field in received)) {
                            return {
                                field,
                                pass: false,
                                error: `Field "${field}" not found in object`
                            };
                        }
                        
                        const fieldValue = received[field];
                        if (typeof fieldValue !== 'string' && !Array.isArray(fieldValue)) {
                            return {
                                field,
                                pass: false,
                                error: `Field "${field}" is not a string or array`
                            };
                        }
                        
                        // Handle array fields (like goals)
                        const textToCheck = Array.isArray(fieldValue) 
                            ? fieldValue.join(' ') 
                            : fieldValue;
                        
                        // Get embedding for the field text
                        const fieldEmbedding = await ai.embed.embedItem(textToCheck);
                        
                        // Check each concept
                        const conceptResults = await Promise.all(
                            concepts.map(async (concept) => {
                                const conceptEmbedding = await ai.embed.embedItem(concept);
                                const similarity = cosineSimilarity(fieldEmbedding, conceptEmbedding);
                                return { concept, similarity, pass: similarity >= threshold };
                            })
                        );
                        
                        const failedConcepts = conceptResults.filter(r => !r.pass);
                        
                        return {
                            field,
                            pass: failedConcepts.length === 0,
                            failedConcepts,
                            conceptResults
                        };
                    })
                );
                
                const failedFields = results.filter(r => !r.pass);
                const pass = failedFields.length === 0;
                
                return {
                    pass,
                    message: () => {
                        if (pass) {
                            return `Expected object not to have fields with the specified concepts`;
                        } else {
                            const failedDetails = failedFields
                                .map(f => {
                                    if ('error' in f) {
                                        return `${f.field}: ${f.error}`;
                                    } else {
                                        const conceptDetails = f.failedConcepts
                                            .map(c => `"${c.concept}" (similarity: ${c.similarity.toFixed(4)})`)
                                            .join(', ');
                                        return `${f.field}: missing concepts [${conceptDetails}]`;
                                    }
                                })
                                .join('\n');
                            return `Expected object to have fields with the specified concepts:\n${failedDetails}\nThreshold: ${threshold}`;
                        }
                    }
                };
            } catch (error) {
                return {
                    pass: false,
                    message: () => `Error checking fields for concepts: ${error}`
                };
            }
        }
    });
}

// Type augmentation for Vitest
declare global {
    namespace Vi {
        interface Assertion<T = any> {
            toBeTextSimilarTo(expected: string, threshold?: number): Promise<void>;
            toContainKeyConcepts(expectedConcepts: string[], threshold?: number): Promise<void>;
            toHaveFieldsWithConcepts(
                expectedConceptsByField: Record<string, string[]>,
                threshold?: number
            ): Promise<void>;
        }
    }
} 