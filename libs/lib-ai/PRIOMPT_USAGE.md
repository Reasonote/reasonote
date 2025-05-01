# Using Priompt JSX in the lib-ai package

This package uses [Priompt](https://github.com/anysphere/priompt) for working with LLM prompts using JSX syntax.

## The .priompt.tsx Extension

We use a special file extension `.priompt.tsx` for files that contain Priompt JSX. This approach provides several benefits:

- Clear distinction between React JSX and Priompt JSX files
- Automatic configuration of the correct JSX factory based on file extension
- No need for special per-file configuration
- Better tooling support

### Example Usage

```tsx
// Example file: myPrompt.priompt.tsx
import * as Priompt from '@anysphere/priompt';
import {
  PromptElement,
  PromptProps,
  SystemMessage,
  UserMessage,
} from '@anysphere/priompt';

export function MyPrompt(props: { name: string }): PromptElement {
  return (
    <SystemMessage>
      Hello {props.name}, I am an AI assistant.
    </SystemMessage>
  );
}
```

### Test Files

Test files (matching patterns `*.test.*`, `*.spec.*`, or in `__tests__` directories) are automatically excluded from the build process. This makes builds faster and prevents test-specific code from being included in the production bundle.

## Import Structure

When using Priompt JSX, make sure to import it correctly:

```tsx
import * as Priompt from '@anysphere/priompt';
import {
  PromptElement,
  PromptProps,
  SystemMessage,
  UserMessage,
} from '@anysphere/priompt';
```

## Testing

For testing, make sure your tests import from the correct places and use the Priompt JSX factory.

## Troubleshooting

If you're seeing React fragments being created instead of Priompt elements:

1. Check that your file has the `.priompt.tsx` extension
2. Check that your imports are correct
3. If issues persist, restart your Next.js server 