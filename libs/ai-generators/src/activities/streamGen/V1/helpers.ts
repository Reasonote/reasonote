import {
  from,
  mergeMap,
  Observable,
  toArray,
} from 'rxjs';

async function asyncGeneratorToCallbacks<T>(generator: AsyncGenerator<T>, onGenerated: (value: T) => void) {
    for await (const value of generator) {
        onGenerated(value);
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
async function* partialObjectStreamToArrayStream<TStream, TItem>(
    partialObjectStream: AsyncIterable<TStream>,
    selectItem: (value: TStream) => TItem[] | null | undefined,
    onNewItem?: (value: TItem) => void,
): AsyncGenerator<TItem> {
    let previousItemStrings: Set<string> = new Set();
    let lastItem: TItem | null = null;

    for await (const chunk of partialObjectStream) {
        const currentItems = selectItem(chunk);
  
        if (currentItems) {
            for (let i = 0; i < currentItems.length; i++) {
                const item = currentItems[i];
                const itemString = JSON.stringify(item);
  
                if (!previousItemStrings.has(itemString)) {
                    if (lastItem) {
                        yield lastItem;
                        onNewItem?.(lastItem);
                    }
                    lastItem = item;
  
                    previousItemStrings.add(itemString);
                }
            }
        }
    }
  
    if (lastItem) {
        yield lastItem;
        onNewItem?.(lastItem);
    }
}

function processStreamInParallel<T, U>(
    stream: AsyncIterable<T>,
    processItem: (item: T) => Promise<U>,
    concurrency = Infinity
): Observable<U[]> {
    return from(stream).pipe(
        mergeMap(item => from(processItem(item)), concurrency),
        toArray()
    );
}