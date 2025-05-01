import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { AI } from '../../AI';
import { createDefaultStubAI } from '../../DefaultStubAI';
import {
  Document,
  DocumentChunk,
  HierarchicalAnalysisResult,
} from '../../docdb';
import { TestDocDB } from '../../docdb/TestDocDB';
import { createDocumentInfoWithSummaries } from './documentSummary';

// Create a real AI instance for testing
let realAI: AI;

// Sample document content
const sampleDocContents = {
  introToML: `
# Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that focuses on developing systems that learn from data.
It involves algorithms that can improve automatically through experience and by the use of data.

## Supervised Learning

Supervised learning is a type of machine learning where the algorithm learns from labeled training data.
The algorithm makes predictions based on the input data and is corrected when those predictions are wrong.

Common supervised learning algorithms include:
- Linear Regression
- Logistic Regression
- Decision Trees
- Support Vector Machines (SVM)
- Neural Networks

## Unsupervised Learning

Unsupervised learning is where the algorithm learns patterns from unlabeled data.
The system tries to learn the patterns and the structure from the data without any explicit instructions.

Popular unsupervised learning algorithms include:
- K-means Clustering
- Hierarchical Clustering
- Principal Component Analysis (PCA)
`,

  deepLearningNotes: `
Neural Networks and Deep Learning
--------------------------------

Deep learning uses neural networks with many layers to analyze data. 
Neural networks are inspired by the structure of the human brain.

Key Components:
1. Neurons - Basic processing units
2. Layers - Groups of neurons
   - Input Layer
   - Hidden Layers
   - Output Layer
3. Weights and Biases - Parameters that are adjusted during training
4. Activation Functions - Add non-linearity to the network

Popular architectures include:
- Convolutional Neural Networks (CNN) for image processing
- Recurrent Neural Networks (RNN) for sequential data
- Transformers for natural language processing

The backpropagation algorithm is used to train neural networks by updating weights based on error gradients.
`,

  pythonBasics: `
def hello_world():
    print("Hello, World!")

# Variables and data types
name = "John"  # string
age = 30       # integer
height = 5.9   # float
is_student = True  # boolean

# Lists
fruits = ["apple", "banana", "cherry"]
fruits.append("orange")
print(fruits[0])  # Access first element

# Dictionaries
person = {
    "name": "John",
    "age": 30,
    "city": "New York"
}
print(person["name"])

# Loops
for fruit in fruits:
    print(fruit)

# Conditional statements
if age > 18:
    print("Adult")
else:
    print("Minor")

# Functions with parameters
def greet(name):
    return f"Hello, {name}!"

message = greet("Alice")
print(message)
`
};

// Create sample document chunks based on the content
function createSampleChunks(content: string, documentId: string, startPositions: number[] = []): DocumentChunk[] {
  // Split the content into chunks of roughly equal size
  const chunkSize = Math.ceil(content.length / (startPositions.length || 3));
  const chunks: DocumentChunk[] = [];
  
  // If startPositions are provided, use them; otherwise create evenly spaced chunks
  if (startPositions.length > 0) {
    for (let i = 0; i < startPositions.length; i++) {
      const start = startPositions[i];
      const end = i < startPositions.length - 1 ? startPositions[i + 1] : content.length;
      
      chunks.push({
        id: `${documentId}-chunk-${i}`,
        documentId,
        content: content.substring(start, end),
        startPosition: start,
        endPosition: end,
        metadata: {
          page: i + 1,
        },
      });
    }
  } else {
    // Create three chunks with sequential startPositions
    for (let i = 0; i < 3; i++) {
      const start = i * chunkSize;
      const end = Math.min((i + 1) * chunkSize, content.length);
      
      chunks.push({
        id: `${documentId}-chunk-${i}`,
        documentId,
        content: content.substring(start, end),
        startPosition: start,
        endPosition: end,
        metadata: {
          page: i + 1,
        },
      });
    }
  }
  
  return chunks;
}

