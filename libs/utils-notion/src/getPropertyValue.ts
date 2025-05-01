import { Client } from '@notionhq/client';

/**
 * If property is paginated, returns an array of property items.
 *
 * Otherwise, it will return a single property item.
 *
 * @param {{ pageId: string, propertyId: string }}
 * @returns {Promise<PropertyItemObject | Array<PropertyItemObject>>}
 */
export async function getPropertyValue({ notion, pageId, propertyId }: { notion: Client, pageId: string, propertyId: string }) {
    const propertyItem = await notion.pages.properties.retrieve({
        page_id: pageId,
        property_id: propertyId,
    })
    if (propertyItem.object === "property_item") {
        return propertyItem
    }

    // Property is paginated.
    let nextCursor = propertyItem.next_cursor
    const results = propertyItem.results

    // while (nextCursor !== null) {
    //     const propertyItem = await notion.pages.properties.retrieve({
    //         page_id: pageId,
    //         property_id: propertyId,
    //         start_cursor: nextCursor,
    //     })

    //     nextCursor = propertyItem.next_cursor
    //     results.push(...propertyItem.results)
    // }

    return results
}