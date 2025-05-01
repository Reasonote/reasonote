import _ from 'lodash';

import * as Priompt from '@anysphere/priompt';
import {
  PromptElement,
  PromptProps,
} from '@anysphere/priompt';
import {
  notEmpty,
  trimLines,
} from '@lukebechtel/lab-ts-utils';

/**
 * Generic Block component for creating named blocks
 */
export function Block(props: PromptProps<{ 
  name: string;
  attributes?: Record<string, any>;
}>): PromptElement {
  // Format attributes if any
  const attributesStr = props.attributes 
    ? Object.entries(props.attributes)
        .map(([key, value]) => {
          if (typeof value === 'string') {
            return ` ${key}="${value}"`;
          } else if (typeof value === 'number') {
            return ` ${key}=${value}`;
          } else if (typeof value === 'boolean') {
            return ` ${key}=${value}`;
          } else if (Array.isArray(value)) {
            return ` ${key}=${JSON.stringify(value)}`;
          } else if (typeof value === 'object') {
            return ` ${key}=${JSON.stringify(value)}`;
          } else if (value === undefined) {
            return undefined;
          } else if (value === null) {
            return ` ${key}=null`;
          } else {
            return ` ${key}=${value}`;
          }
        })
        .filter(notEmpty)
        .join('')
    : '';
  
  return (
    <>
      <br />
      {`<${props.name}${attributesStr}>`}
      <br />
      {typeof props.children === 'string' ? trimLines(props.children) : _.isArray(props.children) ? props.children.map((child) => {
        if (typeof child === 'string') {
          return trimLines(child);
        }
        return child;
      }) : props.children}
      <br />
      {`</${props.name}>`}
      <br />
    </>
  );
} 