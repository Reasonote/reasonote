import * as Priompt from '@anysphere/priompt';
import { trimLines } from '@lukebechtel/lab-ts-utils';
import { Block } from '@reasonote/lib-ai';

export const GenerateLessonPartsPrompt = ({
    lessonName,
    expectedDurationMinutes,
    learningObjectives
}: {
    lessonName: string;
    expectedDurationMinutes: number;
    learningObjectives: {
        learningObjective: string;
        referenceSentences: string[];
    }[];
}): Priompt.PromptElement => {
    return <>
        <Block name="TASK">
            {trimLines(`
                You are an expert teacher tasked with creating an engaging, comprehensive lesson based on the following information:
                The title of the lesson is: ${lessonName}
                The lesson should be about the following learning objectives: ${learningObjectives.map(lo => lo.learningObjective).join(', ')}.
                I will provide you with the reference material for each learning objective.
                The lesson should be around ${expectedDurationMinutes} minutes to complete.

                IMPORTANT: For each part, you MUST include the exact reference sentences you used from the provided material. Do not modify or paraphrase these sentences - copy them exactly as provided.
            `)}
        </Block>

        <Block name="LESSON_STRUCTURE_GUIDELINES">
            <Block name="DETERMINING_PARTS">
                {trimLines(`
                    COGNITIVE LOAD MANAGEMENT:
                    The primary goal of splitting content into parts is to manage cognitive load while keeping closely related concepts together.

                    1. CRITICAL GROUPING RULES:
                       FOUNDATIONAL CONCEPTS MUST BE GROUPED:
                       - ALWAYS keep "Define X" and "Explain X" together in the same part
                       - NEVER separate a definition from its direct explanation
                       - NEVER split foundational concepts about the same topic
                       - NEVER put a definition in one part and its explanation in another

                       ALWAYS group together objectives that:
                       - Share the same core concept
                       - Have direct prerequisite relationships
                       - Build incrementally on each other
                       - Are needed to understand each other
                       - Define and explain the same fundamental concept
                       - Cover different aspects of the same foundational principle

                       ALWAYS separate objectives that:
                       - Introduce fundamentally different concepts
                       - Require significantly different cognitive skills
                       - Can be understood independently
                       - Have distinct applications or contexts
                       - Apply or implement concepts rather than define/explain them

                    2. COGNITIVE LOAD ANALYSIS:
                       For each potential grouping, assess:
                       - Total number of new concepts introduced
                       - Complexity of relationships between concepts
                       - Required background knowledge
                       - Time needed for comprehension
                       
                       Keep cognitive load manageable by:
                       - Limiting new concepts per part (2-3 max for related concepts)
                       - Grouping concepts that naturally support each other
                       - Ensuring prerequisites are covered before dependent concepts
                       - Maintaining a clear conceptual focus in each part
                       - Keeping definitional and explanatory content about the same concept together

                    3. SEQUENCING PRINCIPLES:
                       - Start with foundational concepts
                       - Group closely related concepts in the same part
                       - Build complexity gradually
                       - Ensure each part has a clear conceptual theme
                       - Place complex implementation or synthesis after foundational understanding
                       - Keep definitions and their direct explanations together
                       - NEVER separate a definition from its explanation

                    4. VALIDATION CHECKS:
                       Before finalizing parts, verify:
                       - Related concepts stay together
                       - Direct prerequisites are in the same part as their dependent concepts
                       - Each part has a manageable cognitive load
                       - Complex topics are separated from foundational concepts
                       - The progression feels natural to a learner
                       - Definitions and their immediate explanations are not split across parts
                       - DOUBLE CHECK that no definition is separated from its explanation
                       - DOUBLE CHECK that foundational concepts about the same topic stay together
                `)}
            </Block>
            <br />
            <Block name="CRITICAL_RULES">
                {trimLines(`
                    IMPORTANT: Each learning objective must be assigned to exactly one part. Do not repeat learning objectives across parts.
                `)}
            </Block>
            <br />
            <Block name="SEQUENCING">
                {trimLines(`
                    SEQUENCING RULES:
                    1. Always teach prerequisites before dependent concepts
                    2. Start with foundational concepts that others build upon
                    3. Group related concepts that naturally flow together
                    4. Place standalone concepts where they fit best in the overall flow
                `)}
            </Block>
            <br />
            <Block name="ASSESSMENT_GUIDELINES">
                {trimLines(`
                    CREATE EXPERTS ASSESSMENT QUESTIONS FOR EACH PART:
                    1. Question Format:
                       - MUST start with one of these words: why, how, explain, analyze, compare, evaluate, justify, prove
                       - Focus on deep understanding, not recall
                       - Ask about relationships and principles
                       - Require application and synthesis
                    
                    2. Question Content:
                       - Map directly to learning objectives
                       - Test application of concepts
                       - Cover edge cases and limitations
                       - Connect multiple concepts
                       - Challenge assumptions
                    
                    3. Question Types:
                       - "Why" questions for understanding principles
                       - "How" questions for processes and methods
                       - "Explain" questions for relationships
                       - "Analyze" questions for breaking down concepts
                       - "Compare" questions for seeing connections
                       - "Evaluate" questions for critical thinking
                       - "Justify" questions for reasoning
                       - "Prove" questions for mathematical rigor
                    
                    4. NEVER:
                       - Start with "what is"
                       - Ask for simple definitions
                       - Request mere recall
                       - Use yes/no questions
                `)}
            </Block>
        </Block>
        <br />
        <Block name="INSTRUCTIONS">
            {trimLines(`
                Create a well-structured lesson that will take around ${expectedDurationMinutes} minutes to complete.
                Follow the lesson structure guidelines above to organize the content into coherent, well-sequenced parts.
                
                For each part, provide:
                - The exact learning objectives covered in this part (copy-pasted, not paraphrased). Each learning objective must appear in exactly one part.
                - Key points to cover
                - Example(s) or illustration(s)
                - Expert assessment questions
                
                Also provide:
                - A concise summary of the lesson content. This should be a 1-2 sentences that captures the main idea of the lesson. This should not be meta-information about the lesson, but rather a summary of the content.
            `)}
        </Block>
        <br />
        <Block name="EXAMPLES">
            <Block name="EXAMPLE_1">
                {trimLines(`
                    Input:
                    - Learning Objectives: [
                        "Define what a chemical bond is",
                        "Explain how electrons participate in chemical bonding",
                        "Compare ionic and covalent bonds",
                        "Calculate bond energies"
                    ]
                    - Reference Sentences: [
                        "A chemical bond is a lasting attraction between atoms, ions or molecules that enables the formation of chemical compounds.",
                        "Chemical bonds involve the sharing or transfer of electrons between atoms.",
                        "Ionic bonds involve electron transfer while covalent bonds involve electron sharing.",
                        "Bond energy is the energy required to break a chemical bond, measured in kilojoules per mole."
                    ]
                    - Duration: 30 minutes

                    Good Response:
                    {
                        "summary": "Chemical bonds are fundamental forces that hold atoms together through electron interactions, with different types of bonds forming through distinct electron behaviors and having measurable energetic properties.",
                        "parts": [
                            {
                                "learningObjectives": [
                                    "Define what a chemical bond is",
                                    "Explain how electrons participate in chemical bonding"
                                ],
                                "keyPoints": [
                                    "Chemical bonds are attractions between atoms",
                                    "Electrons are key to bond formation",
                                    "Bonds create stable chemical compounds"
                                ],
                                "examples": [
                                    "Real-world analogy: Like magnets attracting each other",
                                    "Molecular examples:\n1. H2 molecule formation\n2. NaCl crystal structure"
                                ],
                                "expertQuestions": [
                                    "Explain why electron behavior is crucial for understanding chemical bond formation. How do different electron arrangements lead to different bonding possibilities?"
                                ]
                            },
                            {
                                "learningObjectives": [
                                    "Compare ionic and covalent bonds"
                                ],
                                "keyPoints": [
                                    "Ionic bonds involve electron transfer",
                                    "Covalent bonds involve electron sharing",
                                    "Different properties result from each type"
                                ],
                                "examples": [
                                    "Comparison examples:\n1. NaCl (ionic) vs H2O (covalent)\n2. Physical properties of each\n3. Formation process visualization"
                                ],
                                "expertQuestions": [
                                    "Analyze why some elements tend to form ionic bonds while others form covalent bonds. How do electron configurations influence this tendency?"
                                ]
                            },
                            {
                                "learningObjectives": [
                                    "Calculate bond energies"
                                ],
                                "keyPoints": [
                                    "Bond energy measures bond strength",
                                    "Units are kilojoules per mole",
                                    "Experimental determination methods"
                                ],
                                "examples": [
                                    "Calculations:\n1. Breaking H-H bond\n2. Multiple bond energy comparisons\n3. Practical applications in reaction energy"
                                ],
                                "expertQuestions": [
                                    "How do molecular structure and electron distribution influence bond energy calculations? Justify your reasoning with specific examples."
                                ]
                            }
                        ]
                    }

                    Note how the response:
                    1. Groups foundational concepts together (bond definition + electron role)
                    2. Separates comparison of bond types into its own part (different cognitive skill)
                    3. Isolates calculations as a distinct part (requires different cognitive skills)
                    4. Maintains clear prerequisite relationships
                    5. Each part has a focused theme
                    `)}
            </Block>
            <br />
            <Block name="EXAMPLE_2">
                {trimLines(`
                    Input:
                    - Learning Objectives: [
                        "Define what an algorithm is",
                        "Analyze algorithm efficiency using Big O notation",
                        "Compare linear and binary search algorithms",
                        "Implement binary search in code"
                    ]
                    - Reference Sentences: [
                        "An algorithm is a step-by-step procedure for solving a problem or accomplishing a task.",
                        "Big O notation describes an algorithm's worst-case performance or complexity.",
                        "Linear search checks each element sequentially, while binary search divides the search space in half each time.",
                        "Binary search implementation requires a sorted array and uses a divide-and-conquer strategy."
                    ]
                    - Duration: 45 minutes

                    Good Response:
                    {
                        "summary": "Algorithms are systematic problem-solving procedures whose efficiency can be analyzed and compared, with specific implementations like binary search demonstrating how theoretical concepts translate into practical code.",
                        "parts": [
                            {
                                "learningObjectives": [
                                    "Define what an algorithm is"
                                ],
                                "keyPoints": [
                                    "Algorithms are step-by-step procedures",
                                    "They solve specific problems",
                                    "Must be precise and unambiguous"
                                ],
                                "examples": [
                                    "Everyday algorithms:\n1. Recipe for baking a cake\n2. Directions to a destination\n3. Morning routine",
                                    "Simple computing examples:\n1. Finding maximum in a list\n2. Checking if a number is even"
                                ],
                                "expertQuestions": [
                                    "Explain why precision and unambiguity are essential characteristics of algorithms. How do these requirements differ from human instructions?"
                                ]
                            },
                            {
                                "learningObjectives": [
                                    "Analyze algorithm efficiency using Big O notation",
                                    "Compare linear and binary search algorithms"
                                ],
                                "keyPoints": [
                                    "Big O measures worst-case complexity",
                                    "Linear vs logarithmic growth",
                                    "Space vs time tradeoffs"
                                ],
                                "examples": [
                                    "Efficiency comparison:\n1. Linear search: O(n)\n2. Binary search: O(log n)\n3. Growth rate visualization",
                                    "Performance graphs showing scaling differences"
                                ],
                                "expertQuestions": [
                                    "Compare and contrast scenarios where linear search might be preferred over binary search despite its higher time complexity. Consider factors beyond just time complexity in your analysis."
                                ]
                            },
                            {
                                "learningObjectives": [
                                    "Implement binary search in code"
                                ],
                                "keyPoints": [
                                    "Prerequisite: sorted array",
                                    "Divide-and-conquer strategy",
                                    "Edge case handling"
                                ],
                                "examples": [
                                    "Step-by-step implementation:\n1. Finding midpoint\n2. Comparison logic\n3. Recursive vs iterative approaches",
                                    "Edge cases:\n1. Empty array\n2. Single element\n3. Element not found"
                                ],
                                "expertQuestions": [
                                    "How would you modify the binary search implementation to handle duplicates in the array? Analyze the impact of your modifications on the algorithm's complexity."
                                ]
                            }
                        ]
                    }

                    Note how the response:
                    1. Keeps the foundational definition separate (unique cognitive level)
                    2. Groups analysis and comparison together (related analytical skills)
                    3. Separates implementation (different cognitive skill - application)
                    4. Each part builds on previous knowledge
                    5. Implementation part comes last (requires understanding of concepts)
                    `)}
            </Block>
        </Block>
        <br />
        <Block name="CONTEXT">
            {trimLines(`
                Here are the reference materials for each learning objective:
            `)}
            {learningObjectives.map((s, idx) => (
                <Block name={`SKILL_${idx}`}>
                    <Block name="NAME">
                        {trimLines(s.learningObjective)}
                    </Block>
                    <Block name="REFERENCES">
                        {s.referenceSentences.map((ref, refIdx) => (
                            <Block name={`REFERENCE_${refIdx}`}>
                                {trimLines(ref)}
                            </Block>
                        ))}
                    </Block>
                </Block>
            ))}
        </Block>
    </>;
};