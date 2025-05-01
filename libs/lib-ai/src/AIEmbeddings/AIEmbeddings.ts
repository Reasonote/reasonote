import _ from 'lodash';
import OpenAI from 'openai';

import { AI } from '../AI';
import {
  HuggingFaceTransformersEmbeddings,
} from './HuggingFaceTransformersEmbeddings';

const DEFAULT_EMBEDDING_MODEL = 'openai/text-embedding-3-small';

interface BatchConfig {
    maxBatchSize: number;
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
    maxBatchSize: 100
};

// Simple mutex implementation
class Mutex {
    private isLocked = false;
    private queue: Array<() => void> = [];

    async acquire(): Promise<() => void> {
        const release = () => {
            this.isLocked = false;
            const next = this.queue.shift();
            if (next) {
                this.isLocked = true;
                next();
            }
        };

        if (this.isLocked) {
            return new Promise(resolve => {
                this.queue.push(() => resolve(release));
            });
        }

        this.isLocked = true;
        return Promise.resolve(release);
    }
}

export class AIEmbeddings {
    private batchConfig: BatchConfig;
    private mutex = new Mutex();

    constructor(
        private readonly ai: AI,
        private readonly supabaseGteSmall?: HuggingFaceTransformersEmbeddings,
        batchConfig?: Partial<BatchConfig>
    ) {
        this.batchConfig = { ...DEFAULT_BATCH_CONFIG, ...batchConfig };
    }

    private async processBatch(items: string[], modelName: string): Promise<number[][]> {
        // Acquire mutex before processing batch
        const release = await this.mutex.acquire();
        
        try {
            let result: number[][];

            if (modelName === 'supabase/gte-small') {
                if (!this.supabaseGteSmall) {
                    throw new Error('supabaseGteSmall is not set');
                }
                result = await this.supabaseGteSmall.embedDocuments(items);
            } else if (modelName.startsWith('openai/')) {
                const modelSub = modelName.split('/')[1];
                const openai = new OpenAI({
                    apiKey: this.ai.ctx?.openaiApiKey
                });

                const embeddings = await openai.embeddings.create({
                    model: modelSub,
                    input: items
                });

                result = embeddings.data.map((embedding) => embedding.embedding);
            } else {
                throw new Error(`Unsupported embedding model: ${modelName}`);
            }

            return result;
        } finally {
            // Release mutex after processing is complete
            release();
        }
    }

    async embedItems(items: string[], modelName: string = DEFAULT_EMBEDDING_MODEL): Promise<number[][]> {
        const batches: string[][] = [];
        for (let i = 0; i < items.length; i += this.batchConfig.maxBatchSize) {
            batches.push(items.slice(i, i + this.batchConfig.maxBatchSize));
        }

        // Process batches sequentially using the mutex
        // Note: While we're creating all the promises at once, the mutex ensures
        // that only one batch is actively being processed at any given time.
        // Each processBatch call will wait for the mutex before proceeding.
        const batchPromises: Promise<number[][]>[] = [];
        
        for (const batch of batches) {
            batchPromises.push(this.processBatch(batch, modelName));
        }

        const results = await Promise.all(batchPromises);
        return results.flat();
    }

    async embedItem(item: string, modelName: string = DEFAULT_EMBEDDING_MODEL): Promise<number[]> {
        const result = await this.embedItems([item], modelName);
        return result[0];
    }
}