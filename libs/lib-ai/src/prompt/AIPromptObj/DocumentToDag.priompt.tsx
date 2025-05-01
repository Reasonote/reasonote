import _ from 'lodash';

import * as Priompt from '@anysphere/priompt';
import { trimLines } from '@lukebechtel/lab-ts-utils';

import { Block } from './PromptComponents';

export const GenerateLearningSummaryPrompt = ({ chunks }: { chunks: Array<{content: string, p: number}> }): Priompt.PromptElement => {
    const schemaExample = trimLines(`{
    "summary": "string",
    "learningObjectives": ["string"]
}`);

    const exampleInput = trimLines(`
        Neural networks are a fundamental concept in deep learning, inspired by the structure and function of biological neural networks in the human brain. At their core, artificial neural networks consist of interconnected nodes, or "neurons," organized in layers. The basic structure includes an input layer, one or more hidden layers, and an output layer.

        Each connection between neurons has an associated weight that determines its strength. During training, these weights are adjusted through a process called backpropagation, where the network learns from examples by minimizing the difference between its predictions and the actual desired outputs.

        Modern neural networks employ various architectures for different tasks. Convolutional Neural Networks (CNNs) excel at image processing by using specialized layers that detect patterns and features. Recurrent Neural Networks (RNNs) are designed for sequential data, maintaining an internal memory state that allows them to process sequences like text or time series data.

        The training process requires careful consideration of hyperparameters such as learning rate, batch size, and network architecture. Techniques like dropout and batch normalization help prevent overfitting and improve training stability. Advanced optimizers like Adam and RMSprop offer improvements over traditional gradient descent.

        Applications of neural networks span numerous fields. In computer vision, they power image classification, object detection, and facial recognition systems. Natural language processing applications include machine translation, sentiment analysis, and text generation. Neural networks also drive advances in speech recognition, game playing AI, and autonomous vehicles.
    `);

    const goodExample = trimLines(`{
        "summary": "This comprehensive text explores neural networks, starting with their fundamental principles and biological inspiration, then progressing through their core components, modern architectures, training methodologies, and real-world applications. The document provides a bridge between theoretical foundations and practical implementations, emphasizing how different neural network architectures are specialized for specific tasks. It connects abstract mathematical concepts with concrete applications, showing how neural networks have revolutionized fields from computer vision to natural language processing.",
        "learningObjectives": [
            "Understand the fundamental architecture of neural networks and their biological inspiration",
            "Master the core concepts of neural network training, including backpropagation and weight adjustment",
            "Compare and contrast different neural network architectures (CNNs, RNNs) and their specialized applications",
            "Explain practical considerations in neural network implementation, including hyperparameter tuning and optimization techniques",
            "Analyze the broad impact of neural networks across various real-world applications and industries"
        ]
    }`);

    const badExample = trimLines(`{
    "summary": "This text talks about neural networks and how they work. It covers different types of neural networks and what they're used for. It also mentions some technical details about training them.",
    "learningObjectives": [
        "Learn about neural networks",
        "Understand how they work",
        "See where they are used",
        "Learn about training"
    ]
}`);

    return <>
        <Block name="TASK">
            {trimLines(`
            As an experienced educator, analyze this document to create a comprehensive learning-focused summary and broad learning objectives.
            This summary and these objectives will serve as crucial context for later breaking down the document into smaller, focused lessons.

            Your analysis should:
            1. Provide a broad yet detailed overview that captures the document's full scope
            2. Make sure that the summary includes all key concepts and themes that will guide chunk-based lesson creation
            3. Set clear learning objectives that will help determine which parts of the text are essential vs. supplementary
        `)}
        </Block>

        <Block name="FORMAT">
            {trimLines(`
            Return a JSON object containing:
            - summary: A comprehensive overview that will guide the extraction of key concepts from individual chunks
            - learningObjectives: Broad learning goals that will help prioritize content in subsequent chunk analysis

            The output should be valid JSON matching this schema:
            `)}
            <br />
            {schemaExample}
        </Block>

        <Block name="TEXT">
            {chunks.map(chunk => (
                <scope p={chunk.p}>
                    {trimLines(chunk.content)}
                </scope>
            ))}
        </Block>

        <Block name="GUIDELINES">
            {trimLines(`
            1. The summary should:
                - Provide a comprehensive view of the entire document's scope
                - Identify major themes that will guide chunk analysis
                - Highlight relationships between concepts
                - Note progression of ideas from fundamental to advanced
                - Include both theoretical and practical aspects when present

            2. Learning objectives should:
                - Be broad enough to guide chunk-based lesson creation
                - Help identify which content is essential vs. supplementary
                - Cover the full scope of learning from basic to advanced concepts
                - Connect theoretical understanding with practical applications
                - Be specific enough to evaluate content relevance

            3. Learning objective structure:
                - Must start with one of these approved action verbs:
                    * Understanding verbs: "Understand", "Explain", "Describe", "Define"
                    * Analysis verbs: "Analyze", "Compare", "Contrast", "Evaluate"
                    * Application verbs: "Apply", "Implement", "Demonstrate", "Use"
                    * Synthesis verbs: "Integrate", "Connect", "Synthesize", "Combine"
                    * Mastery verbs: "Master", "Design", "Develop", "Create"
                - Must include a clear subject/concept
                - Should specify scope or context when relevant
                - May include practical applications or examples
                - Should follow this pattern: [ACTION_VERB] + [SUBJECT] + [SCOPE/CONTEXT] + [APPLICATION]

            4. Learning objective examples:
                Good:
                - "Understand the fundamental principles of neural networks and their biological inspiration"
                - "Analyze the relationships between different machine learning algorithms in the context of data processing"
                - "Apply optimization techniques to improve neural network performance in real-world applications"
                - "Integrate theoretical concepts with practical implementations in computer vision systems"
                - "Master the process of selecting and tuning machine learning models for specific use cases"

                Bad:
                - "Learn about neural networks" (too vague, wrong verb)
                - "See how it works" (non-specific, wrong verb)
                - "Do machine learning" (non-specific, wrong verb)
                - "Know the concepts" (too vague, wrong verb)
            `)}
        </Block>

        <Block name="EXAMPLES">
            <Block name="EXAMPLE_INPUT">
                {exampleInput}
            </Block>

            <Block name="GOOD_SUMMARY_AND_OBJECTIVES">
                {goodExample}
            </Block>

            <Block name="BAD_SUMMARY_AND_OBJECTIVES">
                {badExample}
            </Block>
            <br />

            {trimLines(`
            The good example provides:
            - A comprehensive summary that captures the full scope and progression of concepts
            - Clear learning objectives that will help evaluate the relevance of specific chunks
            - A framework for identifying essential vs. supplementary content
            - Connections between theoretical concepts and practical applications

            The bad example fails because:
            - The summary is too vague to guide chunk analysis
            - Learning objectives are not specific enough to evaluate content relevance
            - No clear progression from basic to advanced concepts
            - Missing connections between theory and practice
            `)}
        </Block>
    </>;
};

export const GenerateSkillNamePrompt = ({ firstChunkContent, summary, learningObjectives }: {
    firstChunkContent: string;
    summary: string;
    learningObjectives: string[];
}): Priompt.PromptElement => {
    const schemaExample = trimLines(`{
        "skillName": "string",
        "emoji": "string"
    }`);

    const exampleInput1 = trimLines(`
        First Chunk: "Chapter 1: Neural Networks
        This chapter introduces the fundamentals of neural networks, including their structure, training, and applications."
        Summary: "This document covers the fundamentals of neural networks, including their structure, training, and applications."
        Learning Objectives:
        - Understand the basic structure of neural networks
        - Explain how neural networks learn
    `);

    const goodExample1 = trimLines(`{
        "skillName": "Neural Networks",
        "emoji": "🧠"
    }`);

    const badExample1 = trimLines(`{
        "skillName": "Neural Networks Fundamentals",
        "emoji": "📈"
    }`);

    const exampleInput2 = trimLines(`
        First Chunk: "Introduction to Chemical Kinetics and Reaction Mechanisms
        Chemical reactions are processes where reactants transform into products through the breaking and forming of chemical bonds."
        Summary: "This document explores chemical reaction kinetics, mechanisms, and catalysis, focusing on how reactions occur and can be controlled."
        Learning Objectives:
        - Understand reaction mechanisms
        - Analyze reaction rates
    `);

    const goodExample2 = trimLines(`{
        "skillName": "Chemical Kinetics and Reaction Mechanisms",
        "emoji": "🧪"
    }`);

    const badExample2 = trimLines(`{
        "skillName": "This document explains chemical reactions in detail",
        "emoji": "🔍"
    }`);

    return <>
        <Block name="CONTEXT">
            {trimLines(`
            You are an expert curriculum designer breaking down a complex document into focused learning segments.
            The document has already been analyzed at a high level, producing an overview summary and overall learning objectives.
            You are now tasked with creating a name for the skill that is a single phrase that captures the essence of the content.
            `)}
        </Block>

        <Block name="TASK">
            {trimLines(`
            Create a name for the skill by following these priority rules:
            1. If the first chunk contains a clear title or heading (e.g., "Chapter X:", "Introduction to", etc.), extract ONLY the main subject/topic exactly as written:
            2. DO NOT add any words to the extracted title (like "Fundamentals", "Basics", etc.)
            3. If no clear title exists, create a name that captures the essence of the summary and learning objectives
            4. The final name should be concise and to the point, no more than 8 words
            5. Choose an appropriate emoji that represents the skill
            `)}
        </Block>

        <Block name="FIRST_CHUNK">
            {trimLines(firstChunkContent)}
        </Block>

        <Block name="DOCUMENT_CONTEXT">
            {trimLines(summary)}
        </Block>

        <Block name="LEARNING_OBJECTIVES">
            {learningObjectives.map(obj => `- ${obj}`).join('\n')}
        </Block>

        <Block name="FORMAT">
            {trimLines(`
            Return a JSON object containing:
            - skillName: A single phrase that captures the essence of the content, preferably from a title if available
            - emoji: An emoji that represents the skill

            The output should be valid JSON matching this schema:
            `)}
            <br />
            {schemaExample}
        </Block>

        <Block name="GUIDELINES">
            {trimLines(`
            1. Look for titles or headings in the first chunk that follow patterns like:
               - "Chapter X: [Topic]" → extract ONLY "[Topic]" exactly as written
               - "Introduction to [Topic]" → extract ONLY "[Topic]" exactly as written
               - Clear standalone titles → use exactly as written
            2. If using a title, extract it exactly as written without adding ANY extra words
            3. The emoji should be relevant to the subject matter
            4. Avoid generic skill names like "Introduction" or "Chapter 1"
            `)}
        </Block>

        <Block name="EXAMPLES">
            <Block name="EXAMPLE_INPUT_1">
                {exampleInput1}
            </Block>

            <Block name="GOOD_SKILL_NAME_AND_EMOJI_1">
                {goodExample1}
            </Block>

            <Block name="BAD_SKILL_NAME_AND_EMOJI_1">
                {badExample1}
            </Block>

            <Block name="EXAMPLE_INPUT_2">
                {exampleInput2}
            </Block>

            <Block name="GOOD_SKILL_NAME_AND_EMOJI_2">
                {goodExample2}
            </Block>
            <Block name="BAD_SKILL_NAME_AND_EMOJI_2">
                {badExample2}
            </Block>

            <br />

            {trimLines(`
            The good examples demonstrate:
            - Extracting EXACTLY the core topic from titles ("Neural Networks" from "Chapter 1: Neural Networks")
            - Using relevant emojis that match the subject matter (🧠 for neural networks, 🧪 for chemistry)

            The bad examples fail because:
            - The first example INCORRECTLY adds "Fundamentals" when the title was just "Quantum Mechanics"
            - The second example's skill name is too long and descriptive rather than concise
            - Adding words like "Fundamentals", "Basics", or "Principles" to titles is NOT allowed
            `)}
        </Block>
    </>;
};

