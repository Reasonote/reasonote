import * as z from "zod";

import { parseSchema } from "../vendor";

export function unsafeJsonSchemaToZod(jsonSchemaObj: any): z.ZodSchema {
    // TODO: this is hacky and requires us to trust the output of `parseSchema` from a 3rd party lib.
    const scopedEval = (scope: any, script: string) => Function(`"use strict"; ${script}`).bind(scope)();

    const result = scopedEval({ z }, `
        return ${
            parseSchema(jsonSchemaObj as any).replace(/\bz\./g, "this.z.")
        };
    `)

    if (!(result instanceof z.Schema)) {
        throw new Error('Did not receive valid zod object');
    }

    if (typeof result.parse === 'undefined') {
        throw new Error('Did not receive valid zod object');
    }

    return result;
}