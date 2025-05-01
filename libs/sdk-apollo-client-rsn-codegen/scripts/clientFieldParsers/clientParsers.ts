import _ from 'lodash';

import { ClientFieldParser } from './ClientFieldParser';
import { ClientFieldParserTypes } from './clientParserTypes';
import {
  BigIntClientFieldParser,
} from './FieldTypeParsers/BigIntClientFieldParser';
import {
  DateClientFieldParser,
} from './FieldTypeParsers/DateClientFieldParser';
import {
  JSONClientFieldParser,
} from './FieldTypeParsers/JSONClientFieldParser';

export const clientFieldParsers: { [K in keyof ClientFieldParserTypes]: ClientFieldParser<ClientFieldParserTypes[K]> } =
{
    // Fields

    // Scalars
    JSON: new JSONClientFieldParser(),
    JSONB: new JSONClientFieldParser(),
    Date: new DateClientFieldParser(),
    DateTime: new DateClientFieldParser(),
    Datetime: new DateClientFieldParser(),
    BigInt: new BigIntClientFieldParser(),
};
