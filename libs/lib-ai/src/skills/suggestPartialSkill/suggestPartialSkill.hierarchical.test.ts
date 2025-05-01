import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { z } from 'zod';

import { AI } from '../../AI';
import { TestDocDB } from '../../docdb/TestDocDB';
import { HierarchicalAnalysisResult } from '../../docdb/types';
import { suggestPartialSkill } from './index.priompt';
import { SkillDetails } from './types';

// Mock AI implementation
const mockAI: AI = {
  genText: vi.fn(),
  genObject: vi.fn(),
  genTextStream: vi.fn(),
  genObjectStream: vi.fn(),
  genTextWithFunctions: vi.fn(),
  genTextWithFunctionsStream: vi.fn(),
  genEmbedding: vi.fn(),
  observe: vi.fn(),
  streamGenObject: vi.fn(),
} as unknown as AI;

// Sample document content
const machineLearningSample = `
# Machine Learning Basics

Machine learning is a subset of artificial intelligence that focuses on developing systems that can learn from and make decisions based on data. 
It involves algorithms that can improve automatically through experience and by the use of data.

## Key Concepts

### Supervised Learning
Supervised learning is a type of machine learning where the algorithm learns from labeled training data. 
The algorithm makes predictions based on the input data and is corrected when those predictions are wrong. 
This process continues until the algorithm achieves an acceptable level of performance.

Examples of supervised learning algorithms include:
- Linear Regression
- Logistic Regression
- Support Vector Machines (SVM)
- Decision Trees and Random Forests
- Neural Networks

### Unsupervised Learning
Unsupervised learning is where the algorithm learns patterns from unlabeled data. 
The system tries to learn the patterns and the structure from the data without any explicit instructions.

Common unsupervised learning algorithms include:
- K-means Clustering
- Hierarchical Clustering
- Principal Component Analysis (PCA)
- Independent Component Analysis (ICA)
- Association Rules

### Reinforcement Learning
Reinforcement learning is a type of machine learning where an agent learns to behave in an environment by performing actions and seeing the results.
The agent receives rewards or penalties for the actions it performs and its goal is to maximize the total reward.

## Applications

Machine learning has a wide range of applications across various industries:

1. **Healthcare**: Predicting diseases, analyzing medical images, drug discovery
2. **Finance**: Fraud detection, algorithmic trading, credit scoring
3. **Retail**: Recommendation systems, inventory management, customer segmentation
4. **Transportation**: Self-driving cars, traffic prediction, route optimization
5. **Manufacturing**: Predictive maintenance, quality control, supply chain optimization
`;

const deepLearningSample = `
# Deep Learning Overview

Deep learning is a subset of machine learning that uses neural networks with many layers (hence "deep") to analyze various factors of data. 
It is particularly powerful for tasks involving unstructured data like images, text, and audio.

## Neural Networks Fundamentals

### Neurons and Layers
The basic unit of a neural network is the neuron, which takes inputs, applies weights and biases, and passes the result through an activation function.
Neurons are organized into layers:
- Input Layer: Receives the initial data
- Hidden Layers: Process the data through transformations
- Output Layer: Produces the final result

### Activation Functions
Activation functions introduce non-linearity into the network, allowing it to learn complex patterns:
- Sigmoid: Maps values to range (0,1)
- Tanh: Maps values to range (-1,1)
- ReLU (Rectified Linear Unit): Returns max(0,x)
- Softmax: Used for multi-class classification

## Advanced Architectures

### Convolutional Neural Networks (CNNs)
CNNs are specialized for processing grid-like data such as images. They use:
- Convolutional layers to detect features
- Pooling layers to reduce dimensionality
- Fully connected layers for final classification

### Recurrent Neural Networks (RNNs)
RNNs are designed for sequential data like text or time series:
- They maintain a memory of previous inputs
- Long Short-Term Memory (LSTM) and Gated Recurrent Unit (GRU) are popular variants
- They can process sequences of variable length

### Transformer Models
Transformers have revolutionized natural language processing:
- They use self-attention mechanisms to weigh the importance of different words
- They process all words in parallel rather than sequentially
- They form the basis for models like BERT, GPT, and T5

#### Attention Mechanism
The attention mechanism allows the model to focus on different parts of the input sequence:
- It computes relevance scores between elements
- It creates context-aware representations
- It enables better handling of long-range dependencies

## Training Deep Networks

### Backpropagation
Backpropagation is the algorithm used to train neural networks:
- It calculates gradients of the loss function
- It updates weights to minimize the loss
- It propagates errors backward through the network

### Optimization Algorithms
Various optimizers improve training:
- Stochastic Gradient Descent (SGD)
- Adam
- RMSprop
- AdaGrad

### Regularization Techniques
To prevent overfitting:
- Dropout: Randomly deactivates neurons during training
- Batch Normalization: Normalizes layer inputs
- Weight Decay: Penalizes large weights
- Early Stopping: Stops training when validation performance degrades
`;

