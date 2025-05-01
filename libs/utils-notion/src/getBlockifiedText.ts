import _ from 'lodash';

/**
 * Simply splits a string into newline separated notion blocks.
 */
export function getBlockifiedText(text: string, maxGroupSize = 99) {
    const lines = text.split('\n');

    const handleLine = (line: string) => {
        if (line.startsWith('#')) {
            return ({
                object: 'block' as const,
                type: 'heading_1' as const,
                heading_1: {
                    rich_text: [
                        {
                            type: 'text' as const,
                            text: {
                                content: line.replace(/^#+\s*/, ''),
                            }
                        }
                    ]
                }
            })
        }
        else if (line.startsWith('##')) {
            return ({
                object: 'block' as const,
                type: 'heading_2' as const,
                heading_2: {
                    rich_text: [
                        {
                            type: 'text' as const,
                            text: {
                                content: line.replace(/^#+\s*/, ''),
                            }
                        }
                    ]
                }
            })
        }
        else if (line.startsWith('###')) {
            return ({
                object: 'block' as const,
                type: 'heading_3' as const,
                heading_3: {
                    rich_text: [
                        {
                            type: 'text' as const,
                            text: {
                                content: line.replace(/^#+\s*/, ''),
                            }
                        }
                    ]
                }
            })
        }

        return ({
            object: 'block' as const,
            type: 'paragraph' as const,
            paragraph: {
                rich_text: [
                    {
                        type: 'text' as const,
                        text: {
                            content: line,
                        }
                    }
                ]
            }
        })
    }





    if (lines.length <= maxGroupSize) {
        // If we have less than 99 lines, we can just return them as a single list without a wrapper.
        return lines.map((line) => {
            return handleLine(line);
        })
    }
    else {
        // If we have more than 99 lines, we need to split them into groups of 99.
        const groups = _.chunk(lines, 90);

        return groups.map((group, groupIdx) => {
            // Create the sub blocks 
            const subBlocks = group.map((line) => {
                return handleLine(line);
            })

            // Create the wrapping group
            return {
                object: 'block' as const,
                type: 'heading_3' as const,
                heading_3: {
                    rich_text: [
                        {
                            type: 'text' as const,
                            text: {
                                content: `(Part ${groupIdx + 1} / ${groups.length})`,
                            }
                        }
                    ],
                    children: subBlocks
                }
            }
        })
    }
}