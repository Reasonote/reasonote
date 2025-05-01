import { Client } from '@notionhq/client';
import {
  BlockObjectResponse,
  PartialBlockObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';

interface GetTasksFromNotionDatabaseOptions {
    blockId: string
    notion: Client
}

interface GetTasksFromNotionDatabaseResult {
    blocks: (BlockObjectResponse | PartialBlockObjectResponse)[]
}


/**
 * Gets tasks from the database.
 *
 * @returns {Promise<Array<{ pageId: string, status: string, title: string }>>}
 */
export async function getAllBlocksUnderBlock({ blockId, notion }: GetTasksFromNotionDatabaseOptions): Promise<GetTasksFromNotionDatabaseResult> {
    const blocks: (BlockObjectResponse | PartialBlockObjectResponse)[] = []
    let cursor: string | undefined = undefined

    while (true) {
        //@ts-ignore
        const { results, next_cursor } = await notion.blocks.children.list({
            block_id: blockId,
            start_cursor: cursor,
        });
        blocks.push(...results)
        if (!next_cursor) {
            break
        }
        cursor = next_cursor
    }
    // console.log(`${pages.length} pages successfully fetched.`)

    return {
        blocks
    }
}