export const ExtractChunkLearningObjectivesPrompt = ({ chunk, summary }: {
    chunk: string;
    summary: {
        summary: string;
        learningObjectives: string[]
    };
}): Priompt.PromptElement => {

    return (
        <>
            <Block name="CONTEXT">
                {trimLines(`
                    You are an expert curriculum designer breaking down a complex document into focused learning segments.
                    The document has already been analyzed at a high level, producing overall learning objectives.
                    Your task is to identify specific, actionable learning objectives that can be DIRECTLY achieved
                    by studying this specific chunk of content. These objectives must be fully supported by the
                    content provided - if a student cannot achieve the objective by studying just this chunk,
                    DO NOT include it.
                `)}
            </Block>

            <Block name="EXCLUDED_CONCEPTS_WARNING">
                {trimLines(`
                    CRITICAL WARNING: You MUST NOT create learning objectives for ANY concepts that are:
                    
                    1. Only mentioned in passing without thorough explanation
                    2. Specifically identified as topics for future coverage with phrases like:
                       - "we'll explore this later"
                       - "this will be discussed in the next section"
                       - "we'll cover this in detail in a future chapter"
                       - "this topic will be expanded upon later"
                    3. Merely compared or contrasted without being fully explained
                    4. Listed as examples without substantive information
                    5. Mentioned as "beyond the scope" of the current content
                `)}
            </Block>

            <Block name="STRICT_VERB_REQUIREMENTS">
                {trimLines(`
                    CRITICAL: ALL learning objectives MUST start with ONLY these approved action verbs:
                    
                    APPROVED VERBS (use ONLY these):
                    - Understanding: "Identify", "Define", "Describe", "Explain"
                    - Analysis: "Analyze", "Compare", "Differentiate", "Examine" 
                    - Application: "Apply", "Use", "Demonstrate", "Calculate"
                    - Synthesis: "Connect", "Relate", "Integrate", "Combine"
                    - Evaluation: "Assess", "Evaluate", "Judge", "Determine"
                    
                    FORBIDDEN VERBS (NEVER use these):
                    - "Summarize", "Understand", "Learn", "Know", "Comprehend", "Review", "Survey"
                    - "List" (unless creating an actual list is the specific skill being taught)
                    - "Explore", "Discover", "Study", "Research", "Investigate"
                    - Any other verbs not in the approved list above
                    
                    Every single learning objective MUST begin with one of the approved verbs EXACTLY as written.
                `)}
            </Block>

            <Block name="TASK">
                {trimLines(`
                    Analyze this chunk of content and create specific learning objectives that:
                    1. Can be DIRECTLY achieved by studying this chunk's content ALONE
                    2. Are fully supported by the information provided in the chunk
                    3. Connect to broader learning goals where appropriate, but only if the connection is explicit in the chunk
                    4. Are specific, measurable, and demonstrable using only this chunk's material
                    5. START WITH ONE OF THE APPROVED VERBS LISTED ABOVE - this is non-negotiable
                    6. REFER ONLY TO CONCEPTS THAT ARE FULLY EXPLAINED in the chunk, not just mentioned
                    
                    CRITICAL: Only include objectives that a student could demonstrate mastery of after studying
                    this chunk. If achieving the objective would require additional information not present in
                    the chunk, DO NOT include it.
                `)}
            </Block>
            
            <Block name="CONCEPT_DEPTH_CHECK">
                {trimLines(`
                    Before creating each objective, ask yourself:
                    
                    1. Is this concept thoroughly explained in the chunk? (At least 2-3 substantive sentences dedicated to it)
                    2. Does the chunk provide all necessary information to understand this concept without external references?
                    3. Is there explicit mention that this concept will be covered later or in more detail elsewhere?
                    4. Would a student need additional information not in this chunk to demonstrate mastery of this objective?
                    
                    Only proceed with an objective if answers are: YES, YES, NO, NO
                    
                    If a concept appears with phrases like "we'll discuss this more later," "this will be covered in detail in the next chapter," "we'll explore this further," or similar phrases indicating future coverage, DO NOT create objectives about that concept.
                `)}
            </Block>

            <Block name="DOCUMENT_CONTEXT">
                <Block name="OVERALL_SUMMARY">
                    {summary.summary}
                </Block>

                <Block name="OVERALL_LEARNING_OBJECTIVES">
                    {summary.learningObjectives.map(obj => `- ${obj}`).join('\n')}
                </Block>
            </Block>

            <Block name="CHUNK_CONTENT">
                {trimLines(chunk)}
            </Block>

            <Block name="FORMAT">
                {trimLines(`
                    Return a JSON object with:
                    1. objectives: Array of specific learning objectives for this chunk

                    The output should match this schema:
                    {
                        "objectives": ["string"]
                    }

                    VALIDATION: Before submitting, verify for EACH objective:
                    1. It starts with one of the approved verbs
                    2. It ONLY covers concepts that are FULLY EXPLAINED in the chunk
                    3. It does NOT include any concepts marked for "future coverage" or "later exploration"
                    4. It does NOT include concepts that are only briefly mentioned
                    5. It can be fully achieved using ONLY information in this chunk
                `)}
            </Block>

            <Block name="GUIDELINES">
                {trimLines(`
                    1. Learning Objectives Structure:
                        - MUST start with approved action verbs that can be directly assessed:
                            * Understanding: "Identify", "Define", "Describe", "Explain"
                            * Analysis: "Analyze", "Compare", "Differentiate", "Examine"
                            * Application: "Apply", "Use", "Demonstrate", "Calculate"
                            * Synthesis: "Connect", "Relate", "Integrate", "Combine"
                            * Evaluation: "Assess", "Evaluate", "Judge", "Determine"
                        - NEVER use verbs like "Summarize", "Understand", "Learn", "Know", etc.
                        - Must be specific and measurable using ONLY the chunk's content
                        - Should focus on one clear concept or skill that's fully explained in the chunk
                        - Include context and conditions when relevant

                    2. Objectives Requirements:
                        - MUST be fully achievable using this chunk's content alone
                        - MUST be directly supported by explicit information in the chunk
                        - Should be more specific than the overall objectives
                        - Must be demonstrable without requiring additional knowledge
                        - Should be appropriate for a single learning session
                        - NEVER create objectives for concepts that are only mentioned in passing

                    3. Critical Rules:
                        - If the chunk mentions a concept but doesn't fully explain it, DO NOT create an objective for it
                        - If the text says "we'll explore X later" or "X will be covered in another section," DO NOT create objectives about X
                        - If achieving an objective would require information from other chunks, DO NOT include it
                        - If the chunk only partially covers a topic, limit the objective to what's actually covered
                        - Never include objectives that require prerequisite knowledge not provided in the chunk
                        - If a concept is only mentioned briefly in the text, DO NOT create an objective for it
                        - ALWAYS start with an approved verb from the list above
                `)}
            </Block>

            <Block name="EXAMPLES">
                <Block name="EXAMPLE_INPUT">
                    {trimLines(`
                    Chunk: """
                    Chemical equilibrium occurs when the rates of forward and reverse reactions become equal, resulting in no net change in the concentrations of reactants and products. At this dynamic equilibrium point, molecules continue to react in both directions, but the rate at which products are formed equals the rate at which they convert back to reactants. The concentrations remain constant unless external factors disturb the system.

                    Le Chatelier's Principle explains how equilibrium systems respond to disturbances. When conditions change (such as concentration, temperature, or pressure), the equilibrium shifts to counteract that change. For example, if reactant concentration increases, the forward reaction temporarily proceeds faster, shifting the system toward products until a new equilibrium is established.
                    
                    Biological catalysts like enzymes also affect equilibrium, but we'll explore enzyme kinetics in a later chapter.
                    """
                    `)}

                    <Block name="DOCUMENT_CONTEXT">
                        {trimLines(`
                            Summary: "This comprehensive text explores fundamental principles of chemical kinetics and equilibrium, progressing from basic reaction rate concepts to complex equilibrium dynamics and system behaviors. The document bridges theoretical foundations with practical applications, examining how reaction rates and equilibrium states emerge from molecular-level interactions. It connects microscopic behavior to macroscopic observations, showing how factors like temperature, concentration, and pressure influence both kinetics and equilibrium. The text also explores advanced topics such as reaction mechanisms, rate laws, and the thermodynamic basis of equilibrium, demonstrating how these principles apply across different types of chemical systems and industrial processes."
                            Overall Objectives:
                            - "Master the principles of chemical kinetics and equilibrium, including rate laws and equilibrium constants"
                            - "Analyze how molecular-level interactions determine macroscopic reaction behavior"
                            - "Evaluate the relationships between reaction conditions and system responses"
                            - "Apply equilibrium principles to predict and control chemical system behavior"
                            - "Integrate kinetics and equilibrium concepts to understand complex reaction systems"
                        `)}
                    </Block>
                </Block>

                <Block name="GOOD_RESPONSE">
                    {trimLines(`
                    {
                        "objectives": [
                            "Define chemical equilibrium in terms of forward and reverse reaction rates",
                            "Explain the dynamic nature of chemical equilibrium at the molecular level",
                            "Apply Le Chatelier's Principle to predict equilibrium shifts",
                            "Identify specific factors that can disturb chemical equilibrium"
                        ]
                    }
                    Explanation: These objectives are excellent because:
                    - Each one starts with an approved verb (Define, Explain, Apply, Identify)
                    - Each one is fully supported by explicit content in the chunk
                    - They only cover concepts that are thoroughly explained
                    - They do NOT include anything about enzymes or biological catalysts, which are mentioned but explicitly reserved for "a later chapter"
                    - A student could demonstrate achievement using only this material
                    - They don't require knowledge beyond what's provided
                    `)}
                </Block>

                <Block name="BAD_RESPONSE">
                    {trimLines(`
                    {
                        "objectives": [
                            "Understand how reactions work", // Wrong verb, not from approved list
                            "Summarize equilibrium principles", // Wrong verb, not from approved list
                            "Calculate equilibrium constants", // Chunk doesn't show how to calculate
                            "Evaluate reaction mechanisms", // Not covered in this chunk
                            "Compare homogeneous and heterogeneous equilibria", // Not mentioned in chunk
                            "Explain how enzymes affect equilibrium as biological catalysts", // WRONG - text explicitly says "we'll explore enzyme kinetics in a later chapter"
                            "Explain how catalysts affect equilibrium" // Beyond scope of chunk
                        ]
                    }
                    Explanation: These objectives are problematic because:
                    - Some use forbidden verbs like "Understand" and "Summarize" instead of approved verbs
                    - The objective about enzymes includes a topic explicitly marked for future coverage
                    - Some require calculations not taught in the chunk
                    - Some cover topics not mentioned in the chunk
                    - Some require knowledge beyond what's provided
                    - Some address concepts only briefly mentioned but not explained
                    `)}
                </Block>
            </Block>
        </>
    );
};

