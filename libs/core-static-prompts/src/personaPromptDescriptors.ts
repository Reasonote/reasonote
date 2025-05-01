export const personaPromptDescriptors = {
  name: {
    descrip: `
            NAME: The name of the persona
        `,
    outputFormatPrompt: `<Name>THE NAME</Name>`,
    parseResult: (result: string) => {
      return result.match(/<Name>(.*?)<\/Name>/s)?.[1];
    },
  },
  description: {
    descrip: `
            DESCRIPTION: A short description of the persona
            - The DESCRIPTION should be a short, accurate paragraph about the person.
        `,
    outputFormatPrompt: `<Description>THE DESCRIPTION</Description>`,
    parseResult: (result: string) => {
      return result.match(/<Description>(.*?)<\/Description>/s)?.[1];
    },
  },
  prompt: {
    descrip: `
            PROMPT: A prompt that should be used to roleplay as this persona.
            - The PROMPT should include guidance about how to talk like the persona, how to act like the persona, and what the persona is like.
            - The PROMPT should be a short paragraph.
            - The PROMPT should give a few snippets of sample dialogue, so that the user can get a sense of how to roleplay as the persona.
        `,
    outputFormatPrompt: `<Prompt>THE PROMPT</Prompt>`,
    parseResult: (result: string) => {
      return result.match(/<Prompt>(.*?)<\/Prompt>/s)?.[1];
    },
  },
};
