import _ from "lodash";

import { type Maybe } from "./typeUtils";

export function JSONSafeParse(v: any): Maybe<any> {
    try {
        if (_.isString(v)) {
            return {
                success: true,
                data: JSON.parse(v),
                error: undefined,
            };
        } else if (_.isObject(v)) {
            return {
                success: true,
                data: v,
                error: undefined,
            };
        } else {
            throw new Error(
                "JSONSafeParse was not passed a string or an object.",
            );
        }
    } catch (error: any) {
        return {
            success: false,
            error,
            data: undefined,
        };
    }
}
