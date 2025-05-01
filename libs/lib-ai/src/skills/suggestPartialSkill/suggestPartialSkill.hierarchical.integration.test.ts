import { v4 as uuidv4 } from 'uuid';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { createDefaultStubAI } from '../../DefaultStubAI';
import { TestDocDB } from '../../docdb/TestDocDB';
import { suggestPartialSkill } from './index.priompt';

// This is an integration test that uses real AI calls
// It verifies that the hierarchical analysis correctly identifies key concepts from document headers
describe('suggestPartialSkill hierarchical analysis integration', () => {
  // Create a real AI instance for testing using the default stub
  const ai = createDefaultStubAI();

  // Test document with clear section headers that should be identified
  const webDevelopmentDocument = `
    # Modern Web Development Fundamentals

    ## HTML5 Semantic Elements
    HTML5 introduced several semantic elements that provide meaning to the structure of web pages.
    These elements include:
    - \`<header>\`: Represents the header of a document or section
    - \`<nav>\`: Represents a navigation menu
    - \`<main>\`: Represents the main content of a document
    - \`<section>\`: Represents a standalone section
    - \`<article>\`: Represents an independent piece of content
    - \`<footer>\`: Represents the footer of a document or section

    ## CSS3 Flexbox Layout
    Flexbox is a one-dimensional layout method designed for laying out items in rows or columns.
    Key flexbox properties include:
    - \`display: flex\`: Defines a flex container
    - \`flex-direction\`: Defines the direction of flex items (row, column)
    - \`justify-content\`: Aligns items along the main axis
    - \`align-items\`: Aligns items along the cross axis

    ## JavaScript ES6+ Features
    Modern JavaScript includes many powerful features:
    - Arrow functions: \`const add = (a, b) => a + b;\`
    - Template literals: \`\`\`const greeting = \`Hello, \${name}!\`;\`\`\`
    - Destructuring: \`const { name, age } = person;\`
    - Spread operator: \`const newArray = [...oldArray];\`
    - Promises and async/await for asynchronous operations

    ## Responsive Web Design
    Responsive design ensures websites work well on any device:
    - Media queries: \`@media (max-width: 768px) { ... }\`
    - Fluid layouts using percentages
    - Flexible images with \`max-width: 100%\`
    - Mobile-first approach to design

    ## Web Accessibility (WCAG)
    Making websites accessible to all users is essential:
    - Semantic HTML for screen readers
    - Sufficient color contrast
    - Keyboard navigation support
    - ARIA attributes for complex interactions
    - Alt text for images
  `;

  // Test document with different topics
  const dataAnalyticsDocument = `
    # Data Analytics Essentials

    ## Data Collection Methods
    Effective data collection is the foundation of analytics:
    - Surveys and questionnaires
    - Web scraping and APIs
    - Database queries
    - Sensors and IoT devices
    - Third-party data sources

    ## Data Cleaning Techniques
    Raw data often requires cleaning before analysis:
    - Handling missing values
    - Removing duplicates
    - Standardizing formats
    - Outlier detection
    - Data type conversion

    ## Exploratory Data Analysis
    EDA helps understand data characteristics:
    - Summary statistics (mean, median, variance)
    - Data visualization (histograms, scatter plots)
    - Correlation analysis
    - Distribution analysis
    - Pattern identification

    ## Statistical Analysis
    Statistical methods provide insights from data:
    - Hypothesis testing
    - Regression analysis
    - ANOVA
    - Time series analysis
    - Bayesian statistics

    ## Data Visualization Best Practices
    Effective visualization communicates insights clearly:
    - Choose appropriate chart types
    - Minimize chart junk
    - Use color effectively
    - Label axes and include legends
    - Tell a coherent data story
  `;

  // Test document with a clear, specific title about triple integrals
  const tripleIntegralsDocument = `
    # Triple Integrals In Calculus

    ## Introduction to Triple Integrals
    Triple integrals extend the concept of integration to three dimensions, allowing us to calculate volumes, masses, 
    and other properties of three-dimensional regions. They are a fundamental tool in multivariable calculus.

    ## Definition and Notation
    A triple integral over a region E in three-dimensional space is written as:
    
    ∭_E f(x,y,z) dV
    
    Where f(x,y,z) is the function being integrated and dV represents a small volume element.

    ## Rectangular Coordinates
    In rectangular (Cartesian) coordinates, we compute triple integrals as:
    
    ∭_E f(x,y,z) dV = ∫_a^b ∫_c^d ∫_e^f f(x,y,z) dz dy dx
    
    Where the bounds a,b,c,d,e,f define the region of integration.

    ## Cylindrical Coordinates
    For regions with cylindrical symmetry, we use:
    
    ∭_E f(x,y,z) dV = ∫_α^β ∫_r1^r2 ∫_z1^z2 f(r,θ,z) r dr dθ dz
    
    Note the extra factor of r, which comes from the Jacobian of the coordinate transformation.

    ## Spherical Coordinates
    For regions with spherical symmetry:
    
    ∭_E f(x,y,z) dV = ∫_α^β ∫_φ1^φ2 ∫_ρ1^ρ2 f(ρ,θ,φ) ρ² sin(φ) dρ dφ dθ
    
    The factor ρ² sin(φ) is the Jacobian for spherical coordinates.

    ## Applications
    Triple integrals have numerous applications:
    - Volume calculation of complex 3D shapes
    - Mass calculation for objects with variable density
    - Center of mass determination
    - Moment of inertia computation
    - Gravitational and electromagnetic field calculations
  `;

  it('should identify key concepts from document headers with small chunk size', async () => {
    // Create a TestDocDB with small chunk and overlap sizes
    const testDocDB = new TestDocDB(ai, 200, 50);
    
    // Add the test document to the DocDB
    await testDocDB.addDocuments([
      {
        id: uuidv4(),
        fileName: 'web-development.md',
        content: webDevelopmentDocument,
        metadata: {
          tags: ['web-development', 'programming']
        }
      }
    ]);
    
    // Call suggestPartialSkill with hierarchical analysis
    // Use a model that supports structured outputs
    const result = await suggestPartialSkill(ai, {
      docDB: testDocDB,
      docDBFilter: {
        tags: ['web-development']
      },
      model: 'openai:gpt-4o-mini', // Use a model that supports structured outputs
      maxDocTokens: 4000
    });
    
    // Key concepts that should be identified from the document headers
    const expectedConcepts = [
      'HTML5',
      'CSS',
      'Flexbox',
      'JavaScript',
      'Responsive',
      'Accessibility'
    ];
    
    // Check that the result includes skillDetails with name, description, and goals
    expect(result).toHaveProperty('skillDetails');
    expect(result.skillDetails).toHaveProperty('skillName');
    expect(result.skillDetails).toHaveProperty('description');
    expect(result.skillDetails).toHaveProperty('goals');
    expect(result.skillDetails.goals).toBeInstanceOf(Array);
    
    // Check that at least some of the expected concepts are included in goals or name/description
    const foundConcepts = expectedConcepts.filter(concept => 
      result.skillDetails.goals.some((goal: string) => goal.toLowerCase().includes(concept.toLowerCase())) ||
      result.skillDetails.skillName.toLowerCase().includes(concept.toLowerCase()) ||
      result.skillDetails.description.toLowerCase().includes(concept.toLowerCase())
    );
    
    // Expect at least 3 of the key concepts to be identified
    expect(foundConcepts.length).toBeGreaterThanOrEqual(3);
    
    // Verify that the description doesn't explicitly mention "skill" or "course"
    expect(result.skillDetails.description.toLowerCase()).not.toMatch(/\bskill\b/);
    
    // Log the result for manual inspection
    console.log('Course Name:', result.skillDetails.skillName);
    console.log('Description:', result.skillDetails.description);
    console.log('Goals:', result.skillDetails.goals);
  }, 30000);
  
  it('should combine concepts from multiple documents with hierarchical analysis', async () => {
    // Create a TestDocDB with small chunk and overlap sizes
    const testDocDB = new TestDocDB(ai, 200, 50);
    
    // Add both test documents to the DocDB
    await testDocDB.addDocuments([
      {
        id: uuidv4(),
        fileName: 'web-development.md',
        content: webDevelopmentDocument,
        metadata: {
          tags: ['technical', 'programming']
        }
      },
      {
        id: uuidv4(),
        fileName: 'data-analytics.md',
        content: dataAnalyticsDocument,
        metadata: {
          tags: ['technical', 'data']
        }
      }
    ]);
    
    // Call suggestPartialSkill with hierarchical analysis
    // Use a model that supports structured outputs
    const result = await suggestPartialSkill(ai, {
      userInput: "I'm interested in technical skills for a data-driven web application",
      docDB: testDocDB,
      docDBFilter: {
        tags: ['technical']
      },
      model: 'openai:gpt-4o-mini', // Use a model that supports structured outputs
      maxDocTokens: 4000
    });
    
    // Key concepts from both documents
    const webDevConcepts = ['HTML', 'CSS', 'JavaScript', 'Responsive'];
    const dataAnalyticsConcepts = ['Data', 'Analytics', 'Visualization', 'Statistics'];
    
    // Check that the result includes skillDetails with name, description, and goals
    expect(result).toHaveProperty('skillDetails');
    expect(result.skillDetails).toHaveProperty('skillName');
    expect(result.skillDetails).toHaveProperty('description');
    expect(result.skillDetails).toHaveProperty('goals');
    expect(result.skillDetails.goals).toBeInstanceOf(Array);
    
    // Check that concepts from both documents are included in goals or name/description
    const foundWebDevConcepts = webDevConcepts.filter(concept => 
      result.skillDetails.goals.some((goal: string) => goal.toLowerCase().includes(concept.toLowerCase())) ||
      result.skillDetails.skillName.toLowerCase().includes(concept.toLowerCase()) ||
      result.skillDetails.description.toLowerCase().includes(concept.toLowerCase())
    );
    
    const foundDataConcepts = dataAnalyticsConcepts.filter(concept => 
      result.skillDetails.goals.some((goal: string) => goal.toLowerCase().includes(concept.toLowerCase())) ||
      result.skillDetails.skillName.toLowerCase().includes(concept.toLowerCase()) ||
      result.skillDetails.description.toLowerCase().includes(concept.toLowerCase())
    );
    
    // Expect at least 2 concepts from each document to be identified
    expect(foundWebDevConcepts.length).toBeGreaterThanOrEqual(2);
    expect(foundDataConcepts.length).toBeGreaterThanOrEqual(2);
    
    // Verify that the description doesn't explicitly mention "skill" or "course"
    expect(result.skillDetails.description.toLowerCase()).not.toMatch(/\bskill\b/);
    expect(result.skillDetails.description.toLowerCase()).not.toMatch(/\bcourse\b/);
    
    // Log the result for manual inspection
    console.log('Course Name:', result.skillDetails.skillName);
    console.log('Description:', result.skillDetails.description);
    console.log('Goals:', result.skillDetails.goals);
  }, 30000);
  
  it('should preserve the title of a single document in the skill name', async () => {
    // Create a TestDocDB with appropriate chunk and overlap sizes
    const testDocDB = new TestDocDB(ai, 250, 50);
    
    // Create a unique document ID
    const docId = uuidv4();
    
    // Add the triple integrals document to the DocDB
    await testDocDB.addDocuments([
      {
        id: docId,
        fileName: 'triple-integrals.md',
        content: tripleIntegralsDocument,
        metadata: {
          tags: ['calculus', 'mathematics'],
          // No explicit title in metadata - should use the document's heading
        }
      }
    ]);
    
    // Call suggestPartialSkill with hierarchical analysis
    const result = await suggestPartialSkill(ai, {
      docDB: testDocDB,
      docDBFilter: {
        tags: ['calculus']
      },
      model: 'openai:gpt-4o-mini',
      maxDocTokens: 4000
    });
    
    // Check that the result includes skillDetails with name that reflects the document title
    expect(result).toHaveProperty('skillDetails');
    expect(result.skillDetails).toHaveProperty('skillName');
    
    // The skill name should contain "Triple Integrals" (case insensitive)
    expect(result.skillDetails.skillName.toLowerCase()).toContain('triple integrals');
    
    // Log the result for manual inspection
    console.log('Original Document Title: Triple Integrals In Calculus');
    console.log('Generated Skill Name:', result.skillDetails.skillName);
    console.log('Description:', result.skillDetails.description);
    console.log('Goals:', result.skillDetails.goals);
    
    // Check that the goals reflect the content about triple integrals
    const tripleIntegralsTerms = ['triple integral', 'calculus', 'integration', 'coordinates', 'volume'];
    const foundTerms = tripleIntegralsTerms.filter(term => 
      result.skillDetails.goals.some((goal: string) => goal.toLowerCase().includes(term.toLowerCase())) ||
      result.skillDetails.description.toLowerCase().includes(term.toLowerCase())
    );
    
    // Expect at least 3 relevant terms to be identified
    expect(foundTerms.length).toBeGreaterThanOrEqual(3);
  }, 30000);
}); 