export const GroupLearningObjectivesPrompt = ({ objectiveNames }: { objectiveNames: string[] }): Priompt.PromptElement => {
    const schemaExample = trimLines(`{
        "groups": [
            {
                "representative": "string",
                "group": ["string"]
            }
        ]
    }`);

    const exampleInput = trimLines(`
        Input Objectives:
        1. "Analyze how supply and demand interact to determine market equilibrium prices"
        2. "Explain the basic principles of supply and demand in price determination"
        3. "Evaluate the impact of price ceilings on market equilibrium and shortages"
        4. "Analyze how price floors affect market equilibrium and surpluses"
    `);

    const goodExample = trimLines(`{
        "groups": [
            {
                "representative": "Analyze how supply and demand forces interact to determine market equilibrium prices",
                "group": [
                    "Analyze how supply and demand interact to determine market equilibrium prices",
                    "Explain the basic principles of supply and demand in price determination"
                ]
            },
            {
                "representative": "Evaluate the effects of price controls on market equilibrium outcomes",
                "group": [
                    "Evaluate the impact of price ceilings on market equilibrium and shortages",
                    "Analyze how price floors affect market equilibrium and surpluses"
                ]
            }
        ]
    }`);

    const badExample = trimLines(`{
        "groups": [
            {
                "representative": "Analyze supply and demand in markets",
                "group": [
                    "Analyze how supply and demand interact to determine market equilibrium prices"
                ]
            },
            {
                "representative": "Explain supply and demand principles",
                "group": [
                    "Explain the basic principles of supply and demand in price determination"
                ]
            },
            {
                "representative": "Evaluate price ceilings",
                "group": [
                    "Evaluate the impact of price ceilings on market equilibrium and shortages"
                ]
            },
            {
                "representative": "Analyze price floors",
                "group": [
                    "Analyze how price floors affect market equilibrium and surpluses"
                ]
            }
        ]
    }`);

    const contextExample = trimLines(`
        Input Objectives:
        1. "Analyze the impact of bacteria on soil fertility"
        2. "Explain the role of bacteria in human digestion" 
        3. "Identify bacterial structures involved in human digestion"
    `);

    const contextGoodResponse = trimLines(`{
        "groups": [
            {
                "representative": "Analyze the impact of bacteria on soil fertility",
                "group": [
                    "Analyze the impact of bacteria on soil fertility"
                ]
            },
            {
                "representative": "Explain the role of bacteria in human digestion",
                "group": [
                    "Explain the role of bacteria in human digestion",
                    "Identify bacterial structures involved in human digestion"
                ]
            }
        ]
    }`);

    const networkingExample = trimLines(`
        Input Objectives:
        1. "Understand how data packets are transmitted over networks"
        2. "Explain the process of data packet transmission in computer networks" 
        3. "Analyze TCP/IP protocol implementation at the hardware level"
    `);

    const networkingGoodResponse = trimLines(`{
        "groups": [
            {
                "representative": "Explain the process of data packet transmission in computer networks",
                "group": [
                    "Understand how data packets are transmitted over networks",
                    "Explain the process of data packet transmission in computer networks"
                ]
            },
            {
                "representative": "Analyze TCP/IP protocol implementation at the hardware level",
                "group": [
                    "Analyze TCP/IP protocol implementation at the hardware level"
                ]
            }
        ]
    }`);

    return <>
        <Block name="CONTEXT">
            {trimLines(`
            You are part of an intelligent learning system that breaks down complex documents into focused lessons.
            Your task is to analyze a set of learning objectives and group them ONLY when they are semantically equivalent
            or saying essentially the same thing with different wording.
            
            This is NOT about grouping related topics - it's specifically about identifying when two learning objectives
            are teaching exactly the same concept but expressing it with different words or different verbs.
            
            CRITICAL: Objectives about the same general topic (e.g., "enzymes" or "bacteria") but in DIFFERENT CONTEXTS
            (e.g., "digestion" vs. "DNA replication" or "soil fertility" vs. "human gut") are NOT semantically equivalent
            and should be kept in separate groups.
            `)}
        </Block>

        <Block name="SEMANTIC_EQUIVALENCE_GUIDELINES">
            {trimLines(`
            WHEN OBJECTIVES ARE SEMANTICALLY EQUIVALENT (GROUP THESE):

            1. SAME CONCEPT WITH DIFFERENT VERBS
               - When objectives describe the exact same knowledge/skill but use different cognitive verbs
               - Example: "Identify the planets in our solar system" and "List the planets in our solar system"
               - Example: "Analyze the causes of World War I" and "Examine the factors that led to World War I"

            2. PARAPHRASES OF THE SAME CONCEPT
               - When objectives are essentially saying the same thing using different words
               - Example: "Describe the water cycle" and "Explain the hydrologic cycle"
               - Example: "Evaluate the effects of inflation on purchasing power" and "Assess the impact of inflation on buying capacity"

            3. SAME CONTENT APPROACHED FROM SLIGHT DIFFERENT ANGLES
               - When objectives cover the exact same content but frame it slightly differently
               - Example: "Calculate the area of triangles" and "Apply formulas to find triangle areas"

            4. LOOK FOR THESE EQUIVALENCE PATTERNS:
               - Synonym substitution ("effects" vs "impacts", "describe" vs "explain")
               - Reordering of similar elements ("causes of X" vs "factors leading to X")
               - Different levels of formality but same meaning
               - Different technical terms for the same concept
            `)}
        </Block>

        <Block name="NON_EQUIVALENCE_GUIDELINES">
            {trimLines(`
            WHEN OBJECTIVES ARE NOT SEMANTICALLY EQUIVALENT (KEEP SEPARATE):

            1. DIFFERENT SUBJECT MATTER
               - Even within the same domain, if they cover different topics or concepts
               - Example: "Analyze cellular respiration" vs "Describe photosynthesis" (related but different processes)

            2. DIFFERENT CONTEXTS OR APPLICATIONS
               - Same general topic but applied in different contexts or systems
               - Example: "Explain the role of bacteria in soil fertility" vs "Describe how bacteria aid digestion"
               - Example: "Analyze the role enzymes play in digestion" vs "Explain which enzymes are involved in DNA replication"
               - These involve the same type of biological entity but in completely different contexts

            3. DIFFERENT LEVELS OF ANALYSIS
               - One addresses basic knowledge while another addresses complex analysis
               - Example: "Define democracy" vs "Evaluate how democratic systems respond to crises"
               - Example: "Explain basic database concepts" vs "Analyze database normalization techniques"

            4. DIFFERENT PURPOSES OR APPLICATIONS
               - One focuses on understanding while another focuses on application
               - Example: "Explain Newton's laws" vs "Apply Newton's laws to solve physics problems"

            5. SUBSTANTIALLY DIFFERENT SCOPE
               - One is much broader or narrower in scope than the other
               - Example: "Describe cell structure" vs "Explain how mitochondria produce ATP"
               
            6. DIFFERENT TECHNICAL DEPTH
               - One covers basic principles while the other delves into implementation details
               - Example: "Explain how computer networks transmit data" vs "Analyze routing protocols at the packet level"
               - Example: "Understand cloud computing concepts" vs "Analyze distributed database sharding techniques"
               
            7. DIFFERENT BIOLOGICAL PROCESSES OR SYSTEMS
               - Same biological entity (e.g., enzymes, bacteria) but in different systems or processes
               - Example: "Explain enzymes in the digestive system" vs "Analyze enzymes in DNA replication"
               - These are fundamentally different contexts and should not be grouped
            `)}
        </Block>

        <Block name="INPUT_OBJECTIVES">
            Here are the learning objectives you need to analyze and group:
            <br />
            {objectiveNames.map((obj, i) =>
                <Block name={`OBJECTIVE_${i + 1}`}>
                    {trimLines(obj)}
                </Block>
            )}
        </Block>

        <Block name="TASK">
            {trimLines(`
            Analyze the provided learning objectives and:
            1. Group objectives that are semantically equivalent (saying the same thing in different words)
            2. Generate a representative objective for each group that captures the shared learning goal
            3. Ensure every objective is assigned to exactly one group
            4. Use the highest cognitive level verb from the group in the representative objective (Evaluate > Analyze > Explain > Describe > Identify)
            
            IMPORTANT: Focus only on true semantic equivalence - not just topic similarity. Two objectives must be teaching the EXACT SAME THING to be grouped together.
            
            For objectives that use different verbs but are otherwise identical, group them together.
            
            CRITICAL: Carefully check for different contexts - even if two objectives discuss the same type of entity 
            (like enzymes, bacteria, or chemical reactions), if they're in different contexts or biological systems 
            (like digestion vs. DNA replication, or soil bacteria vs. gut bacteria), they are NOT semantically equivalent
            and should be kept in separate groups.
            `)}
        </Block>

        <Block name="SEMANTIC_EQUIVALENCE_TESTS">
            {trimLines(`
            For each pair of objectives, apply these semantic equivalence tests:

            1. SUBSTITUTION TEST: If you replaced key terms with synonyms, would they be the same objective?
               - Example: "Identify key themes in Hamlet" = "Recognize main themes in Hamlet"
            
            2. REWORDING TEST: If you reword them, would they become identical?
               - If after standardizing terminology they are essentially the same, GROUP THEM
            
            3. LEARNING OUTCOME TEST: Would a student who mastered one automatically master the other?
               - If learning one guarantees mastery of the other, they are equivalent
            
            4. CORE CONCEPT TEST: Strip away the verbs and modifiers - is the core concept identical?
               - "Analyze how supply impacts demand" and "Explain supply's effect on demand" have the same core concept
            
            5. DIFFERENT VERB TEST: If only the cognitive verb differs but the knowledge content is identical, they are equivalent
               - Different cognitive levels addressing the same exact knowledge should be grouped
               
            6. CONTEXT TEST: Are they addressing the same entity in the same context/system/process?
               - "Explain enzymes in digestion" vs "Analyze enzymes in DNA replication" are NOT equivalent
               - Different contexts mean different learning content, even with the same entity type
               
            7. TECHNICAL DEPTH TEST: Are they addressing the same level of technical detail?
               - "Explain web browser functionality" vs "Analyze JavaScript engine optimization algorithms" are not equivalent 
               - One addresses general concept, one addresses specialized implementation details
            `)}
        </Block>

        <Block name="FORMAT">
            {trimLines(`
            Return a JSON object containing an array of groups, where each group has:
            - representative: A comprehensive learning objective that represents the entire group
            - group: An array of the exact original learning objectives that belong to this group

            The output should be valid JSON matching this schema:
            `)}
            <br />
            {schemaExample}
        </Block>

        <Block name="GUIDELINES">
            {trimLines(`
            CRITICAL RULES:
            1. GROUPING CRITERIA
               - Group objectives ONLY when they are semantically equivalent (same content, different wording)
               - Different verbs addressing the same exact content should be grouped (e.g., "identify" vs "recognize")
               - Objectives must teach the exact same thing to be grouped, not just related concepts
               - If there's any significant difference in what's being taught, keep them separate
               - Apply the semantic equivalence tests rigorously

            2. REPRESENTATIVE OBJECTIVES
               - Use the highest cognitive level verb from the group (Evaluate > Analyze > Explain > Describe > Identify)
               - Must capture the exact shared concept of all objectives in the group
               - Should be specific and clear about what exactly is being taught

            3. CRITICAL RULES
               - NEVER modify the original objectives when listing them in groups
               - NEVER leave any objectives unassigned
               - NEVER assign an objective to multiple groups
               - DO group objectives that differ only in their cognitive verb
               - DO group objectives that are paraphrases of the same exact concept
               - DO NOT group objectives simply because they relate to the same general topic
               - DO NOT group objectives that differ in technical depth or implementation level
               - DO NOT group fundamental concept understanding with detailed implementation analysis
            `)}
        </Block>

        <Block name="COGNITIVE_VERB_HIERARCHY">
            {trimLines(`
            When choosing the representative verb, use this hierarchy (highest to lowest):
            
            1. EVALUATE/ASSESS (highest): Judge, critique, appraise
            2. ANALYZE/INVESTIGATE: Break down, compare, examine
            3. APPLY/IMPLEMENT: Use, demonstrate, calculate, solve
            4. EXPLAIN/DESCRIBE: Clarify, elaborate, illustrate
            5. IDENTIFY/DEFINE/UNDERSTAND (lowest): Recognize, list, state, name
            
            Always use the highest level verb from the grouped objectives.
            `)}
        </Block>

        <Block name="EXAMPLES">
            <Block name="EXAMPLE_INPUT_1">
                {exampleInput}
            </Block>

            <Block name="GOOD_GROUPING_EXAMPLE_1">
                {goodExample}
            </Block>

            <Block name="BAD_GROUPING_EXAMPLE_1">
                {badExample}
            </Block>
            <br />
            
            <Block name="CONTEXT_EXAMPLE_INPUT">
                {contextExample}
            </Block>

            <Block name="CONTEXT_GOOD_RESPONSE">
                {contextGoodResponse}
            </Block>
            <br />
            
            <Block name="NETWORKING_EXAMPLE_INPUT">
                {networkingExample}
            </Block>

            <Block name="NETWORKING_GOOD_RESPONSE">
                {networkingGoodResponse}
            </Block>
            <br />

            {trimLines(`
            Example Analysis - Economics:
            
            The good example correctly groups:
            - "Analyze how supply and demand interact to determine market equilibrium prices" with "Explain the basic principles of supply and demand in price determination" because they cover the same fundamental concept of supply and demand determining prices, just with different cognitive verbs.
            - "Evaluate the impact of price ceilings on market equilibrium" with "Analyze how price floors affect market equilibrium" because both address price controls affecting market equilibrium (semantically equivalent concepts with different specifics).
            
            The bad example fails because:
            - It creates separate groups for objectives that are semantically equivalent
            - It misses that the objectives about supply and demand are teaching the same core concept
            - It fails to recognize that price ceiling and price floor objectives are essentially covering the same concept (price controls) just with different examples

            Example Analysis - Different Contexts:
            
            The good example correctly groups:
            - It keeps "Analyze the impact of bacteria on soil fertility" separate from the digestive system objectives because these are completely different contexts for bacteria.
            - It correctly groups "Explain the role of bacteria in human digestion" with "Identify bacterial structures involved in human digestion" because they both address the same topic in the same context (bacteria in digestion).
            
            This demonstrates the critical context distinction:
            - Even though all objectives are about bacteria, the soil context is completely different from the digestive context
            - The first objective is in an environmental/agricultural context
            - The other two are in a human biological context
            - Different contexts should be kept separate even when dealing with the same type of organism
            
            Example Analysis - Networking:
            
            The good example correctly groups:
            - "Understand how data packets are transmitted over networks" with "Explain the process of data packet transmission in computer networks" because they are semantically equivalent - just using different cognitive verbs (understand vs. explain) but addressing the exact same content (data packet transmission).
            - It correctly keeps "Analyze TCP/IP protocol implementation at the hardware level" separate because this objective addresses a much deeper technical implementation level rather than the general concept of data transmission.
            
            This demonstrates the technical depth distinction:
            - The first two objectives are about the general concept of data packet transmission
            - The third objective is about specialized hardware-level implementation details
            - Different technical levels should not be grouped together even when related to the same technology
            `)}
        </Block>
    </>;
};

