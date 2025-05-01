// import {openai} from "@ai-sdk/openai";
// import {
//   beforeEach,
//   describe,
//   expect,
//   it,
//   jest,
// } from "@jest/globals";
// import {genText} from "@reasonote/lib-ai";

// const alwaysFailsModel = {
//     doGenerate: async () => {
//         throw new Error('Model 1 failed')
//     }
// } as any;

// describe('genText', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   // Test case 1: Using generateObject with a single model
//   it('should genText as preferred', async () => {
//     const result = await genText({
//         model: openai('gpt-4o-mini'),
//         prompt: 'Write exactly "Hello World" and nothing else'
//     })

//     expect(result.text.trim()).toEqual('Hello World');
//   });

//   // Test case 2: Using multiple models with the first one throwing an error
//   it('should fallback to the next model if the first one throws', async () => {
//     const result = await genText({
//       models: [
//         alwaysFailsModel, 
//         openai('gpt-4o-mini')
//     ],
//       prompt: 'Write exactly "Hello World" and nothing else'
//     });

//     expect(result.text.trim()).toEqual('Hello World');
//   });
// });

export {};
