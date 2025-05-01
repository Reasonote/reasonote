import type {
  Document,
  Element,
} from "parse5/dist/tree-adapters/default";

/**
 * Extracts the authors of the article from the HTML content.
 * @param document HTML doc
 * @param url URL of the page
 * @returns The list of authors of the article.
 */
export function extractAuthors(document: Document, url: string): string[] {
    const metaTags = getElementsByTagName(document, 'meta');
    
    const authors = metaTags
      .filter(tag => 
        tag.attrs?.some(attr => 
          (attr.name === 'name' && attr.value === 'author') ||
          (attr.name === 'property' && attr.value === 'author')
        )
      )
      .map(tag => {
        const contentAttr = tag.attrs?.find(attr => attr.name === 'content');
        return contentAttr?.value?.trim() || '';
      })
      .filter(Boolean);

    return authors;
}

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