export const ExtractReferenceSentencesPrompt = ({ content, learningObjective, subObjectives }: { content: string; learningObjective: string; subObjectives: string[] }): Priompt.PromptElement => {
    const schemaExample = trimLines(`{
    "referenceSentences": ["string"]
}`);

    return <>
        <Block name="CONTEXT">
            {trimLines(`
            We are creating an intelligent learning system that breaks down documents into focused lessons.
            Each learning objective represents a specific skill or knowledge that students should acquire.
            We need to extract EXACT sentences from the source text that directly support teaching and assessing this learning objective.
            These reference sentences will serve as authoritative source material for creating mini-lessons.
            
            CRITICAL: Our system requires sentences that directly contribute to teaching the objective. Quality is more important than quantity.
            CRITICAL: You must EXCLUDE navigational sentences, meta-references, and transitional phrases that don't contain actual content.
            `)}
        </Block>

        <Block name="TASK">
            {trimLines(`
            Extract specific reference sentences that support teaching the learning objective:
            "${learningObjective}"

            The reference sentences MUST be copied EXACTLY as they appear in the text.
            Extract sentences that:
            1. Directly teach or explain the concept or skill in the learning objective
            2. Provide essential context, definitions, or background needed to understand the concept
            3. Show practical applications, examples, or real-world relevance
            4. Connect this concept to related concepts (if crucial for understanding)
            5. Describe the structure, components, or characteristics related to the objective
            6. Explain processes, mechanisms, or how the concept works
            7. Describe factors that affect or influence the concept
            8. Explain internal conditions, states, or maintenance related to the concept
            
            IMPORTANT FOR ANALYSIS OBJECTIVES: For objectives that involve analyzing, comparing, or evaluating, you MUST INCLUDE the foundational/definitional sentences as well as the analytical ones. Never assume the student already knows what the subject is.
            
            DO NOT INCLUDE:
            1. Navigational phrases like "Let's explore...", "Next, we'll discuss...", "Let's examine how..."
            2. Meta-references like "See chapter 3", "You'll learn more about this later"
            3. Transitional sentences that only serve to move between topics
            4. Sentences that don't contribute substantive information about the concept
            `)}
            <br />
            <Block name="LEARNING_OBJECTIVE_DETAILS">
                Main Learning Objective: ${learningObjective}
                <br />
                This objective was synthesized from these more specific sub-objectives:
                <Block name="SUBOBJECTIVES">
                    {subObjectives.map(obj => `- ${obj}`).join('\n')}
                </Block>
            </Block>
        </Block>

        <Block name="TEXT">
            {trimLines(content)}
        </Block>

        <Block name="FORMAT">
            {trimLines(`
            Return a JSON object with an array of referenceSentences. Each sentence must be an exact match from the text.
            The output must be valid JSON matching this schema:
            `)}
            <br />
            {schemaExample}
        </Block>

        <Block name="GUIDELINES">
            {trimLines(`
            1. EXACT MATCHING RULES:
               - Copy sentences exactly as they appear, preserving all punctuation and formatting
               - Do not modify, paraphrase, combine, or split sentences
               - Match terms regardless of case but preserve original casing
               - Include complete sentences only - no fragments

            2. CONTENT RELEVANCE REQUIREMENTS:
               - Only include sentences with SUBSTANTIVE CONTENT related to the learning objective
               - For analytical objectives, include both definitional sentences AND analytical ones
               - Include all necessary sentences to provide comprehensive coverage of the topic
               - Make sure to cover all aspects mentioned in the sub-objectives
               - Focus on quality over quantity - each sentence should clearly contribute to the objective

            3. RELEVANCE CRITERIA:
               - PRIMARY: Include sentences that directly teach the main concept/skill
               - FOUNDATIONAL: Include sentences that provide necessary definitions and background
               - STRUCTURAL: Include sentences describing structure, components, or characteristics
               - PROCESS: Include sentences describing how processes work or how mechanisms function
               - FACTORS: Include sentences describing factors that affect or influence the concept
               - CONDITIONS: Include sentences about maintaining conditions or states
               - EXAMPLES: Include sentences with concrete examples or applications
               - CONNECTIONS: Include sentences showing crucial relationships to other concepts
               - EXCLUDE:
                 * Meta-references (e.g., "See chapter 3", "We'll cover this later")
                 * Navigation text (e.g., "Let's explore", "Moving on to")
                 * Organizational text (e.g., "This section covers", "Next, we'll discuss")
                 * Transitional phrases that don't contribute substantive information (e.g., "Let's examine how...")

            4. COGNITIVE LEVEL ALIGNMENT:
               - For ALL objectives, include foundational and definitional sentences
               - For "Define/Describe" objectives: Include definitional and descriptive sentences
               - For "Analyze/Evaluate" objectives: Include BOTH definitional sentences AND sentences about relationships, effects, and implications
               - For "Apply/Demonstrate" objectives: Include BOTH definitional sentences AND examples of applications
               - For ALL levels: Include sentences about processes, factors, and conditions

            5. COVERAGE REQUIREMENTS:
               - Include ALL sentences necessary to fully support teaching the objective
               - Cover ALL key aspects mentioned in the sub-objectives
               - Maintain logical flow and progression of ideas
               - Balance breadth and depth of coverage

            6. CRITICAL DISTINCTION - CONTENT vs. NAVIGATION:
               - Content sentences provide substantive information about the topic
               - Navigation sentences merely direct attention or transition between topics
               - When a sentence contains BOTH content and navigation elements, only include it if the content portion is substantial and directly relevant
               - Sentences that primarily serve to guide the reader through the text without providing substantial information should be excluded
            `)}
        </Block>

        <Block name="EXAMPLES">
            {trimLines(`
            Example 1 - Mathematical Concept:
            Learning Objective: "Analyze the properties of polynomial functions and their graphs"
            Sub-objectives:
            - "Define polynomial functions and their degree"
            - "Identify key features of polynomial graphs"
            - "Analyze the relationship between polynomial degree and graph behavior"
            Text:
            """
            A polynomial function is a function that can be written in the form P(x) = a₀ + a₁x + a₂x² + ... + aₙxⁿ, where n is a non-negative integer and aₙ ≠ 0. The highest power of x is called the degree of the polynomial. For example, P(x) = 3x⁴ + 2x² - 5 has a degree of 4.

            The graph of a polynomial function is a smooth, continuous curve. Polynomial functions of odd degree extend in opposite directions as x approaches positive and negative infinity. In contrast, polynomial functions of even degree extend in the same direction. The number of possible turning points in a polynomial graph is at most one less than the degree. Real zeros of a polynomial function are the x-values where the graph crosses the x-axis.
            
            Understanding these properties allows us to sketch graphs of polynomial functions without plotting every point. Look at the next section for applications in real-world modeling.
            """
            Good Response:
            {
                "referenceSentences": [
                    "A polynomial function is a function that can be written in the form P(x) = a₀ + a₁x + a₂x² + ... + aₙxⁿ, where n is a non-negative integer and aₙ ≠ 0.",
                    "The highest power of x is called the degree of the polynomial.",
                    "For example, P(x) = 3x⁴ + 2x² - 5 has a degree of 4.",
                    "The graph of a polynomial function is a smooth, continuous curve.",
                    "Polynomial functions of odd degree extend in opposite directions as x approaches positive and negative infinity.",
                    "In contrast, polynomial functions of even degree extend in the same direction.",
                    "The number of possible turning points in a polynomial graph is at most one less than the degree.",
                    "Real zeros of a polynomial function are the x-values where the graph crosses the x-axis.",
                    "Understanding these properties allows us to sketch graphs of polynomial functions without plotting every point."
                ]
            }
            Note: CORRECTLY excludes "Look at the next section for applications in real-world modeling" as it's navigational text without substantive content.

            Example 2 - Market Economics Concept:
            Learning Objective: "Analyze how different market structures affect price determination and competition"
            Sub-objectives:
            - "Explain the characteristics of different market structures"
            - "Compare perfect competition and monopolistic markets"
            - "Describe factors affecting market efficiency"
            Text:
            """
            Market structure refers to the competitive environment in which firms operate and interact with each other and consumers. The four main types of market structures are perfect competition, monopolistic competition, oligopoly, and monopoly. Each structure has distinct characteristics that influence pricing strategies and competitive behaviors.

            Perfect competition exists when there are many sellers offering identical products, with no barriers to entry or exit. In perfectly competitive markets, firms are price takers, meaning they must accept the prevailing market price. The market price is determined by the intersection of supply and demand curves. Let's examine how this process establishes equilibrium.

            Monopolistic markets feature a single seller that controls the entire supply of a good or service with no close substitutes. Monopolists are price makers who can set prices above marginal cost, resulting in economic inefficiency. The efficiency of markets depends on factors such as information availability, externalities, and government regulations. Now, let's move on to other market structures. Price discrimination and barriers to entry are two strategies monopolists use to maintain market power.
            """
            Good Response:
            {
                "referenceSentences": [
                    "Market structure refers to the competitive environment in which firms operate and interact with each other and consumers.",
                    "The four main types of market structures are perfect competition, monopolistic competition, oligopoly, and monopoly.",
                    "Each structure has distinct characteristics that influence pricing strategies and competitive behaviors.",
                    "Perfect competition exists when there are many sellers offering identical products, with no barriers to entry or exit.",
                    "In perfectly competitive markets, firms are price takers, meaning they must accept the prevailing market price.",
                    "The market price is determined by the intersection of supply and demand curves.",
                    "Monopolistic markets feature a single seller that controls the entire supply of a good or service with no close substitutes.",
                    "Monopolists are price makers who can set prices above marginal cost, resulting in economic inefficiency.",
                    "The efficiency of markets depends on factors such as information availability, externalities, and government regulations.",
                    "Price discrimination and barriers to entry are two strategies monopolists use to maintain market power."
                ]
            }
            Note: CORRECTLY excludes "Let's examine how this process establishes equilibrium" and "Now, let's move on to other market structures" as they are navigational phrases without substantive content.

            Bad Response Examples:
            1. Including Navigation Text:
            {
                "referenceSentences": [
                    "Let's examine how this process works.", // BAD: pure navigation with no content
                    "Now, let's move on to other cellular processes.", // BAD: pure navigation
                    "Look at the next section for applications in real-world modeling." // BAD: navigation text
                ]
            }
            Problem: Includes text that doesn't teach substantive content.

            2. Missing Critical Content:
            {
                "referenceSentences": [
                    "Monopolistic markets feature a single seller that controls the entire supply of a good or service with no close substitutes.",
                    "Price discrimination and barriers to entry are two strategies monopolists use to maintain market power."
                ]
            }
            Problem: Missing critical sentences about passive transport, which is essential for comparing transport mechanisms.

            3. Modified Unicode and Special Characters:
            Text: "The currency exchange rate was £1 = €1.18 ≈ $1.30, with a ±0.5% daily fluctuation range."
            Bad Response: 
            {
                "referenceSentences": [
                    "The currency exchange rate was GBP 1 = EUR 1.18 approximately USD 1.30, with a plus/minus 0.5% daily fluctuation range." // BAD: replaced special characters with text equivalents
                ]
            }
            Good Response:
            {
                "referenceSentences": [
                    "The currency exchange rate was £1 = €1.18 ≈ $1.30, with a ±0.5% daily fluctuation range." // GOOD: preserves exact special characters and symbols
                ]
            }
            Problem: Modifies special characters and Unicode symbols rather than preserving the exact text
            `)}
        </Block>
    </>;
};