describe('suggestPartialSkill with hierarchical analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use hierarchical analysis when docDB is provided', async () => {
    // Mock the AI genObject function for hierarchical analysis
    const mockChunkAnalysis = {
      relevantConcepts: ['Machine Learning', 'Supervised Learning', 'Neural Networks'],
      importantPoints: [
        'Machine learning involves algorithms that learn from data',
        'Supervised learning uses labeled training data',
        'Neural networks are a key component in deep learning'
      ],
      courseRelevance: 9
    };

    const mockSkillDetails: SkillDetails = {
      skillName: 'Machine Learning Fundamentals',
      description: 'Understanding the core concepts and applications of machine learning',
      level: 'intermediate',
      goals: ['Understand supervised learning', 'Apply neural networks', 'Analyze data effectively'],
      emoji: '🤖'
    };

    // Setup the mock to return different values based on the schema
    mockAI.genObject = vi.fn().mockImplementation(({ schema }) => {
      if (schema === z.object({
        relevantConcepts: z.array(z.string()),
        importantPoints: z.array(z.string()),
        courseRelevance: z.number().min(0).max(10)
      })) {
        return Promise.resolve({ object: mockChunkAnalysis });
      } else {
        return Promise.resolve({ object: { 
          name: mockSkillDetails.skillName,
          description: mockSkillDetails.description,
          concepts: ['Supervised Learning', 'Neural Networks', 'Data Analysis'],
          level: mockSkillDetails.level,
          goals: mockSkillDetails.goals,
          emoji: mockSkillDetails.emoji,
          relevance: 9
        }});
      }
    });

    // Create a spy on the analyzeChunksHierarchically method
    const testDocDB = new TestDocDB(mockAI);
    const analyzeChunksSpy = vi.spyOn(testDocDB, 'analyzeChunksHierarchically');

    // Mock the result of analyzeChunksHierarchically
    analyzeChunksSpy.mockResolvedValue({
      chunkAnalyses: [
        {
          chunks: [],
          analysis: mockChunkAnalysis
        }
      ],
      documents: new Map()
    } as HierarchicalAnalysisResult<typeof mockChunkAnalysis>);

    // Call suggestPartialSkill with the docDB
    const result = await suggestPartialSkill(mockAI, {
      userInput: 'I want to learn about machine learning',
      docDB: testDocDB,
      docDBFilter: { tags: ['machine-learning'] }
    });

    // Verify that analyzeChunksHierarchically was called
    expect(analyzeChunksSpy).toHaveBeenCalled();
    expect(analyzeChunksSpy).toHaveBeenCalledWith(expect.objectContaining({
      question: expect.stringContaining("identify potential"),
      filter: { tags: ['machine-learning'] }
    }));

    // Verify the result
    expect(result).toHaveProperty('skillDetails');
    expect(result.skillDetails).toEqual(mockSkillDetails);
  });

  it('should respect maxDocTokens parameter', async () => {
    // Mock the AI genObject function
    mockAI.genObject = vi.fn().mockResolvedValue({
      object: {
        name: 'Machine Learning Overview',
        description: 'A comprehensive overview of machine learning concepts',
        concepts: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning'],
        level: 'beginner',
        goals: ['Understand ML types', 'Apply basic algorithms'],
        emoji: '📊',
        relevance: 9
      }
    });

    // Create a TestDocDB instance
    const testDocDB = new TestDocDB(mockAI);
    
    // Spy on the analyzeChunksHierarchically method
    const analyzeChunksSpy = vi.spyOn(testDocDB, 'analyzeChunksHierarchically');
    analyzeChunksSpy.mockResolvedValue({
      chunkAnalyses: [],
      documents: new Map()
    } as HierarchicalAnalysisResult<any>);

    // Call suggestPartialSkill with a maxDocTokens parameter and docDBFilter to trigger hierarchical analysis
    await suggestPartialSkill(mockAI, {
      docDB: testDocDB,
      docDBFilter: { tags: ['test'] }, // Add a filter to ensure hierarchical analysis is triggered
      maxDocTokens: 5000
    });

    // Verify that analyzeChunksHierarchically was called with the maxTokens parameter
    expect(analyzeChunksSpy).toHaveBeenCalledWith(expect.objectContaining({
      maxTokens: 5000
    }));
  });
}); 