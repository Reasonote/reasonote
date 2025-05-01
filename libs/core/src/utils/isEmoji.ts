// Function to count visual characters (graphemes)
export function countGraphemes(str: string): number {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        // Use Intl.Segmenter if available (modern browsers)
        const segmenter = new Intl.Segmenter();
        return Array.from(segmenter.segment(str)).length;
    } else {
        // Fallback for older browsers
        // This is a simple approximation and may not work for all cases
        return str.replace(/\p{Extended_Pictographic}/gu, '_').length;
    }
}

// Function to check if a string is (probably) an emoji
export function isEmoji(str: string): boolean {
    // Check if the string is empty
    if (str.length === 0) return false;

    // Count Unicode code points
    const codePoints = Array.from(str).length;

    // Count visual characters (graphemes)
    const graphemes = countGraphemes(str);

    // If there's only one grapheme but potentially multiple code points, it's likely an emoji
    if (graphemes === 1 && codePoints >= 1) {
        // Additional check: see if it matches the emoji Unicode range
        const firstCodePoint = str.codePointAt(0);
        if (firstCodePoint === undefined) return false;

        return (
            (firstCodePoint >= 0x1F000 && firstCodePoint <= 0x1FFFF) || // Miscellaneous Symbols and Pictographs
            (firstCodePoint >= 0x2600 && firstCodePoint <= 0x26FF) ||   // Miscellaneous Symbols
            (firstCodePoint >= 0x2700 && firstCodePoint <= 0x27BF) ||   // Dingbats
            (firstCodePoint >= 0xFE00 && firstCodePoint <= 0xFE0F) ||   // Variation Selectors
            (firstCodePoint >= 0x1F900 && firstCodePoint <= 0x1F9FF)    // Supplemental Symbols and Pictographs
        );
    }

    return false;
}