export const FindPrerequisitesPrompt = ({ lessonGroup, lessonGroups, chunks, maxPrerequisites = 10 }: {
    lessonGroup: { 
        lessonName: string;
        cluster: Array<{ learningObjective: string; referenceSentences?: string[] }>;
    };
    lessonGroups: Array<{ 
        lessonName: string;
        cluster: Array<{ learningObjective: string; referenceSentences?: string[] }>;
    }>;
    chunks: string[];
    maxPrerequisites?: number;
}): Priompt.PromptElement => {
    const schemaExample = trimLines(`{
    "prerequisites": ["string"] // Maximum ${maxPrerequisites} prerequisites allowed
}`);

    return <>
        <Block name="CONTEXT">
            {trimLines(`
            Your task is to identify the DIRECT prerequisites for a given lesson.
            A prerequisite lesson is one that MUST be completed BEFORE the student can successfully complete the current lesson.
            You are building a knowledge graph where each lesson may depend on other lessons, but we STRICTLY want ONLY DIRECT (one-level) dependencies.
            
            IMPORTANT: Focus on LEARNING OBJECTIVES within each lesson, not just the lesson names. Examine what concepts and skills are being taught.
            
            Prerequisite relationships should be determined based on:
            1. Content relationships and concept dependencies
            2. Natural learning progression (what needs to be understood first)
            3. Subject matter connections and shared terminology
            4. References to concepts across different lessons
            
            STRICT LIMIT: No lesson may have more than ${maxPrerequisites} prerequisites.
            
            You will be PENALIZED for:
            1. Missing important concept relationships between lessons
            2. Including prerequisites without clear evidence of dependency
            3. Including indirect prerequisites or lessons not in the provided list
            4. Creating cyclic dependencies
            5. Having more than ${maxPrerequisites} prerequisites
            `)}
        </Block>

        <Block name="TASK">
            {trimLines(`
            Analyze the learning objectives within the current lesson and other available lessons to determine appropriate DIRECT prerequisites.
            
            KEY PROCESS TO FOLLOW:
            1. Review each learning objective in the current lesson carefully
            2. For each concept mentioned, identify lessons that teach foundational or prerequisite concepts
            3. Look for shared terminology, related concepts, and natural learning sequences
            4. Include lessons that cover concepts that logically need to be understood first
            5. For lessons with "Analyze" or "Evaluate" objectives, ensure appropriate foundational lessons are included
            
            IMPORTANT CONSIDERATIONS: 
            1. Look beyond lesson names to examine the actual learning objectives and content
            2. Consider relationships between subject matter - what naturally needs to be learned first?
            3. Pay attention to reference sentences that may indicate connections between topics
            4. For chemistry topics, be generous in connecting related concepts (reactions, kinetics, catalysts)
            5. Strike a balance between including all necessary prerequisites and avoiding unrelated content
            `)}
        </Block>

        <Block name="CURRENT_LESSON">
            {trimLines(`
            LESSON_NAME: ${lessonGroup.lessonName}
            LEARNING_OBJECTIVES:
            ${lessonGroup.cluster.map(obj => `- ${obj.learningObjective}\n  REFERENCE_SENTENCES: ${obj.referenceSentences?.join(' ')}`).join('\n')}
            `)}
            <br />
            <Block name="ALL_RELEVANT_TEXT">
                {trimLines(chunks.join('\n'))}
            </Block>
        </Block>

        <Block name="AVAILABLE_LESSONS">
            IMPORTANT: You can ONLY use lessons from this list as prerequisites. Any other lessons will result in a PENALTY.
            {lessonGroups.map(lesson =>
                <Block name="LESSON">
                    {trimLines(`
                        LESSON_NAME: ${lesson.lessonName}
                        LEARNING_OBJECTIVES:
                        ${lesson.cluster.map(obj => `- ${obj.learningObjective}\n  REFERENCE_SENTENCES: ${obj.referenceSentences?.join(' ')}`).join('\n')}
                    `)}
                </Block>
            )}
        </Block>

        <Block name="FORMAT">
            {trimLines(`
            Return a JSON object with an array of prerequisites. Each prerequisite MUST:
            1. Be a lesson name from the AVAILABLE_LESSONS list ONLY
            2. Be a DIRECT prerequisite (one level only)
            3. Match the exact text of the original lesson's name
            4. Have clear evidence from the content supporting the prerequisite relationship
            5. Be truly necessary for completing the current lesson

            The output should be valid JSON matching this schema:
            ${schemaExample}
            `)}
        </Block>

        <Block name="GUIDELINES">
            {trimLines(`
            PRACTICAL GUIDELINES:
            
            1. CONTENT RELATIONSHIPS
               - Look for lessons that teach concepts that are necessary foundations for the current lesson
               - Identify when one concept naturally builds upon another
               - Look for shared terminology or overlapping concepts
               - Consider what knowledge would be required to understand the current material

            
            2. LEARNING OBJECTIVES ANALYSIS
               - Examine the verbs used in learning objectives (define, explain, analyze, evaluate)
               - Connect foundational objectives (define, identify) to more advanced ones (analyze, evaluate)
               - Include prerequisites that teach concepts referenced in current learning objectives
               - For objectives about analyzing or evaluating a concept, include lessons that introduce that concept
               
            3. EVIDENCE-BASED DECISIONS
               - Base prerequisite relationships on clear evidence from learning objectives and content
               - Look for keywords and terminology that appear across different lessons
               - For chemistry concepts, terms like "reaction", "catalyst", "kinetics" indicate strong relationships
               - Use reference sentences to identify conceptual connections between lessons
            
            4. BALANCED APPROACH
               - Include enough prerequisites to ensure proper preparation (typically 2-3 for advanced topics)
               - Avoid over-connecting unrelated concepts
               - Focus on direct, immediate prerequisites rather than distant connections
               - Ensure prerequisites form a logical learning progression
            `)}
        </Block>

        <Block name="EXAMPLES">
            {trimLines(`
            Example 1:
            Current Lesson:
            LESSON_NAME: "Architectural design principles"
            LEARNING_OBJECTIVES:
            - "Analyze how structural elements support building integrity"
            - "Evaluate the relationship between form and function in architectural designs"

            Available Lessons:
            LESSON_NAME: "Foundations of building structures"
            LEARNING_OBJECTIVES:
            - "Define basic structural components in architecture"
            - "Identify load-bearing elements in construction"

            LESSON_NAME: "Architectural aesthetics and form"
            LEARNING_OBJECTIVES:
            - "Explain how aesthetic elements contribute to architectural design"
            - "Describe the relationship between materials and visual appeal"

            Good Response:
            {
                "prerequisites": [
                    "Foundations of building structures", 
                    "Architectural aesthetics and form"
                ]
            }
            Reasoning: 
            - Understanding basic structural components is necessary before analyzing how they support building integrity
            - Knowledge of architectural aesthetics is needed to evaluate form and function relationships
            - Both lessons cover foundational concepts referenced in the current lesson's objectives
            - This follows a logical learning progression in architectural studies

            Example 2:
            Current Lesson:
            LESSON_NAME: "Music composition techniques"
            LEARNING_OBJECTIVES:
            - "Create complex melodic structures using counterpoint principles"
            - "Analyze harmonic progressions in various musical styles"

            Available Lessons:
            LESSON_NAME: "Music theory fundamentals"
            LEARNING_OBJECTIVES:
            - "Define musical notation and basic terminology"
            - "Identify common chord structures and scales"

            LESSON_NAME: "Harmonics and chord progression"
            LEARNING_OBJECTIVES:
            - "Explain how chord progressions create emotional responses"
            - "Describe harmonic relationships between notes"

            Good Response:
            {
                "prerequisites": [
                    "Music theory fundamentals",
                    "Harmonics and chord progression"
                ]
            }
            Reasoning:
            - Understanding music notation and basic terminology is necessary before creating complex melodic structures
            - Knowledge of chord progressions is needed to analyze harmonic progressions in different styles
            - The current lesson builds upon concepts covered in both prerequisite lessons
            - This represents a natural learning sequence in music education
            `)}
        </Block>
    </>;
};

