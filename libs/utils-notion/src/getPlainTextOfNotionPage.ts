import { Client } from '@notionhq/client';

import {
  MdBlock,
  NotionToMarkdown,
} from './notion-to-md';

export interface GetPlainTextOfNotionPageBodyResult {
    mdString: string;
    mdLines: {
        mdBlock: MdBlock;
        nestingLevel: number;
    }[];
}

export async function getPlainTextOfNotionPageBody({ notion, pageId }: { notion: Client, pageId: string }): Promise<{
    mdString: string, mdLines: {
        mdBlock: MdBlock;
        nestingLevel: number;
    }[]
}> {
    const n2m = new NotionToMarkdown({ notionClient: notion });
    const mdblocks = await n2m.pageToMarkdown(pageId);
    const mdString = n2m.toMarkdownString(mdblocks);
    const mdLines = n2m.getFlatMarkdownBlocks(mdblocks);

    return {
        mdString,
        mdLines,
    };
}

// Fixes import issues?
(() => { })();