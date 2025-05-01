import {NextResponse} from "next/server";

/**
 * Checks if the object is a NextResponse.
 * @param obj The object to check
 * @returns Whether the object is a NextResponse
 */
export function isNextResponse(obj: any): obj is NextResponse {
    return obj
        && obj.cookies
        && typeof obj.cookies.set === 'function'
        && typeof obj.cookies.get === 'function'
        && typeof obj.cookies.getAll === 'function'
        && typeof obj.cookies.delete === 'function'
        && typeof obj.json === 'function'
        && typeof obj.redirect === 'function'
        && typeof obj.rewrite === 'function'
        && typeof obj.next === 'function';
}

/**
 * Checks if the object is a NextResponse, but doesn't check for cookies.
 * @param obj The object to check
 * @returns Whether the object is a NextResponse
 */
export function isNextResponseProbably(obj: any): obj is NextResponse {
    return obj
        && obj.cookies
        && typeof obj.json === 'function'
        && typeof obj.redirect === 'function'
        && typeof obj.rewrite === 'function'
        && typeof obj.next === 'function';
}


/**
 * Checks if the object is a NextResponse.
 * @param obj The object to check
 * @returns Whether the object is a NextResponse
 */
export function isNextResponseV3(obj: any): boolean {
    // Check for the existence of the symbols and properties specific to NextResponse
    const hasSymbols = typeof obj === 'object' && obj !== null
        && Symbol.for('realm') in obj
        && Symbol.for('state') in obj
        && Symbol.for('headers') in obj
        && Symbol.for('internal response') in obj;

    if (!hasSymbols) return false;

    const state = obj[Symbol.for('state')];
    const headers = obj[Symbol.for('headers')];
    const internalResponse = obj[Symbol.for('internal response')];

    // Further checks can be added here based on the properties within state, headers, and internalResponse
    // For example, checking for specific properties in state:
    const stateIsValid = typeof state === 'object' && state !== null
        && 'aborted' in state && typeof state.aborted === 'boolean'
        // ... other properties of state

    // Similar checks for headers and internalResponse

    return stateIsValid; // && otherValidityChecks
}

export function isNextResponseV4(obj: any): boolean {
    // Check for a few key methods that are unique to NextResponse
    return obj && typeof obj.json === 'function'
}