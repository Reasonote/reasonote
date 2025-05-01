import { staticValidateActivityTypeDefinition } from "@reasonote/core";

import {
    SlideActivityConfig,
    SlideActivityConfigSchema,
    SlideResultSchema,
} from "./schema";

export * from './schema';

/**
 * A helper class for multiple choice activities.
 * 
 * We prefer static methods, so that we are encouraged to 
 * rely on the backend for state.
 */
export class SlideActivityTypeDefinition {
    static type = "slide" as const;

    static typeHumanName = "Slide";

    static resultSchema = SlideResultSchema;

    static configSchema = SlideActivityConfigSchema;

    static hideScoreBarOnResults = true;
   
    static skipResultBar = true;
    
    static createEmptyConfig(): SlideActivityConfig {
        return {
            version: '0.0.0',
            type: 'slide',
            titleEmoji: '',
            title: '',
            markdownContent: ''
        }
    }
   
    static aigenPrompts= {
        instructions: `
            <LENGTH>
                Each slide should be between 2-4 paragraphs.
            </LENGTH>

            <FORMATTING>
            - REMEMBER: You can use markdown to format the slide.
            - REMEMBER: LaTeX must be wrapped in $$...$$, and you must use DOUBLE BACKSLASHES \`\\\\\` to render in LaTeX.
            - REMEMBER: If you do not wrap your LaTeX in $$...$$, IT WILL NOT RENDER.
            - The title will be set automatically -- you DO NOT need to include the title in the markdown content.
            - Use an emoji with the title.
            - You can create a mermaid diagram by wrapping your mermaid code in a \`\`\`mermaid ... \`\`\` code block.
            </FORMATTING>

            <REFERENCES>
            - You may use the user's interests, but only once per-slide. Otherwise, it comes off as pandering / kitschy. Only make references when it really makes sense.
            - Similarly, when it makes sense, a well-placed emoji can make the slide pop. Try to only do this once per slide.
            </REFERENCES>

            <VISUALS>
            - When making visuals, use mermaid diagrams. This is a good way to create flowcharts, sequence diagrams, etc.
            </VISUALS>
        `,
        finalNotes: `
            <FORMATTING>
            - REMEMBER: You can use markdown to format the slide.
            - REMEMBER: LaTeX must be wrapped in $$...$$, and you must use DOUBLE BACKSLASHES \`\\\\\` to render in LaTeX.
            - REMEMBER: If you do not wrap your LaTeX in $$...$$, IT WILL NOT RENDER.
            - The title will be set automatically -- you DO NOT need to include the title in the markdown content.
            - Use an emoji with the title.
            - You can create a mermaid diagram by wrapping your mermaid code in a \`\`\`mermaid ... \`\`\` code block.
            </FORMATTING>

            <REFERENCES>
            - You may use the user's interests, but only once per-slide. Otherwise, it comes off as pandering / kitschy. Only make references when it really makes sense.
            - Similarly, when it makes sense, a well-placed emoji can make the slide pop. Try to only do this once per slide.
            </REFERENCES>

            <VISUALS>
            - You should create visuals using mermaid diagrams. This is a good way to create flowcharts, sequence diagrams, etc.
            </VISUALS>
        `
    }

    static aiStringifier = (config: SlideActivityConfig) => {
        return `
        # Slide Activity
        A slide (ungraded).
        
        ## Title
        ${config.title}

        ## Content
        ${config.markdownContent}
        `
    }
}


staticValidateActivityTypeDefinition(SlideActivityTypeDefinition);
