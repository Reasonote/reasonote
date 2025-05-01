import { z } from 'zod';

import { DomainCtxInjectorConfig } from '@reasonote/core';

import { AI } from '../../../../';
import { RNCtxInjector } from '../RNCtxInjector';

export const DomainPromptLibrary: {
    [name: string]: {
        exampleSubjects: string;
        specificExamples: string[];
        [generationType: string]: string | string[];
        general: string;
    }
} = {
    foundationalUnderstanding: {
        exampleSubjects: `
            Basic Mathematics (arithmetic, fractions), 
            Basic Grammar (parts of speech, sentence structure),
            Basic Science (scientific method, basic terminology),
            Anatomy (body systems, organ functions),
            Music Theory Fundamentals (notes, scales, basic rhythm),
            Language Basics (vocabulary, pronunciation)
        `,
        specificExamples: [
            "The Basics of Quantum Mechanics: Understanding Wave-Particle Duality",
            "Introduction to the Principles of Sustainable Agriculture",
            "Fundamentals of Digital Marketing: SEO and Content Strategy"
        ],
        activityGeneration: `
            Create activities that:
                - Focus on memorization and recall of core concepts
                - Use repetition and practice to reinforce basic principles
                - Break complex topics into simple, digestible parts
                - Include clear definitions and examples
                - Test basic comprehension before moving to complex applications
                - Use visual aids and mnemonics where helpful
        `,
        general: `
            - Present information in a clear, structured manner
            - Define all key terms explicitly
            - Use simple examples before complex ones
            - Break down complex concepts into basic components
            - Build strong foundational knowledge before advancing
            - Ensure mastery of prerequisites
        `
    },

    criticalThinkingAndAnalysis: {
        exampleSubjects: `
            Philosophy (logic, ethics),
            Advanced Economics (market analysis, economic theory),
            Literary Analysis (theme analysis, character study),
            Scientific Research (methodology, data analysis),
            Political Science (policy analysis, governance),
            Legal Studies (case analysis, legal reasoning)
        `,
        specificExamples: [
            "The Role of Cognitive Biases in Decision Making",
            "Analyzing Logical Fallacies in Political Debates",
            "Techniques for Evaluating the Credibility of Online Sources"
        ],
        activityGeneration: `
            Create activities that:
                - Require analysis of complex scenarios
                - Ask students to evaluate multiple perspectives
                - Challenge assumptions and biases
                - Require evidence-based reasoning
                - Include case studies and real-world examples
                - Promote debate and discussion
                - Encourage identification of logical fallacies
        `,
        general: `
            - Emphasize logical reasoning and evidence-based thinking
            - Encourage questioning and skeptical inquiry
            - Develop analytical frameworks
            - Consider multiple perspectives and interpretations
            - Identify assumptions and biases
            - Practice systematic evaluation methods
        `
    },

    creativeExpressionAndInnovation: {
        exampleSubjects: `
            Creative Writing (fiction, poetry, screenwriting),
            Visual Arts (painting, sculpture, digital art),
            Music Composition (songwriting, orchestration),
            Design (UX/UI, industrial, fashion),
            Game Development (narrative design, mechanics),
            Architectural Design (conceptual, innovative spaces)
        `,
        specificExamples: [
            "The Art of Storyboarding: Techniques for Visual Storytelling in Animation",
            "Innovative Upcycling: Transforming Everyday Waste into Functional Art",
            "Digital Fabrication: Exploring 3D Printing for Creative Product Design"
        ],
        activityGeneration: `
            Create activities that:
                - Encourage original and innovative thinking
                - Promote artistic expression and creativity
                - Challenge conventional approaches
                - Include open-ended problems
                - Foster personal style development
                - Encourage experimentation with different mediums
        `,
        general: `
            - Value originality and creative risk-taking
            - Embrace ambiguity and experimentation
            - Encourage diverse perspectives and approaches
            - Support iterative development and refinement
            - Balance creative freedom with constraints
            - Provide constructive critique methods
        `
    },

    quantitativeReasoningAndProblemSolving: {
        exampleSubjects: `
            Advanced Mathematics (calculus, linear algebra),
            Physics (mechanics, thermodynamics),
            Engineering (structural analysis, circuit design),
            Computer Science (algorithms, data structures),
            Statistics (probability, data analysis),
            Quantitative Finance (financial modeling, risk analysis)
        `,
        specificExamples: [
            "Statistical Analysis of Sports Performance Metrics",
            "Differential Calculus: The Chain Rule",
            "Understanding first-order greeks in options trading"
        ],
        activityGeneration: `
            Create activities that:
                - Require mathematical reasoning and problem-solving
                - Include step-by-step solution processes
                - Use data analysis and interpretation
                - Apply formulas and equations appropriately
                - Include word problems with real-world applications
                - Test multiple solution strategies
            Remember: All mathematical expressions must use $$...$$
        `,
        general: `
            - Use precise mathematical notation (always in $$...$$)
            - Show step-by-step problem-solving processes
            - Emphasize accuracy and precision
            - Include units and dimensional analysis
            - Verify solutions and check reasonableness
            - Connect abstract concepts to concrete applications
        `
    },

    practicalApplicationAndRealWorldRelevance: {
        exampleSubjects: `
            Business Administration (management, operations),
            Medicine (clinical practice, patient care),
            Engineering (applied mechanics, systems design),
            Personal Finance (budgeting, investment),
            Project Management (planning, execution),
            Environmental Science (conservation, sustainability)
        `,
        specificExamples: [
            "The Impact of Urban Gardening on Food Security in Low-Income Communities",
            "Using Data Analytics to Improve Supply Chain Efficiency in Small Businesses",
            "The Role of Renewable Energy Technologies in Reducing Carbon Footprint for Homeowners"
        ],
        activityGeneration: `
            Create activities that:
                - Use real-world case studies and scenarios
                - Apply theoretical knowledge to practical problems
                - Include industry-standard practices
                - Consider real-world constraints and limitations
                - Incorporate professional standards
                - Address ethical considerations
                - Include decision-making scenarios
        `,
        general: `
            - Connect theory to practical applications
            - Emphasize real-world relevance
            - Include industry best practices
            - Consider practical constraints
            - Address professional ethics
            - Focus on actionable outcomes
            - Incorporate current trends and developments
        `
    },

    historicalAndCulturalContext: {
        exampleSubjects: `
            World History (civilizations, major events),
            Cultural Anthropology (customs, social structures),
            Art History (movements, cultural impact),
            Literature (historical context, cultural analysis),
            Religious Studies (traditions, beliefs),
            Archaeological Studies (ancient cultures, artifacts)
        `,
        specificExamples: [
            "The Role of Women in the French Revolution: Social Changes and Cultural Impact",
            "The Influence of Ancient Egyptian Art on Modern Design: A Study of Aesthetics and Symbolism",
            "The Cultural Significance of the Silk Road: Trade, Religion, and Cultural Exchange in Ancient Civilizations"
        ],
        activityGeneration: `
            Create activities that:
                - Examine historical contexts and influences
                - Compare different cultural perspectives
                - Analyze primary historical sources
                - Trace developments over time
                - Consider cultural sensitivity
                - Connect past events to present situations
                - Explore cultural artifacts and documents
        `,
        general: `
            - Consider historical context and development
            - Respect cultural diversity and perspectives
            - Use primary sources when possible
            - Examine cause-and-effect relationships
            - Recognize cultural biases and assumptions
            - Connect historical patterns to present day
            - Promote cultural understanding and empathy
        `
    },

    proceduralSkillsAndTechniques: {
        exampleSubjects: `
            Programming (coding practices, debugging),
            Laboratory Techniques (experimental procedures),
            Medical Procedures (clinical skills),
            Technical Writing (documentation, specifications),
            Manufacturing Processes (assembly, quality control),
            Musical Performance (instrument technique, practice methods)
        `,
        specificExamples: [
            "Advanced Suture Techniques for Wound Closure in Surgical Procedures",
            "Guitar Solos: Techniques for Improvisation and Composition",
            "Implementing Lean Manufacturing Practices to Optimize Assembly Line Efficiency"
        ],
        activityGeneration: `
            Create activities that:
                - Break down complex procedures into clear steps
                - Include specific practice exercises
                - Focus on technique refinement
                - Provide immediate feedback opportunities
                - Include common error prevention
                - Test procedural knowledge directly
        `,
        general: `
            - Present clear, sequential instructions
            - Emphasize proper technique and form
            - Include safety considerations
            - Address common mistakes and pitfalls
            - Focus on practice and repetition
            - Build from basic to advanced techniques
        `
    },

    strategicThinkingAndTacticalExecution: {
        exampleSubjects: `
            Business Strategy (market analysis, competitive strategy),
            Military Strategy (tactical planning, resource allocation),
            Game Theory (decision analysis, optimal play),
            Sports Strategy (team tactics, game planning),
            Political Strategy (policy planning, campaign management),
            Resource Management (optimization, allocation)
        `,
        specificExamples: [
            "Understanding and Applying Pot Odds and Implied Odds in Texas Hold'em",
            "Evaluating Porter's Five Forces to Determine Market Entry Viability",
            "Designing Dynamic Offensive and Defensive Game Plans in Soccer"
        ],
        activityGeneration: `
            Create activities that:
                - Test the users decision making skills
                - Test the user in specific scenarios
                - Require them to make decisions based on the given information
                - Require them to think about the consequences of their decisions
                - Require them to think about the optimal strategy
                - Require them to apply their knowledge to real-world situations
        `,
        general: `
            - Emphasize strategic thinking and planning
            - Consider short and long-term consequences
            - Analyze competitive environments
            - Balance resources and objectives
            - Develop contingency planning
            - Focus on decision-making processes
            - Include risk-reward evaluation
        `
    }
}

