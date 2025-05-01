"use client"
import "katex/dist/katex.min.css";

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import _ from "lodash";
import mermaid from "mermaid";
import MuiMarkdown, {
  getOverrides,
  MuiMarkdownProps,
} from "mui-markdown";
import {
  Highlight,
  themes,
} from "prism-react-renderer";
import {InlineMath} from "react-katex";

import {tryUntilAsync} from "@lukebechtel/lab-ts-utils";
import {Typography} from "@mui/material";

import {TypingTxt} from "../typography/TypingTxt";
import {LI} from "./components/LI";
import {OL} from "./components/OL";
import {UL} from "./components/UL";

// Function to process LLM-generated LaTeX
const addLatexEnvironmentIfAbsent = (latex: string): string => {
  const trimmedLatex = latex.trim();
  
  // Single line: return as is (inline math)
  if (!trimmedLatex.includes('\n')) {
    return trimmedLatex;
  }
  
  // Check if it already contains an align environment
  if (trimmedLatex.includes('\\begin{align}')) {
    // Replace align with aligned and wrap in display math
    return trimmedLatex.replace(
      /\\begin\{align\}([\s\S]*?)\\end\{align\}/g,
      '\\begin{aligned}$1\\end{aligned}'
    );
  }
  
  // Check if it already contains any other environment
  if (trimmedLatex.includes('\\begin{')) {
    return trimmedLatex;
  }
  
  // Multi-line without environment: wrap in aligned
  return `\\begin{aligned}\n${trimmedLatex.replace(/\n\s*\n/g, '\n')}\n\\end{aligned}`;
};

