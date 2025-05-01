import { Client } from '@notionhq/client';

import { NotionToMarkdown } from './notion-to-md';

export async function getPlainTextLinesOfNotionPageBody({ notion, pageId }: { notion: Client, pageId: string }) {
    const n2m = new NotionToMarkdown({ notionClient: notion });
    const mdblocks = await n2m.pageToMarkdown(pageId);

    const mdLines = await n2m.getFlatMarkdownBlocks(mdblocks);

    return mdLines;
}

// Fixes import issues?
(() => { })();