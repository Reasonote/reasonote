import * as Priompt from '@anysphere/priompt';
import {
  Block,
  UnifiedResource,
} from '@reasonote/lib-ai';

/**
 * The chunk size that will be used if no matched sections are found.
 */
const DEFAULT_CHUNK_SIZE_CHARS = 1000;
const DEFAULT_MAX_TOKEN_PER_RESOURCE = 30_000;

export function ResourceSection(props: {resource: UnifiedResource, dangerouslyEmbedFullContent?: boolean, tokenLimit?: number}) {
    const { resource, dangerouslyEmbedFullContent, tokenLimit } = props;

    var sectionsConsolidated = resource.matchedSections?.map((section) => section.sections).flat();

    /**
     * When a resource has no matched sections (which happens when vector search didn't match anything
     * or wasn't performed), we need to provide the content in a consumable format.
     * 
     * The approach below chunks the entire content into fixed-size blocks of 500 characters.
     * This ensures that:
     * 1. Large documents are broken into manageable pieces
     * 2. Each chunk is small enough to be processed effectively
     * 3. We maintain the full content context while providing structure
     * 
     * Each chunk is then formatted in the same way matched sections would be,
     * with proper content offsets to maintain positional awareness.
     */
    if (dangerouslyEmbedFullContent) {
        const content = resource.content || '';
        const contentChunks = [];
        
        // Split content into chunks of 500 characters
        for (let i = 0; i < content.length; i += DEFAULT_CHUNK_SIZE_CHARS) {
            contentChunks.push(content.substring(i, i + DEFAULT_CHUNK_SIZE_CHARS));
        }

        sectionsConsolidated = contentChunks.map((chunk: string, index: number) => ({
            id: `chunk-${index}`,
            type: 'content',
            content: chunk,
            contentOffset: index * DEFAULT_CHUNK_SIZE_CHARS,
            contentLength: chunk.length,
            similarity: 1,
        }));
    }

    if (!sectionsConsolidated || sectionsConsolidated.length === 0) {
        return null;
    }

    return (
        <Block name="RESOURCE" attributes={{ id: resource.id, name: resource.name, source: resource.source }}>
            <isolate tokenLimit={tokenLimit ?? DEFAULT_MAX_TOKEN_PER_RESOURCE}>
                {sectionsConsolidated.map((section) => (
                    section.type === 'content' ?
                    <scope p={section.similarity * 100}>
                        <Block name={`content`} attributes={{ id: section.id, type: section.type, content: section.content }}>
                            {section.content}
                        </Block>
                    </scope>
                    :
                    `<gap gapLength="${section.gapLength}"/>`
                ))}
            </isolate>
        </Block>
    );
}