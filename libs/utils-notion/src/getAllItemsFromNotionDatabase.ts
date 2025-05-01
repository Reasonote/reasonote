import {
  Client,
  isFullPage,
} from '@notionhq/client';
import {
  PageObjectResponse,
  PartialPageObjectResponse,
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { notEmpty } from '@reasonote/lib-utils';

import { getPlainTextOfNotionPageBody } from './getPlainTextOfNotionPage';
import { MdBlock } from './notion-to-md';

export interface GetTasksFromNotionDatabaseOptions {
    databaseId: string
    notion: Client
    queryInfo?: Partial<QueryDatabaseParameters> | { ids: string[] };
}

export interface GetItemsPage {
    pageId: string;
    originalPage: PageObjectResponse
    extracted: {
        title: string;
        mdText: string;
        mdLines: {
            mdBlock: MdBlock;
            nestingLevel: number;
        }[];
    }
}

export interface GetTasksFromNotionDatabaseResult {
    pages: GetItemsPage[]
}


/**
 * Gets tasks from the database.
 *
 * @returns {Promise<Array<{ pageId: string, status: string, title: string }>>}
 */
export async function getAllItemsFromNotionDatabase({ databaseId, notion, queryInfo }: GetTasksFromNotionDatabaseOptions): Promise<GetTasksFromNotionDatabaseResult> {
    const pages: (PageObjectResponse | PartialPageObjectResponse)[] = []
    let cursor: string | undefined = undefined

    if (queryInfo && 'ids' in queryInfo) {
        await Promise.all(queryInfo.ids.map((page_id) => {
            return notion.pages.retrieve({
                page_id
            }).then((page) => {
                pages.push(page)
            })
        }))
    }
    else {
        while (true) {
            const { results, next_cursor } = await notion.databases.query({
                ...queryInfo,
                database_id: databaseId,
                start_cursor: cursor,
            }) as QueryDatabaseResponse;
            pages.push(...results)
            if (!next_cursor) {
                break
            }
            cursor = next_cursor
        }
    }

    // console.log(`${pages.length} pages successfully fetched.`)

    return {
        pages: (await Promise.all(pages.map(async (p) => {
            const titleProperty = isFullPage(p) ? p.properties['Name'] : { type: 'title', title: [{ plain_text: '<Title_Loading_Error>' }] }

            const { mdString, mdLines } = await getPlainTextOfNotionPageBody({ notion, pageId: p.id })

            if (isFullPage(p)) {
                return {
                    pageId: p.id,
                    originalPage: p,
                    extracted: {
                        title: titleProperty.type === 'title' && titleProperty.title[0] ? titleProperty.title[0].plain_text : '<Title_Loading_Error>',
                        mdText: mdString,
                        mdLines
                    },
                }
            }
            else {
                console.warn("Page is not full page! Returning null", p)
                return null
            }
        }))).filter(notEmpty)
    }
}