import * as Priompt from '@anysphere/priompt';
import { PromptElement } from '@anysphere/priompt';

import { Block } from '../prompt/AIPromptObj/PromptComponents';

/**
 * A simple test Priompt component to verify the correct JSX transformation
 * 
 * We're intentionally using React import here so the loader can replace it.
 */
export function TestPriompt(props: { name: string }): PromptElement {
  // This function should use JSX syntax, which will be transformed to use Priompt.createElement
  return (
    <>
      <Block name="Cool">
        Hello {props.name}, I am an AI assistant configured to help you.
      </Block>
      <Block name="Nice">
        I need help with my task.
      </Block>
    </>
  );
}

// Also export a simple function to test importing this module
export function createTestPrompt(name: string): PromptElement {
  return <TestPriompt name={name} />;
} 