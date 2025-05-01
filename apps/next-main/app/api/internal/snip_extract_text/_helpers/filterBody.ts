import type {Document} from "parse5/dist/tree-adapters/default";

function removeElements(node: any, tagsToRemove: string[]) {
  if (!node.childNodes) return;
  
  node.childNodes = node.childNodes.filter((child: any) => {
    if (child.tagName && tagsToRemove.includes(child.tagName)) {
      return false;
    }
    removeElements(child, tagsToRemove);
    return true;
  });
}

export async function getFilteredDocument(document: Document, url: string) {
  const tagsToRemove = ['script', 'style', 'header', 'footer', 'nav'];
  removeElements(document, tagsToRemove);
  return document;
}