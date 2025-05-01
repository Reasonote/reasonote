export function jwtBearerify(token: string): string {
    return token.startsWith("Bearer") ? token.trim() : `Bearer ${token.trim()}`;
}
