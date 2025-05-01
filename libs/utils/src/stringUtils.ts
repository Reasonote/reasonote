export function trimAllLines(str: string): string {
    return str
        .split("\n")
        .map((line) => line.trim())
        .join("\n");
}

export function prefixAllLines(prefix: string, str: string): string {
    return str
        .split("\n")
        .map((line) => `${prefix}${line}`)
        .join("\n");
}
