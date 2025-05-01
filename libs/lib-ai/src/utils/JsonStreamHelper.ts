import _ from 'lodash';

import { createSimpleLogger } from '@lukebechtel/lab-ts-utils';

import { reduceObjectToPaths } from './reduceObjectToPaths';

interface PathStatus {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
    writeStatus: 'waiting' | 'in-progress' | 'complete';
    lastUpdatedAtIteration: number;
    firstSeenAtIteration: number;
    value: any;
    prevValueAtOutput?: any;
    prevValue?: any;
}

export class JsonStreamHelper {
    private prevPathMap: Map<string, PathStatus> = new Map<string, PathStatus>();
    private pathMap: Map<string, PathStatus> = new Map<string, PathStatus>();
    private curIteration: number = 0;

    private textSentSoFar: string = '';

    private logger = createSimpleLogger({
        prefix: {
            type: 'function',
            func: ({ logType, logArgs }) => {
                return `[${this.curIteration}]`;
            },
        },
        // For debugging, comment out these log functions and you'll see copious output.
        logFunctions: {
            log: (...args: any[]) => {
                //
            },
            warn: (...args: any[]) => {
                //
            },
            error: (...args: any[]) => {
                //
            },
            debug: (...args: any[]) => {
                //
            },
        },
    });

    /**
     * The buffer of output that will be sent in the next chunk.
     */
    private outputChunkBuffer: string = '';

