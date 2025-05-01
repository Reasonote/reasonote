'use client'
import {
  useEffect,
  useState,
} from "react";

import _ from "lodash";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: true,
  theme: "default",
  securityLevel: "loose",
  themeCSS: `
    g.classGroup rect {
      fill: #282a36;
      stroke: #6272a4;
    } 
    g.classGroup text {
      fill: #f8f8f2;
    }
    g.classGroup line {
      stroke: #f8f8f2;
      stroke-width: 0.5;
    }
    .classLabel .box {
      stroke: #21222c;
      stroke-width: 3;
      fill: #21222c;
      opacity: 1;
    }
    .classLabel .label {
      fill: #f1fa8c;
    }
    .relation {
      stroke: #ff79c6;
      stroke-width: 1;
    }
    #compositionStart, #compositionEnd {
      fill: #bd93f9;
      stroke: #bd93f9;
      stroke-width: 1;
    }
    #aggregationEnd, #aggregationStart {
      fill: #21222c;
      stroke: #50fa7b;
      stroke-width: 1;
    }
    #dependencyStart, #dependencyEnd {
      fill: #00bcd4;
      stroke: #00bcd4;
      stroke-width: 1;
    } 
    #extensionStart, #extensionEnd {
      fill: #f8f8f2;
      stroke: #f8f8f2;
      stroke-width: 1;
    }`,
  fontFamily: "Fira Code"
});

export function MermaidReact({ chart }: { chart: string }) {
    const [uniqId] = useState(() => _.uniqueId('mermaid-'));
    const [svgContent, setSvgContent] = useState('');
  
    useEffect(() => {
      const renderMermaid = async () => {
        try {
            const element = document.querySelector(`#${uniqId}`);
  
            if (!element) return;
      
            const { svg } = await mermaid.render(uniqId, chart);
            setSvgContent(svg); // Update the state with the new SVG content
        }
        catch (e) {
            console.error("Error rendering mermaid", e);
            setSvgContent('');
        }
      };
  
      renderMermaid();
    }, [chart, uniqId]);
  
    return <>
        {/* TODO: not clear why we need this dummy but... */}
        <div id={uniqId}></div>
        <div dangerouslySetInnerHTML={{ __html: svgContent }}>
        </div>
    </>;
  }