export const ResolveCyclicDependenciesPrompt = ({
    cycle,
    learningObjectives,
    chunks
}: {
    cycle: string[];
    learningObjectives: Array<{ learningObjective: string; referenceSentences?: string[] }>;
    chunks: string[];
}): Priompt.PromptElement => {
    const schemaExample = trimLines(`{
    "resolvedDependencies": [
        {
            "learningObjective": "string",
            "prerequisites": ["string"]
        }
    ]
}`);

    return <>
        <Block name="CONTEXT">
            {trimLines(`
            Your task is to resolve a cyclic dependency in a set of learning objectives.
            A cyclic dependency occurs when learning objectives form a circular prerequisite chain (e.g., A requires B, which requires C, which requires A).
            Such cycles are problematic because they create impossible learning sequences.
            
            You will be provided with:
            1. A cycle of learning objectives that form a circular dependency
            2. The reference sentences that support each learning objective
            3. The full content chunks for context
            
            Your goal is to break this cycle by:
            1. Analyzing the true prerequisite relationships based on the content
            2. Identifying which dependencies are strongest/most necessary
            3. Removing or redirecting the weakest dependencies to break the cycle
            4. Ensuring the final structure represents a valid learning sequence
            `)}
        </Block>

        <Block name="TASK">
            {trimLines(`
            Analyze the following cyclic dependency and propose a resolution:
            ${cycle.join(' -> ')} -> ${cycle[0]}

            For each learning objective in the cycle:
            1. Evaluate if its prerequisites are truly necessary based on the reference sentences
            2. Identify which dependencies are weakest (least supported by the content)
            3. Determine if any prerequisites can be removed or redirected
            4. Ensure any changes maintain pedagogical sense
            `)}
        </Block>

        <Block name="CURRENT_CYCLE">
            {cycle.map(objective => {
                const obj = learningObjectives.find(lo => lo.learningObjective === objective);
                return (
                    <Block name="OBJECTIVE">
                        {trimLines(`
                            OBJECTIVE: ${obj?.learningObjective}
                            REFERENCE_SENTENCES: ${obj?.referenceSentences?.join(' ')}
                        `)}
                    </Block>
                );
            })}
            <Block name="ALL_RELEVANT_TEXT">
                {trimLines(chunks.join('\n'))}
            </Block>
        </Block>

        <Block name="FORMAT">
            {trimLines(`
            Return a JSON object with an array of resolved dependencies. For each learning objective in the cycle:
            1. Keep only the prerequisites that are strongly supported by the reference sentences
            2. Remove or modify prerequisites to break the cycle
            3. Ensure the remaining prerequisites form a valid learning sequence

            The output should be valid JSON matching this schema:
            ${schemaExample}
            `)}
        </Block>

        <Block name="GUIDELINES">
            {trimLines(`
            CRITICAL RULES:
            1. EVIDENCE-BASED DECISIONS
               - Only keep prerequisites that have clear support in reference sentences
               - Remove dependencies that lack strong textual evidence
               - Document your reasoning in the reference sentences

            2. MAINTAIN LEARNING COHERENCE
               - Ensure changes preserve the logical progression of learning
               - Don't remove crucial prerequisites just to break cycles
               - Consider the cognitive level of each objective

            3. MINIMAL DISRUPTION
               - Make the minimum number of changes needed to break the cycle
               - Prefer removing weaker dependencies over stronger ones
               - Don't add new prerequisites not present in the original set

            4. PEDAGOGICAL VALIDITY
               - Ensure changes result in a sensible learning sequence
               - Maintain proper cognitive level progression
               - Keep foundational knowledge requirements intact

            5. NO NEW CYCLES
               - Verify your changes don't create new cyclic dependencies
               - Check that all modified relationships maintain a clear direction
               - Ensure the final structure is a proper directed acyclic graph
            `)}
        </Block>

        <Block name="EXAMPLES">
            {trimLines(`
            GOOD EXAMPLE 1 - Breaking a Simple Cycle:
            Cycle: "Define chemical equilibrium" -> "Explain equilibrium constants" -> "Define chemical equilibrium"
            Reference Sentences:
            - "Chemical equilibrium is a state where forward and reverse reaction rates are equal."
            - "Equilibrium constants (K) are calculated from concentrations at equilibrium."
            - "Understanding equilibrium is necessary to work with equilibrium constants."
            Resolution: Remove "Define chemical equilibrium" as a prerequisite of "Explain equilibrium constants"
            Reasoning: The definition is clearly a prerequisite for understanding constants, but not vice versa.

            GOOD EXAMPLE 2 - Redirecting Dependencies:
            Cycle: "Explain reaction mechanisms" -> "Analyze reaction intermediates" -> "Predict reaction products" -> "Explain reaction mechanisms"
            Reference Sentences:
            - "Reaction mechanisms show the step-by-step process including intermediates."
            - "Intermediates help predict the final products of a reaction."
            - "Understanding products requires knowledge of mechanisms."
            Resolution: Keep "mechanisms -> intermediates -> products" chain, remove "products -> mechanisms"
            Reasoning: The content shows a clear progression from mechanisms to products, making the reverse dependency unnecessary.

            BAD EXAMPLE 1 - Breaking Dependencies Without Evidence:
            Cycle: "Calculate pH" -> "Understand acid-base equilibria" -> "Calculate pH"
            Resolution: Remove all dependencies
            Reasoning: Wrong because it ignores the clear interdependence shown in the content. Should analyze which dependency is weaker based on reference sentences.

            BAD EXAMPLE 2 - Adding New Dependencies:
            Cycle: "Define catalysis" -> "Explain activation energy" -> "Define catalysis"
            Resolution: Add new prerequisite "Understand collision theory" to both
            Reasoning: Wrong because it introduces new prerequisites instead of resolving the existing cycle based on content.
            `)}
        </Block>
    </>;
};

