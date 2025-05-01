## Reasonote - Developer Documentation


## Getting Started

First, run the development server:

```plaintext
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Adding a New Document

To add a new document, create a new file in the `contents/docs` folder and add the appropriate metadata at the top of the file.

Then, add the new route to the `lib/routes-config.ts` file to ensure it appears in the sidebar.