    visitPath(path: string, hasLaterSiblings: boolean){
        const pathItem = this.pathMap.get(path)!;

        if (!pathItem) {
            return;
        }

        // If this path is 'complete', we should skip it -- it and its children have already been output.
        if (pathItem.writeStatus === 'complete') {
            return;
        }

        this.logger.log(`Visiting path ${path} with {type: ${pathItem.type}, writeStatus: ${pathItem.writeStatus}}`);


        // If this path is a non-collection (string, number, boolean, null)
        if (['string', 'number', 'boolean', 'null'].includes(pathItem.type)) {
            // If waiting
            if (pathItem.writeStatus === 'waiting') {
                // If string, output our initial " character
                if (pathItem.type === 'string') {
                    this.outputChunkBuffer += '"';
                }

                // When we visit a path, we mark it as 'in-progress'.
                pathItem.writeStatus = 'in-progress';
            }

            // Now we must output the remainder of the value
            if (pathItem.type === 'string' || pathItem.type === 'number') {
                const escapeString = (str: string): string => {
                    return str.replace(/[\n\r\t"\\]/g, (match: string) => ({
                        '\n': '\\n',
                        '\r': '\\r',
                        '\t': '\\t',
                        '"': '\\"',
                        '\\': '\\\\'
                    })[match] ?? match);
                }

                const prevText = pathItem.prevValueAtOutput 
                    ? escapeString(pathItem.prevValueAtOutput.toString())
                    : '';
                const curText = escapeString(pathItem.value.toString());

                // For strings and numbers, only output the diff between the prevValue and the current value
                // (if any)
                if (prevText !== curText) {
                    pathItem.prevValueAtOutput = pathItem.value;
                    this.outputChunkBuffer += curText.slice(prevText.length);
                }
            } else if (pathItem.type === 'boolean') {
                this.outputChunkBuffer += pathItem.value ? 'true' : 'false';
            } else if (pathItem.type === 'null') {
                this.outputChunkBuffer += 'null';
            }

            // If there are *any newer paths than this path* (because this is terminal)...
            // Or we have later siblings...
            // OR We're boolean / null, then this node is done.
            if (pathItem.lastUpdatedAtIteration < this.curIteration || hasLaterSiblings || ['boolean', 'null'].includes(pathItem.type)) {
                // If string, output our final " character
                if (pathItem.type === 'string') {
                    this.outputChunkBuffer += '"';
                }

                // Mark this path as complete
                pathItem.writeStatus = 'complete';
            }
        }
        // Else this path is a collection (object, array)
        else {
            if (pathItem.writeStatus === 'waiting') {
                // If this is our first time seeing this path, we should output the initial characters for the path.
                // If it's an object, we should output '{'
                if (pathItem.type === 'object') {
                    this.outputChunkBuffer += '{';
                }
                // If it's an array, we should output '['
                else if (pathItem.type === 'array') {
                    this.outputChunkBuffer += '[';
                }

                // Mark this path as 'in-progress'
                pathItem.writeStatus = 'in-progress';
            }

            // const allPathmap = Array.from(this.pathMap.entries());
            // this.logger.log(`All pathmap: ${JSON.stringify(allPathmap, null, 2)}`);


            // Find any children of this path
            // As denoted by pathMap keys with this path as a prefix
            // (there are easier / faster ways, but...)
            const children = Array.from(this.pathMap.entries()).filter(([mappedPath, status]) => {
                // console.log(`path: "${path}", mappedPath: "${mappedPath}"`);
                if (path.trim().length === 0) {
                    const res = mappedPath !== path && 
                        mappedPath.split('.').length === 1;

                    return res;
                }
                else {
                    // Only immediate children, so anything that has exactly one dot after our path
                    return mappedPath.startsWith(path) && 
                        mappedPath !== path && 
                        mappedPath.split('.').length === path.split('.').length + 1;
                }
            });

            // const getHasLaterSiblings = (thisPath: string): boolean => {
            //     // Get index in children array
            //     const indexInChildren = children.findIndex(([childPath, _]) => childPath === thisPath);

            //     // Return true if there are more children after this one
            //     return indexInChildren < children.length - 1;
            // }

            // If this is an object, we must account for the case where the following happens:
            // {
            //     "a": 1,
            //     "b": ""
            //     "c": {
            //         "d": 3
            //     }
            // }
            // {
            //     "a": 1,
            //     "b": "hello",
            //     "c": {
            //         "d": 3
            //     }
            // }
            // We must be careful here becuase javascript objects are unordered.
            // Thus, we should not output *any* key, until we've seen it at least 2 times.
            // Then, we should order the output of the keys based on their lastUpdatedAtIteration.
            // So, let's filter the children by firstSeenAtIteration
            // - Then let's order them by lastUpdatedAtIteration

            const childrenToIterateOver = _.orderBy(children
                .filter(([_, status]) => {
                    // If we have more than one child, and we're an object, we should only output the keys if they've been seen at least once.
                    if (pathItem.type === 'object' && children.length > 1) {
                        return status.firstSeenAtIteration < this.curIteration;
                    }
                    return true;
                })
                .sort(([_, status]) => status.lastUpdatedAtIteration)
                ,
                (child) => child[1].lastUpdatedAtIteration,
                'asc'
            );

            // Now, we should iterate over the children in order
            for (let index = 0; index < childrenToIterateOver.length; index++) {
                const [childPath, childStatus] = childrenToIterateOver[index];


                // If this is the first time we're visiting this child..
                if (childStatus.writeStatus === 'waiting') {
                    // If this is not the first child, we should output the prefix comma
                    if (index > 0) {
                        this.outputChunkBuffer += ',';
                    }

                    // If this is an object, and this is the first time we're visiting this child (it's waiting)we should output the key
                    if (pathItem.type === 'object') {
                        this.outputChunkBuffer += `"${childPath.split('.').pop()}":`;
                    }
                }

                this.visitPath(childPath, index < childrenToIterateOver.length - 1);
            }

            //////////////////////////////////////////////////////////////
            // TODO: this is old and should likely be removed

            // this.logger.log(`Found ${children.length} children for path ${path}: ${children.map(([childPath, _]) => childPath).join(', ')}`);
            // this.logger.log(JSON.stringify(children, null, 2));

            // Find any children that are 'in-progress'
            // const inProgressChildren = children.filter(([_, status]) => status.writeStatus === 'in-progress');

            // this.logger.log(`Found ${inProgressChildren.length} in-progress children for path ${path}: ${inProgressChildren.map(([childPath, _]) => childPath).join(', ')}`);

            // if (inProgressChildren.length > 1) {
            //     this.logger.warn(`Found more than one child (${inProgressChildren.length}, to be exact) that is 'in-progress' for path ${path}. This should never happen.`);
            // }

            // // If any children are 'in-progress', we must deal with them first.
            // if (inProgressChildren.length > 0) {
            //     // Set this as the prevPath

            //     for (let index = 0; index < inProgressChildren.length; index++) {
            //         const [childPath, childStatus] = inProgressChildren[index];
            //         // Check if this childPath has been around for more than 1 iteration
            //         this.visitPath(childPath, getHasLaterSiblings(childPath));
            //     }
            // }

            // // Handle 'waiting' children
            // const waitingChildren = children.filter(([_, status]) => status.writeStatus === 'waiting');
            // for (let index = 0; index < waitingChildren.length; index++) {
            //     const [childPath, childStatus] = waitingChildren[index];

            //     // Waiting children have not had any prework completed, so we should handle them now.
            //     // Need to output the key for the child if it is an object.
            //     if (pathItem.type === 'object') {
            //         this.outputChunkBuffer += `"${childPath.split('.').pop()}":`;
            //     }

            //     this.visitPath(childPath, getHasLaterSiblings(childPath));
            // }


            // console.log(`pathItem.lastUpdatedAtIteration: ${pathItem.lastUpdatedAtIteration}, curIteration: ${this.curIteration}`);
            // Now we've handled all waiting and in-progress children
            // - If there are *newer paths outside of this path* that have been added after this path was first seen
            //   then we should mark this path as 'complete' because we have processed all of its children.
            if (pathItem.lastUpdatedAtIteration < this.curIteration) {


                pathItem.writeStatus = 'complete';

                this.logger.log(`Marking path ${path} (${pathItem.type}) as complete`);

                // Based on the type of pathItem, output the appropriate closing character
                if (pathItem.type === 'object') {
                    this.outputChunkBuffer += '}';
                } else if (pathItem.type === 'array') {
                    this.outputChunkBuffer += ']';
                }
            }
        }
    }

    /**
     * Gets the next chunk of text that should be sent.
     * 
     * 
     * currentObject: This will always be a superset of the previousObject.
     */
    getNextChunk(currentObject: any, forceComplete: boolean = false): string {
        // Unless we're forcing completion, we should only output if the currentObject has changed.
        if (JSON.stringify(currentObject) === JSON.stringify(this.prevPathMap.get('')?.value) && !forceComplete) {
            return '';
        }
        // console.log(`currentObject: ${JSON.stringify(currentObject)}, prevPathMap: ${JSON.stringify(this.prevPathMap.get('')?.value)}`);

        this.logger.log(`Getting next chunk`);
        function getPathType(value: any): PathStatus['type'] {
            return _.isArray(value) ? 'array' as const : _.isObject(value) ? 'object' as const : _.isString(value) ? 'string' as const : _.isNumber(value) ? 'number' as const : _.isBoolean(value) ? 'boolean' as const : _.isNull(value) ? 'null' as const : 'null';
        }


        // Get the new list of all paths.
        const curPathMap = reduceObjectToPaths(currentObject, (v) => {
            return {
                type: getPathType(v),
                value: v,
            }
        });

        // Insert the root item 
        curPathMap.set('', {
            type: getPathType(currentObject),
            value: currentObject,
        });

        // Add all new paths to the pathMap
        for (const path of Array.from(curPathMap.keys())) {
            if (!this.pathMap.has(path)) {
                // console.log(`Adding path ${path} to pathMap`);
                this.pathMap.set(path, {
                    ...curPathMap.get(path)!,
                    prevValue: undefined,
                    writeStatus: 'waiting',
                    firstSeenAtIteration: this.curIteration,
                    lastUpdatedAtIteration: this.curIteration,
                });
            }

            // Set all values to the most updated values
            this.pathMap.get(path)!.value = curPathMap.get(path)!.value;
            this.pathMap.get(path)!.prevValue = this.prevPathMap.get(path)?.value;

            // If this path, or any of its children, were updated, set the lastUpdatedAtIteration to the current iteration
            if (JSON.stringify(this.pathMap.get(path)!.value) !== JSON.stringify(this.prevPathMap.get(path)?.value)) {
                // console.log(`Updating lastUpdatedAtIteration for path ${path}`);
                // Update lastUpdatedAtIteration for this path and all parent paths
                let curPath = path;
                while (curPath !== '') {
                    const pathItem = this.pathMap.get(curPath);
                    if (pathItem) {
                        pathItem.lastUpdatedAtIteration = this.curIteration;
                    }
                    // Get parent path by removing last segment
                    curPath = curPath.substring(0, Math.max(0, curPath.lastIndexOf('.')));
                }
                
                // Also update root
                const rootPathItem = this.pathMap.get('');
                if (rootPathItem) {
                    rootPathItem.lastUpdatedAtIteration = this.curIteration;
                }
            }
        }

        // Visit any root paths
        this.visitPath('', false);

        // Copy the output chunk
        const outputChunk = _.cloneDeep(this.outputChunkBuffer);

        // Reset the output chunk
        this.outputChunkBuffer = '';

        // Save prevMap
        this.prevPathMap = _.cloneDeep(this.pathMap);

        // Return the output chunk
        this.textSentSoFar += outputChunk;
        this.curIteration++;
        return outputChunk;
    }

    getAllText(): string {
        return this.textSentSoFar;
    }
    

    /**
     * Resets the helper state
     */
    reset(): void {
        this.outputChunkBuffer = '';
        this.pathMap.clear();
        this.prevPathMap.clear();
        this.curIteration = 0;
        this.textSentSoFar = '';
    }
} 