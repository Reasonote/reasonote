import assert from 'assert';
import { z } from 'zod';

import { trimLines } from '@lukebechtel/lab-ts-utils';

import {
  RecursiveCharacterTextSplitter,
} from './chunking/langchainTextSplitter';
import { isMainFileBeingRun } from './utils';

interface ChunkingInput {
    metadata: Record<string, any>;
    value: string;
    chunkSize?: number;
    chunkOverlap?: number;
}

export const ChunkingMetadataSchema = z.object({
    loc: z.object({
        lines: z.object({
            from: z.number(),
            to: z.number(),
        }),
        rawOffset: z.number(),
    firstLineOffset: z.number(),
    }),
}).passthrough();

type ChunkingMetadata = z.infer<typeof ChunkingMetadataSchema>;

interface ChunkingOutput {
    chunkText: string;
    metadata: ChunkingMetadata;
}

export async function createChunks(input: ChunkingInput): Promise<ChunkingOutput[]> {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: input.chunkSize ?? 2000,
        chunkOverlap: input.chunkOverlap ?? 500,
        separators: ["\n\n", "\n", " ", ""], // Prioritize splitting on paragraph breaks
    });

    const chunks = await splitter.createDocuments([input.value], [input.metadata]);

    // SafeParse metadata and warn if it's not valid
    chunks.forEach(chunk => {
        const metadata = ChunkingMetadataSchema.safeParse(chunk.metadata);
        if (!metadata.success) {
            console.warn(`Invalid metadata for chunk ${chunk.id}: ${metadata.error.message}`);
        }
    });

    return chunks.map((chunk, index) => ({
        chunkText: chunk.pageContent,
        metadata: chunk.metadata as ChunkingMetadata,
    }));
}

async function testChunking(markdown: string, description: string, chunkOverlap = 0) {
    console.log(trimLines(`
        ================================
        === Testing ${description} ===
        ================================
    `));
    console.log('Original length:', markdown.length);

    const chunks = await createChunks({ 
        metadata: {
            id: 'test',
        },
        value: markdown,
        chunkOverlap,
    });

    console.log(`Created ${chunks.length} chunks:`);
    chunks.forEach((chunk, i) => {
        const indentedPreview = chunk.chunkText.slice(0, 100)
            .split('\n')
            .map(line => '    ' + line)
            .join('\n');

        console.log(`\nChunk ${i + 1}:`);
        console.log(`Metadata: ${JSON.stringify(chunk.metadata, null, 2)}`);
        console.log('Length:', chunk.chunkText.length);
        console.log('Preview:\n', '\x1b[1m' + indentedPreview + '\x1b[0m');
    });

    // Verify total length
    const totalChunkLength = chunks.reduce((acc, chunk) => acc + chunk.chunkText.length, 0);
    console.log('Total chunk length:', totalChunkLength);
    console.log('Original string length:', markdown.length);

    // Verify chunk offsets
    chunks.forEach(chunk => {
        const offsetChunk = markdown.slice(
            chunk.metadata.loc.rawOffset, 
            chunk.metadata.loc.rawOffset + chunk.chunkText.length
        );
        assert(offsetChunk === chunk.chunkText, 'Offset chunk does not match original string');
    });

    return chunks;
}

// Check if this file is being run directly
if (isMainFileBeingRun(import.meta.url)) {
    const testMarkdown = trimLines(`
        # Vector Search Implementation Guide

        ## Introduction

        This document provides a comprehensive guide to implementing vector search in your application. Vector search, also known as similarity search or semantic search, allows you to find documents or items that are semantically similar to a given query.

        ## Key Concepts

        ### Embeddings

        Embeddings are numerical representations of text that capture semantic meaning. When we convert text to embeddings:
        - Words with similar meanings have similar vectors
        - Relationships between words are preserved
        - The dimensionality is consistent (e.g., 1536 dimensions for OpenAI embeddings)

        ### Vector Similarity

        We measure similarity between vectors using various metrics:
        - Cosine similarity (most common)
        - Euclidean distance
        - Dot product

        ## Implementation Steps

        ### 1. Text Preprocessing

        Before generating embeddings, we typically:
        1. Clean the text
        2. Split into chunks
        3. Remove irrelevant content
        4. Normalize formatting

        ### 2. Generating Embeddings

        We can generate embeddings using:
        - OpenAI's text-embedding-3-small model
        - Local models like Xenova's transformers
        - Other providers like Cohere or Azure
        `
    );

    // Remove all newlines from the test markdown
    const cleanedTestMarkdown = testMarkdown.replace(/\n/g, ' ');

    // Test both versions in series
    await testChunking(testMarkdown, 'Original Markdown');
    await testChunking(cleanedTestMarkdown, 'Cleaned Markdown');
}
