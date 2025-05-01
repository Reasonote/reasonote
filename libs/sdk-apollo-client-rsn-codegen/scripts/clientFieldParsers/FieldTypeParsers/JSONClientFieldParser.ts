import _ from 'lodash';

import { ClientFieldParser } from '../ClientFieldParser';

/**
 * The expected client-side type of the Vector3 field.
 */
export type JSONClientFieldParserType = Record<string, unknown>;

/**
 * Can serialize and deserialize the `JSON` type.
 */
export class JSONClientFieldParser extends ClientFieldParser<JSONClientFieldParserType> {
    constructor(readonly handleEmptyString: (value: string) => JSONClientFieldParserType | null = (value) => null) {
        super("JSON");
    }
    // Serialize determines how objects will be converted when they go
    // FROM client TO server.
    protected getSerializedValue = (parsed: unknown): string | null => {
        if (_.isObject(parsed)) {
            return JSON.stringify(parsed);
        }
        return null;
    };
    // parseValue determines how objects will be converted when they go
    // FROM server TO client.
    protected getParsedValue = (raw: unknown): JSONClientFieldParserType | null => {
        if (_.isString(raw)) {
            if (raw.trim().length === 0) {
                // An empty string on a JSON field is equivalent to an empty object.
                return this.handleEmptyString(raw);
            } else {
                return JSON.parse(raw);
            }
        }
        if (_.isObject(raw)) {
            return raw as JSONClientFieldParserType;
        }

        throw new Error("Invalid JSON value.");
    };
}
