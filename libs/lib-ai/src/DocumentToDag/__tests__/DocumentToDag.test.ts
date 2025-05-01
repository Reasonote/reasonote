import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import { createDefaultStubAI } from '../../DefaultStubAI';
import { TestDocDB } from '../../docdb/TestDocDB';
import {
  DocumentToDag,
  LearningObjectiveWithPrerequisites,
  LessonGroup,
  LessonGroupWithPrerequisites,
} from '../DocumentToDag';
import {
  findCycles,
  hasCycles,
  hasSelfDependency,
} from '../utils';

// Using describe.concurrent for parallel test execution with increased timeout for AI operations
describe.concurrent('DocumentToDag', () => {
    const ai = createDefaultStubAI();
    const dagCreator = new DocumentToDag(ai);

    describe.concurrent('createDag', () => {
        it.concurrent('should process content and create a complete knowledge graph', { timeout: 120000 }, async () => {
            const sampleContent = `
                Chemical reactions are processes where reactants transform into products through the breaking and forming of chemical bonds. The rate of these reactions depends on factors such as temperature, concentration, and the presence of catalysts.

                Reaction mechanisms describe the step-by-step sequence of elementary reactions that lead to the final products. Each elementary step shows how molecules collide, which bonds break, and which new bonds form. Understanding these mechanisms is crucial for predicting reaction outcomes and optimizing conditions.

                Catalysis in chemical reactions involves the use of substances that increase reaction rates without being consumed. Catalysts work by providing alternative reaction pathways with lower activation energy barriers. Enzymes are biological catalysts that can increase reaction rates by millions of times.

                Advanced reaction kinetics involves analyzing complex reaction networks and their energy profiles. This includes studying transition states, intermediate species, and rate-determining steps. Understanding these aspects allows chemists to control reaction selectivity and yield.
            `;

            const testDocDB = new TestDocDB(ai);
            testDocDB.addDocuments([{
                id: 'doc1',
                content: sampleContent,
                fileName: 'test.txt',
            }]);
            const overrideDagCreator = new DocumentToDag(ai);

            const result = await overrideDagCreator.createDag({ documentId: 'doc1', docDB: testDocDB, summary: { summary: '', learningObjectives: [] } });

            expect(Array.isArray(result)).toBe(true);

            // Verify learning objectives are processed
            expect(result.length).toBeGreaterThan(0);

            // Verify the knowledge graph structure
            const hasPrerequisites = result.some(objective => (objective.prerequisites || []).length > 0);
            expect(hasPrerequisites).toBe(true);

            // Verify that there are no cycles in the graph
            expect(hasCycles(result.map(lg => ({ object: lg.lessonName, prerequisites: lg.prerequisites })))).toBe(false);
        });

        it.concurrent('should handle errors gracefully', { timeout: 30000 }, async () => {
            const testDocDB = new TestDocDB(ai);
            testDocDB.addDocuments([{
                id: 'doc1',
                content: '',
                fileName: 'test.txt',
            }]);
            const overrideDagCreator = new DocumentToDag(ai);

            // Test with invalid content
            await expect(overrideDagCreator.createDag({ documentId: 'doc1', docDB: testDocDB, summary: { summary: '', learningObjectives: [] } }))
                .rejects
                .toThrow();
        });
    });

    describe.concurrent('generateLearningSummary', () => {
        it.concurrent('should generate a learning-focused summary with objectives for technical content', { timeout: 30000 }, async () => {
            const sampleContent = `
                Chemical reactions are processes where reactants transform into products through the breaking and forming of chemical bonds. The rate of these reactions depends on factors such as temperature, concentration, and the presence of catalysts.

                Reaction mechanisms describe the step-by-step sequence of elementary reactions that lead to the final products. Each elementary step shows how molecules collide, which bonds break, and which new bonds form. Understanding these mechanisms is crucial for predicting reaction outcomes and optimizing conditions.

                Catalysis in chemical reactions involves the use of substances that increase reaction rates without being consumed. Catalysts work by providing alternative reaction pathways with lower activation energy barriers. Enzymes are biological catalysts that can increase reaction rates by millions of times.

                Advanced reaction kinetics involves analyzing complex reaction networks and their energy profiles. This includes studying transition states, intermediate species, and rate-determining steps. Understanding these aspects allows chemists to control reaction selectivity and yield.
            `;
            const result = await dagCreator.generateLearningSummary([{ content: sampleContent, p: 0 }]);

            expect(result).toHaveProperty('summary');
            expect(result).toHaveProperty('learningObjectives');
            expect(Array.isArray(result.learningObjectives)).toBe(true);
            expect(result.learningObjectives.length).toBeGreaterThan(0);

            // Verify the summary is comprehensive and contains key chemistry concepts
            expect(result.summary).toMatch(/chemical reactions/);
            expect(result.summary).toMatch(/reaction mechanisms/);
            expect(result.summary).toMatch(/catalysis|catalysts/);
            expect(result.summary).toMatch(/reaction kinetics/);

            // Verify learning objectives are specific and actionable
            result.learningObjectives.forEach(objective => {
                expect(objective).toMatch(/understand|explain|describe|define|analyze|compare|contrast|evaluate|apply|implement|demonstrate|use|integrate|connect|synthesize|combine|master|design|develop|create/i);
            });
        });

        it.concurrent('should handle content with multiple distinct topics', { timeout: 30000 }, async () => {
            const multiTopicContent = `
                Photosynthesis is the process by which plants convert light energy into chemical energy. This process takes place in the chloroplasts of plant cells, specifically using chlorophyll pigments.

                The water cycle, also known as the hydrologic cycle, describes the continuous movement of water within Earth and the atmosphere. It involves processes like evaporation, condensation, and precipitation.

                Cellular respiration is how organisms break down glucose to produce energy in the form of ATP. This process occurs in the mitochondria and involves multiple steps including glycolysis and the Krebs cycle.
            `;

            const result = await dagCreator.generateLearningSummary([{ content: multiTopicContent, p: 0 }]);

            // Verify summary includes all major topics
            expect(result.summary).toContain('photosynthesis');
            expect(result.summary).toContain('water cycle');
            expect(result.summary).toContain('cellular respiration');

            // Verify learning objectives cover all topics
            expect(result.learningObjectives.some(obj => obj.toLowerCase().includes('photosynthesis'))).toBe(true);
            expect(result.learningObjectives.some(obj => obj.toLowerCase().includes('water') || obj.toLowerCase().includes('hydrologic'))).toBe(true);
            expect(result.learningObjectives.some(obj => obj.toLowerCase().includes('cellular respiration'))).toBe(true);
        });

        it.concurrent('should handle content with minimal technical terms', { timeout: 30000 }, async () => {
            const nonTechnicalContent = `
                The importance of time management cannot be overstated in today's fast-paced world. Good time management helps reduce stress and increases productivity.

                Setting clear goals is the first step. This involves breaking down large tasks into smaller, manageable pieces and prioritizing them based on importance and urgency.

                Regular breaks are essential for maintaining focus and preventing burnout. Studies show that taking short breaks can actually improve overall productivity.
            `;

            const result = await dagCreator.generateLearningSummary([{ content: nonTechnicalContent, p: 0 }]);

            // Verify summary captures main concepts despite lack of technical terms
            expect(result.summary).toContain('time management');
            expect(result.summary).toContain('goals');
            expect(result.summary).toContain('productivity');

            // Verify learning objectives are practical and actionable
            result.learningObjectives.forEach(objective => {
                expect(objective).toMatch(/understand|explain|describe|define|analyze|compare|contrast|evaluate|apply|implement|demonstrate|use|integrate|connect|synthesize|combine|master|design|develop|create/i);
            });
        });

        it.concurrent('should error on empty content', { timeout: 30000 }, async () => {
            await expect(dagCreator.generateLearningSummary([{ content: '', p: 0 }])).rejects.toThrow();
        });

        it.concurrent('should handle content with only whitespace', { timeout: 30000 }, async () => {
            await expect(dagCreator.generateLearningSummary([{ content: '   \n   \t   ', p: 0 }])).rejects.toThrow();
        });
    });

    describe.concurrent('generateSkillName', () => {
        it.concurrent('should extract skill name from chapter title in first chunk', { timeout: 15000 }, async () => {
            const firstChunkContent = `Chapter 3: Quantum Mechanics
                This chapter introduces the fundamental principles of quantum mechanics, including wave-particle duality and the uncertainty principle.`;
            const summary = "This document explores quantum mechanics from basic principles to advanced applications.";
            const learningObjectives = [
                "Understand wave-particle duality",
                "Apply the uncertainty principle",
                "Solve the Schrödinger equation"
            ];

            const result = await dagCreator.generateSkillName(firstChunkContent, summary, learningObjectives);

            expect(result.skillName).toBe("Quantum Mechanics");
            expect(result.emoji).toBeTruthy();
        });

        it.concurrent('should extract skill name from "Introduction to" format', { timeout: 15000 }, async () => {
            const firstChunkContent = `Introduction to Data Structures and Algorithms
                We begin our exploration of fundamental computer science concepts with data structures and algorithms.`;
            const summary = "A comprehensive guide to data structures and algorithmic principles.";
            const learningObjectives = [
                "Implement basic data structures",
                "Analyze algorithm complexity",
                "Apply sorting algorithms"
            ];

            const result = await dagCreator.generateSkillName(firstChunkContent, summary, learningObjectives);

            expect(result.skillName).toBe("Data Structures and Algorithms");
            expect(result.emoji).toBeTruthy();
        });

        it.concurrent('should handle standalone title format', { timeout: 15000 }, async () => {
            const firstChunkContent = `Linear Algebra
                The study of linear equations, matrices, and vector spaces forms the foundation of many mathematical concepts.`;
            const summary = "An exploration of linear algebra concepts and their applications.";
            const learningObjectives = [
                "Solve systems of linear equations",
                "Perform matrix operations",
                "Understand vector spaces"
            ];

            const result = await dagCreator.generateSkillName(firstChunkContent, summary, learningObjectives);

            expect(result.skillName).toBe("Linear Algebra");
            expect(result.emoji).toBeTruthy();
        });

        it.concurrent('should generate appropriate name when no clear title exists', { timeout: 15000 }, async () => {
            const firstChunkContent = `The process of photosynthesis converts light energy into chemical energy, 
                enabling plants to produce glucose from carbon dioxide and water.`;
            const summary = "A detailed examination of photosynthesis, including light-dependent and light-independent reactions.";
            const learningObjectives = [
                "Explain the light-dependent reactions",
                "Describe the Calvin cycle",
                "Analyze factors affecting photosynthesis rate"
            ];

            const result = await dagCreator.generateSkillName(firstChunkContent, summary, learningObjectives);

            expect(result.skillName.toLowerCase()).toContain("photosynthesis");
            expect(result.emoji).toBeTruthy();
        });

        it.concurrent('should generate concise name for complex content', { timeout: 15000 }, async () => {
            const firstChunkContent = `Advanced Topics in Machine Learning and Neural Network Architectures: 
                A Comprehensive Study of Deep Learning Models, Training Strategies, and Applications in Modern AI Systems`;
            const summary = "An in-depth exploration of advanced machine learning concepts and neural network architectures.";
            const learningObjectives = [
                "Design neural network architectures",
                "Implement training strategies",
                "Optimize model performance"
            ];

            const result = await dagCreator.generateSkillName(firstChunkContent, summary, learningObjectives);

            expect(result.skillName.split(' ').length).toBeLessThanOrEqual(8);
            expect(result.emoji).toBeTruthy();
        });

        it.concurrent('should handle empty or minimal first chunk gracefully', { timeout: 15000 }, async () => {
            const firstChunkContent = "";
            const summary = "An introduction to basic programming concepts and syntax.";
            const learningObjectives = [
                "Write basic programs",
                "Understand variables and data types",
                "Implement control structures"
            ];

            const result = await dagCreator.generateSkillName(firstChunkContent, summary, learningObjectives);

            expect(result.skillName).toBeTruthy();
            expect(result.skillName.split(' ').length).toBeLessThanOrEqual(8);
            expect(result.emoji).toBeTruthy();
        });

        it.concurrent('should extract title when preceded by document metadata', { timeout: 15000 }, async () => {
            const firstChunkContent = `Page 1 of 42
                Document ID: PHYS-2023-001
                Last Updated: 2023-12-15
                Course Code: PHYS301
                ----------------------------------------
                
                Chapter 4: Thermodynamics and Statistical Mechanics
                
                This chapter explores the fundamental principles of thermodynamics and statistical mechanics, including the laws of thermodynamics, entropy, and statistical ensembles.`;
            const summary = "A comprehensive study of thermodynamic principles and statistical mechanical approaches to understanding energy and matter.";
            const learningObjectives = [
                "Apply the laws of thermodynamics",
                "Calculate entropy changes in various processes",
                "Analyze systems using statistical mechanics"
            ];

            const result = await dagCreator.generateSkillName(firstChunkContent, summary, learningObjectives);

            expect(result.skillName).toBe("Thermodynamics and Statistical Mechanics");
            expect(result.emoji).toBeTruthy();
        });
    });

    describe.concurrent('extractSpecificLearningObjectives', () => {
        const economicsSummary = {
            summary: "This comprehensive text explores fundamental economic concepts, focusing on market dynamics, pricing mechanisms, and economic decision-making. The document examines how various economic forces interact, from basic supply and demand relationships to complex market structures and efficiency considerations. It details how prices are determined, how markets reach equilibrium, and how different market conditions affect economic outcomes.",
            learningObjectives: [
                "Master the fundamental principles of market economics and price determination",
                "Analyze how supply and demand forces shape market outcomes",
                "Evaluate the efficiency of different market structures and pricing mechanisms",
                "Understand the relationships between various economic concepts and their practical applications",
                "Apply economic principles to real-world market analysis and decision-making"
            ]
        };

        const chunks = [
            {
                id: 'chunk1',
                documentId: 'doc1',
                content: `
                    Market Equilibrium occurs when supply equals demand, determining the market price and quantity. At this equilibrium point, the quantity that producers are willing to supply exactly matches the quantity that consumers wish to purchase. When markets reach equilibrium, there is no tendency for prices to change unless external factors shift the supply or demand curves.

                    The equilibrium price serves as a signal to both producers and consumers, coordinating their decisions. If the price is above equilibrium, producers will supply more than consumers demand, creating a surplus that puts downward pressure on prices. Conversely, if the price is below equilibrium, consumers will demand more than producers supply, creating a shortage that puts upward pressure on prices.
                `,
                startPosition: 0,
                endPosition: 100,
                metadata: {
                    title: 'Market Equilibrium',
                    type: 'text'
                }
            },
            {
                id: 'chunk2',
                documentId: 'doc1',
                content: `
                    Price Elasticity of demand measures how responsive quantity demanded is to changes in price. When demand is elastic, a small change in price leads to a large change in quantity demanded. Conversely, when demand is inelastic, even large price changes have minimal impact on quantity demanded.

                    Understanding elasticity is crucial for businesses making pricing decisions and governments designing tax policies. Products with elastic demand require careful price setting to maximize revenue, while those with inelastic demand can sustain higher prices without significantly affecting sales volume.
                `,
                startPosition: 101,
                endPosition: 200,
                metadata: {
                    title: 'Price Elasticity',
                    type: 'text'
                }
            }
        ];

        it.concurrent('should extract specific learning objectives for each chunk', { timeout: 30000 }, async () => {
            const objectives = await dagCreator.extractSpecificLearningObjectives(chunks, economicsSummary);

            // Verify we get results for each chunk
            ['chunk1', 'chunk2'].forEach(chunkId => {
                const chunkObjectives = objectives.filter(r => r.chunkIds.includes(chunkId));
                expect(chunkObjectives).toBeDefined();
                expect(chunkObjectives?.length).toBeGreaterThan(0);
            });

            // Verify objectives follow proper structure for first chunk (Market Equilibrium)
            const marketEquilibriumObjectives = objectives.find(r => r.chunkIds.includes('chunk1'))?.learningObjective;
            expect(marketEquilibriumObjectives).toBeDefined();
            expect(marketEquilibriumObjectives).toMatch(/^(Identify|Define|Describe|Explain|Analyze|Compare|Differentiate|Examine|Apply|Use|Demonstrate|Calculate|Connect|Relate|Integrate|Combine|Assess|Evaluate|Judge|Determine)/);

            // Should contain relevant market equilibrium concepts
            expect(marketEquilibriumObjectives?.toLowerCase()).toMatch(/(equilibrium|price|supply|demand|market|surplus|shortage)/);

            // Verify objectives follow proper structure for second chunk (Price Elasticity)
            const elasticityObjectives = objectives.find(r => r.chunkIds.includes('chunk2'))?.learningObjective;
            expect(elasticityObjectives).toBeDefined();
            expect(elasticityObjectives).toMatch(/^(Identify|Define|Describe|Explain|Analyze|Compare|Differentiate|Examine|Apply|Use|Demonstrate|Calculate|Connect|Relate|Integrate|Combine|Assess|Evaluate|Judge|Determine)/);

            // Should contain relevant elasticity concepts
            expect(elasticityObjectives?.toLowerCase()).toMatch(/(elastic|inelastic|price|demand|quantity|response|sensitivity)/);
        });

        it.concurrent('should handle empty chunks gracefully', { timeout: 30000 }, async () => {
            const emptyChunks = [
                {
                    ...chunks[0],
                    content: '   \n   \t   '
                }
            ];

            const objectives = await dagCreator.extractSpecificLearningObjectives(emptyChunks, economicsSummary);
            expect(objectives).toHaveLength(0);
        });

        it.concurrent('should create objectives that align with broader learning goals', { timeout: 30000 }, async () => {
            const objectives = await dagCreator.extractSpecificLearningObjectives(chunks, economicsSummary);

            // Check alignment with broader learning objectives
            const broadGoalKeywords = [
                'market', 'price', 'supply', 'demand', 'equilibrium', 'efficiency',
                'elasticity', 'analysis', 'decision', 'principles'
            ];

            // Each objective should contain at least one keyword from broader goals
            objectives.forEach(objective => {
                const hasRelevantKeyword = broadGoalKeywords.some(keyword =>
                    objective.learningObjective.toLowerCase().includes(keyword)
                );
                expect(hasRelevantKeyword).toBe(true);
            });

            // Objectives should not be too broad or vague
            objectives.forEach(objective => {
                // Should not contain vague terms
                expect(objective.learningObjective.toLowerCase()).not.toMatch(/\b(understand|learn|know|grasp|get|see)\b/);

                // Should be specific and measurable
                expect(objective.learningObjective).toMatch(/(identify|define|describe|explain|analyze|compare|differentiate|examine|apply|use|demonstrate|calculate|connect|relate|integrate|combine|assess|evaluate|judge|determine)/i);
            });
        });

        it.concurrent('should handle chunks with different complexity levels', { timeout: 30000 }, async () => {
            const mixedComplexityChunks = [
                // Simple chunk
                {
                    id: 'simple',
                    documentId: 'doc1',
                    content: 'Supply and demand are basic economic forces that determine market prices.',
                    startPosition: 0,
                    endPosition: 50,
                    metadata: { title: 'Basic Concepts', type: 'text' }
                },
                // Complex chunk
                {
                    id: 'complex',
                    documentId: 'doc1',
                    content: `
                        The price elasticity coefficient measures the percentage change in quantity demanded relative to the percentage change in price. Cross-price elasticity examines how the demand for one good responds to price changes in related goods, while income elasticity of demand measures how quantity demanded changes with income variations. These relationships help economists understand market interdependencies and consumer behavior patterns.
                    `,
                    startPosition: 51,
                    endPosition: 150,
                    metadata: { title: 'Advanced Concepts', type: 'text' }
                }
            ];

            const objectives = await dagCreator.extractSpecificLearningObjectives(mixedComplexityChunks, economicsSummary);

            const simpleChunkObjectives = objectives.filter(obj => obj.chunkIds.includes('simple'));
            const complexChunkObjectives = objectives.filter(obj => obj.chunkIds.includes('complex'));

            // Identify some simple objectives
            expect(simpleChunkObjectives.length).toBeLessThanOrEqual(2);

            // Identify some complex objectives
            expect(complexChunkObjectives.length).toBeGreaterThan(1);

        });

        it.concurrent('should strictly limit objectives to content explicitly covered in chunk', { timeout: 30000 }, async () => {
            // A chunk that mentions several concepts but only fully explains some of them
            const partialCoverageChunk = {
                id: 'partial',
                documentId: 'doc1',
                content: `
                    Market equilibrium is influenced by various factors including government policies and market structure. 
                    When the government imposes a price ceiling below the equilibrium price, it creates a shortage in the market. 
                    This happens because at the artificially low price, consumers want to buy more than producers are willing to supply.

                    Perfect competition and monopolistic markets respond differently to price controls, but we'll explore those 
                    market structures in detail later. For now, let's focus on how price ceilings affect the basic supply and 
                    demand model we've discussed.
                `,
                startPosition: 0,
                endPosition: 100,
                metadata: { title: 'Price Controls', type: 'text' }
            };

            const objectives = await dagCreator.extractSpecificLearningObjectives([partialCoverageChunk], economicsSummary);

            // Should only include objectives about price ceilings and their immediate effects
            const priceControlObjectives = objectives.filter(r => r.chunkIds.includes('partial'));

            // Verify we DON'T get objectives for merely mentioned concepts
            priceControlObjectives?.forEach(objective => {
                // Should not include objectives about market structures
                expect(objective.learningObjective.toLowerCase()).not.toMatch(/perfect competition|monopolistic|market structure/);
                // Should not include detailed policy analysis
                expect(objective.learningObjective.toLowerCase()).not.toMatch(/compare|evaluate|analyze.+policies/);
                // Should not include objectives requiring knowledge of other market types
                expect(objective.learningObjective.toLowerCase()).not.toMatch(/different market types|various markets/);
            });

            // Verify objectives are specific to what's actually explained
            priceControlObjectives?.forEach(objective => {
                // Should focus on the mechanism that is fully explained
                expect(objective.learningObjective).toMatch(/^(Identify|Define|Describe|Explain|Demonstrate)/);
                // Should be about price ceilings and their direct effects
                expect(objective.learningObjective.toLowerCase()).toMatch(/price ceiling|shortage|supply|demand|equilibrium/);
            });

            // Verify the number of objectives is reasonable for the content
            expect(priceControlObjectives?.length).toBeLessThanOrEqual(3);
        });
    });

    describe.concurrent('generateGroupedObjectives', () => {

        it.concurrent('should group similar objectives while maintaining metadata', { timeout: 30000 }, async () => {
            const objectives = [
                {
                    learningObjective: "Analyze how enzymes catalyze biochemical reactions in metabolic pathways",
                    chunkIds: ["chunk1"],
                    ids: ["1-1"],
                    allSubObjectives: ["sub1", "sub2"]
                },
                {
                    learningObjective: "Explain the catalytic mechanisms of enzymes in cellular metabolism",
                    chunkIds: ["chunk1", "chunk2"],
                    ids: ["1-2"],
                    allSubObjectives: ["sub3"]
                },
                {
                    learningObjective: "Describe the role of enzymes as biological catalysts in metabolic processes",
                    chunkIds: ["chunk2"],
                    ids: ["1-3"],
                    allSubObjectives: ["sub4", "sub5"]
                }
            ];

            const result = await dagCreator.generateGroupedObjectives(objectives);

            // Should group all enzyme-related objectives together
            expect(result.length).toBe(1);
            expect(result[0].group.length).toBe(3);

            // Representative objective should use appropriate action verb and be comprehensive
            expect(result[0].representative).toMatch(/^(Analyze|Evaluate|Explain|Describe)/);
            expect(result[0].representative.toLowerCase()).toContain('enzyme');
            expect(result[0].representative.toLowerCase()).toMatch(/metabolic|metabolism/);
        });

        it.concurrent('should create separate groups for distinct concepts', { timeout: 30000 }, async () => {
            const objectives = [
                {
                    learningObjective: "Analyze the role enzymes play in digestion",
                    chunkIds: ["chunk1"],
                    ids: ["1-1"],
                    allSubObjectives: ["sub1"]
                },
                {
                    learningObjective: "Explain which enzymes are involved in DNA replication",
                    chunkIds: ["chunk2"],
                    ids: ["1-2"],
                    allSubObjectives: ["sub2"]
                },
                {
                    learningObjective: "Identify the enzymes involved in DNA replication",
                    chunkIds: ["chunk2"],
                    ids: ["1-3"],
                    allSubObjectives: ["sub3"]
                }
            ];

            const result = await dagCreator.generateGroupedObjectives(objectives);

            // Should create two groups: one for enzymes, one for DNA replication
            expect(result.length).toBe(2);

            // Each group should have appropriate objectives
            const dnaGroup = result.find(g => g.representative.toLowerCase().includes('dna replication'));

            expect(dnaGroup?.group.length).toBe(2);
        });

        it.concurrent('should handle single unique objective', { timeout: 30000 }, async () => {
            const objectives = [
                {
                    learningObjective: "Analyze the unique properties of quantum entanglement",
                    chunkIds: ["chunk1"],
                    ids: ["1-1"],
                    allSubObjectives: ["sub1"]
                }
            ];

            const result = await dagCreator.generateGroupedObjectives(objectives);

            // Should create one group with one objective
            expect(result.length).toBe(1);
            expect(result[0].group.length).toBe(1);
            expect(result[0].group[0]).toBe(objectives[0].learningObjective);

            // Representative should be appropriate for a single objective
            expect(result[0].representative).toMatch(/^(Analyze|Evaluate|Explain|Describe)/);
            expect(result[0].representative.toLowerCase()).toContain('quantum');
            expect(result[0].representative.toLowerCase()).toContain('entanglement');
        });

        it.concurrent('should handle objectives with varying complexity levels', { timeout: 30000 }, async () => {
            const objectives = [
                {
                    learningObjective: "Define Newton's first law of motion",
                    chunkIds: ["chunk1"],
                    ids: ["1-1"],
                    allSubObjectives: ["sub1"]
                },
                {
                    learningObjective: "Explain how Newton's first law of motion works",
                    chunkIds: ["chunk1"],
                    ids: ["1-2"],
                    allSubObjectives: ["sub2"]
                },
                {
                    learningObjective: "Define Newton's second law of motion",
                    chunkIds: ["chunk1"],
                    ids: ["1-3"],
                    allSubObjectives: ["sub3"]
                }
            ];

            const result = await dagCreator.generateGroupedObjectives(objectives);

            expect(result.length).toBe(2);

            // First group should contain the two Newton's first law-related objectives
            expect(result[0].group.length).toBe(2);
            expect(result[0].group.some(o => o === objectives[0].learningObjective));
            expect(result[0].group.some(o => o === objectives[1].learningObjective));

            // Second group should contain the Newton's second law objective
            expect(result[1].group.length).toBe(1);
            expect(result[1].group.some(o => o === objectives[2].learningObjective));
        });

        it.concurrent('should not modify original objectives when grouping', { timeout: 30000 }, async () => {
            const objectives = [
                {
                    learningObjective: "Analyze database indexing strategies",
                    chunkIds: ["chunk1"],
                    ids: ["1-1"],
                    allSubObjectives: ["sub1"]
                },
                {
                    learningObjective: "Evaluate query optimization techniques",
                    chunkIds: ["chunk2"],
                    ids: ["1-2"],
                    allSubObjectives: ["sub2"]
                }
            ];

            const result = await dagCreator.generateGroupedObjectives(objectives);

            // Original objectives should appear exactly as provided in the groups
            result.forEach(group => {
                group.group.forEach(objective => {
                    expect(objectives.some(orig => orig.learningObjective === objective)).toBe(true);
                });
            });
        });

        it.concurrent('should handle empty input gracefully', { timeout: 30000 }, async () => {
            const result = await dagCreator.generateGroupedObjectives([]);
            expect(result).toEqual([]);
        });

        it.concurrent('should ensure all input objectives are assigned to groups', { timeout: 30000 }, async () => {
            const objectives = [
                {
                    learningObjective: "Analyze market equilibrium in perfect competition",
                    chunkIds: ["chunk1"],
                    ids: ["1-1"],
                    allSubObjectives: ["sub1"]
                },
                {
                    learningObjective: "Evaluate the effects of government intervention in markets",
                    chunkIds: ["chunk2"],
                    ids: ["1-2"],
                    allSubObjectives: ["sub2"]
                },
                {
                    learningObjective: "Explain how market forces determine equilibrium prices",
                    chunkIds: ["chunk1"],
                    ids: ["1-3"],
                    allSubObjectives: ["sub3"]
                }
            ];

            const result = await dagCreator.generateGroupedObjectives(objectives);

            // Get all objectives from all groups
            const assignedObjectives = result.flatMap(group => group.group);

            // Verify each input objective appears exactly once in the groups
            objectives.forEach(obj => {
                const occurrences = assignedObjectives.filter(assigned => assigned === obj.learningObjective).length;
                expect(occurrences).toBe(1);
            });

            // Verify no extra objectives were added
            expect(assignedObjectives.length).toBe(objectives.length);
        });
    });

    describe.concurrent('extractReferenceSentences', () => {
        const sampleContent = `
            The cell membrane is a biological barrier that separates the interior of a cell from the external environment. This semipermeable membrane controls what enters and exits the cell through various transport mechanisms. The phospholipid bilayer forms the basic structure of the membrane, with proteins embedded throughout. We will explore more about membrane transport in the next section. Active transport requires energy in the form of ATP to move molecules against their concentration gradient. This process allows cells to maintain optimal internal conditions. The sodium-potassium pump is a classic example of active transport, moving sodium out of the cell while bringing potassium in. Let's examine how this process works. Passive transport, including diffusion and osmosis, moves molecules from areas of high concentration to areas of low concentration without using energy. The rate of diffusion depends on factors such as temperature and concentration gradient. Simple diffusion and facilitated diffusion are two types of passive transport.
            Active transport requires energy in the form of ATP to move molecules against their concentration gradient. This process allows cells to maintain optimal internal conditions. The sodium-potassium pump is a classic example of active transport, moving sodium out of the cell while bringing potassium in. Let's examine how this process works.
            Passive transport, including diffusion and osmosis, moves molecules from areas of high concentration to areas of low concentration without using energy. The rate of diffusion depends on factors such as temperature and concentration gradient. Simple diffusion and facilitated diffusion are two types of passive transport.
        `;

        const sampleChunks = [{
            id: 'chunk1',
            documentId: 'doc1',
            content: sampleContent,
            startPosition: 0,
            endPosition: sampleContent.length,
            metadata: {
                title: 'Cell Transport',
                type: 'text'
            }
        }];

        const sampleObjective = {
            learningObjective: "Analyze how different transport mechanisms move molecules across the cell membrane",
            chunkIds: ['chunk1'],
            ids: ['1-1'],
            allSubObjectives: [
                "Explain the structure and function of the cell membrane",
                "Compare and contrast active and passive transport",
                "Describe specific examples of transport mechanisms"
            ]
        };

        it.concurrent('should extract sentences that directly support the learning objective', { timeout: 30000 }, async () => {
            const result = await dagCreator.extractReferenceSentences([sampleObjective], sampleChunks);
            expect(result[0]).toHaveProperty('referenceSentences');

            const referenceSentences = result[0].referenceSentences.map(ref => ref.sentence);

            // Should include fundamental structure and function
            expect(referenceSentences.includes(
                "The cell membrane is a biological barrier that separates the interior of a cell from the external environment."
            )).toBe(true);
            expect(referenceSentences.includes(
                "This semipermeable membrane controls what enters and exits the cell through various transport mechanisms."
            )).toBe(true);

            // Should include both active and passive transport
            expect(referenceSentences.includes(
                "Active transport requires energy in the form of ATP to move molecules against their concentration gradient."
            )).toBe(true);
            expect(referenceSentences.includes(
                "Passive transport, including diffusion and osmosis, moves molecules from areas of high concentration to areas of low concentration without using energy."
            )).toBe(true);
        });

        it.concurrent('should handle objectives with different cognitive levels', { timeout: 30000 }, async () => {
            const defineObjective = {
                learningObjective: "Define and describe the cell membrane structure",
                chunkIds: ['chunk1'],
                ids: ['1-2'],
                allSubObjectives: [
                    "Define what a cell membrane is",
                    "Describe the components of the cell membrane"
                ]
            };

            const analyzeObjective = {
                learningObjective: "Analyze the relationship between transport mechanisms and energy use",
                chunkIds: ['chunk1'],
                ids: ['1-3'],
                allSubObjectives: [
                    "Compare energy requirements in active vs passive transport",
                    "Analyze how cells maintain optimal conditions through transport"
                ]
            };

            const results = await dagCreator.extractReferenceSentences(
                [defineObjective, analyzeObjective],
                sampleChunks
            );
            const referenceSentences_0 = results[0].referenceSentences.map(ref => ref.sentence);
            const referenceSentences_1 = results[1].referenceSentences.map(ref => ref.sentence);

            // Define/describe level should focus on structural descriptions
            expect(referenceSentences_0.includes(
                "The phospholipid bilayer forms the basic structure of the membrane, with proteins embedded throughout."
            )).toBe(true);

            // Analyze level should include process and relationship descriptions
            expect(referenceSentences_1.includes(
                "Active transport requires energy in the form of ATP to move molecules against their concentration gradient."
            )).toBe(true);
        });

        it.concurrent('should exclude meta-references and navigation text', { timeout: 30000 }, async () => {
            const result = await dagCreator.extractReferenceSentences([sampleObjective], sampleChunks);
            const referenceSentences = result.flatMap(result => result.referenceSentences.map(ref => ref.sentence));

            // Should not include meta-references
            expect(referenceSentences.some(sentence => sentence.includes(
                "We will explore more about membrane transport in the next section."
            ))).toBe(false);

            // Should not include navigation text
            expect(referenceSentences.some(sentence => sentence.includes(
                "Let's examine how this process works."
            ))).toBe(false);
        });

        it.concurrent('should handle empty or whitespace content', { timeout: 30000 }, async () => {
            const emptyChunk = {
                id: 'empty1',
                documentId: 'doc1',
                content: "   \n   \t   ",
                startPosition: 0,
                endPosition: 10,
                metadata: {
                    title: 'Empty Content',
                    type: 'text'
                }
            };

            const result = await dagCreator.extractReferenceSentences(
                [sampleObjective],
                [emptyChunk]
            );
            expect(result[0]).toHaveProperty('referenceSentences');
            const referenceSentences = result.flatMap(result => result.referenceSentences.map(ref => ref.sentence));
            expect(referenceSentences).toHaveLength(0);
        });

        it.concurrent('should extract references that cover all sub-objectives', { timeout: 30000 }, async () => {
            const comprehensiveObjective = {
                learningObjective: "Explain the mechanisms of passive transport in cell membranes",
                chunkIds: ['chunk1'],
                ids: ['1-4'],
                allSubObjectives: [
                    "Define passive transport",
                    "Identify types of passive transport",
                    "Describe factors affecting diffusion rate"
                ]
            };

            const result = await dagCreator.extractReferenceSentences(
                [comprehensiveObjective],
                sampleChunks
            );

            // Should have sentences covering all sub-objectives
            const referencesSentences = result.flatMap(result => result.referenceSentences.map(ref => ref.sentence));

            // Definition
            expect(referencesSentences.some(s => s.includes("Passive transport, including diffusion and osmosis, moves molecules from areas of high concentration to areas of low concentration without using energy."))).toBe(true);
            expect(referencesSentences.some(s => s.includes("Simple diffusion and facilitated diffusion"))).toBe(true);
            expect(referencesSentences.some(s => s.includes("rate of diffusion depends on factors"))).toBe(true);
        });

        it.concurrent('should handle multiple chunks with related content', { timeout: 30000 }, async () => {
            const multiChunkContent = [
                {
                    id: 'chunk1',
                    documentId: 'doc1',
                    content: `Active transport is a crucial cellular process that moves molecules against their concentration gradient. This type of transport requires energy in the form of ATP. The sodium-potassium pump exemplifies active transport in cell membranes.`,
                    startPosition: 0,
                    endPosition: 200,
                    metadata: { title: 'Active Transport Basics', type: 'text' }
                },
                {
                    id: 'chunk2',
                    documentId: 'doc1',
                    content: `The sodium-potassium pump maintains crucial ion gradients across cell membranes. This pump moves sodium ions out of the cell while bringing potassium ions in, both against their concentration gradients. The energy for this process comes from ATP hydrolysis.`,
                    startPosition: 201,
                    endPosition: 400,
                    metadata: { title: 'Sodium-Potassium Pump', type: 'text' }
                }
            ];

            const objective = {
                learningObjective: "Analyze how the sodium-potassium pump exemplifies active transport",
                chunkIds: ['chunk1', 'chunk2'],
                ids: ['1-5'],
                allSubObjectives: [
                    "Explain the basic principle of active transport",
                    "Describe the specific function of the sodium-potassium pump",
                    "Connect ATP usage to ion movement"
                ]
            };

            const result = await dagCreator.extractReferenceSentences([objective], multiChunkContent);

            const sentences = result[0].referenceSentences.map(ref => ref.sentence);

            // Should include content about the sodium-potassium pump
            expect(sentences.some(s => 
                s.includes("sodium-potassium pump") && 
                s.includes("cell membrane")
            )).toBe(true);

            // Should include content about energy usage
            expect(sentences.some(s => 
                s.includes("energy") && 
                (s.includes("ATP") || s.includes("ATP hydrolysis"))
            )).toBe(true);

            // Should include content specifically from chunk2
            expect(sentences.some(s => 
                s.includes("sodium ions") && 
                s.includes("potassium ions")
            )).toBe(true);
        });

        it.concurrent('should extract exact matches from the text', { timeout: 30000 }, async () => {
            const textWithSpecialChars = `The cell membrane (also known as the plasma membrane) is a biological barrier!
                The membrane contains various proteins-including transport proteins!
                Some molecules, like H2O and CO2, can pass through easily; others cannot.
                This semi-permeable membrane controls what enters & exits the cell.`;

            const chunk = {
                id: 'chunk1',
                documentId: 'doc1',
                content: textWithSpecialChars,
                startPosition: 0,
                endPosition: textWithSpecialChars.length,
                metadata: { title: 'Cell Membrane', type: 'text' }
            };

            const objective = {
                learningObjective: "Describe the cell membrane's structure and function",
                chunkIds: ['chunk1'],
                ids: ['1-1'],
                allSubObjectives: ["Explain the basic structure of the cell membrane"]
            };

            const result = await dagCreator.extractReferenceSentences([objective], [chunk]);
            const referenceSentences = result.flatMap(result => result.referenceSentences.map(ref => ref.sentence));

            // Verify each returned reference is properly matched and formatted
            expect(referenceSentences.some(s => s.includes(
                "The cell membrane (also known as the plasma membrane) is a biological barrier!"
            ))).toBe(true);
            expect(referenceSentences.some(s => s.includes(
                "The membrane contains various proteins-including transport proteins!"
            ))).toBe(true);
        });

        it.concurrent('should handle text with Unicode and special characters', { timeout: 30000 }, async () => {
            const specialCharText = `
                The cell membrane's primary function is protection.
                Temperature (°C) affects membrane fluidity—higher temperatures increase fluidity.
                Na⁺/K⁺-ATPase pumps maintain ion gradients.
                The membrane's thickness ≈ 7–8 nm varies slightly.
                Scientists use electron microscopes (×100,000) to study membranes.
            `;

            const chunk = {
                id: 'special',
                documentId: 'doc1',
                content: specialCharText,
                startPosition: 0,
                endPosition: specialCharText.length,
                metadata: { title: 'Special Characters', type: 'text' }
            };

            const objective = {
                learningObjective: "Describe membrane characteristics",
                chunkIds: ['special'],
                ids: ['1-1'],
                allSubObjectives: ["Explain membrane properties"]
            };

            const result = await dagCreator.extractReferenceSentences([objective], [chunk]);

            console.log('result');
            console.dir(result, { depth: null });
            console.log('chunk');
            console.dir(chunk, { depth: null });

            // Verify special characters are preserved in exact matches
            for (const ref of result[0].referenceSentences) {
                // The exact sentence should be found in the source text
                expect(chunk.content.includes(ref.sentence)).toBe(true);
            }
        });
    });

    describe.concurrent('generateLessonGroups', () => {
        const createObjectiveWithReferences = (
            learningObjective: string,
            referenceSentences: string[],
            prerequisites: string[] = [],
            chunkIds: string[] = ['chunk1'],
            ids: string[] = ['1']
        ): LearningObjectiveWithPrerequisites => ({
            learningObjective,
            referenceSentences: referenceSentences.map(sentence => ({
                sentence,
                isExactMatch: true,
                sourceChunkId: chunkIds[0],
                sourceDocumentId: 'doc1'
            })),
            prerequisites,
            chunkIds,
            ids,
            allSubObjectives: []
        });

        // Helper function to verify that all objectives are preserved
        const verifyObjectivesPreserved = (
            originalObjectives: LearningObjectiveWithPrerequisites[],
            lessons: LessonGroup[]
        ) => {
            // Get all original objective strings
            const originalObjectiveStrings = new Set(originalObjectives.map(o => o.learningObjective));

            // Get all lesson objective strings
            const lessonObjectiveStrings = new Set(lessons.flatMap(l => l.cluster.map(o => o.learningObjective)));

            // Verify no objectives were dropped
            expect(lessonObjectiveStrings.size).toBe(originalObjectiveStrings.size);
            originalObjectiveStrings.forEach(obj => {
                expect(lessonObjectiveStrings.has(obj)).toBe(true);
            });

            // Verify no objectives appear in multiple lessons
            const objectiveCounts = new Map<string, number>();
            lessons.forEach(lesson => {
                lesson.cluster.forEach(obj => {
                    objectiveCounts.set(obj.learningObjective, (objectiveCounts.get(obj.learningObjective) || 0) + 1);
                });
            });
            objectiveCounts.forEach((count, obj) => {
                expect(count).toBe(1);
            });
        };

        it.concurrent('should group objectives with reference sentences into lessons', { timeout: 30000 }, async () => {
            const objectives = [
                createObjectiveWithReferences(
                    'Define variables and data types in JavaScript',
                    ['Variables in JavaScript are named containers that store data in a program. JavaScript data types include strings, numbers, and booleans.'],
                    [],
                    ['chunk1'],
                    ['1']
                ),
                createObjectiveWithReferences(
                    'Explain variable declaration and type assignment in JavaScript',
                    ['JavaScript variables can be declared using let, const, or var keywords. JavaScript automatically assigns appropriate data types to variables when values are assigned.'],
                    ['Define variables and data types in JavaScript'],
                    ['chunk1'],
                    ['2']
                ),
                createObjectiveWithReferences(
                    'Write control flow structures',
                    ['Control flow structures like loops and conditionals determine program execution order.'],
                    [],
                    ['chunk2'],
                    ['3']
                )
            ];

            const documentToDag = new DocumentToDag(ai);
            const result = await documentToDag.generateLessonGroups(objectives);

            // Verify all objectives are preserved
            verifyObjectivesPreserved(objectives, result);

            // Find lessons containing our test objectives
            const variablesLesson = result.find(l =>
                l.cluster.some(o => o.learningObjective === 'Define variables and data types in JavaScript')
            );
            const variableDeclarationLesson = result.find(l =>
                l.cluster.some(o => o.learningObjective === 'Explain variable declaration and type assignment in JavaScript')
            );
            const controlFlowLesson = result.find(l =>
                l.cluster.some(o => o.learningObjective === 'Write control flow structures')
            );

            // Verify lessons were found
            expect(variablesLesson).toBeDefined();
            expect(variableDeclarationLesson).toBeDefined();
            expect(controlFlowLesson).toBeDefined();

            // Verify related objectives are grouped together
            expect(variablesLesson).toBe(variableDeclarationLesson);
            expect(controlFlowLesson).not.toBe(variablesLesson);

            // Verify lesson names reflect their content
            expect(variablesLesson!.lessonName.toLowerCase()).toMatch(/variable|javascript|data type/);
            expect(controlFlowLesson!.lessonName.toLowerCase()).toMatch(/control|flow|structure/);

            // Verify durations are reasonable
            expect(variablesLesson!.expectedDurationMinutes).toBeGreaterThanOrEqual(2);
            expect(variablesLesson!.expectedDurationMinutes).toBeLessThanOrEqual(45);
            expect(controlFlowLesson!.expectedDurationMinutes).toBeGreaterThanOrEqual(2);
            expect(controlFlowLesson!.expectedDurationMinutes).toBeLessThanOrEqual(45);
        });

        it.concurrent('should preserve all objectives when splitting into multiple lessons', { timeout: 30000 }, async () => {
            const objectives = [
                createObjectiveWithReferences(
                    'Define functions and parameters',
                    ['Functions are reusable blocks of code that can accept parameters and return values.'],
                    [],
                    ['chunk1'],
                    ['1']
                ),
                createObjectiveWithReferences(
                    'Implement function overloading',
                    ['Function overloading allows multiple functions with the same name but different parameter types.'],
                    ['Define functions and parameters'],
                    ['chunk1'],
                    ['2']
                ),
                createObjectiveWithReferences(
                    'Create recursive functions',
                    ['Recursive functions are functions that call themselves to solve problems.'],
                    ['Define functions and parameters'],
                    ['chunk2'],
                    ['3']
                ),
                createObjectiveWithReferences(
                    'Optimize recursive algorithms',
                    ['Optimization techniques like memoization improve recursive function performance.'],
                    ['Create recursive functions'],
                    ['chunk2'],
                    ['4']
                )
            ];

            const documentToDag = new DocumentToDag(ai);
            const result = await documentToDag.generateLessonGroups(objectives);

            // Verify all objectives are preserved
            verifyObjectivesPreserved(objectives, result);

            // Verify reasonable splitting
            expect(result.length).toBeGreaterThanOrEqual(1);
            expect(result.length).toBeLessThanOrEqual(objectives.length);

            // Verify each lesson has reasonable duration
            result.forEach(lesson => {
                expect(lesson.expectedDurationMinutes).toBeGreaterThanOrEqual(2);
                expect(lesson.expectedDurationMinutes).toBeLessThanOrEqual(45);
            });
        });

        it.concurrent('should respect duration constraints and topic relationships', { timeout: 30000 }, async () => {
            const objectives = Array(10).fill(null).map((_, i) => {
                const topics = [
                    'Define object-oriented concepts',
                    'Create classes and objects',
                    'Implement inheritance',
                    'Apply polymorphism',
                    'Design interfaces',
                    'Handle exceptions',
                    'Manage memory allocation',
                    'Optimize garbage collection',
                    'Implement multithreading',
                    'Design concurrent algorithms'
                ];
                return createObjectiveWithReferences(
                    topics[i],
                    [`Reference sentence for ${topics[i]}`],
                    i > 0 ? [topics[i - 1]] : []
                );
            });

            const result = await dagCreator.generateLessonGroups(objectives);

            // Verify lessons don't exceed maximum duration
            result.forEach(lesson => {
                expect(lesson.expectedDurationMinutes).toBeLessThanOrEqual(45);
            });
        });

        it.concurrent('should handle empty or minimal input appropriately', { timeout: 30000 }, async () => {
            const result = await dagCreator.generateLessonGroups([]);
            expect(result).toEqual([]);

            const singleObjective = [
                createObjectiveWithReferences(
                    'Write a basic program',
                    ['A program is a sequence of instructions that tells a computer what to do.']
                )
            ];
            const singleResult = await dagCreator.generateLessonGroups(singleObjective);
            expect(singleResult.length).toBe(1);
            expect(singleResult[0].cluster.length).toBe(1);
        });

        it.concurrent('should maintain reference sentences in output', { timeout: 30000 }, async () => {
            const objectives = [
                createObjectiveWithReferences(
                    'Define arrays and lists',
                    ['Arrays are fixed-size collections of elements.', 'Lists are dynamic collections that can grow or shrink.']
                ),
                createObjectiveWithReferences(
                    'Implement array operations',
                    ['Array operations include accessing, inserting, and deleting elements.', 'Array indices start at zero in most programming languages.']
                )
            ];

            const result = await dagCreator.generateLessonGroups(objectives);

            result.forEach(lesson => {
                lesson.cluster.forEach(objective => {
                    const originalObjective = objectives.find(
                        obj => obj.learningObjective === objective.learningObjective
                    );
                    expect(objective.referenceSentences).toEqual(originalObjective?.referenceSentences);
                });
            });
        });
    });

    describe.concurrent('findPrerequisites', () => {
        const sampleContent = `
            Chemical reactions are processes where reactants transform into products through the breaking and forming of chemical bonds. The rate of these reactions depends on factors such as temperature, concentration, and the presence of catalysts.

            Reaction mechanisms describe the step-by-step sequence of elementary reactions that lead to the final products. Each elementary step shows how molecules collide, which bonds break, and which new bonds form. Understanding these mechanisms is crucial for predicting reaction outcomes and optimizing conditions.

            Catalysis in chemical reactions involves the use of substances that increase reaction rates without being consumed. Catalysts work by providing alternative reaction pathways with lower activation energy barriers. Enzymes are biological catalysts that can increase reaction rates by millions of times.

            Advanced reaction kinetics involves analyzing complex reaction networks and their energy profiles. This includes studying transition states, intermediate species, and rate-determining steps. Understanding these aspects allows chemists to control reaction selectivity and yield.
        `;

        const sampleChunks = [{
            id: 'chunk1',
            documentId: 'doc1',
            content: sampleContent,
            startPosition: 0,
            endPosition: sampleContent.length,
            metadata: {}
        }];

        const sampleLessonGroups: LessonGroup[] = [
            {
                lessonName: "Fundamental concepts of chemical reactions and bond changes",
                cluster: [
                    {
                        learningObjective: "Define fundamental concepts of chemical reactions and bond changes",
                        chunkIds: ['chunk1'],
                        ids: ['1-1'],
                        allSubObjectives: [
                            "Identify the components of a chemical reaction",
                            "List factors affecting reaction rates"
                        ],
                        referenceSentences: [
                            {
                                sentence: "Chemical reactions are processes where reactants transform into products through the breaking and forming of chemical bonds.",
                                isExactMatch: true,
                                sourceChunkId: 'chunk1',
                                sourceDocumentId: 'doc1'
                            },
                            {
                                sentence: "The rate of these reactions depends on factors such as temperature, concentration, and the presence of catalysts.",
                                isExactMatch: true,
                                sourceChunkId: 'chunk1',
                                sourceDocumentId: 'doc1'
                            }
                        ]
                    }
                ],
                chunkIds: ['chunk1'],
                expectedDurationMinutes: 30
            },
            {
                lessonName: "Reaction mechanisms and elementary steps",
                cluster: [
                    {
                        learningObjective: "Describe reaction mechanisms and elementary steps",
                        chunkIds: ['chunk1'],
                        ids: ['1-2'],
                        allSubObjectives: [
                            "Explain what reaction mechanisms are",
                            "Identify the components of elementary steps",
                            "Describe how molecular collisions lead to reactions"
                        ],
                        referenceSentences: [
                            {
                                sentence: "Reaction mechanisms describe the step-by-step sequence of elementary reactions that lead to the final products.",
                                isExactMatch: true,
                                sourceChunkId: 'chunk1',
                                sourceDocumentId: 'doc1'
                            },
                            {
                                sentence: "Each elementary step shows how molecules collide, which bonds break, and which new bonds form.",
                                isExactMatch: true,
                                sourceChunkId: 'chunk1',
                                sourceDocumentId: 'doc1'
                            }
                        ]
                    }
                ],
                chunkIds: ['chunk1'],
                expectedDurationMinutes: 30
            },
            {
                lessonName: "Catalysts and reaction rates",
                cluster: [
                    {
                        learningObjective: "Explain how catalysts affect chemical reaction rates and pathways",
                        chunkIds: ['chunk1'],
                        ids: ['1-3'],
                        allSubObjectives: [
                            "Define catalysis in chemical reactions",
                            "Explain how catalysts lower activation energy",
                            "Compare enzymatic and non-enzymatic catalysis"
                        ],
                        referenceSentences: [
                            {
                                sentence: "Catalysis in chemical reactions involves the use of substances that increase reaction rates without being consumed.",
                                isExactMatch: true,
                                sourceChunkId: 'chunk1',
                                sourceDocumentId: 'doc1'
                            },
                            {
                                sentence: "Catalysts work by providing alternative reaction pathways with lower activation energy barriers.",
                                isExactMatch: true,
                                sourceChunkId: 'chunk1',
                                sourceDocumentId: 'doc1'
                            },
                            {
                                sentence: "Enzymes are biological catalysts that can increase reaction rates by millions of times.",
                                isExactMatch: true,
                                sourceChunkId: 'chunk1',
                                sourceDocumentId: 'doc1'
                            }
                        ]
                    }
                ],
                chunkIds: ['chunk1'],
                expectedDurationMinutes: 30
            },
            {
                lessonName: "Reaction kinetics and energy profiles",
                cluster: [
                    {
                        learningObjective: "Analyze reaction kinetics and energy profiles in complex reactions",
                        chunkIds: ['chunk1'],
                        ids: ['1-4'],
                        allSubObjectives: [
                            "Analyze transition states in reaction mechanisms",
                            "Evaluate rate-determining steps",
                            "Assess the role of intermediate species"
                        ],
                        referenceSentences: [
                            {
                                sentence: "Advanced reaction kinetics involves analyzing complex reaction networks and their energy profiles.",
                                isExactMatch: true,
                                sourceChunkId: 'chunk1',
                                sourceDocumentId: 'doc1'
                            },
                            {
                                sentence: "This includes studying transition states, intermediate species, and rate-determining steps.",
                                isExactMatch: true,
                                sourceChunkId: 'chunk1',
                                sourceDocumentId: 'doc1'
                            }
                        ]
                    }
                ],
                chunkIds: ['chunk1'],
                expectedDurationMinutes: 30
            },
            {
                lessonName: "Optimizing reaction conditions and selectivity",
                cluster: [
                    {
                        learningObjective: "Evaluate methods to optimize reaction conditions and control selectivity",
                        chunkIds: ['chunk1'],
                        ids: ['1-5'],
                        allSubObjectives: [
                            "Evaluate strategies for improving reaction yield",
                            "Design optimal reaction conditions",
                            "Develop methods to control reaction selectivity"
                        ],
                        referenceSentences: [
                            {
                                sentence: "Understanding these aspects allows chemists to control reaction selectivity and yield.",
                                isExactMatch: true,
                                sourceChunkId: 'chunk1',
                                sourceDocumentId: 'doc1'
                            }
                        ]
                    }
                ],
                chunkIds: ['chunk1'],
                expectedDurationMinutes: 30
            }
        ];

        let result: LessonGroupWithPrerequisites[];

        beforeAll(async () => {
            result = await dagCreator.findPrerequisites(sampleLessonGroups, sampleChunks);
        });

        it.concurrent('should identify direct prerequisites based on cognitive level hierarchy', { timeout: 30000 }, () => {
            const ReactionKineticsLesson = result.find(obj => obj.lessonName.startsWith('Reaction kinetics and energy profiles'));
            expect(ReactionKineticsLesson?.prerequisites).toContain("Fundamental concepts of chemical reactions and bond changes");
            expect(ReactionKineticsLesson?.prerequisites).toContain("Catalysts and reaction rates");
        });

        it.concurrent('should handle multiple direct prerequisites', { timeout: 30000 }, () => {
            // Advanced topics should require understanding of multiple prerequisites
            const OptimizingReactionConditionsLesson = result.find(obj => obj.lessonName.startsWith('Optimizing reaction conditions and selectivity'));
            expect(OptimizingReactionConditionsLesson?.prerequisites).toContain("Reaction mechanisms and elementary steps");
            expect(OptimizingReactionConditionsLesson?.prerequisites?.length).toBeGreaterThan(1);
        });

        it.concurrent('should respect cognitive level progression', { timeout: 30000 }, () => {
            // "Evaluate" (highest) should depend on "Analyze" (high) which depends on "Explain" (medium) which depends on "Define" (basic)
            const OptimizingReactionConditionsLesson = result.find(obj => obj.lessonName.startsWith('Optimizing reaction conditions and selectivity'));
            const ReactionMechanismsLesson = result.find(obj => obj.lessonName.startsWith('Reaction mechanisms and elementary steps'));
            const CatalystsLesson = result.find(obj => obj.lessonName.startsWith('Catalysts and reaction rates'));

            expect(OptimizingReactionConditionsLesson?.prerequisites).toContain("Reaction mechanisms and elementary steps");
            expect(ReactionMechanismsLesson?.prerequisites).toContain("Fundamental concepts of chemical reactions and bond changes");
            expect(CatalystsLesson?.prerequisites).toContain("Fundamental concepts of chemical reactions and bond changes");
        });

        it.concurrent('should prevent cyclic dependencies', { timeout: 30000 }, () => {
            // If A depends on B, B should not depend on A
            const ReactionKineticsLesson = result.find(obj => obj.lessonName.startsWith('Reaction kinetics and energy profiles'));
            const CatalystsLesson = result.find(obj => obj.lessonName.startsWith('Catalysts and reaction rates'));

            expect(ReactionKineticsLesson?.prerequisites).toContain("Catalysts and reaction rates");
            expect(CatalystsLesson?.prerequisites).not.toContain("Reaction kinetics and energy profiles");
        });

        it.concurrent('should handle lessons with varying complexity levels', { timeout: 30000 }, async () => {
            const mixedLessonGroups: LessonGroup[] = [
                {
                    lessonName: "Fundamental concepts of chemical reactions and bond changes",
                    cluster: [
                        {
                            learningObjective: "Define fundamental concepts of chemical reactions and bond changes",
                            chunkIds: ['chunk1'],
                            ids: ['2-1'],
                            allSubObjectives: [
                                "Identify basic reaction components",
                                "List types of chemical bonds involved in reactions"
                            ],
                            referenceSentences: [
                                {
                                    sentence: "Chemical reactions involve the breaking and forming of bonds between atoms, resulting in the transformation of reactants into products.",
                                    isExactMatch: true,
                                    sourceChunkId: 'chunk1',
                                    sourceDocumentId: 'doc1'
                                }
                            ]
                        }
                    ],
                    chunkIds: ['chunk1'],
                    expectedDurationMinutes: 30
                },
                {
                    lessonName: "Reaction kinetics and energy profiles",
                    cluster: [
                        {
                            learningObjective: "Analyze reaction kinetics and energy profiles in complex reactions",
                            chunkIds: ['chunk1'],
                            ids: ['2-2'],
                            allSubObjectives: [
                                "Analyze reaction rate patterns",
                                "Compare energy profiles of different reactions"
                            ],
                            referenceSentences: [
                                {
                                    sentence: "The rate of a chemical reaction depends on factors such as temperature, concentration, and the presence of catalysts.",
                                    isExactMatch: true,
                                    sourceChunkId: 'chunk1',
                                    sourceDocumentId: 'doc1'
                                }
                            ]
                        },
                    ],
                    chunkIds: ['chunk1'],
                    expectedDurationMinutes: 30
                },
                {
                    lessonName: "Optimizing reaction conditions and selectivity",
                    cluster: [
                        {
                            learningObjective: "Evaluate methods to optimize reaction conditions and control selectivity",
                            chunkIds: ['chunk1'],
                            ids: ['2-3'],
                            allSubObjectives: [
                                "Design optimization strategies for reaction conditions",
                                "Assess methods for controlling reaction selectivity"
                            ],
                            referenceSentences: [
                                {
                                    sentence: "Advanced reaction control involves techniques like temperature regulation, catalyst selection, and precise concentration management to achieve desired products.",
                                    isExactMatch: true,
                                    sourceChunkId: 'chunk1',
                                    sourceDocumentId: 'doc1'
                                }
                            ]
                        }
                    ],
                    chunkIds: ['chunk1'],
                    expectedDurationMinutes: 30
                }
            ];

            const complexityResult = await dagCreator.findPrerequisites(mixedLessonGroups, sampleChunks);

            // Higher-level objectives should depend on lower-level ones
            const OptimizingReactionConditionsLesson = complexityResult.find(obj => obj.lessonName.startsWith('Optimizing reaction conditions and selectivity'));
            const ReactionKineticsLesson = complexityResult.find(obj => obj.lessonName.startsWith('Reaction kinetics and energy profiles'));

            expect(OptimizingReactionConditionsLesson?.prerequisites).toContain("Reaction kinetics and energy profiles");
            expect(ReactionKineticsLesson?.prerequisites).toContain("Fundamental concepts of chemical reactions and bond changes");
        });

        it.concurrent('should handle empty or invalid content gracefully', { timeout: 30000 }, async () => {
            const emptyChunk = [{
                id: 'empty1',
                documentId: 'doc1',
                content: "   \n   \t   ",
                startPosition: 0,
                endPosition: 10,
                metadata: {}
            }];

            const result = await dagCreator.findPrerequisites(sampleLessonGroups, emptyChunk);

            // Should still maintain the structure but with empty prerequisites
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            result.forEach(obj => {
                expect(obj).toHaveProperty('lessonName');
                expect(obj).toHaveProperty('prerequisites');
                expect(Array.isArray(obj.prerequisites)).toBe(true);
            });
        });
    });

    describe.concurrent('removeCyclicDependencies', () => {
        // Helper function to create test objects
        const createObject = (id: string, prerequisites: string[] = []) => ({
            object: id,
            prerequisites
        });

        // Helper function to create test lesson groups
        const createLessonGroup = (id: string, prerequisites: string[] = []) => ({
            lessonName: id,
            cluster: [
                {
                    learningObjective: id,
                    chunkIds: ['chunk1'],
                    ids: ['1'],
                    allSubObjectives: [],
                    referenceSentences: [],
                }
            ],
            chunkIds: ['chunk1'],
            expectedDurationMinutes: 30,
            prerequisites
        });

        // Test suite for cycle detection utilities
        describe.concurrent('cycle detection utilities', () => {
            it.concurrent('findCycles should detect all types of cycles', { timeout: 15000 }, () => {
                const objects = [
                    // Simple cycle: A -> B -> C -> A
                    createObject("A", ["B"]),
                    createObject("B", ["C"]),
                    createObject("C", ["A"]),

                    // Self cycle: D -> D
                    createObject("D", ["D"]),

                    // No cycle: E -> F -> G
                    createObject("E", ["F"]),
                    createObject("F", ["G"]),
                    createObject("G", []),

                    // Complex cycle: H -> I -> J -> H, I -> K -> I
                    createObject("H", ["I"]),
                    createObject("I", ["J", "K"]),
                    createObject("J", ["H"]),
                    createObject("K", ["I"])
                ];

                const cycles = findCycles(objects);

                // Should find all cycles
                expect(cycles).toHaveLength(4);

                // Simple cycle
                expect(cycles).toContainEqual(["A", "B", "C", "A"]);

                // Self cycle
                expect(cycles).toContainEqual(["D", "D"]);

                // Complex cycles
                expect(cycles).toContainEqual(["I", "K", "I"]);
                expect(cycles).toContainEqual(["H", "I", "J", "H"]);
            });

            it.concurrent('hasSelfDependency should detect self-referential cycles', { timeout: 15000 }, () => {
                const selfDependent = createObject("A", ["A"]);
                const nonSelfDependent = createObject("B", ["C"]);

                expect(hasSelfDependency(selfDependent)).toBe(true);
                expect(hasSelfDependency(nonSelfDependent)).toBe(false);
            });

            it.concurrent('hasCycles should detect presence of any cycles', { timeout: 15000 }, () => {
                const cyclicObjects = [
                    createObject("A", ["B"]),
                    createObject("B", ["A"])
                ];

                const acyclicObjects = [
                    createObject("A", ["B"]),
                    createObject("B", ["C"]),
                    createObject("C", [])
                ];

                expect(hasCycles(cyclicObjects)).toBe(true);
                expect(hasCycles(acyclicObjects)).toBe(false);
            });

            it.concurrent('findCycles should handle empty or invalid input', { timeout: 15000 }, () => {
                expect(findCycles([])).toEqual([]);

                const invalidObjects = [
                    createObject("A", ["B"]) // B doesn't exist
                ];

                // Should not throw and should handle missing prerequisites gracefully
                expect(() => findCycles(invalidObjects)).not.toThrow();
            });
        });

        // Now actually test the removeCyclicDependencies function
        it.concurrent('should remove self-dependencies', { timeout: 15000 }, async () => {
            const lessonGroups = [
                createLessonGroup('Define acid-base equilibrium', ['Define acid-base equilibrium', 'Calculate pH values']), // Self-dependency
                createLessonGroup('Calculate pH values', ['Calculate pH values']), // Self-dependency
                createLessonGroup('Design buffer solutions', ['Define acid-base equilibrium'])
            ];

            const chunks = [
                { id: 'chunk_Define acid-base equilibrium', content: 'Content about acid-base equilibrium', documentId: '1', startPosition: 0, endPosition: 100 },
                { id: 'chunk_Calculate pH values', content: 'Content about pH calculations', documentId: '1', startPosition: 100, endPosition: 200 },
                { id: 'chunk_Design buffer solutions', content: 'Content about buffer design', documentId: '1', startPosition: 200, endPosition: 300 }
            ];

            const result = await dagCreator.removeCyclicDependencies(lessonGroups, chunks);

            // Check that self-dependencies are removed
            expect(result.find(o => o.lessonName === 'Define acid-base equilibrium')?.prerequisites).not.toContain('Define acid-base equilibrium');
            expect(result.find(o => o.lessonName === 'Calculate pH values')?.prerequisites).not.toContain('Calculate pH values');
            // Check that valid dependencies remain
            expect(result.find(o => o.lessonName === 'Define acid-base equilibrium')?.prerequisites).toContain('Calculate pH values');
            expect(result.find(o => o.lessonName === 'Design buffer solutions')?.prerequisites).toContain('Define acid-base equilibrium');

            // Verify no cycles remain using our utility
            expect(hasCycles(result.map(lg => ({ object: lg.lessonName, prerequisites: lg.prerequisites })))).toBe(false);
        });

        it.concurrent('should detect and handle simple cycles', { timeout: 15000 }, async () => {
            const lessonGroups = [
                createLessonGroup('Define acid-base equilibrium', ['Calculate pH values']),
                createLessonGroup('Calculate pH values', ['Design buffer solutions']),
                createLessonGroup('Design buffer solutions', ['Define acid-base equilibrium'])
            ];

            const chunks = [
                { id: 'chunk_Define acid-base equilibrium', content: 'Content about acid-base equilibrium', documentId: '1', startPosition: 0, endPosition: 100 },
                { id: 'chunk_Calculate pH values', content: 'Content about pH calculations', documentId: '1', startPosition: 100, endPosition: 200 },
                { id: 'chunk_Design buffer solutions', content: 'Content about buffer design', documentId: '1', startPosition: 200, endPosition: 300 }
            ];

            // Verify initial cycle exists
            const initialCycles = findCycles(lessonGroups.map(lg => ({ object: lg.lessonName, prerequisites: lg.prerequisites })));
            expect(initialCycles.length).toBe(1);

            const result = await dagCreator.removeCyclicDependencies(lessonGroups, chunks);
            // Verify no cycles remain
            expect(findCycles(result.map(lg => ({ object: lg.lessonName, prerequisites: lg.prerequisites })))).toHaveLength(0);

            // Check that we haven't lost all edges - at least one prerequisite should remain
            const totalPrereqs = result.reduce((sum, obj) => sum + obj.prerequisites.length, 0);
            expect(totalPrereqs).toBeGreaterThan(0);

            // Verify that each node still exists
            expect(result.length).toBe(lessonGroups.length);
        });

        it.concurrent('should handle multiple independent cycles', { timeout: 15000 }, async () => {
            const lessonGroups = [
                // First cycle
                createLessonGroup('Define chemical equilibrium', ['Calculate equilibrium constants']),
                createLessonGroup('Calculate equilibrium constants', ['Define chemical equilibrium']),
                // Second cycle
                createLessonGroup('Explain reaction mechanisms', ['Analyze reaction intermediates']),
                createLessonGroup('Analyze reaction intermediates', ['Evaluate activation energy']),
                createLessonGroup('Evaluate activation energy', ['Explain reaction mechanisms']),
                // Independent node
                createLessonGroup('Apply Le Chatelier\'s principle', ['Define chemical equilibrium'])
            ];

            const chunks = lessonGroups.map(lg => ({
                id: `chunk_${lg.lessonName}`,
                content: `Content ${lg.lessonName}`,
                documentId: '1',
                startPosition: 0,
                endPosition: 100
            }));

            // Verify initial cycles exist
            const initialCycles = findCycles(lessonGroups.map(lg => ({ object: lg.lessonName, prerequisites: lg.prerequisites })));
            expect(initialCycles.length).toBe(2);

            const result = await dagCreator.removeCyclicDependencies(lessonGroups, chunks);

            // Verify no cycles remain
            expect(hasCycles(result.map(lg => ({ object: lg.lessonName, prerequisites: lg.prerequisites })))).toBe(false);

            // Verify that independent dependencies are preserved
            expect(result.find(o => o.lessonName === 'Apply Le Chatelier\'s principle')?.prerequisites).toContain('Define chemical equilibrium');
        });

        it.concurrent('should preserve non-cyclic dependencies', { timeout: 15000 }, async () => {
            const lessonGroups = [
                createLessonGroup('Analyze reaction kinetics', ['Calculate rate constants', 'Define collision theory']), // Has both cyclic and non-cyclic dependencies
                createLessonGroup('Calculate rate constants', ['Analyze reaction kinetics']), // Forms cycle with A
                createLessonGroup('Define collision theory', ['Explain molecular motion']), // Non-cyclic dependency
                createLessonGroup('Explain molecular motion', [])
            ];

            const chunks = lessonGroups.map(lg => ({
                id: `chunk_${lg.lessonName}`,
                content: `Content ${lg.lessonName}`,
                documentId: '1',
                startPosition: 0,
                endPosition: 100
            }));

            // Verify initial cycle exists
            const initialCycles = findCycles(lessonGroups.map(lg => ({ object: lg.lessonName, prerequisites: lg.prerequisites })));
            expect(initialCycles.length).toBe(1);
            expect(initialCycles[0]).toContain('Analyze reaction kinetics');
            expect(initialCycles[0]).toContain('Calculate rate constants');

            const result = await dagCreator.removeCyclicDependencies(lessonGroups, chunks);

            // Verify no cycles remain
            expect(hasCycles(result.map(lg => ({ object: lg.lessonName, prerequisites: lg.prerequisites })))).toBe(false);

            // Verify C->D dependency is preserved
            expect(result.find(o => o.lessonName === 'Define collision theory')?.prerequisites).toContain('Explain molecular motion');

            // Verify A->C dependency is preserved
            expect(result.find(o => o.lessonName === 'Analyze reaction kinetics')?.prerequisites).toContain('Define collision theory');
        });

        it.concurrent('should resolve chemistry concept dependencies correctly', { timeout: 15000 }, async () => {
            const objectives = [
                // Basic atomic structure concepts
                createLessonGroup(
                    "Define and describe the fundamental particles of an atom (protons, neutrons, electrons)",
                    []
                ),
                createLessonGroup(
                    "Explain electron configuration and orbital theory",
                    ["Define and describe the fundamental particles of an atom (protons, neutrons, electrons)"]
                ),

                // Chemical bonding concepts with cyclic dependencies to fix
                createLessonGroup(
                    "Explain how atomic structure influences chemical bonding",
                    [
                        "Explain electron configuration and orbital theory",
                        "Describe different types of chemical bonds", // This creates a cycle
                        "Define and describe the fundamental particles of an atom (protons, neutrons, electrons)"
                    ]
                ),
                createLessonGroup(
                    "Describe different types of chemical bonds",
                    [
                        "Explain how atomic structure influences chemical bonding", // This creates a cycle
                        "Explain electron configuration and orbital theory"
                    ]
                ),

                // Advanced concepts that depend on bonding
                createLessonGroup(
                    "Analyze how bond types affect chemical reactions",
                    [
                        "Describe different types of chemical bonds",
                        "Explain how atomic structure influences chemical bonding"
                    ]
                )
            ];

            const chunks = [
                {
                    id: 'chunk_atomic',
                    content: `
                        Atoms are the fundamental building blocks of matter, composed of protons, neutrons, and electrons.
                        Protons and neutrons are found in the nucleus, while electrons orbit in shells around the nucleus.
                        The number of protons determines the atomic number and element identity.
                    `,
                    documentId: '1',
                    startPosition: 0,
                    endPosition: 200
                },
                {
                    id: 'chunk_orbitals',
                    content: `
                        Electron configuration describes how electrons are arranged in atomic orbitals.
                        The arrangement of electrons follows the Aufbau principle, Pauli exclusion principle,
                        and Hund's rule. Understanding electron configuration is crucial for predicting chemical bonding.
                    `,
                    documentId: '1',
                    startPosition: 201,
                    endPosition: 400
                },
                {
                    id: 'chunk_bonding',
                    content: `
                        Chemical bonding occurs when atoms share or transfer electrons. The type of bond formed
                        depends on the electron configurations of the participating atoms. Common types include
                        ionic bonds, where electrons are transferred, and covalent bonds, where electrons are shared.
                    `,
                    documentId: '1',
                    startPosition: 401,
                    endPosition: 600
                },
                {
                    id: 'chunk_reactions',
                    content: `
                        Chemical reactions involve the breaking and forming of chemical bonds. The type of bond
                        affects the energy required for the reaction and the properties of the products formed.
                        Understanding bond types helps predict reaction mechanisms and outcomes.
                    `,
                    documentId: '1',
                    startPosition: 601,
                    endPosition: 800
                }
            ];

            const result = await dagCreator.removeCyclicDependencies(objectives, chunks);

            // Verify fundamental concepts have no prerequisites
            expect(result.find(o =>
                o.lessonName === "Define and describe the fundamental particles of an atom (protons, neutrons, electrons)"
            )?.prerequisites).toHaveLength(0);

            // Verify electron configuration depends on atomic structure
            const electronConfig = result.find(o =>
                o.lessonName === "Explain electron configuration and orbital theory"
            );
            expect(electronConfig?.prerequisites).toContain(
                "Define and describe the fundamental particles of an atom (protons, neutrons, electrons)"
            );

            // Verify the cyclic dependency between bonding concepts is resolved
            const bondingInfluence = result.find(o =>
                o.lessonName === "Explain how atomic structure influences chemical bonding"
            );
            const bondTypes = result.find(o =>
                o.lessonName === "Describe different types of chemical bonds"
            )!; // Non-null assertion since we know this exists in our test data

            // Only one should depend on the other, not both
            const hasCycle = bondingInfluence?.prerequisites?.includes(bondTypes.lessonName) &&
                bondTypes?.prerequisites?.includes(bondingInfluence.lessonName);
            expect(hasCycle).toBe(false);

            // Both should still depend on electron configuration
            expect(bondingInfluence?.prerequisites).toContain("Explain electron configuration and orbital theory");
            expect(bondTypes?.prerequisites).toContain("Explain electron configuration and orbital theory");

            // Advanced concept should maintain its valid prerequisites
            const reactionAnalysis = result.find(o =>
                o.lessonName === "Analyze how bond types affect chemical reactions"
            );
            expect(reactionAnalysis?.prerequisites).toContain("Describe different types of chemical bonds");

            // Verify no cycles exist in the final result
            expect(hasCycles(result.map(lg => ({ object: lg.lessonName, prerequisites: lg.prerequisites })))).toBe(false);
        });

        it.concurrent('should preserve valid dependencies when removing cycles', { timeout: 15000 }, async () => {
            const objectives = [
                // Create a complex dependency graph with multiple cycles and shared nodes
                createLessonGroup(
                    "Analyze reaction mechanisms",
                    ["Apply transition state theory", "Evaluate activation energy"] // Analyze depends on Apply and Evaluate
                ),
                createLessonGroup(
                    "Apply transition state theory",
                    ["Evaluate activation energy", "Define molecular collisions"] // Apply depends on Evaluate and Define
                ),
                createLessonGroup(
                    "Evaluate activation energy",
                    ["Analyze reaction mechanisms", "Define molecular collisions"] // Evaluate depends on Analyze (creates cycle) and Define
                ),
                createLessonGroup(
                    "Define molecular collisions",
                    ["Explain kinetic molecular theory"] // Define depends on Explain (valid dependency)
                ),
                createLessonGroup(
                    "Explain kinetic molecular theory",
                    [] // Explain has no dependencies
                )
            ];

            const chunks = [
                {
                    id: 'chunk1',
                    documentId: 'doc1',
                    content: `
                        Understanding reaction mechanisms requires applying transition state theory and evaluating activation energy.
                        Applying transition state theory builds upon activation energy concepts and molecular collisions.
                        Evaluating activation energy relates back to reaction mechanisms and requires understanding molecular collisions.
                        Understanding molecular collisions is based on kinetic molecular theory.
                        Kinetic molecular theory is a fundamental concept.
                    `,
                    startPosition: 0,
                    endPosition: 200
                }
            ];

            const result = await dagCreator.removeCyclicDependencies(objectives, chunks);

            // Verify that valid dependencies are preserved
            expect(result.find(o => o.lessonName === "Define molecular collisions")?.prerequisites).toContain("Explain kinetic molecular theory");

            // Verify that cycles are broken
            const findCycle = (start: string, visited = new Set<string>()): boolean => {
                if (visited.has(start)) return true;
                visited.add(start);
                const prereqs = result.find(o => o.lessonName === start)?.prerequisites || [];
                return prereqs.some(prereq => findCycle(prereq, new Set(visited)));
            };

            // Check that no cycles exist
            expect(result.some(obj => findCycle(obj.lessonName))).toBe(false);

            // Verify that some valid dependencies between cycle nodes are preserved
            const analyzeObj = result.find(o => o.lessonName === "Analyze reaction mechanisms");
            const applyObj = result.find(o => o.lessonName === "Apply transition state theory");
            const evaluateObj = result.find(o => o.lessonName === "Evaluate activation energy");

            // At least one dependency between Analyze, Apply, and Evaluate should be preserved
            const hasPreservedDependency =
                (analyzeObj?.prerequisites.some(p => ["Apply transition state theory", "Evaluate activation energy"].includes(p))) ||
                (applyObj?.prerequisites.some(p => ["Analyze reaction mechanisms", "Evaluate activation energy"].includes(p))) ||
                (evaluateObj?.prerequisites.some(p => ["Analyze reaction mechanisms", "Apply transition state theory"].includes(p)));

            expect(hasPreservedDependency).toBe(true);
        });

        it.concurrent('should handle interleaved cycles correctly', { timeout: 30000 }, async () => {
            const lessonGroups = [
                // Create two interleaved cycles: Analyze->Apply->Evaluate->Analyze and Apply->Evaluate->Define->Apply
                createLessonGroup("Analyze chemical equilibrium", ["Apply Le Chatelier's principle"]),
                createLessonGroup("Apply Le Chatelier's principle", ["Evaluate equilibrium constants"]),
                createLessonGroup("Evaluate equilibrium constants", ["Analyze chemical equilibrium", "Define reaction quotient"]),
                createLessonGroup("Define reaction quotient", ["Apply Le Chatelier's principle"])
            ];

            const chunks = [{
                id: 'chunk1',
                documentId: 'doc1',
                content: `
                    Understanding chemical equilibrium requires applying Le Chatelier's principle.
                    Applying Le Chatelier's principle requires evaluating equilibrium constants.
                    Evaluating equilibrium constants requires both analyzing chemical equilibrium and defining reaction quotient.
                    Defining reaction quotient requires applying Le Chatelier's principle.
                `,
                startPosition: 0,
                endPosition: 100
            }];

            // Verify initial cycles exist
            const initialCycles = findCycles(lessonGroups.map(lg => ({ object: lg.lessonName, prerequisites: lg.prerequisites })));
            expect(initialCycles.length).toBe(2); // Should find both interleaved cycles

            const result = await dagCreator.removeCyclicDependencies(lessonGroups, chunks);

            // Verify no cycles remain
            expect(hasCycles(result.map(lg => ({ object: lg.lessonName, prerequisites: lg.prerequisites })))).toBe(false);

            // Verify that the dependency structure is still meaningful
            expect(result.some(obj => obj.prerequisites.length > 0)).toBe(true);
        });

        it.concurrent('should not add unnecessary dependencies when resolving cycles', { timeout: 15000 }, async () => {
            const lessonGroups = [
                createLessonGroup("Analyze atomic orbitals", ["Apply quantum numbers"]),
                createLessonGroup("Apply quantum numbers", ["Evaluate electron configurations"]),
                createLessonGroup("Evaluate electron configurations", ["Analyze atomic orbitals"]), // Creates cycle
                createLessonGroup("Define periodic trends", ["Apply quantum numbers"]), // Depends on quantum numbers but not part of cycle
                createLessonGroup("Explain atomic theory", [])     // Independent node
            ];

            const chunks = lessonGroups.map(lg => ({
                id: `chunk_${lg.lessonName}`,
                content: `Content for ${lg.lessonName}`,
                documentId: '1',
                startPosition: 0,
                endPosition: 100
            }));

            // Verify initial cycle exists
            const initialCycles = findCycles(lessonGroups.map(lg => ({ object: lg.lessonName, prerequisites: lg.prerequisites })));
            expect(initialCycles.length).toBe(1);
            expect(initialCycles[0]).toContain("Analyze atomic orbitals");
            expect(initialCycles[0]).toContain("Apply quantum numbers");
            expect(initialCycles[0]).toContain("Evaluate electron configurations");

            const result = await dagCreator.removeCyclicDependencies(lessonGroups, chunks);

            // Verify no cycles remain
            expect(hasCycles(result.map(lg => ({ object: lg.lessonName, prerequisites: lg.prerequisites })))).toBe(false);

            // Check that Define->Apply dependency is preserved (not part of cycle)
            expect(result.find(o => o.lessonName === "Define periodic trends")?.prerequisites).toContain("Apply quantum numbers");

            // Check that Explain remains independent
            expect(result.find(o => o.lessonName === "Explain atomic theory")?.prerequisites).toHaveLength(0);

            // Check that no new dependencies were added to any node
            result.forEach(obj => {
                const original = lessonGroups.find(lg => lg.lessonName === obj.lessonName);
                expect(obj.prerequisites.every(p => original?.prerequisites.includes(p))).toBe(true);
            });
        });
    });
});