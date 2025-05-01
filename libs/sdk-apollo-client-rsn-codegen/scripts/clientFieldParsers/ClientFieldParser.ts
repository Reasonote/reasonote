import _ from 'lodash';

import { createSimpleLogger } from '@reasonote/lib-utils';

export abstract class ClientFieldParser<T> {
    uniqId = _.uniqueId(`ClientFieldParser_${this.parserType}`);
    logger = createSimpleLogger(this.uniqId);

    constructor(readonly parserType: string) { }

    /**
     * Serialize determines how objects will be converted when they go
     * FROM client TO server.
     *
     * Should throw an error if there is an issue.
     */
    protected abstract getSerializedValue: (parsed: unknown) => string | null;

    /**
     * Serialize determines how objects will be converted when they go
     * FROM client TO server.
     *
     * Should throw an error if there is an issue.
     */
    serialize = (parsed: unknown) => {
        try {
            return this.getSerializedValue(parsed);
        } catch (err) {
            this.logger.error(`Error serializing`, parsed, err);
            throw err;
        }
    };

    /**
     * parseValue determines how objects will be converted when they go
     * FROM server TO client.
     *
     * Should throw an error if there is an issue.
     */
    protected abstract getParsedValue: (raw: unknown) => T | null;

    /**
     * parseValue determines how objects will be converted when they go
     * FROM server TO client.
     *
     * If there is an issue, we log it and *return null*.
     */
    parseValue = (raw: unknown): T | null => {
        try {
            return this.getParsedValue(raw);
        } catch (err) {
            this.logger.error(`Error parsing`, raw, err);
            // We don't throw an error here because we trust the server.
            // If the server sends us what we *perceive to be* bad data,
            // we just ignore it.
            return null;
        }
    };
}