const preprocessLatex = (content: string): string => {
  // First, let's handle multi-line code blocks
  const multilineCodeBlockRegex = /(```[\s\S]*?```)/g;
  let parts = content.split(multilineCodeBlockRegex);
  
  // Now, let's process each part, handling inline code blocks and LaTeX
  parts = parts.map((part, index) => {
    if (index % 2 === 0) { // Not inside a multi-line code block
      // Handle inline code blocks
      const inlineCodeBlockRegex = /(`[^`\n]+`)/g;
      return part.split(inlineCodeBlockRegex).map((subPart, subIndex) => {
        if (subIndex % 2 === 0) { // Not inside an inline code block
          // Process LaTeX in $$ and <latex> tags
          let processedSubPart = subPart.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
            const processedLatex = addLatexEnvironmentIfAbsent(latex);
            return `<latex>${processedLatex}</latex>`;
          });
          
          processedSubPart = processedSubPart.replace(/<latex>([\s\S]*?)<\/latex>/g, (_, latex) => {
            const processedLatex = addLatexEnvironmentIfAbsent(latex);
            return `<latex>${processedLatex}</latex>`;
          });
          
          return processedSubPart;
        } else {
          // Inside inline code block, return as is
          return subPart;
        }
      }).join('');
    } else {
      // Inside multi-line code block, return as is
      return part;
    }
  });
  
  return parts.join('');
};

export function MuiMarkdownDefault({ animateTyping, animateTypingSpeed, otherInput, children, overrides, ...rest }: MuiMarkdownProps & { animateTyping?: boolean, animateTypingSpeed?: number, otherInput?: string }) {
  const [mermaidSvgs, setMermaidSvgs] = useState<Record<number, string>>({});
  const [mermaidCodes, setMermaidCodes] = useState<Record<number, string>>({});

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'dark', themeVariables: { lineColor: '#ffffff' } });
  }, []);

  const usingOverrides = useMemo(() => {
    const UsingTxt = animateTyping ? 
      TypingTxt 
      : Typography

    return ({
      ...getOverrides({ Highlight: Highlight as any, themes, theme: themes.vsDark, hideLineNumbers: true }),
      latex: (props: { children?: ReactNode[]; }) => {
        const usingChildren = props?.children?.[0] as string;
        return usingChildren ? <InlineMath math={usingChildren} /> : null;
      },
      h1: {component: UsingTxt, props: {component: 'h3', variant: 'h3'}},
      h2: {component: UsingTxt, props: {component: 'h4', variant: 'h4'}},
      h3: {component: UsingTxt, props: {component: 'h5', variant: 'h5'}},
      h4: {component: UsingTxt, props: {component: 'h6', variant: 'h6'}},
      h5: {component: UsingTxt, props: {component: 'subtitle1', variant: 'subtitle1'}},
      h6: {component: UsingTxt, props: {component: 'subtitle2', variant: 'subtitle2'}},
      b: { component: UsingTxt, props: { component: 'b', variant: 'body1', fontWeight: 'bold'}},
      i: { component: UsingTxt, props: { component: 'i', variant: 'body1', fontStyle: 'italic'}},
      s: { component: UsingTxt, props: { component: 's', variant: 'body1', textDecoration: 'line-through'}},
      u: { component: UsingTxt, props: { component: 'u', variant: 'body1', textDecoration: 'underline'}},
      ul: {component: UL, props: { component: 'ul', variant: 'body1', className: 'ul-disc-style'}},
      ol: {component: OL, props: { component: 'ol', variant: 'body1', className: 'ol-decimal-style'}},
      li: {component: LI, props: { component: 'li', variant: 'body1'}},
      text: {component: UsingTxt, props: { component: 'span', variant: 'body1'}},
      // hr: { component: 'hr', props: { style: { border: 'none', borderTop: '1px solid #ccc', margin: '16px 0' } } },
      // img: { component: 'img', props: { style: { maxWidth: '100%', height: 'auto' } } },
      p: {component: UsingTxt, props: { component: 'p', variant: 'body1'}},
      // span: {component: UsingTxt, props: { component: 'span', variant: 'body1'}},
      // a: {component: UsingTxt, props: { component: 'a', variant: 'body1'}},
      // br: {component: () => <Typography variant="body1">Test</Typography>},
      strong: {component: UsingTxt, props: { component: 'strong', variant: 'body1', fontWeight: 'bold'}},
      // em: {component: UsingTxt, props: { component: 'em', variant: 'body1', fontStyle: 'italic'}}, 
    });
  }, [overrides, animateTyping]);

  const renderMermaidDiagram = useCallback(async (code: string, index: number) => {
    try {
      const ret = await tryUntilAsync({
        func: async () => {
          // Only add init block if does not exist.
          // const initBlockRegex = /%%{init:/;
          // const codeWithInit = initBlockRegex.test(code) ? code : `%%{init: {'theme': 'base', 'themeVariables': { 'lineColor': '#ffffff' }}}%%\n${code}`;
          const {svg } = await mermaid.render(`mermaid-diagram-${index}`, code);

          // Check if the svg string contains a <g> tag with alphanumeric characters and other XML tags inside it
          const regex = /<g>(?=[\s\S]*?[a-zA-Z0-9])(?=[\s\S]*?<[^>]+>)[\s\S]+?<\/g>/;

          if (!svg || !regex.test(svg)) {
              throw new Error('Mermaid diagram did not render correctly');
          }

          return {svg};
        },
        tryLimits: {
          maxAttempts: 3
        },
        onError: (err) => {
          console.warn("Failed to render mermaid diagram. This happens sometimes.", err);
        }
      });

      setMermaidSvgs(prev => ({ ...prev, [index]: ret.svg }));
    } catch (error) {
      console.error("Failed to render mermaid diagram:", error);
    }
  }, []);

  useEffect(() => {
    if (typeof children === 'string') {
      const parts = children.split(/```mermaid\n([\s\S]*?)\n```/);
      const newMermaidCodes: Record<number, string> = {};

      parts.forEach((part, index) => {
        if (index % 2 !== 0) {
          newMermaidCodes[index] = part;
          if (part !== mermaidCodes[index]) {
            renderMermaidDiagram(part, index);
          }
        }
      });

      setMermaidCodes(newMermaidCodes);
    }
  }, [children, renderMermaidDiagram]);

  const renderContent = useMemo(() => {
    if (typeof children !== 'string') return [children];

    // Preprocess the content to convert LaTeX delimiters
    const preprocessedContent = preprocessLatex(children);

    var parts = preprocessedContent.split(/```mermaid\n([\s\S]*?)\n```/);

    // Replace all <br/> with newlines
    parts = parts.map(part => part.replace(/<br\/>/g, '<br/>\n'));

    // const parts = children.split(/```mermaid\n([\s\S]*?)\n```/);

    return parts.map((part, index) => {
      if (index % 2 === 0) {
        return (
          //@ts-ignore
          <MuiMarkdown
            key={index}
            Highlight={Highlight as any}
            themes={themes}
            prismTheme={themes.vsDark}
            hideLineNumbers
            // overrides={usingOverrides}
            options={{
              forceBlock: true,
              overrides: usingOverrides,
              renderRule (next, node, renderChildren, state) {
                const nextEl = next();

                return nextEl;
              },
            }}
            {...rest}
          >
            {/* {part} */}
            {`<div></div>\n${part}`}
          </MuiMarkdown>
        );
      } else {
        return mermaidSvgs[index] ? (
          <div key={index} dangerouslySetInnerHTML={{ __html: mermaidSvgs[index] }} />
        ) : null;
      }
    });
  }, [children, usingOverrides, rest, mermaidSvgs]);

  return (
    <div style={{ width: '100%', overflow: 'auto', height: '100%' }}>
      {renderContent}
    </div>
    // LEAVE THIS FOR DEBUGGING
    //@ts-ignore
    // <MuiMarkdown
    //   overrides={{
    //     // FOR DEBUGGING
    //     // ...(
    //     //   Object.entries(usingOverrides).reduce((acc, [key, value]) => {
    //     //     acc[key] = {
    //     //       component: (...args) => <AnimatedTypography {...args}>{key} -- {args[0]}</AnimatedTypography>,
    //     //       props: { variant: "body1" }
    //     //     };
    //     //     return acc;
    //     //   }, {})
    //     // ),
    //     ...usingOverrides
    //   }}
    //   // Highlight={Highlight as any}
    //   // themes={themes}
    //   // prismTheme={themes.vsDark}
    //   // hideLineNumbers
    //   // {...rest}
    // >
    //   {children}
    // </MuiMarkdown>
  );
}