// import {z} from "zod";

// import {openai} from "@ai-sdk/openai";
// import {
//   beforeEach,
//   describe,
//   expect,
//   it,
//   jest,
// } from "@jest/globals";
// import {genObject} from "@reasonote/lib-ai";

// const alwaysFailsModel = {
//   doGenerate: async () => {
//       throw new Error('Model 1 failed')
//   },
// } as any;

// describe('genObject', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   // Test case 1: Using generateObject with a single model
//   it('should call generateObject when model is provided', async () => {
//     const result = await genObject({
//       prompt: 'Write "bar"',
//       //@ts-ignore
//       model: openai('gpt-4o-mini'),
//       schema: z.object({ foo: z.string() }),
//     });

//     expect(result.object).toEqual({ foo: 'bar' });
//   });

//   it('should call generateObject when model is provided', async () => {
//     const result = await genObject({
//       prompt: 'Write "bar"',
//       //@ts-ignore
//       models: [
//         alwaysFailsModel,
//         openai('gpt-4o-mini'),
//       ],
//       schema: z.object({ foo: z.string() }),
//     });

//     expect(result.object).toEqual({ foo: 'bar' });
//   });

//   it('should call generateObject when model is provided', async () => {
//     const result = await genObject({
//       prompt: 'Write "bar"',
//       //@ts-ignore
//       models: [
//         alwaysFailsModel,
//         openai('gpt-4o-mini'),
//       ],
//       schema: z.object({ foo: z.string() }),
//     });

//     expect(result.object).toEqual({ foo: 'bar' });
//   });

//   it('should succeed when maxFeedbackLoops is provided', async () => {
//     const result = await genObject({
//       prompt: 'Write "bar"',
//       //@ts-ignore
//       models: [
//         alwaysFailsModel,
//         openai('gpt-4o-mini'),
//       ],
//       feedbackModels: [
//         openai('gpt-4o-mini'),
//       ],
//       schema: z.object({ foo: z.string() }),
//       maxFeedbackLoops: 1,
//     });

//     expect(result.object).toEqual({ foo: 'bar' });
//   });
// });

export {};
