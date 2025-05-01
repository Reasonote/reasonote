import * as Priompt from '@anysphere/priompt';
import {
  PromptElement,
  PromptProps,
} from '@anysphere/priompt';

import { Block } from './Block.priompt';

/**
 * Props for the Document component
 */
export interface DocumentProps {
  /**
   * The content of the document
   */
  text: string;
  
  /**
   * Optional title of the document
   */
  title?: string | null;
  
  /**
   * Optional document identifier
   */
  id?: string | number;
}

/**
 * A prompt component that formats a document in a structured way
 * for use in prompts
 */
export function Doc(props: PromptProps<DocumentProps>): PromptElement {
  const { text, title, id } = props;
  
  // Create attributes object with conditionally added title
  const attributes: Record<string, string> = {};
  
  // Add id if provided or use index
  if (id !== undefined) {
    attributes.id = String(id);
  }
  
  // Add title if provided
  if (title) {
    attributes.title = title;
  }
  
  return (
    <Block name="Doc" attributes={attributes}>
      {text}
    </Block>
  );
}

/**
 * A component that renders a collection of documents
 */
export function DocCollection(props: PromptProps<{
  documents: DocumentProps[];
}>): PromptElement {
  const { documents } = props;
  
  // In Priompt, unlike React, we don't use keys
  // Each document will get rendered in sequence
  return (
    <>
      {documents.map((doc, index) => (
        <Doc
          text={doc.text} 
          title={doc.title} 
          id={doc.id ?? (index + 1)} 
        />
      ))}
    </>
  );
}
