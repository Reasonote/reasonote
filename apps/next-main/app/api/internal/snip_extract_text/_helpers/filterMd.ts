import _ from "lodash";

/**
 * Filters MD text to remove any unwanted content
 * @param md The markdown text to filter
 * @returns The filtered MD text
 */
export function filterMd(md: string, authors?: string[]): string {  
    // Remove any markdown link which has as its inner text "Skip to main content" or "Skip to content" or "Skip Ad" or "Skip Advertisment" or "Skip Adds" or "Skip Advertisement" or "Skip Advertisements"
    const adLinkInnerTexts = [
        "skip to main content",
        "skip to content",
        "skip ad",
        "skip advertisement",
        "skip advertisements",
    ];
    
    adLinkInnerTexts.forEach((innerText) => {
        // Match any markdown link with the inner text (case-insensitive)
        md = md.replace(new RegExp(`\\[${innerText}\\]\\([^)]+\\)`, "gi"), "");
    });

    // Filter out any links which just have the author's name,
    // or "More by [author]" or "By [author]"
    // or "Written by [author]" or "Written by: [author]"
    // or "Author: [author]" or "Author(s): [author]"
    // or "Contributed by [author]" or "Contributed by: [author]"
    // or "Contributor: [author]" or "Contributors: [author]"
    authors?.forEach((author) => {
        md = md.replace(new RegExp(`\\[${author}\\]\\([^)]+\\)`, "gi"), "");
        md = md.replace(new RegExp(`More by ${author}`, "gi"), "");
        md = md.replace(new RegExp(`By ${author}`, "gi"), "");
        md = md.replace(new RegExp(`Written by ${author}`, "gi"), "");
        md = md.replace(new RegExp(`Written by: ${author}`, "gi"), "");
        md = md.replace(new RegExp(`Author: ${author}`, "gi"), "");
        md = md.replace(new RegExp(`Author\\(s\\): ${author}`, "gi"), "");
        md = md.replace(new RegExp(`Contributed by ${author}`, "gi"), "");
        md = md.replace(new RegExp(`Contributed by: ${author}`, "gi"), "");
        md = md.replace(new RegExp(`Contributor: ${author}`, "gi"), "");
    });

    // Filter out empty links
    md = md.replace(/\[.*\]\(\)/g, "");

    // Filter out any links which just have the word "source"
    md = md.replace(/\[source\]\([^)]+\)/gi, "");

    return md;
}