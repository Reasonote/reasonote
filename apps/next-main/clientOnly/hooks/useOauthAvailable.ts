'use client'

export function useOauthAvailable() {
    const hostname = window.location.hostname;
    // This just checks if we're on localhost and returns false if we are.
    return {oauthIsAvailable: hostname !== "localhost"}
}