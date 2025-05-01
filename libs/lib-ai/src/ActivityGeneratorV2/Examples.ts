import _ from 'lodash';

import { trimLines } from '@lukebechtel/lab-ts-utils';
import { ActivityGenExample } from '@reasonote/core';

export function formatExample(example: ActivityGenExample, exampleIndex: number) {
    return trimLines(`
        <${example.name ?? `example-${exampleIndex}`}>
            <INPUT>
                ${example.input}
            </INPUT>
            <OUTPUTS>
            ${example.outputs.map((output, outputIndex) => trimLines(`
                <${output.quality.toUpperCase()}-EXAMPLE>
                    <${output.name ?? `output-${outputIndex}`}>
                        ${_.isString(output.output) ? output.output : JSON.stringify(output.output)}
                    </${output.name ?? `output-${outputIndex}`}>
                    <EXPLANATION>
                        ${output.explanation}
                    </EXPLANATION>
                </${output.quality.toUpperCase()}-EXAMPLE>
                `)).join('\n')}
            </OUTPUTS>
        </${example.name ?? `example-${exampleIndex}`}>
    `)
}