/**
 * Injects contextual prompts for dealing within a given subject
 */
export class DomainCtxInjector extends RNCtxInjector<DomainCtxInjectorConfig> {
    name: string = 'Domain';
    defaultConfig = null;

    async _get(ai: AI, resolvedConfig: DomainCtxInjectorConfig): Promise<{ name: string, description?: string, content: string }> {
        if (!resolvedConfig.subjectName && !resolvedConfig.skillId) {
            throw new Error('subjectName or skillId is required');
        }
        let subjectName = resolvedConfig.subjectName;
        let subjectDescription = '';
        let subjectDomain: string = 'none'; // Initialize with default value

        if (resolvedConfig.skillId) {
            const skill = await ai.sb.from('skill').select('*').eq('id', resolvedConfig.skillId).single();
            subjectName = skill.data?._name;
            subjectDescription = skill.data?._description ?? '';
            subjectDomain = skill.data?.domain ?? 'none';
        }

        if (subjectDomain === 'none') {
            console.log('No domain found for skill:', resolvedConfig.skillId);
            console.log('Identifying domain...');
            // Get domain names from DomainPromptLibrary
            const domainNames = Object.keys(DomainPromptLibrary);

            // Determine the domain using AI
            const domainResult = await ai.genObject({
                schema: z.object({
                    domain: z.enum(['none', ...domainNames] as const),
                    confidence: z.number()
                }),
                prompt: `
                <TASK>
                    Given the following subject, determine which domain it best fits into. If it doesn't fit into any domain, return "none".
                    Consider the examples and descriptions in each domain.
                </TASK>

                <SUBJECT>
                    <SUBJECT_NAME>
                        ${subjectName}
                    </SUBJECT_NAME>
                    <SUBJECT_DESCRIPTION>
                        ${subjectDescription}
                    </SUBJECT_DESCRIPTION>
                </SUBJECT>

                <AVAILABLE_DOMAINS>
                    ${Object.entries(DomainPromptLibrary).map(([domain, content]) =>
                    `<DOMAIN>
                            <DOMAIN_NAME>
                                ${domain}
                            </DOMAIN_NAME>
                            <DOMAIN_EXAMPLES>
                                ${content.exampleSubjects}
                            </DOMAIN_EXAMPLES>
                        </DOMAIN>`
                ).join('\n')}
                </AVAILABLE_DOMAINS>
                
                <OUTPUT>
                    <DOMAIN>
                        The domain that best fits the subject
                    </DOMAIN>
                    <CONFIDENCE>
                        Your confidence level (0-1) in your choice
                    </CONFIDENCE>
                </OUTPUT>
            `,
                model: 'openai:gpt-4o-mini',
                mode: 'json',
                providerArgs: {
                    structuredOutputs: true
                }
            });

            console.log('Identified domain:', domainResult.object.domain, 'with confidence:', domainResult.object.confidence, 'for subject:', subjectName, 'and description:', subjectDescription);
            subjectDomain = domainResult.object.domain;

            if (resolvedConfig.skillId) {
                // Fire and forget - don't await
                Promise.resolve(ai.sb.from('skill').update({
                    domain: subjectDomain
                }).eq('id', resolvedConfig.skillId)).then(() => {
                    console.log('Updated skill domain in background');
                }).catch((err: Error) => {
                    console.error('Failed to update skill domain:', err);
                });
            }
        }

        // Get the domain's prompts
        const domainPrompts = DomainPromptLibrary[subjectDomain];

        // const domainPrompt = `
        //     <DOMAIN_SPECIFIC_INSTRUCTIONS>
        //         <DOMAIN_NAME>
        //             This subject is best suited for the domain of ${domainResult.object.domain}. Make sure to follow the specific instructions for this domain.
        //         </DOMAIN_NAME>
        //         <GENERAL>
        //             ${domainPrompts.general}
        //         </GENERAL>
        //         ${resolvedConfig.specificity ? `
        //         <${resolvedConfig.specificity.toUpperCase()}>
        //             ${domainPrompts[resolvedConfig.specificity]}
        //         </${resolvedConfig.specificity.toUpperCase()}>` : ''}
        //     </DOMAIN_SPECIFIC_INSTRUCTIONS>
        // `

        const domainPrompt = `
        <DOMAIN_SPECIFIC_INSTRUCTIONS>
            <DOMAIN_NAME>
                This subject is best suited for the domain of ${subjectDomain}. Make sure to follow the specific instructions for this domain.
            </DOMAIN_NAME>
            ${resolvedConfig.specificity ? `
            <${resolvedConfig.specificity.toUpperCase()}>
                ${domainPrompts[resolvedConfig.specificity]}
            </${resolvedConfig.specificity.toUpperCase()}>` : ''}
        </DOMAIN_SPECIFIC_INSTRUCTIONS>
    `
        console.log('DomainCtxInjector domainPrompt', domainPrompt);

        return {
            name: 'SubjectDomain',
            description: `Domain: ${subjectDomain}`,
            content: domainPrompt
        }
    }
}