/**
 * API key authentication for the MCP server HTTP transport.
 *
 * Users can set REASONOTE_MCP_API_KEYS as a comma-separated list of valid keys.
 * When set, every HTTP request must include a valid key via:
 *   - Header:  Authorization: Bearer <key>
 *   - Header:  X-API-Key: <key>
 *   - Query:   ?apiKey=<key>
 *
 * If REASONOTE_MCP_API_KEYS is not set, authentication is disabled (open access).
 */
import type { Request, Response, NextFunction } from 'express';

let validKeys: Set<string> | null = null;

function loadKeys(): Set<string> | null {
    const raw = process.env.REASONOTE_MCP_API_KEYS;
    if (!raw || raw.trim() === '') {
        return null; // auth disabled
    }
    return new Set(
        raw.split(',').map(k => k.trim()).filter(k => k.length > 0)
    );
}

/**
 * Returns true if the API key auth feature is enabled (at least one key configured).
 */
export function isAuthEnabled(): boolean {
    if (validKeys === null) {
        validKeys = loadKeys();
    }
    return validKeys !== null && validKeys.size > 0;
}

/**
 * Express middleware that enforces API key authentication.
 * If no keys are configured, all requests are allowed through.
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
    // Lazy-load keys on first request
    if (validKeys === null) {
        validKeys = loadKeys();
    }

    // If no keys configured, auth is disabled
    if (!validKeys || validKeys.size === 0) {
        next();
        return;
    }

    // Extract key from various sources
    let key: string | undefined;

    // 1. Authorization: Bearer <key>
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        key = authHeader.slice(7).trim();
    }

    // 2. X-API-Key header
    if (!key) {
        const xApiKey = req.headers['x-api-key'];
        if (typeof xApiKey === 'string') {
            key = xApiKey.trim();
        }
    }

    // 3. Query parameter
    if (!key) {
        const queryKey = req.query.apiKey;
        if (typeof queryKey === 'string') {
            key = queryKey.trim();
        }
    }

    if (!key || !validKeys.has(key)) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'A valid API key is required. Provide it via Authorization: Bearer <key>, X-API-Key header, or ?apiKey= query parameter.',
        });
        return;
    }

    next();
}
