import { SupabaseClient } from '@supabase/supabase-js';

export interface VectorWorkerContext {
    logger: {
        debug: (...args: any[]) => void;
        info: (...args: any[]) => void;
        warn: (...args: any[]) => void;
        error: (...args: any[]) => void;
        log: (...args: any[]) => void;
    };
    SUPERUSER_supabase: SupabaseClient;
}

export interface VectorizeChunk {
    id: string;
    chunkText: string;
    charOffsetStart: number;
    colname: string;
    colpath: string[] | null;
}

export interface VectorizeRequest {
    chunks: VectorizeChunk[];
    version: string;
    embeddingType: string;
}