export const RankLessonsPrompt = ({
    lessonGroups,
}: {
    lessonGroups: Array<{
        lessonName: string;
        cluster: Array<{
            learningObjective: string;
            referenceSentences?: string[];
        }>;
        prerequisites: string[];
    }>;
}): Priompt.PromptElement => {
    const schemaExample = trimLines(`{
    "rankedObjectives": ["string"]
}`);

    return <>
        <Block name="CONTEXT">
            {trimLines(`
            Your task is to analyze a set of interconnected lessons and determine their optimal learning sequence.
            These lessons are part of one or more cycles in their prerequisite relationships, which you'll use to inform your ranking.
            You need to break these cycles by determining the most logical order in which these lessons should be taught.
            
            CRITICAL: You MUST output EXACTLY the same lesson names that were provided, with NO modifications to their text.
            You will be HEAVILY PENALIZED for:
            1. Modifying any lesson name, even slightly
            2. Omitting any lessons from the output
            3. Adding lessons that weren't in the input
            4. Changing the case, punctuation, or any characters of the lesson names
            
            You will be provided with:
            1. A set of lessons that form part of one or more cycles
            2. The learning objectives and reference sentences for each lesson
            3. The current prerequisites for each lesson
            
            Your goal is to:
            1. Analyze the content and cognitive complexity of each lesson's learning objectives
            2. Use the prerequisite relationships to understand current dependencies
            3. Determine which lessons cover more fundamental concepts and should be taught first
            4. Create a strict linear ordering that represents the optimal teaching sequence
            5. Ensure the ordering respects the natural progression of learning
            6. Output EXACTLY the same lesson names in the optimal order
            `)}
        </Block>

        <Block name="TASK">
            {trimLines(`
            Analyze the following lessons and create a strict linear ordering:

            For each lesson:
            1. Evaluate its fundamental nature - which lessons teach prerequisites for others?
            2. Assess its cognitive complexity - which lessons require more advanced understanding?
            3. Analyze the content relationships - how do these lessons build upon each other?
            4. Consider the pedagogical sequence - what is the most effective order for teaching?
            5. Study its current prerequisites and cycle involvement
            
            REMEMBER: You must output EXACTLY the same lesson names, in the exact same format they were provided.
            `)}
        </Block>

        <Block name="LESSONS">
            {lessonGroups.map((lesson, index) => (
                <Block name={`LESSON_${index}`}>
                    {trimLines(`
                        LESSON: ${lesson.lessonName}
                        LEARNING_OBJECTIVES: ${lesson.cluster.map(obj => obj.learningObjective).join('\n')}
                        REFERENCE_SENTENCES: ${lesson.cluster.map(obj => obj.referenceSentences?.join(' ')).filter(Boolean).join('\n')}
                        CURRENT_PREREQUISITES: ${lesson.prerequisites.join(', ')}
                    `)}
                </Block>
            ))}
        </Block>

        <Block name="FORMAT">
            {trimLines(`
            Return a JSON object with an array of lesson names in their optimal teaching order.
            The first lesson should cover the most fundamental concepts that should be taught first.
            Each subsequent lesson should build upon the previous ones.

            CRITICAL REQUIREMENTS:
            1. Each lesson name MUST be an EXACT copy of one from the input
            2. ALL lessons from the input MUST be included
            3. NO additional lessons may be added
            4. NO modifications to lesson names are allowed

            The output should be valid JSON matching this schema:
            ${schemaExample}
            `)}
        </Block>

        <Block name="GUIDELINES">
            {trimLines(`
            CRITICAL RULES:
            1. EXACT MATCHING - STRICTLY ENFORCED
               - Copy lesson names EXACTLY as provided - no changes allowed
               - Maintain exact spacing, punctuation, and capitalization
               - Do not combine, split, or modify lessons in any way
               - You will be HEAVILY PENALIZED for any modifications

            2. COMPLETENESS - STRICTLY ENFORCED
               - Include ALL provided lessons in the ranking
               - Do not skip any lessons
               - Do not add new lessons
               - You will be HEAVILY PENALIZED for missing lessons

            3. FUNDAMENTAL FIRST
               - Place lessons covering more basic, foundational concepts earlier in the sequence
               - Look for lessons that define or introduce core concepts
               - Consider which knowledge is prerequisite for understanding later lessons

            4. COGNITIVE PROGRESSION
               - Follow Bloom's Taxonomy progression where possible
               - Order lessons from lower to higher cognitive levels:
                 * Remember/Define/List (lowest)
                 * Understand/Explain/Describe
                 * Apply/Implement
                 * Analyze/Compare
                 * Evaluate/Assess (highest)

            5. CONTENT RELATIONSHIPS
               - Use learning objectives and reference sentences to identify natural dependencies
               - Look for lessons that build upon or extend concepts from other lessons
               - Consider which concepts are referenced or assumed by others

            6. PEDAGOGICAL COHERENCE
               - Ensure each lesson in the sequence builds logically on previous lessons
               - Avoid jumps that skip necessary intermediate concepts
               - Create a smooth progression of difficulty

            7. NO TIES
               - Provide a strict linear ordering
               - Resolve any apparent ties by analyzing subtle differences
               - Use content relationships to break ties when cognitive levels are equal
            `)}
        </Block>

        <Block name="EXAMPLES">
            {trimLines(`
            GOOD EXAMPLE 1 - Programming Fundamentals:
            Input Lessons:
            1. "Advanced Error Handling in JavaScript"
                Learning Objectives: ["Implement error handling in asynchronous functions", "Handle complex error scenarios"]
                Prerequisites: ["Asynchronous Programming Basics", "JavaScript Promise Fundamentals"]
            2. "Asynchronous Programming Basics"
                Learning Objectives: ["Explain the concept of asynchronous programming", "Understand event loops"]
                Prerequisites: ["JavaScript Promise Fundamentals"]
            3. "JavaScript Promise Fundamentals"
                Learning Objectives: ["Define what a Promise is in JavaScript", "Create basic Promise chains"]
                Prerequisites: []

            Good Response:
            {
                "rankedObjectives": [
                    "JavaScript Promise Fundamentals",
                    "Asynchronous Programming Basics",
                    "Advanced Error Handling in JavaScript"
                ]
            }
            Reasoning: 
            - Places foundational Promise concepts first
            - Preserves the relationship where understanding async concepts helps with error handling
            - Follows cognitive progression from fundamental concepts to advanced applications
            - Breaks the cycle while maintaining the most important prerequisite relationships

            GOOD EXAMPLE 2 - Economics Course:
            Input Lessons:
            1. "Market Analysis and Equilibrium"
                Learning Objectives: ["Evaluate market equilibrium outcomes", "Analyze supply and demand interactions"]
                Prerequisites: ["Supply and Demand Fundamentals", "Price Elasticity Concepts"]
            2. "Supply and Demand Fundamentals"
                Learning Objectives: ["Define basic market principles", "Explain supply and demand curves"]
                Prerequisites: ["Price Elasticity Concepts"]
            3. "Price Elasticity Concepts"
                Learning Objectives: ["Apply price elasticity concepts", "Calculate elasticity coefficients"]
                Prerequisites: ["Supply and Demand Fundamentals"]

            Good Response:
            {
                "rankedObjectives": [
                    "Supply and Demand Fundamentals",
                    "Price Elasticity Concepts",
                    "Market Analysis and Equilibrium"
                ]
            }
            Reasoning:
            - Places foundational market concepts first
            - Creates a logical progression of concept complexity
            - Follows cognitive progression from basic definitions to analysis
            - Creates an effective teaching sequence

            BAD EXAMPLE 1 - Breaking Too Many Dependencies:
            Input Lessons:
            1. "Data Structure Performance"
                Learning Objectives: ["Analyze data structures performance", "Compare algorithm complexities"]
                Prerequisites: ["Basic Data Structures", "Algorithm Analysis"]
            2. "Basic Data Structures"
                Learning Objectives: ["Define common data structures", "Implement basic data structures"]
                Prerequisites: ["Data Structure Performance"]
            3. "Algorithm Analysis"
                Learning Objectives: ["Explain algorithm complexity", "Calculate Big O notation"]
                Prerequisites: ["Basic Data Structures"]

            Bad Response:
            {
                "rankedObjectives": [
                    "Algorithm Analysis",
                    "Data Structure Performance",
                    "Basic Data Structures"
                ]
            }
            Reasoning: WRONG because:
            - Places algorithm analysis before understanding basic data structures
            - Creates an illogical learning sequence
            - Could have preserved more natural dependencies with: "Basic Data Structures", "Algorithm Analysis", "Data Structure Performance"

            BAD EXAMPLE 2 - Ignoring Content Complexity:
            Input Lessons:
            1. "Machine Learning Basics"
                Learning Objectives: ["Define machine learning concepts", "Explain supervised learning"]
                Prerequisites: []
            2. "Neural Network Implementation"
                Learning Objectives: ["Implement neural networks", "Build training pipelines"]
                Prerequisites: ["Training Algorithm Analysis"]
            3. "Training Algorithm Analysis"
                Learning Objectives: ["Analyze training algorithms", "Evaluate model performance"]
                Prerequisites: ["Machine Learning Basics", "Neural Network Implementation"]

            Bad Response:
            {
                "rankedObjectives": [
                    "Neural Network Implementation",
                    "Machine Learning Basics",
                    "Training Algorithm Analysis"
                ]
            }
            Reasoning: WRONG because:
            - Places complex implementation before basic concepts
            - Ignores natural learning progression
            - Could have preserved better learning sequence with: "Machine Learning Basics", "Training Algorithm Analysis", "Neural Network Implementation"
            `)}
        </Block>
    </>;
};

