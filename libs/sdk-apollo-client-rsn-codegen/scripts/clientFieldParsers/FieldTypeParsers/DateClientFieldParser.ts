import _ from 'lodash';
import { DateTime } from 'luxon';

import { ClientFieldParser } from '../ClientFieldParser';

/**
 * The expected client-side type of the Date field.
 */
export type DateClientFieldParserType = Date;

/**
 * Can serialize and deserialize the `Date` type.
 */
export class DateClientFieldParser extends ClientFieldParser<DateClientFieldParserType> {
    constructor() {
        super("Date");
    }
    // Serialize determines how objects will be converted when they go
    // FROM client TO server.
    protected getSerializedValue = (parsed: unknown): string | null => {
        if (_.isDate(parsed)) {
            return parsed.toISOString();
        }
        return null;
    };
    // parseValue determines how objects will be converted when they go
    // FROM server TO client.
    protected getParsedValue = (raw: unknown): Date | null => {
        if (_.isString(raw)) {
            return DateTime.fromISO(raw, { zone: "utc" }).toJSDate();
        }
        if (_.isDate(raw)) {
            return raw;
        }

        throw new Error("Invalid Date value.");
    };
}
