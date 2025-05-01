import fetch from "node-fetch";
import {NodeHtmlMarkdown} from "node-html-markdown";
import * as parse5 from "parse5";
import type {
  Document,
  Element,
} from "parse5/dist/tree-adapters/default";
import validator from "validator";

import {SimpleLogger} from "@lukebechtel/lab-ts-utils";
import {Database} from "@reasonote/lib-sdk";
import {SupabaseClient} from "@supabase/supabase-js";

import {extractAuthors} from "./extractAuthors";
import {getFilteredDocument} from "./filterBody";
import {filterMd} from "./filterMd";

/**
 * Helper function to find elements by tag name in parse5 AST
 */
function getElementsByTagName(node: any, tagName: string): Element[] {
  const elements: Element[] = [];
  
  if (node.tagName === tagName) {
    elements.push(node);
  }
  
  if (node.childNodes) {
    node.childNodes.forEach((child: any) => {
      elements.push(...getElementsByTagName(child, tagName));
    });
  }
  
  return elements;
}

/**
 * Helper function to get text content from a node
 */
function getTextContent(node: any): string {
  if (node.nodeName === '#text') {
    return node.value || '';
  }
  
  if (node.childNodes) {
    return node.childNodes.map((child: any) => getTextContent(child)).join('');
  }
  
  return '';
}

/**
 * Extracts the most-reasonable title of a webpage from its HTML content.
 * @param document HTML doc
 * @param url URL of the page
 * @returns The most reasonable title of the page
 */
function extractTitle(document: Document, url: string): string {
  // Check for a <title> tag
  const titleElements = getElementsByTagName(document, 'title');
  const titleTag = titleElements[0] ? getTextContent(titleElements[0])?.trim() : '';
  if (titleTag) return titleTag;

  // Look for the first <h1> - <h6> tags
  for (let i = 1; i <= 6; i++) {
    const headings = getElementsByTagName(document, `h${i}`);
    const heading = headings[0] ? getTextContent(headings[0])?.trim() : '';
    if (heading) return heading;
  }

  // Check for meta tags
  const metaTags = getElementsByTagName(document, 'meta');
  const titleMeta = metaTags.find(tag => 
    tag.attrs?.find(attr => 
      (attr.name === 'name' && attr.value === 'title') ||
      (attr.name === 'property' && attr.value === 'og:title')
    )
  );
  const metaTitle = titleMeta?.attrs?.find(attr => attr.name === 'content')?.value?.trim();
  if (metaTitle) return metaTitle;

  // URL Fallback
  const urlFallback = new URL(url).pathname.split('/').filter(Boolean).pop() || '';
  return decodeURIComponent(urlFallback.replace(/-/g, ' '));
}

export async function extractAndFillSnip({supabase, id, logger}: {supabase: SupabaseClient<Database>, id: string, logger: SimpleLogger}): Promise<string | null> {
  // Fetch the Supabase item by id
  const { data: snip, error, count } = await supabase
    .from('snip')
    .select('*')
    .eq('id', id)
    .single();

  logger.debug(`Snip ${id} found:`, snip);

  if (error || count === 0) {
    console.log("No snip found with the given id.");
    return null;
  }

  // If it's already extracted AND content isn't null or empty,
  // return the existingcontent
  if (snip.extraction_state === 'success' && snip.text_content && snip.text_content.trim() !== ''){
    logger.warn(`Tried to extract text from ${id} that already has text content. Returning existing content.`);
    return snip.text_content;
  }

  const testUrl = snip.source_url;
  const url = `http://archive.org/wayback/available?url=${testUrl}`;
  const response = await fetch(url);
  const data = await response.json() as any;

  const archiveUrl = data?.archived_snapshots?.closest?.url ?? testUrl;

  if (archiveUrl) {
    logger.debug(`Archived version: ${archiveUrl}`);

    // Fetching the archived page
    const pageResponse = await fetch(archiveUrl);

    const htmlContent = await pageResponse.text();

    // Parse the HTML with parse5
    const document = parse5.parse(htmlContent);

    logger.debug(`htmlContent: ${htmlContent.slice(0, 1000)}`);

    // Filter out unwanted elements
    const filteredDocument = await getFilteredDocument(document, archiveUrl);

    // Convert the filtered document back to HTML string
    const serializedHtml = parse5.serialize(filteredDocument);
    
    const mdPrefilter = NodeHtmlMarkdown.translate(serializedHtml);

    const authors = extractAuthors(document, archiveUrl);

    const markdownContent = filterMd(mdPrefilter, authors);
    logger.debug(`Markdown content: `);
    
    const title = extractTitle(document, archiveUrl);

    // Update the extracted text in the Supabase "snip" item
    const res = await supabase
      .from('snip')
      .update({
          text_content: validator.escape(markdownContent),
          _name: validator.escape(title),
          extraction_state: 'success',
      })
      .eq('id', id);

    if (res.error) {
      logger.error(`Failed to update snip ${id} with extracted content:`, res.error);
      const errorRes = await supabase
        .from('snip')
        .update({
            extraction_state: 'failed',
            extraction_error: `Failed to update snip with extracted content: (Message: ${res.error?.message}, Details: ${res.error?.details}, Code: ${res.error?.code})`,
        })
        .eq('id', id);

      return null;
    }

    logger.debug(`Updated snip ${id} with extracted content:`, res);

    return markdownContent;
  } else {
    console.log("No archived version available.");
    return null;
  }
}