import _ from 'lodash';

import { ClientFieldParser } from '../ClientFieldParser';

/**
 * The expected client-side type of the Bigint field.
 *
 * This is the typescript type you'll deal with locally.
 */
export type BigIntClientFieldParserType = number;

/**
 * Can serialize and deserialize the `BigInt` type.
 */
export class BigIntClientFieldParser extends ClientFieldParser<BigIntClientFieldParserType> {
    constructor(readonly handleEmptyString: (value: string) => BigIntClientFieldParserType | null = (value) => null) {
        super("BigInt");
    }
    // Serialize determines how objects will be converted when they go
    // FROM client TO server.
    protected getSerializedValue = (parsed: unknown): string | null => {
        if (_.isNumber(parsed)) {
            return parsed.toString();
        }
        return null;
    };
    // parseValue determines how objects will be converted when they go
    // FROM server TO client.
    protected getParsedValue = (raw: unknown): BigIntClientFieldParserType | null => {
        if (_.isString(raw)) {
            return parseFloat(raw);
        }

        throw new Error("Invalid BigInt value.");
    };
}
