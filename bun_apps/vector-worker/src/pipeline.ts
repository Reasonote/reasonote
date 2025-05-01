import {
  env,
  pipeline,
} from '@xenova/transformers';

// Increase the number of WASM threads
// You can adjust this number based on your hardware capabilities
env.backends.onnx.wasm.numThreads = 1; // Using 1 thread bc node can only do this.

// Use the Singleton pattern to enable lazy construction of the pipeline.
// NOTE: We wrap the class in a function to prevent code duplication (see below).
const P = () =>
  class XenovaTransformersPipelineSingleton {
    // static task = 'text-classification';
    // static model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
    static task = "feature-extraction";
    static model = "Supabase/gte-small";
    static instance = null;

    static async getInstance(progress_callback = null) {
      if (this.instance === null) {
        /** @ts-ignore */
        this.instance = pipeline(this.task, this.model, {
          // @ts-ignore
          progress_callback,
          // Explicitly set the execution provider to WASM
          executionProvider: 'wasm',
          // You can also specify the number of threads here if needed
          wasmSettings: {
            numThreads: 1 // Should match the number set above
          }
        });
      }
      return this.instance;
    }
  };

let XenovaTransformersPipelineSingleton: any = null;
if (process.env.NODE_ENV !== "production") {
  // When running in development mode, attach the pipeline to the
  // global object so that it's preserved between hot reloads.
  // For more information, see https://vercel.com/guides/nextjs-prisma-postgres
  //@ts-ignore
  if (!global.XenovaTransformersPipelineSingleton) {
    //@ts-ignore
    global.XenovaTransformersPipelineSingleton = P();
  }
  //@ts-ignore
  XenovaTransformersPipelineSingleton =
    //@ts-ignore
    global.XenovaTransformersPipelineSingleton;
} else {
  XenovaTransformersPipelineSingleton = P();
}
export default XenovaTransformersPipelineSingleton;
