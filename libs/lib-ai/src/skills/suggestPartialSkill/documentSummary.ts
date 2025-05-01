import {
  AI,
  DocumentChunk,
  DocumentInfo,
  DocumentInfoWithSummary,
  HierarchicalAnalysisResult,
} from '@reasonote/lib-ai';

/**
 * Generates a document title using AI based on document content
 */
async function generateAIDocumentTitle(
    ai: AI,
    fileName: string,
    chunks: DocumentChunk[],
    model = "openai:gpt-4o-mini"
): Promise<string> {
    if (!chunks.length) {
        return `Document ${fileName}`;
    }

    // Sort chunks by their position in the document if possible
    const sortedChunks = [...chunks].sort((a, b) => {
        // First check for startPosition property directly on the chunk
        if (a.startPosition !== undefined && b.startPosition !== undefined) {
            return a.startPosition - b.startPosition;
        }
        // Then check for page numbers in metadata
        if (a.metadata?.page && b.metadata?.page) {
            return (a.metadata.page as number) - (b.metadata.page as number);
        }
        // Then check for position indices in metadata
        if (a.metadata?.position && b.metadata?.position) {
            return (a.metadata.position as number) - (b.metadata.position as number);
        }
        return 0;
    });

    // Take up to first 3 chunks for context (or fewer if not available)
    const contextChunks = sortedChunks.slice(0, Math.min(3, sortedChunks.length));

    // Construct a prompt for the AI
    const contentSample = contextChunks.map((chunk, i) =>
        `CHUNK ${i + 1}:\n${chunk.content.substring(0, 500)}${chunk.content.length > 500 ? '...' : ''}`
    ).join('\n\n');

    const prompt = `
      I need to determine the most appropriate title for a document. 
      
      Document filename: "${fileName}"
      
      Here are the first few chunks of content from the document:
      
      ${contentSample}
      
      Based solely on this content, what would be the most accurate, concise and descriptive title for this document?
      Provide ONLY the title, nothing else. The title should be brief (5-10 words) but descriptive of the main topic or purpose of the document.
    `;

    try {
        // Call the AI to generate a title
        const response = await ai.genText({
            prompt,
            model,
            maxTokens: 50, // Short response, just the title
        });

        // Clean up the response
        let title = response.text.trim();

        // Remove quotes if the AI included them
        title = title.replace(/^["']|["']$/g, '');

        // If we somehow got a very long title, truncate it
        if (title.length > 100) {
            title = title.substring(0, 97) + '...';
        }

        return title;
    } catch (error) {
        console.error('Error generating document title with AI:', error);

        // Fallback to a simple extraction method
        const firstChunk = sortedChunks[0].content;
        const firstLine = firstChunk.split('\n').find(line => line.trim().length > 0) || '';
        return firstLine.length > 10 && firstLine.length < 60
            ? firstLine
            : `Document based on ${fileName}`;
    }
}

/**
 * Generates the best possible title for a document
 * Uses document title if available, or generates one using AI
 */
async function getBestDocumentTitle(
    ai: AI,
    docId: string,
    document?: DocumentInfo,
    chunks?: DocumentChunk[],
    model = "openai:gpt-4o-mini"
): Promise<string> {
    // If document has a title metadata, use that
    if (document?.metadata?.title) {
        return document.metadata.title as string;
    }

    // Use AI to generate a title based on content
    if (chunks && chunks.length > 0) {
        return await generateAIDocumentTitle(
            ai,
            document?.fileName || `doc-${docId.substring(0, 8)}`,
            chunks,
            model
        );
    }

    // Last resort fallback if no chunks are available
    return `Document ${docId.substring(0, 8)}`;
}

/**
 * Extracts a summary from document chunks
 */
function extractDocumentSummary(chunks: DocumentChunk[]): string {
    if (!chunks.length) {
        return "No content available for summarization";
    }

    // Sort chunks by their position in the document if possible
    const sortedChunks = [...chunks].sort((a, b) => {
        // First check for startPosition property directly on the chunk
        if (a.startPosition !== undefined && b.startPosition !== undefined) {
            return a.startPosition - b.startPosition;
        }
        // Then check for page numbers in metadata
        if (a.metadata?.page && b.metadata?.page) {
            return (a.metadata.page as number) - (b.metadata.page as number);
        }
        // Then check for position indices in metadata
        if (a.metadata?.position && b.metadata?.position) {
            return (a.metadata.position as number) - (b.metadata.position as number);
        }
        return 0;
    });

    // Get first chunk for beginning of document
    const firstChunk = sortedChunks[0];
    let summary = firstChunk.content.substring(0, 200);

    // If we have enough chunks, add a bit from the middle and end too
    if (sortedChunks.length > 2) {
        const middleChunk = sortedChunks[Math.floor(sortedChunks.length / 2)];
        const endChunk = sortedChunks[sortedChunks.length - 1];

        summary += "\n...\n" + middleChunk.content.substring(0, 100);
        summary += "\n...\n" + endChunk.content.substring(0, 100);
    }

    // Add ellipsis if content was truncated
    if (summary.length < chunks.map(c => c.content).join('').length) {
        summary += "...";
    }

    return summary;
}



/**
 * Creates DocumentInfoWithSummary objects from analysis result
 */
export async function createDocumentInfoWithSummaries(
    ai: AI,
    analysisResult: HierarchicalAnalysisResult<any>,
    model = "openai:gpt-4o-mini"
): Promise<DocumentInfoWithSummary[]> {
    // Get unique document IDs from all chunks
    const documentIds = new Set<string>();
    analysisResult.chunkAnalyses.forEach(analysis => {
        analysis.chunks.forEach(chunk => {
            documentIds.add(chunk.documentId);
        });
    });

    // Process each document in parallel
    const documentPromises = Array.from(documentIds).map(async docId => {
        // Find chunks for this document
        const docChunks = analysisResult.chunkAnalyses
            .flatMap(analysis => analysis.chunks)
            .filter(chunk => chunk.documentId === docId);

        // Get document from map if available
        const document = analysisResult.documents.get(docId);
        const fileName = document?.fileName || 'Unknown document';

        // Get the best possible title
        const title = await getBestDocumentTitle(ai, docId, document, docChunks, model);

        // Extract a summary
        const summary = extractDocumentSummary(docChunks);

        return {
            id: docId,
            fileName,
            title,
            summary,
            content: document?.content || '',
            totalChunks: docChunks.length
        };
    });

    return Promise.all(documentPromises);
}