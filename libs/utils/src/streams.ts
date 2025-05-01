/**
 * Converts an async generator to a readable stream that emits a JSON array.
 * @param generator The generator to convert to a readable stream.
 * @returns A readable stream that emits a JSON array.
 */
export function generatorToJSONArrayReadableStream<T>(generator: AsyncGenerator<T>) {
    return new ReadableStream({
      async start(controller) {
        controller.enqueue(new TextEncoder().encode(`[`));
        for await (const chunk of generator) {
          controller.enqueue(new TextEncoder().encode(`${JSON.stringify(chunk)},`));
        }
        controller.enqueue(new TextEncoder().encode(`]`));
        controller.close();
      },
    });
}

/**
 * Streams a partial object and yields each new item in the stream.
 *
 * As the stream comes in (representing a partial object), `selectItem` is called to get the current array of objects, if any.
 * If a list exists, 
 * No item is returned until it has an item after it in the list -- this is because the final item may still be under construction.
 * This continues until the stream completes -- only then is the last item added.
 *
 * @param partialObjectStream - The stream of partial objects.
 * @param selectItem - A function to select the array of items from the partial object.
 * @returns An async generator that yields each new item in the stream.
 */
export async function* partialObjectStreamToArrayGenerator<TStream, TItem>(
  partialObjectStream: AsyncIterable<TStream>,
  selectArray: (value: TStream) => TItem[] | null | undefined,
): AsyncGenerator<TItem> {
  let previousItemStrings: Set<string> = new Set();
  let lastSeenItem: TItem | null = null;

  for await (const chunk of partialObjectStream) {
      const currentItems = selectArray(chunk);
      
      if (currentItems?.length) {
          // For all items except the last one in this chunk
          for (let i = 0; i < currentItems.length - 1; i++) {
              const item = currentItems[i];
              const itemString = JSON.stringify(item);
              
              // If this item is new, save it to yield
              if (!previousItemStrings.has(itemString)) {
                  yield item;
                  previousItemStrings.add(itemString);
              }
          }
          
          // Save the last item to potentially yield later
          if (currentItems.length > 0) {
              lastSeenItem = currentItems[currentItems.length - 1];
          }
      }
  }

  // After the stream is complete, yield the last item if we haven't yielded it yet
  if (lastSeenItem && !previousItemStrings.has(JSON.stringify(lastSeenItem))) {
      yield lastSeenItem;
  }
}

/**
 * Streams a partial object and calls the `onNewItem` callback with each new item in the stream.
 *
 * As the stream comes in (representing a partial object), `selectItem` is called to get the current array of objects, if any.
 * If a list exists, the `onNewItem` callback is called for each new item in the array (determined by a list of JSON.stringified objects kept in this function).
 * No item is returned until it has an item after it in the list -- this is because the final item may still be under construction.
 * This continues until the stream completes -- only then is the last item added.
 *
 * @param partialObjectStream - The stream of partial objects.
 * @param onNewItem - The callback to call with each new item in the stream.
 * @param selectItem - A function to select the array of items from the partial object.
 */
export async function partialObjectStreamToArrayCb<TStream, TItem>(
  partialObjectStream: AsyncIterable<TStream>,
  selectItem: (value: TStream) => TItem[] | null | undefined,
  onNewItem?: (value: TItem) => void,
): Promise<TItem[]> {
  const items: TItem[] = [];

  for await (const item of partialObjectStreamToArrayGenerator(partialObjectStream, selectItem)) {
    items.push(item);
    onNewItem?.(item);
  }

  return items;
}

/**
* Processes complete JSON objects from a chunk of data.
* @param chunk - The chunk of data containing complete JSON objects.
* @returns An object containing the processed JSON objects and any remaining chunks.
*/
export const processCompleteJSONObjects = (chunk: string) => {
 let accumulatedChunks = '';
 const objects: any[] = [];

 accumulatedChunks += chunk;

 while (true) {
   try {
     const endIndex = accumulatedChunks.indexOf('\n');
     if (endIndex === -1) {
       break;
     }

     const jsonString = accumulatedChunks.slice(0, endIndex);
     const object = JSON.parse(jsonString);
     objects.push(object);
     accumulatedChunks = accumulatedChunks.slice(endIndex + 1);
   } catch (error) {
     break;
   }
 }

 return { objects, remainingChunks: accumulatedChunks };
}