import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { render } from '@anysphere/priompt';
import {
  getTokenizerByName_ONLY_FOR_OPENAI_TOKENIZERS,
} from '@anysphere/priompt/dist/tokenizer';
import { priomptRenderToString } from '@reasonote/lib-ai';

import {
  ArvidStory,
  BackgroundContext,
  CasualResponse,
  ExamplePrompt,
  FormalGreeting,
  LanguageDetectionAssistant,
  SimplePrompt,
} from './ExamplePrompt.priompt';

// We're going to test the prompt construction rather than full rendering
describe('Prompt Tests', () => {
  describe('Individual Prompt Components', () => {
    it('should construct BackgroundContext correctly', async () => {
      // Act
      const promptElement = BackgroundContext();
      
      // Assert
      const promptString = JSON.stringify(promptElement);

      const renderedPrompt = await priomptRenderToString(promptElement);

      console.log('Rendered Prompt type: ', typeof renderedPrompt);
      console.log('Rendered Prompt: ', renderedPrompt);

      expect(renderedPrompt).toContain('flair for the dramatic');
    });
    
    it('should construct FormalGreeting correctly', () => {
      // Arrange
      const props = { name: 'Sir William' };
      
      // Act
      const promptElement = FormalGreeting(props);
      
      // Assert
      const promptString = JSON.stringify(promptElement);
      expect(promptString).toContain('Sir William');
      expect(promptString).toContain('honorable');
    });
    
    it('should construct CasualResponse correctly', () => {
      // Act
      const promptElement = CasualResponse();
      
      // Assert
      const promptString = JSON.stringify(promptElement);
      expect(promptString).toContain('super chill');
      expect(promptString).toContain('cool teenager');
    });
  });
  
  describe('ExamplePrompt', () => {
    it('should construct ExamplePrompt correctly', async () => {
      // Arrange
      const props = {
        name: 'Test User',
        message: 'Hello, how are you today?'
      };

      // Act
      const promptElement = ExamplePrompt(props);
      const renderedPrompt = await render(promptElement, {
        tokenLimit: 10000,
        tokenizer: getTokenizerByName_ONLY_FOR_OPENAI_TOKENIZERS('cl100k_base')
      });

      // Assert - Check the element structure
      // Convert to string to check content
      const promptString = JSON.stringify(renderedPrompt.prompt, null, 2);

      console.log('Prompt String: ', promptString);

      expect(promptString).toContain('Test User');
      expect(promptString).toContain('Hello, how are you today?');
      expect(promptString).toContain('medieval style');
      expect(promptString).toContain('flair for the dramatic');
      expect(promptString).toContain('super chill');
    });
    
    it('should include all nested prompts in the overall structure', () => {
      // Arrange
      const props = {
        name: 'Nested User',
        message: 'Tell me about nested prompts.'
      };

      // Act
      const promptElement = ExamplePrompt(props);
      
      // Assert
      // Check if all our child components are included
      const promptString = JSON.stringify(promptElement);
      
      // Should contain BackgroundContext content
      expect(promptString).toContain('flair for the dramatic');
      
      // Should contain FormalGreeting content with the name
      expect(promptString).toContain('honorable Nested User');
      
      // Should contain CasualResponse content
      expect(promptString).toContain('super chill');
      
      // Should contain the main instruction
      expect(promptString).toContain('medieval style');
      expect(promptString).toContain('cool dude texting style');
      
      // Should contain the user message
      expect(promptString).toContain('Tell me about nested prompts');
    });
  });

  describe('SimplePrompt', () => {
    it('should construct SimplePrompt correctly', () => {
      // Arrange
      const onReturnMock = vi.fn();
      const props = {
        language: 'Spanish',
        text: 'Hola mundo',
        onReturn: onReturnMock
      };

      // Act
      const promptElement = SimplePrompt(props);
      console.log('SimplePrompt Element:', promptElement);

      // Assert
      const promptString = JSON.stringify(promptElement);
      expect(promptString).toContain('Spanish');
      expect(promptString).toContain('Hola mundo');
    });

    it('should call onReturn with true when output contains yes', async () => {
      // Arrange
      const onReturnMock = vi.fn();
      const props = {
        language: 'Spanish',
        text: 'Hola mundo',
        onReturn: onReturnMock
      };

      // Build the prompt element
      const promptElement = SimplePrompt(props);
      
      // Find the capture element
      const captureElement = findCaptureInPromptElement(promptElement);
      expect(captureElement).toBeDefined();
      
      // Test onOutput directly
      if (captureElement && captureElement.props && captureElement.props.onOutput) {
        await captureElement.props.onOutput({ content: 'yes' });
        expect(onReturnMock).toHaveBeenCalledWith(true);
      }
    });

    it('should call onReturn with false when output contains no', async () => {
      // Arrange
      const onReturnMock = vi.fn();
      const props = {
        language: 'Spanish',
        text: 'Hola mundo',
        onReturn: onReturnMock
      };

      // Build the prompt element
      const promptElement = SimplePrompt(props);
      
      // Find the capture element
      const captureElement = findCaptureInPromptElement(promptElement);
      expect(captureElement).toBeDefined();
      
      // Test onOutput directly
      if (captureElement && captureElement.props && captureElement.props.onOutput) {
        await captureElement.props.onOutput({ content: 'no' });
        expect(onReturnMock).toHaveBeenCalledWith(false);
      }
    });

    it('should throw an error for invalid output', async () => {
      // Arrange
      const onReturnMock = vi.fn();
      const props = {
        language: 'Spanish',
        text: 'Hola mundo',
        onReturn: onReturnMock
      };

      // Build the prompt element
      const promptElement = SimplePrompt(props);
      
      // Find the capture element
      const captureElement = findCaptureInPromptElement(promptElement);
      expect(captureElement).toBeDefined();
      
      // Test onOutput directly
      if (captureElement && captureElement.props && captureElement.props.onOutput) {
        await expect(captureElement.props.onOutput({ content: 'maybe' }))
          .rejects.toThrow('Invalid output: maybe');
      }
    });
  });
  
  describe('LanguageDetectionAssistant', () => {
    it('should construct LanguageDetectionAssistant correctly', () => {
      // Arrange
      const onReturnMock = vi.fn();
      const props = {
        text: 'Hola mundo',
        possibleLanguages: ['Spanish', 'English', 'French'],
        onReturn: onReturnMock
      };
      
      // Act
      const promptElement = LanguageDetectionAssistant(props);
      
      // Assert
      const promptString = JSON.stringify(promptElement);
      expect(promptString).toContain('language detection assistant');
      expect(promptString).toContain('Hola mundo');
      expect(promptString).toContain('Spanish');
      expect(promptString).toContain('English');
      expect(promptString).toContain('French');
      
      // Should contain named scopes for language checks
      expect(promptString).toContain('Check if text is Spanish');
      expect(promptString).toContain('Check if text is English');
      expect(promptString).toContain('Check if text is French');
    });
  });

  describe('ArvidStory', () => {
    it('should construct ArvidStory correctly', () => {
      // Arrange
      const onReturnMock = vi.fn();
      const props = {
        onReturn: onReturnMock
      };

      // Act
      const promptElement = ArvidStory(props);
      console.log('ArvidStory Element:', promptElement);

      // Assert
      const promptString = JSON.stringify(promptElement);
      expect(promptString).toContain('young boy named Arvid');
    });

    it('should process stream chunks correctly', async () => {
      // Arrange
      const onReturnMock = vi.fn();
      const props = {
        onReturn: onReturnMock
      };

      // Build the prompt element
      const promptElement = ArvidStory(props);
      
      // Find the capture element
      const captureElement = findCaptureInPromptElement(promptElement);
      expect(captureElement).toBeDefined();
      
      // Create a mock stream for testing
      const mockStream = [
        { content: 'Once upon a time, there was a young boy named Arvid.' },
        { content: ' He loved to run and play in the forest.' }
      ];
      
      // Create an async iterable from the mock stream
      const mockStreamIterable = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockStream) {
            yield chunk;
          }
        }
      };
      
      // Test onStream directly
      if (captureElement && captureElement.props && captureElement.props.onStream) {
        await captureElement.props.onStream(mockStreamIterable);
        
        expect(onReturnMock).toHaveBeenCalled();
        
        // Extract the async iterable that was passed to onReturn
        const returnedAsyncIterable = onReturnMock.mock.calls[0][0];
        expect(typeof returnedAsyncIterable[Symbol.asyncIterator]).toBe('function');
        
        // Collect all the chunks from the returned iterable to verify the transformation
        const collectedChunks: string[] = [];
        for await (const chunk of returnedAsyncIterable) {
          collectedChunks.push(chunk);
        }
        
        // Verify the transformation (r -> j)
        expect(collectedChunks.join('')).toBe(
          'Once upon a time, theje was a young boy named Ajvid. He loved to jun and play in the fojest.'
        );
      }
    });
  });
});

// Helper function to find a capture element in the prompt element tree
function findCaptureInPromptElement(element: any): any {
  // Check if the current element is a capture element
  if (element && element.type === 'capture') {
    return element;
  }
  
  // Check children recursively
  if (element && element.props && element.props.children) {
    if (Array.isArray(element.props.children)) {
      for (const child of element.props.children) {
        const found = findCaptureInPromptElement(child);
        if (found) {
          return found;
        }
      }
    } else {
      return findCaptureInPromptElement(element.props.children);
    }
  }
  
  return null;
} 