# Priompt Example Components

This directory contains example components for use with [Priompt](https://github.com/anysphere/priompt), a library for composable prompting in LLM applications.

## Components

The following components are defined in `ExamplePrompt.tsx`:

### Basic Components

1. **BackgroundContext**: A simple component that sets up background context for the AI assistant.
2. **FormalGreeting**: A component that creates a formal, medieval-style greeting for a user.
3. **CasualResponse**: A component that instructs the AI to respond in a casual, modern style.

### Composed Components

4. **ExamplePrompt**: A combined prompt that nests the above components, then greets a user by name in a formal style and replies to their message in a casual style.
5. **SimplePrompt**: Determines if a given text is in a specified language, returning a boolean result.
6. **LanguageDetectionAssistant**: A more complex component that uses multiple nested SimplePrompt instances to detect which of several possible languages a text is in.
7. **ArvidStory**: Generates a short story about a boy named Arvid, replacing the letter 'r' with 'j' in the output.

## Component Nesting

A key strength of Priompt is the ability to compose and nest prompt components. This approach offers several benefits:

- **Modularity**: Break down complex prompts into smaller, reusable pieces
- **Reusability**: Use the same components in different contexts
- **Maintainability**: Update a single component rather than multiple instances of similar prompts
- **Named Scopes**: Use named scopes to add semantic meaning to prompt sections

In our examples:
- `ExamplePrompt` nests `BackgroundContext`, `FormalGreeting`, and `CasualResponse`
- `LanguageDetectionAssistant` nests multiple instances of `SimplePrompt` within named scopes

## Testing

To run the component tests:

```bash
# From the workspace root
yarn test:ai -- src/prompt/AIPromptObj/ExamplePrompt.test.tsx
```

The tests verify that:
- Components construct the correct prompt structure
- The correct messages are included in the prompts
- The capture callbacks work as expected
- Nested components are properly included

## Demo

To run the demonstration script:

```bash
# From the workspace root
yarn tsx libs/lib-ai/src/prompt/AIPromptObj/ExamplePromptDemo.ts
```

The demo will:
1. Show individual components in isolation
2. Display combined/nested prompts
3. Extract and display system and user messages
4. Show information about the named scopes
5. Demonstrate how capture elements work

## Using These Components

### Individual Components

```typescript
import { BackgroundContext, FormalGreeting, CasualResponse } from 'libs/lib-ai/src/prompt/AIPromptObj/ExamplePrompt';

// Create and use individual components
const backgroundContext = BackgroundContext();
const greeting = FormalGreeting({ name: 'User' });
const casualStyle = CasualResponse();
```

### ExamplePrompt (with nested components)

```typescript
import { ExamplePrompt } from 'libs/lib-ai/src/prompt/AIPromptObj/ExamplePrompt';

// Create the composed component with nested components
const promptElement = ExamplePrompt({
  name: 'User',
  message: 'Tell me about AI.'
});

// Use with Priompt.render
const result = await Priompt.render(promptElement);
console.log(result.toString());
```

### SimplePrompt

```typescript
import { SimplePrompt } from 'libs/lib-ai/src/prompt/AIPromptObj/ExamplePrompt';

// Create the component with a callback
const promptElement = SimplePrompt({
  language: 'Spanish',
  text: 'Hola mundo',
  onReturn: async (isSpanish: boolean) => {
    console.log(`Is the text Spanish? ${isSpanish ? 'Yes' : 'No'}`);
  }
});

// Use with Priompt.render
await Priompt.render(promptElement);
```

### LanguageDetectionAssistant (with nested SimplePrompts)

```typescript
import { LanguageDetectionAssistant } from 'libs/lib-ai/src/prompt/AIPromptObj/ExamplePrompt';

// Create the component with multiple languages to check
const promptElement = LanguageDetectionAssistant({
  text: 'Hola mundo',
  possibleLanguages: ['Spanish', 'English', 'French', 'German'],
  onReturn: async (detectedLanguage: string) => {
    console.log(`Detected language: ${detectedLanguage}`);
  }
});

// Use with Priompt.render
await Priompt.render(promptElement);
```

### ArvidStory

```typescript
import { ArvidStory } from 'libs/lib-ai/src/prompt/AIPromptObj/ExamplePrompt';

// Create the component with a streaming callback
const promptElement = ArvidStory({
  onReturn: async (storyStream: AsyncIterable<string>) => {
    for await (const chunk of storyStream) {
      process.stdout.write(chunk);
    }
  }
});

// Use with Priompt.render
await Priompt.render(promptElement);
``` 