export const GenerateLessonGroupsPrompt = ({
    learningObjectives
}: {
    learningObjectives: {
        learningObjective: string;
        referenceSentences: string[];
    }[];
}): Priompt.PromptElement => {
    const schemaExample = trimLines(`{
    "lessons": [{
        "lessonName": "string",
        "expectedDurationMinutes": number, // between 2 and 45 minutes
        "learningObjectives": string[] // subset of input learning objectives that belong together
    }]
}`);

    return <>
        <Block name="CONTEXT">
            {trimLines(`
            Your task is to organize learning objectives into coherent lesson groups and estimate their duration.
            
            GROUPING PHILOSOPHY:
            - Group objectives that naturally flow together and enhance each other's understanding
            - Keep objectives together if they share significant conceptual overlap
            - Split objectives if they cover distinct concepts or skills
            - Consider cognitive load and natural learning progression
            
            The duration should reflect the time needed for an average student to:
            1. Understand the concepts through instruction
            2. Practice and apply the knowledge
            3. Ask questions and receive clarification
            4. Complete basic exercises or activities
            `)}
        </Block>

        <Block name="EXAMPLES">
            {trimLines(`
            Example 1 - Good Grouping (Keep Together):
            Input Learning Objectives:
            1. {
                learningObjective: "Define chemical equilibrium and its characteristics",
                referenceSentences: [
                    "Chemical equilibrium occurs when forward and reverse reaction rates are equal.",
                    "At equilibrium, reactant and product concentrations remain constant over time."
                ]
            }
            2. {
                learningObjective: "Calculate equilibrium constants for chemical reactions",
                referenceSentences: [
                    "The equilibrium constant (Keq) represents the ratio of products to reactants at equilibrium.",
                    "Keq values indicate whether products or reactants are favored at equilibrium."
                ]
            }

            Good Response:
            {
                "lessons": [{
                    "lessonName": "Chemical Equilibrium Fundamentals",
                    "expectedDurationMinutes": 35,
                    "learningObjectives": [
                        "Define chemical equilibrium and its characteristics",
                        "Calculate equilibrium constants for chemical reactions"
                    ]
                }]
            }

            Explanation: These objectives work well together because:
            - The reference sentences show clear conceptual connections
            - Understanding equilibrium is necessary for working with equilibrium constants
            - The concepts build naturally on each other
            - Combined duration is reasonable for a single lesson

            Example 2 - Good Splitting (Separate Concepts):
            Input Learning Objectives:
            1. {
                learningObjective: "Explain the structure of DNA",
                referenceSentences: [
                    "DNA consists of two strands forming a double helix.",
                    "The strands are made up of nucleotides containing sugar, phosphate, and nitrogenous bases."
                ]
            }
            2. {
                learningObjective: "Describe the process of DNA replication",
                referenceSentences: [
                    "DNA replication begins with the separation of the double helix.",
                    "DNA polymerase synthesizes new strands using the original as templates."
                ]
            }
            3. {
                learningObjective: "Analyze mutations and their effects",
                referenceSentences: [
                    "Mutations are changes in DNA sequence that can affect protein function.",
                    "Different types of mutations include substitutions, insertions, and deletions."
                ]
            }

            Good Response:
            {
                "lessons": [
                    {
                        "lessonName": "DNA Structure and Replication",
                        "expectedDurationMinutes": 40,
                        "learningObjectives": [
                            "Explain the structure of DNA",
                            "Describe the process of DNA replication"
                        ]
                    },
                    {
                        "lessonName": "Understanding DNA Mutations",
                        "expectedDurationMinutes": 30,
                        "learningObjectives": [
                            "Analyze mutations and their effects"
                        ]
                    }
                ]
            }

            Explanation: This split is appropriate because:
            - Structure and replication are closely related and build on each other
            - Mutations represent a distinct concept that can be taught separately
            - Reference sentences show natural grouping of topics
            - Each lesson has a clear, focused theme

            Example 3 - Bad Grouping (Forcing Unrelated Topics):
            Input Learning Objectives:
            1. {
                learningObjective: "Explain photosynthesis in plants",
                referenceSentences: [
                    "Photosynthesis converts light energy into chemical energy.",
                    "The process produces glucose and oxygen from carbon dioxide and water."
                ]
            }
            2. {
                learningObjective: "Describe cellular respiration",
                referenceSentences: [
                    "Cellular respiration breaks down glucose to produce ATP.",
                    "The process requires oxygen and produces carbon dioxide and water."
                ]
            }
            3. {
                learningObjective: "Analyze plant growth factors",
                referenceSentences: [
                    "Plant growth depends on environmental factors like light, water, and nutrients.",
                    "Hormones regulate different aspects of plant development."
                ]
            }

            Bad Response:
            {
                "lessons": [
                    {
                        "lessonName": "Plant Biology Concepts",
                        "expectedDurationMinutes": 45,
                        "learningObjectives": [
                            "Explain photosynthesis in plants",
                            "Describe cellular respiration",
                            "Analyze plant growth factors"
                        ]
                    }
                ]
            }

            Why this is bad:
            - Tries to cover too many distinct processes in one lesson
            - Reference sentences show these are complex topics deserving separate focus
            - Topics, while related to plants, require different cognitive frameworks
            - Would be better split into "Energy Processes" (photosynthesis and respiration) and "Plant Growth and Development"
            `)}
        </Block>

        <Block name="TASK">
            {trimLines(`
            1. Analyze each learning objective and its reference sentences
            2. Look for natural groupings based on:
               - Conceptual relationships
               - Learning progression
               - Cognitive load
               - Time requirements
            3. Create lessons that:
               - Have clear thematic unity
               - Build knowledge effectively
               - Stay within the 45-minute limit
               - Make sense given the reference material
            4. Name each lesson to reflect its specific focus
            
            CRITICAL: Every learning objective from the input MUST appear in exactly one lesson's learningObjectives array.
            Do not drop any objectives, and do not duplicate any objectives across lessons.
            `)}
        </Block>

        <Block name="INPUT_DATA">
            ${learningObjectives.map((obj, i) => 
                <Block name={`LEARNING_OBJECTIVE_${i + 1}`}>
                    {trimLines(`
                    Learning Objective:
                    ${obj.learningObjective}
                    
                    Reference Sentences:
                    ${obj.referenceSentences.map((ref, i) => `${i + 1}. ${ref}`).join('\n')}
                    `)}
                </Block>
            )}
        </Block>

        <Block name="VALIDATION_RULES">
            {trimLines(`
            Before returning your response, verify that:
            1. Every learning objective from the input appears in exactly one lesson
            2. No learning objective appears in multiple lessons
            3. No learning objective has been dropped or omitted
            4. Each lesson's name reflects its specific focus
            5. Each lesson's duration is between 2 and 45 minutes
            6. Groupings make sense given the reference sentences
            `)}
        </Block>

        <Block name="OUTPUT_SCHEMA">
            {schemaExample}
        </Block>
    </>;
};

export default {
    GenerateLearningSummaryPrompt,
    ExtractReferenceSentencesPrompt,
    FindPrerequisitesPrompt,
    ExtractChunkLearningObjectivesPrompt,
    GroupLearningObjectivesPrompt,
    ResolveCyclicDependenciesPrompt,
    RankLessonsPrompt,
    GenerateLessonGroupsPrompt
};