describe('Document Summarization and Title Extraction', () => {
  beforeEach(async () => {
    // Create a real AI instance before each test
    realAI = await createDefaultStubAI();
  });

  it('should extract titles and summaries from document chunks', async () => {
    // Create documents
    const mlDocument: Document = {
      id: 'doc-ml',
      fileName: 'intro_to_ml.md',
      content: sampleDocContents.introToML,
      metadata: {}
    };
    
    const dlDocument: Document = {
      id: 'doc-dl',
      fileName: 'deep_learning_notes.txt',
      content: sampleDocContents.deepLearningNotes,  // Add content property
      metadata: { title: 'Deep Learning Notes' } // This one has an explicit title
    };
    
    const pyDocument: Document = {
      id: 'doc-py',
      fileName: 'python_snippets.py',
      content: sampleDocContents.pythonBasics,
      metadata: {}
    };
    
    // Create document map
    const documents = new Map<string, Document>([
      [mlDocument.id, mlDocument],
      [dlDocument.id, dlDocument],
      [pyDocument.id, pyDocument]
    ]);
    
    // Create chunks
    const mlChunks = createSampleChunks(sampleDocContents.introToML, mlDocument.id, [0, 300, 600]);
    const dlChunks = createSampleChunks(sampleDocContents.deepLearningNotes, dlDocument.id);
    const pyChunks = createSampleChunks(sampleDocContents.pythonBasics, pyDocument.id, [0, 200, 400]);
    
    // Create analysis result
    const mockAnalysisResult: HierarchicalAnalysisResult<any> = {
      chunkAnalyses: [
        {
          chunks: mlChunks,
          analysis: {
            relevantConcepts: ['Machine Learning', 'Supervised Learning', 'Algorithms'],
            importantPoints: ['Machine learning uses data to improve', 'Supervised learning uses labeled data'],
            courseRelevance: 9
          }
        },
        {
          chunks: dlChunks,
          analysis: {
            relevantConcepts: ['Neural Networks', 'Deep Learning', 'Layers'],
            importantPoints: ['Neural networks are inspired by the brain', 'Deep learning uses multiple layers'],
            courseRelevance: 8
          }
        },
        {
          chunks: pyChunks,
          analysis: {
            relevantConcepts: ['Python', 'Programming', 'Functions'],
            importantPoints: ['Python is a versatile language', 'Functions are defined with def keyword'],
            courseRelevance: 7
          }
        }
      ],
      documents
    };
    
    // Call the function to test
    const documentInfos = await createDocumentInfoWithSummaries(realAI, mockAnalysisResult);
    
    // Assertions
    expect(documentInfos).toHaveLength(3);
    
    // Check ML document
    const mlInfo = documentInfos.find((d: { id: string }) => d.id === 'doc-ml');
    expect(mlInfo).toBeDefined();
    expect(typeof mlInfo?.title).toBe('string');
    expect(mlInfo?.title.length).toBeGreaterThan(0);
    expect(mlInfo?.summary).toContain('Machine learning');
    expect(mlInfo?.summary).toContain('...');  // Should indicate truncation
    expect(mlInfo?.totalChunks).toBe(3);
    
    // Check DL document
    const dlInfo = documentInfos.find((d: { id: string }) => d.id === 'doc-dl');
    expect(dlInfo).toBeDefined();
    expect(dlInfo?.title).toBe('Deep Learning Notes');  // Should use the metadata title
    expect(dlInfo?.summary).toContain('Neural Networks');
    expect(dlInfo?.summary).toContain('...');
    expect(dlInfo?.totalChunks).toBe(3);
    
    // Check Python document
    const pyInfo = documentInfos.find((d: { id: string }) => d.id === 'doc-py');
    expect(pyInfo).toBeDefined();
    expect(typeof pyInfo?.title).toBe('string');
    expect(pyInfo?.title.length).toBeGreaterThan(0);
    expect(pyInfo?.summary).toContain('def hello_world');
    expect(pyInfo?.summary).toContain('...');
    expect(pyInfo?.totalChunks).toBe(3);
  }, 30000); // Increased timeout for real AI calls
  
  it('should order chunks correctly by startPosition for summary generation', async () => {
    // Create document
    const mlDocument: Document = {
      id: 'doc-ml',
      fileName: 'intro_to_ml.md',
      content: sampleDocContents.introToML,
      metadata: {}
    };
    
    // Create out-of-order chunks
    const mlChunks = [
      {
        id: 'chunk-2',
        documentId: mlDocument.id,
        content: '## Unsupervised Learning\n\nUnsupervised learning is where the algorithm learns patterns from unlabeled data.',
        startPosition: 600,
        endPosition: 800,
        metadata: { page: 3 }
      },
      {
        id: 'chunk-0',
        documentId: mlDocument.id,
        content: '# Introduction to Machine Learning\n\nMachine learning is a subset of artificial intelligence.',
        startPosition: 0,
        endPosition: 200,
        metadata: { page: 1 }
      },
      {
        id: 'chunk-1',
        documentId: mlDocument.id,
        content: '## Supervised Learning\n\nSupervised learning is a type of machine learning where the algorithm learns from labeled training data.',
        startPosition: 300,
        endPosition: 500,
        metadata: { page: 2 }
      }
    ];
    
    // Create analysis result with out-of-order chunks
    const mockAnalysisResult: HierarchicalAnalysisResult<any> = {
      chunkAnalyses: [
        {
          chunks: mlChunks,
          analysis: {
            relevantConcepts: ['Machine Learning'],
            importantPoints: ['Key concept in AI'],
            courseRelevance: 9
          }
        }
      ],
      documents: new Map([[mlDocument.id, mlDocument]])
    };
    
    // Call the function to test
    const documentInfos = await createDocumentInfoWithSummaries(realAI, mockAnalysisResult);
    
    // Get the ML document info
    const mlInfo = documentInfos[0];
    
    // The summary should start with content from the first chunk (chunk-0) by startPosition
    expect(mlInfo.summary.indexOf('Introduction to Machine Learning')).toBeLessThan(
      mlInfo.summary.indexOf('Supervised Learning')
    );
    
    // The 'Supervised Learning' should appear before 'Unsupervised Learning' in the summary
    expect(mlInfo.summary.indexOf('Supervised Learning')).toBeLessThan(
      mlInfo.summary.indexOf('Unsupervised Learning')
    );
  }, 30000); // Increased timeout for real AI calls
  
  it('should integrate with analyzeChunksHierarchically', async () => {
    // Create a test DocDB with real AI
    const testDocDB = new TestDocDB(realAI);
    
    // Mock the analyzeChunksHierarchically method
    const analyzeChunksSpy = vi.spyOn(testDocDB, 'analyzeChunksHierarchically');
    
    // Create a document and its chunks
    const mlDocument: Document = {
      id: 'doc-ml',
      fileName: 'ml-concepts.md',
      content: sampleDocContents.introToML
    };
    
    const mlChunks = createSampleChunks(sampleDocContents.introToML, mlDocument.id);
    
    // Create the mock hierarchical analysis result
    const mockAnalysisResult: HierarchicalAnalysisResult<any> = {
      chunkAnalyses: [
        {
          chunks: mlChunks,
          analysis: {
            relevantConcepts: ['Machine Learning', 'Supervised Learning', 'Algorithms'],
            importantPoints: ['Machine learning uses data to improve', 'Supervised learning uses labeled data'],
            courseRelevance: 9
          }
        }
      ],
      documents: new Map([[mlDocument.id, mlDocument]])
    };
    
    // Mock the analysis result
    analyzeChunksSpy.mockResolvedValue(mockAnalysisResult);
    
    // Add the document to the test DocDB
    await testDocDB.addDocuments([{
      id: mlDocument.id,
      fileName: mlDocument.fileName,
      content: mlDocument.content,
      metadata: {}
    }]);
    
    // Run the analyzeChunksHierarchically method
    const analysisResult = await testDocDB.analyzeChunksHierarchically({
      question: "identify potential course concepts and important information",
      schema: {} as any, // Use type assertion since we're mocking the return value
      filter: {},
      model: "openai:gpt-4o-mini",
      maxTokens: 10000
    });
    
    // Generate document summaries from the analysis result
    const documentInfos = await createDocumentInfoWithSummaries(realAI, analysisResult);
    
    // Assertions
    expect(documentInfos).toHaveLength(1);
    expect(documentInfos[0].id).toBe(mlDocument.id);
    expect(documentInfos[0].fileName).toBe(mlDocument.fileName);
    expect(typeof documentInfos[0].title).toBe('string');
    expect(documentInfos[0].title.length).toBeGreaterThan(0);
    expect(documentInfos[0].summary).toContain('Machine learning');
    expect(documentInfos[0].totalChunks).toBeGreaterThan(0);
  }, 30000); // Increased timeout for real AI calls
  
  it('should handle documents with explicit titles in metadata', async () => {
    // Create a document with an explicit title
    const document: Document = {
      id: 'doc-with-title',
      fileName: 'some_file.txt',
      content: 'This is some content',
      metadata: {
        title: 'Explicit Document Title'
      }
    };
    
    // Create chunks
    const chunks = [
      {
        id: 'chunk-1',
        documentId: document.id,
        content: 'This is some content that would normally be analyzed for a title',
        startPosition: 0,
        endPosition: 100,
        metadata: { page: 1 }
      }
    ];
    
    // Create analysis result
    const mockAnalysisResult: HierarchicalAnalysisResult<any> = {
      chunkAnalyses: [
        {
          chunks,
          analysis: {
            relevantConcepts: ['Some Concept'],
            importantPoints: ['Some point'],
            courseRelevance: 5
          }
        }
      ],
      documents: new Map([[document.id, document]])
    };
    
    // Call the function to test
    const documentInfos = await createDocumentInfoWithSummaries(realAI, mockAnalysisResult);
    
    // Assertions
    expect(documentInfos).toHaveLength(1);
    
    // The title should be taken from metadata and not generated by AI
    expect(documentInfos[0].title).toBe('Explicit Document Title');
  }, 30000); // Increased timeout for real AI calls
  
  it('should generate AI titles when no metadata title is available', async () => {
    // Create a document without a title
    const document: Document = {
      id: 'doc-without-title',
      fileName: 'technical_document.txt',
      content: 'Technical content without a clear title',
      metadata: { /* no title */ }
    };
    
    // Create chunks
    const chunks = [
      {
        id: 'chunk-1',
        documentId: document.id,
        content: 'Technical content that would be analyzed for a title generation. This document discusses various technical concepts related to software engineering.',
        startPosition: 0,
        endPosition: 150,
        metadata: { page: 1 }
      }
    ];
    
    // Create analysis result
    const mockAnalysisResult: HierarchicalAnalysisResult<any> = {
      chunkAnalyses: [
        {
          chunks,
          analysis: {
            relevantConcepts: ['Technical Content'],
            importantPoints: ['Some technical point'],
            courseRelevance: 6
          }
        }
      ],
      documents: new Map([[document.id, document]])
    };
    
    // Call the function to test
    const documentInfos = await createDocumentInfoWithSummaries(realAI, mockAnalysisResult);
    
    // Assertions
    expect(documentInfos).toHaveLength(1);
    
    // The title should be AI-generated
    expect(typeof documentInfos[0].title).toBe('string');
    expect(documentInfos[0].title.length).toBeGreaterThan(0);
    expect(documentInfos[0].title).toMatch(/Technical|Software|Engineering/i);
  }, 30000); // Increased timeout for real AI calls
}); 