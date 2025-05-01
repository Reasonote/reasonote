import { z } from 'zod';

import * as Priompt from '@anysphere/priompt';

import { AI } from '../../AI';
import {
  Document,
  DocumentChunk,
  HierarchicalAnalysisResult,
} from '../../docdb';
import { Block } from '../../prompt/AIPromptObj/PromptComponents';
import {
  priomptRenderToString,
} from '../../prompt/priomptUtils/priomptRenderToString';
import { createDocumentInfoWithSummaries } from './documentSummary';
import {
  DocumentInfo,
  DocumentInfoWithSummary,
  SkillDetails,
  SkillDetailsSchema,
  SuggestSkillArgs,
  SuggestSkillResult,
} from './types';

// Get embedding type from environment or use default
const EMBEDDING_TYPE = process.env.EMBEDDING_TYPE || 'openai/text-embedding-3-small';



/**
 * Approximate token count for a string
 * This is a simple approximation - in a real implementation, you would use a more accurate tokenizer
 * @param text The text to count tokens for
 * @returns Approximate token count
 */
function estimateTokenCount(text: string): number {
  // A very rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Schema for the skill analysis of each chunk group
const SkillChunkAnalysisSchema = z.object({
  relevantConcepts: z.array(z.string()).describe('Key concepts found in these chunks'),
  importantPoints: z.array(z.string()).describe('Important points or facts from these chunks'),
  courseRelevance: z.number().describe('How relevant these chunks are to a course (0-10)'),
});

// Schema for the final skill suggestion
const SkillSuggestionSchema = z.object({
  name: z.string().describe('A concise, descriptive name for the course'),
  description: z.string().describe('A brief description of what this course covers'),
  concepts: z.array(z.string()).describe('Key concepts this course encompasses'),
  level: z.enum(['beginner', 'intermediate', 'advanced']).describe('Difficulty level of the course'),
  goals: z.array(z.string()).describe('Learning objectives for the course'),
  emoji: z.string().describe('An emoji that represents the course'),
  relevance: z.number().describe('How relevant and coherent this course is (0-10)'),
});

type SkillChunkAnalysis = z.infer<typeof SkillChunkAnalysisSchema>;
type SkillSuggestion = z.infer<typeof SkillSuggestionSchema>;

/**
 * Suggests a skill based on user input and/or documents.
 * If documents are provided, the skill will be fully focused on those documents.
 * 
 * @param ai - The AI instance to use for generating the skill
 * @param args - The arguments for suggesting a skill
 * @returns The suggested skill details
 */
export async function suggestPartialSkill(
    ai: AI,
    args: SuggestSkillArgs
): Promise<SuggestSkillResult> {
    const { userInput, documents, docDB, docDBFilter, maxDocTokens = 10000, model = "openai:gpt-4o-mini" } = args;
    
    // If we have a docDB and hierarchical analysis is preferred, use that approach
    if (docDB && (docDBFilter || (documents && documents.length > 0))) {
      return await suggestSkillWithHierarchicalAnalysis(ai, args);
    }
    
    // Use the traditional approach
    try {
        let documentPromptSection = '';
        
        // Process documents if they exist
        if (documents?.length) {
            // If docDB is provided, use it for document processing
            if (docDB) {
                // Add documents to DocDB
                await docDB.addDocuments(documents.map(doc => ({
                    id: doc.pageId || doc.fileName,
                    fileName: doc.fileName,
                    content: doc.content,
                    metadata: {
                        tags: ['user-document'],
                        source: 'user-upload',
                        pageId: doc.pageId
                    }
                })));
                
                // Search for relevant chunks if userInput is provided
                if (userInput) {
                    const searchResult = await docDB.searchTextSimilarity({
                        query: userInput,
                        maxResults: 50, // Get more results than we might need to account for token limits
                        filter: docDBFilter
                    });
                    
                    // Format document chunks for prompt with token limit
                    documentPromptSection = formatDocumentChunksForPromptWithTokenLimit(
                        searchResult.chunks, 
                        searchResult.documents,
                        maxDocTokens
                    );
                } else {
                    // Without userInput, we'll just use the documents directly with token limit
                    documentPromptSection = formatDocumentsForPromptWithTokenLimit(documents, maxDocTokens);
                }
            } else {
                // If no docDB is provided, use the original document formatting with token limit
                documentPromptSection = formatDocumentsForPromptWithTokenLimit(documents, maxDocTokens);
            }
        } 
        // If no documents but docDB and docDBFilter are provided, use docDB to search
        else if (docDB && docDBFilter && userInput) {
            const searchResult = await docDB.searchTextSimilarity({
                query: userInput,
                maxResults: 50, // Get more results than we might need to account for token limits
                filter: docDBFilter
            });
            
            if (searchResult.chunks.length > 0) {
                // Format document chunks for prompt with token limit
                documentPromptSection = formatDocumentChunksForPromptWithTokenLimit(
                    searchResult.chunks, 
                    searchResult.documents,
                    maxDocTokens
                );
            }
        }
        
        // Construct the prompt
        const prompt = `
            <TASK>
            ${userInput ? 'Analyze the user\'s input' : ''}${userInput && documentPromptSection ? ' and ' : ''}${documentPromptSection ? 'analyze the provided documents' : ''} to generate:
            1. An appropriate skill name
            2. A brief description
            3. A difficulty level
            4. Any specific learning goals mentioned
            5. An emoji that represents the skill

            ${documentPromptSection ? `
            <IMPORTANT>
            If documents are provided, the skill should be FULLY focused on the content of these documents.
            - For a single document (like an Arxiv paper), create a skill that is entirely about mastering that specific paper.
            - For multiple documents, create a skill that captures the aggregate knowledge and themes across all documents.
            - The skill name, description, and goals should directly reflect the document content, not general topics.
            </IMPORTANT>
            ` : ''}

            ${userInput ? `User message: "${userInput}"` : ''}
            ${documentPromptSection}
            </TASK>

            <REQUIREMENTS>
            - Name: Create a clear, professional title (2-5 words)
            - Description: Write a concise overview focusing on the scope and value
            - Level: Classify as:
                * beginner (no prerequisites needed)
                * intermediate (basic knowledge required)
                * advanced (significant experience needed)
            - Goals: Extract or infer specific learning objectives
                * If user mentions specific goals, include them
                * If user mentions "want to be able to" or similar phrases, convert to goals
                * If documents contain learning objectives, include them
                * If no goals mentioned, return 2 basic suggested goals
            - Default to beginner level if unclear
            - Avoid phrases like "learn", "master", "course", or "you will"
            - Emoji: Return an emoji that represents the skill
            ${documentPromptSection ? '- When documents are provided, the skill MUST be entirely focused on the document content - not general topics' : ''}
            ${documentPromptSection && documents?.length === 1 ? '- For a single document, create a skill specifically about mastering that document\'s content' : ''}
            ${documentPromptSection && documents?.length && documents.length > 1 ? '- For multiple documents, create a skill that captures the collective knowledge across all documents' : ''}
            </REQUIREMENTS>

            <EXAMPLES>
            <EXAMPLE>
            Topic: "python for beginners"
            {
                "skillName": "Python Programming Basics",
                "description": "Core Python concepts and syntax for building simple applications and scripts.",
                "level": "beginner",
                "goals": [
                    "Understand basic Python syntax",
                    "Write simple programs"
                ],
                "emoji": "🐍"
            }
            </EXAMPLE>

            <EXAMPLE>
            Document: "Introduction to Data Structures.pdf:
            This comprehensive guide covers fundamental data structures including arrays, linked lists, trees, and graphs. Topics include time complexity analysis, implementation strategies, and optimization techniques..."
            {
                "skillName": "Data Structures Fundamentals",
                "description": "Essential data organization patterns and algorithmic concepts for efficient programming.",
                "level": "intermediate",
                "goals": [
                    "Implement basic data structures",
                    "Analyze algorithmic complexity",
                    "Apply optimization techniques"
                ],
                "emoji": "🌳"
            }
            </EXAMPLE>

            <EXAMPLE>
            Document: "Attention Is All You Need.pdf:
            We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train..."
            {
                "skillName": "Transformer Architecture",
                "description": "Deep dive into the groundbreaking Transformer model that revolutionized NLP through attention mechanisms.",
                "level": "advanced",
                "goals": [
                    "Understand attention mechanisms in the Transformer",
                    "Analyze the architecture's advantages over RNNs",
                    "Implement key components of the Transformer model"
                ],
                "emoji": "🤖"
            }
            </EXAMPLE>

            <EXAMPLE>
            Multiple Documents:
            Document 1: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding.pdf:
            We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. BERT is designed to pre-train deep bidirectional representations from unlabeled text..."
            
            Document 2: "GPT-3: Language Models are Few-Shot Learners.pdf:
            We demonstrate that scaling language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches..."
            {
                "skillName": "Modern NLP Architectures",
                "description": "Comprehensive study of transformer-based language models that have defined the current state of natural language processing.",
                "level": "advanced",
                "goals": [
                    "Compare BERT's bidirectional approach with GPT's unidirectional design",
                    "Analyze pre-training and fine-tuning strategies across models",
                    "Understand few-shot learning capabilities in large language models"
                ],
                "emoji": "📚"
            }
            </EXAMPLE>
            </EXAMPLES>
            `;
        
        // Log the prompt for debugging
        console.log('suggestPartialSkill prompt:', prompt);

        // Generate skill details using AI
        const aiResponse = await ai.genObject({
            schema: SkillDetailsSchema,
            prompt,
            model,
            mode: 'json',
            providerArgs: {
                structuredOutputs: true,
            },
        });

        return {
            skillDetails: aiResponse.object as SkillDetails,
        };
    } catch (error) {
        console.error('Error in suggestPartialSkill:', error);
        throw error;
    }
}

/**
 * Priompt component for rendering skill chunk analyses
 */
const AnalysesSection = ({ analysisResult }: { analysisResult: HierarchicalAnalysisResult<{
  relevantConcepts: string[];
  importantPoints: string[];
  courseRelevance: number;
}> }): Priompt.PromptElement => {
  return (
    <Block name="ANALYSES">
      {analysisResult.chunkAnalyses.map((analysis, index: number) => {
        const { relevantConcepts, importantPoints, courseRelevance } = analysis.analysis;
        
        return (
          <Block name={`ANALYSIS-${index}`} attributes={{ relevance: String(courseRelevance), fromDocuments: analysis.chunks.map(chunk => chunk.documentId).join(',') }}>
            <Block name="CONCEPTS">
              {relevantConcepts.join('\n')}
            </Block>
            <Block name="POINTS">
              {importantPoints.join('\n')}
            </Block>
          </Block>
        );
      })}
    </Block>
  );
};

/**
 * Priompt component for user input section
 */
const UserInputSection = ({ userInput }: { userInput?: string }): Priompt.PromptElement | null => {
  if (!userInput) {
    return null;
  }
  
  return (
    <Block name="USER_INPUT">
      {userInput}
    </Block>
  );
};

/**
 * Priompt component for instructions section
 */
const InstructionsSection = ({ documentSummaries }: { documentSummaries: DocumentInfoWithSummary[] }): Priompt.PromptElement => {
  const isSingleDocument = documentSummaries.length === 1;
  
  return (
    <Block name="INSTRUCTIONS">
      {isSingleDocument ? `
        - IMPORTANT: Since only one document is provided ("${documentSummaries[0].title}"), use this EXACT title as the skill name
        - Assume the user wants to study this specific content in great detail
        - The learning goals should focus specifically on mastering the concepts in this document
      ` : ''}
      {`
        - Create a coherent course that encompasses the most important concepts from the analyses
        - The course should be specific enough to be useful but broad enough to cover related concepts
        - Prioritize concepts that appear in multiple analyses or have high relevance scores
        - If user input is provided, ensure the course aligns with the user's interests
        - Provide a concise name, brief description, and list of key concepts
        - In the description, focus on the subject matter without explicitly mentioning that it's a "course" or "skill"
        - Determine an appropriate difficulty level (beginner, intermediate, or advanced)
        - Create 2-4 specific learning goals based on the content
        - Select an appropriate emoji that represents the course content
      `}
    </Block>
  );
};

/**
 * Priompt component for examples section
 */
const ExamplesSection = ({ documentSummaries }: { documentSummaries: DocumentInfoWithSummary[] }): Priompt.PromptElement => {
  const isSingleDocument = documentSummaries.length === 1;
  
  return (
    <Block name="EXAMPLES">
      {isSingleDocument ? (
        <Block name="EXAMPLE-SINGLE-DOCUMENT">
          {`Document: "Triple Integrals In Calculus"
          {
            "name": "Triple Integrals In Calculus",
            "description": "Comprehensive study of triple integrals in multivariable calculus, including rectangular, cylindrical, and spherical coordinate systems.",
            "concepts": ["Triple Integrals", "Multivariable Calculus", "Volume Calculation", "Coordinate Systems"],
            "level": "advanced",
            "goals": [
              "Apply triple integrals to calculate volumes and masses",
              "Convert between coordinate systems for integration",
              "Solve complex multivariable calculus problems"
            ],
            "emoji": "🧮",
            "relevance": 10
          }`}
        </Block>
      ) : (
        <>
          <Block name="EXAMPLE-1">
            {`Topic: "python for beginners"
            {
              "name": "Python Programming Basics",
              "description": "Core Python concepts and syntax for building simple applications and scripts.",
              "concepts": ["Variables", "Data Types", "Control Flow", "Functions", "Modules"],
              "level": "beginner",
              "goals": [
                "Understand basic Python syntax",
                "Write simple programs",
                "Use Python libraries"
              ],
              "emoji": "🐍",
              "relevance": 9
            }`}
          </Block>

          <Block name="EXAMPLE-2">
            {`Document: "Introduction to Data Structures"
            {
              "name": "Data Structures Fundamentals",
              "description": "Essential data organization patterns and algorithmic concepts for efficient programming.",
              "concepts": ["Arrays", "Linked Lists", "Trees", "Graphs", "Time Complexity"],
              "level": "intermediate",
              "goals": [
                "Implement basic data structures",
                "Analyze algorithmic complexity",
                "Apply optimization techniques"
              ],
              "emoji": "🌳",
              "relevance": 8
            }`}
          </Block>
        </>
      )}
    </Block>
  );
};


/**
 * Priompt component for documents section
 */
const DocumentSummariesSection = ({ documents }: { 
  documents: DocumentInfoWithSummary[] 
}): Priompt.PromptElement => {
  return (
    <Block name="DOCUMENTS">
      <br/>
      {documents.map((doc, index) => (
        <Block name={`DOCUMENT-${index}`} attributes={{ id: doc.id, title: doc.title, fileName: doc.fileName }}>
          <Block name="SUMMARY">
            {doc.summary}
          </Block>
          <br/>
          <Block name="TOTAL_CHUNKS">
            {doc.totalChunks} chunks analyzed from this document
          </Block>
        </Block>
      ))}
    </Block>
  );
};

/**
 * Main Priompt component for skill suggestion prompt
 */
const SkillSuggestionPrompt = ({ 
  analysisResult, 
  userInput,
  documentSummaries
}: { 
  analysisResult: any;
  userInput?: string;
  documentSummaries: DocumentInfoWithSummary[];
}): Priompt.PromptElement => {
  const isSingleDocument = documentSummaries.length === 1;
  
  return (
    <>
      <Block name="TASK">
        Create a course suggestion based on the following analyses of document chunks.
        {isSingleDocument && (
          <Block name="SINGLE_DOCUMENT_INSTRUCTION">
            Since only one document is provided, create a skill that is focused entirely on mastering the content of this specific document. Use the document's exact title as the skill name.
          </Block>
        )}
        <br/>
        <DocumentSummariesSection documents={documentSummaries} />
        <br/>
        <AnalysesSection analysisResult={analysisResult} />
        <br/>
        <UserInputSection userInput={userInput} />
      </Block>
      <br/>
      <InstructionsSection documentSummaries={documentSummaries} />
      <br/>
      <ExamplesSection documentSummaries={documentSummaries} />
    </>
  );
};

/**
 * Suggests a skill using hierarchical analysis of document chunks
 */
async function suggestSkillWithHierarchicalAnalysis(
  ai: AI,
  args: SuggestSkillArgs
): Promise<SuggestSkillResult> {
  const { userInput, documents, docDB, docDBFilter, maxDocTokens = 10000, model = "openai:gpt-4o-mini" } = args;
  
  if (!docDB) {
    throw new Error("DocDB is required for hierarchical analysis");
  }
  
  // Add any provided documents to the docDB first
  if (documents && documents.length > 0) {
    // Pass the documents directly to addDocuments without transforming them
    await docDB.addDocuments(documents.map(doc => ({
      id: doc.pageId || doc.fileName,
      fileName: doc.fileName,
      content: doc.content,
      metadata: { 
        pageId: doc.pageId,
        tags: ['user-document'],
        source: 'user-upload'
      }
    })));
  }

  console.log('Using hierarchical analysis with docDBFilter:', docDBFilter);
  
  // Step 1: Analyze chunks hierarchically
  const analysisResult = await docDB.analyzeChunksHierarchically({
    question: "identify potential course concepts and important information",
    schema: SkillChunkAnalysisSchema,
    filter: docDBFilter,
    model,
    maxTokens: maxDocTokens
  });
  
  // Step 2: Process documents and generate titles using AI
  const documentSummaries = await createDocumentInfoWithSummaries(ai, analysisResult, model);
 
  // Step 3: Construct the complete prompt using Priompt components with actual document summaries
  const promptElement = <SkillSuggestionPrompt 
    analysisResult={analysisResult}
    userInput={userInput}
    documentSummaries={documentSummaries}
  />;
  
  // Render the prompt
  const prompt = await priomptRenderToString(promptElement);
  
  console.log('prompt:', prompt);


  // Generate the final skill suggestion
  const result = await ai.genObject({
    schema: SkillSuggestionSchema,
    prompt,
    model,
    mode: 'json',
    providerArgs: {
      structuredOutputs: true,
    },
  });
  
  const skillSuggestion = result.object as SkillSuggestion;
  
  // Convert to the expected SkillDetails format
  const skillDetails: SkillDetails = {
    skillName: skillSuggestion.name,
    description: skillSuggestion.description,
    level: skillSuggestion.level,
    goals: skillSuggestion.goals,
    emoji: skillSuggestion.emoji
  };
  
  return {
    skillDetails
  };
}

/**
 * Helper function to format document chunks for prompt with token limit
 */
function formatDocumentChunksForPromptWithTokenLimit(
    chunks: DocumentChunk[], 
    documents: Map<string, Document>,
    maxTokens: number
): string {
    let totalTokens = 0;
    const includedChunks: DocumentChunk[] = [];
    
    // Sort chunks by relevance (assuming they're already sorted)
    for (const chunk of chunks) {
        const tokenCount = estimateTokenCount(chunk.content);
        
        // Check if adding this chunk would exceed the token limit
        if (totalTokens + tokenCount <= maxTokens) {
            includedChunks.push(chunk);
            totalTokens += tokenCount;
        } else {
            // Stop once we hit the token limit
            break;
        }
    }
    
    // Format the included chunks
    return `
    <PROVIDED_DOCUMENTS>
    ${includedChunks.map((chunk, index) => {
        const document = documents.get(chunk.documentId);
        return `
        <DOCUMENT-${index} fileName="${document?.fileName}">
            ${chunk.content}
        </DOCUMENT-${index}>
        `;
    }).join('\n')}
    </PROVIDED_DOCUMENTS>
    `;
}

/**
 * Helper function to format documents for prompt with token limit
 */
function formatDocumentsForPromptWithTokenLimit(
    documents: DocumentInfo[],
    maxTokens: number
): string {
    let totalTokens = 0;
    const formattedDocs: string[] = [];
    
    for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        // For each document, try to include as much content as possible within the token limit
        let contentToInclude = doc.content;
        const fullContentTokens = estimateTokenCount(contentToInclude);
        
        // If the full content exceeds the remaining token budget, truncate it
        if (totalTokens + fullContentTokens > maxTokens) {
            // Calculate how many tokens we have left
            const remainingTokens = maxTokens - totalTokens;
            // Approximate character count based on token estimate
            const approximateCharCount = remainingTokens * 4;
            // Truncate the content
            contentToInclude = doc.content.slice(0, approximateCharCount) + '...';
        }
        
        const formattedDoc = `
        <DOCUMENT-${i} fileName="${doc.fileName}">
            ${contentToInclude}
        </DOCUMENT-${i}>
        `;
        
        const docTokens = estimateTokenCount(formattedDoc);
        
        // Check if adding this document would exceed the token limit
        if (totalTokens + docTokens <= maxTokens) {
            formattedDocs.push(formattedDoc);
            totalTokens += docTokens;
        } else {
            // Stop once we hit the token limit
            break;
        }
    }
    
    return `
    <PROVIDED_DOCUMENTS>
    ${formattedDocs.join('\n')}
    </PROVIDED_DOCUMENTS>
    `;
}

/**
 * Helper function to format document chunks for prompt (without token limit)
 */
function formatDocumentChunksForPrompt(chunks: DocumentChunk[], documents: Map<string, Document>): string {
    return formatDocumentChunksForPromptWithTokenLimit(chunks, documents, 10000);
}

export * from './types';