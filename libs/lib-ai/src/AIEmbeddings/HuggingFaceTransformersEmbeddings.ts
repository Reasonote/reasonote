import _ from 'lodash';

import {
  Embeddings,
  type EmbeddingsParams,
} from '@langchain/core/embeddings';
import { chunkArray } from '@langchain/core/utils/chunk_array';
import {
  createSimpleLogger,
  TypedUuidV4,
} from '@lukebechtel/lab-ts-utils';
import { typedUuidV4 } from '@reasonote/lib-utils';

export interface HuggingFaceTransformersEmbeddingsParams
  extends EmbeddingsParams {
  /** Model name to use */
  modelName: string;

  /**
   * Timeout to use when making requests to OpenAI.
   */
  timeout?: number;

  /**
   * The maximum number of documents to embed in a single request.
   */
  batchSize?: number;

  /**
   * Whether to strip new lines from the input text. This is recommended by
   * OpenAI, but may not be suitable for all use cases.
   */
  stripNewLines?: boolean;

  transformersPkg?: any;
}

/**
 * @example
 * ```typescript
 * const model = new HuggingFaceTransformersEmbeddings({
 *   modelName: "Xenova/all-MiniLM-L6-v2",
 * });
 *
 * // Embed a single query
 * const res = await model.embedQuery(
 *   "What would be a good company name for a company that makes colorful socks?"
 * );
 * console.log({ res });
 *
 * // Embed multiple documents
 * const documentRes = await model.embedDocuments(["Hello world", "Bye bye"]);
 * console.log({ documentRes });
 * ```
 */
export class HuggingFaceTransformersEmbeddings
  extends Embeddings
  implements HuggingFaceTransformersEmbeddingsParams
{
  modelName = "Supabase/gte-small";

  batchSize = 512;

  stripNewLines = true;

  uniqId: TypedUuidV4 = typedUuidV4('HuggingFaceTransformersEmbeddings')

  logger = createSimpleLogger({prefix: this.uniqId})

  timeout?: number;

  private pipelinePromises: (Promise<any> | null)[] = [
    null,
    // null,
    // null,
    // null,
    // null
  ];

  transformersPkg: any;

  constructor(fields?: Partial<HuggingFaceTransformersEmbeddingsParams>) {
    super(fields ?? {});

    this.transformersPkg = fields?.transformersPkg;

    this.modelName = fields?.modelName ?? this.modelName;
    this.stripNewLines = fields?.stripNewLines ?? this.stripNewLines;
    this.timeout = fields?.timeout;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const batches = chunkArray(
      this.stripNewLines ? texts.map((t) => t.replace(/\n/g, " ")) : texts,
      this.batchSize
    );

    const batchRequests = batches.map((batch) => this.runEmbedding(batch));
    const batchResponses = await Promise.all(batchRequests);
    const embeddings: number[][] = [];

    for (let i = 0; i < batchResponses.length; i += 1) {
      const batchResponse = batchResponses[i];
      for (let j = 0; j < batchResponse.length; j += 1) {
        embeddings.push(batchResponse[j]);
      }
    }

    return embeddings;
  }

  async embedQuery(text: string): Promise<number[]> {
    const data = await this.runEmbedding([
      this.stripNewLines ? text.replace(/\n/g, " ") : text,
    ]);
    return data[0];
  }

  private async runEmbedding(texts: string[]) {
    var { FeatureExtractionPipeline, pipeline }: any = {
      FeatureExtractionPipeline: null,
      pipeline: null,
    };

    if (!this.transformersPkg){
      throw new Error('@xenova/transformers not provided as transformersPkg. Please provide it in the constructor');
    }

    try {
      const result = this.transformersPkg;//?? await import('@xenova/transformers');
      // const result: any = 'hi';
      FeatureExtractionPipeline = result.FeatureExtractionPipeline;
      pipeline = result.pipeline;
    }
    catch (e: any) {
      throw new Error(
        `Issue while importing the transformers package. Please make sure it is installed. Original Error: ${e}`
      );
    }
  
    const textBatchSize = Math.floor(texts.length / this.pipelinePromises.length);

    // First we chunk our texts into a group sized by the number of pipelines
    const chunks = _.map(_.range(0, this.pipelinePromises.length), (num) => {
      return texts.slice(num * textBatchSize, (num + 1) * textBatchSize);
    });

    // Next, we assign each chunk to a pipeline
    const results = await Promise.all(_.map(chunks, async (chunk, index) => {
      if (!this.pipelinePromises[index]) {
        this.logger.debug(`Creating pipeline ${index}`);
      }

      const startTime = Date.now();
      const pipe = await (this.pipelinePromises[index] ??= pipeline(
        "feature-extraction",
        this.modelName
      ));
      const endTime = Date.now();
      this.logger.debug(`Pipeline ${index} took ${endTime - startTime}ms to create`);

      return this.caller.call(async () => {
        const output = await pipe(chunk, { pooling: "mean", normalize: true });
        return output.tolist();
      });
    }));

    return _.flatten(results);
  }
}