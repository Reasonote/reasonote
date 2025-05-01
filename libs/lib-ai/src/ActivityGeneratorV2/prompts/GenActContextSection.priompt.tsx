import * as Priompt from '@anysphere/priompt';
import {
  notEmpty,
  trimLines,
} from '@lukebechtel/lab-ts-utils';
import {
  ActivityConfig,
  ActivityGenerateRequest,
} from '@reasonote/core';
import {
  AI_EXPLAINERS,
  aiExplainerFormat,
} from '@reasonote/core-static-prompts';
import {
  AI,
  Block,
  UnifiedResource,
} from '@reasonote/lib-ai';

import { ActivityRequestHydratedValues } from '../types';
import { ResourceSection } from './ResourceSection.priompt';

// Add the interface for the component props
export interface GenActContextSectionProps {
    /**
     * The resources that define the full parameters of the skill.
     */
    sourceResources?: UnifiedResource[];

    /**
     * The references and chunks to be used in the activity.
     */
    sourceReferencesAndChunks?: {
        references: {id: string, content: string, docId: string, name: string}[],
        chunks: {id: string, content: string, docId: string, name: string}[]
    };
    /**
     * The activity configs to emulate.
     */
    activitiesToEmulate?: (ActivityConfig | string)[];

    /**
     * Additional instructions for the activity.    
     */
    additionalInstructions?: string;

    /**
     * The explainer sections to include in the activity.
     */
    explainerSections?: string[];
}


export class GenActContextSection {
    static async getArgs(ai: AI, req: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues}): Promise<GenActContextSectionProps> {
        const { user, userSkill, lesson, from, additionalInstructions, ctxInjectors, hydrated } = req;
        const { skill, activityIds, activityConfigs } = from;

        // Prepare the context injectors
        const ctxInjectorsFormatted = await ai.getCtxStringFromInvokeConfigs(ctxInjectors ?? []);

        // Prepare the explainer sections
        const explainerSections = [
            user ? aiExplainerFormat(AI_EXPLAINERS.USER_PROFILE(user)) : null,
            userSkill && user && skill ? aiExplainerFormat(AI_EXPLAINERS.USER_SKILL({
                user,
                userSkill,
                skill
            })) : null,
            skill ? aiExplainerFormat(AI_EXPLAINERS.SKILL_CONTEXT_DOCUMENTS(skill)) : null,
            skill ? aiExplainerFormat(AI_EXPLAINERS.SKILL_EXPERT_QUESTIONS(skill)) : null,
            lesson ?
                `
                    ${aiExplainerFormat(AI_EXPLAINERS.LESSON({ lessonConfig: lesson }))}
                    ${'id' in lesson && lesson.id !== undefined ? await ai.prompt.lessons.formatSnips({ lessonId: lesson.id }) : ''}
                    `
                :
                null,
            aiExplainerFormat(AI_EXPLAINERS.OUTPUT_FORMAT_MARKDOWN_LATEX),
            ctxInjectorsFormatted
        ].filter(notEmpty);

        return {
            sourceResources: hydrated.resources,
            sourceReferencesAndChunks: hydrated.referencesAndChunks,
            activitiesToEmulate: hydrated.fromActivityPrompts,
            additionalInstructions,
            explainerSections
        };
    }

    static Prompt(props: GenActContextSectionProps): Priompt.PromptElement {
        const {
            sourceResources,
            sourceReferencesAndChunks,
            activitiesToEmulate,
            additionalInstructions,
            explainerSections
        } = props;
    
        return (
            <Block name="CONTEXT" attributes={{ description: "Context that should be used to generate the activities." }}>
                {sourceResources && sourceResources.length > 0 ? (
                    <Block name="SOURCE_RESOURCES" attributes={{ description: "The following resources define the full parameters of the skill. Use these to generate the activity." }}>
                        {sourceResources.map((resource) => 
                            <ResourceSection resource={resource}/>
                        )}
                    </Block>
                ) : null}

                {sourceReferencesAndChunks && sourceReferencesAndChunks.references.length > 0 ? (
                    <Block name="SOURCE_REFERENCES" attributes={{ description: "The following references are the source material for the skill. Use these to generate the activity." }}>
                        {sourceReferencesAndChunks.references.map((reference) => (
                            <Block name="REFERENCE" attributes={{ id: reference.id }}>{reference.content}</Block>
                        ))}
                    </Block>
                ) : null}

                {sourceReferencesAndChunks && sourceReferencesAndChunks.chunks.length > 0 ? (
                    <Block name="SOURCE_CHUNKS" attributes={{ description: "The following chunks are the source material for the skill. Use these to generate the activity." }}>
                        {sourceReferencesAndChunks.chunks.map((chunk) => (
                            <Block name="CHUNK" attributes={{ id: chunk.id }}>{chunk.content}</Block>
                        ))}
                    </Block>
                ) : null}
                
                {activitiesToEmulate && activitiesToEmulate.length > 0 ? (
                    <Block name="ACTIVITIES-TO-EMULATE" attributes={{ description: "You have been provided with existing activities to emulate. These are the configs for those activities." }}>
                        {activitiesToEmulate.map((ac, idx) => 
                            <Block name={`REF-ACT-${idx}`}>
                                {JSON.stringify(ac, null, 2)}
                            </Block>
                        )}
                        <br/>
                        <Block name="COMMENT">
                            {trimLines(`
                                You should cover the EXACT SAME CONTENT as these activities but your question and answer choices should be differently formatted.
    
                                Think of it like this -- if the user gets your question right, they should also get the existing question right.
                                Same goes for wrong answers.
                            `)}
                        </Block>
                    </Block>
                ) : null}
                
                {additionalInstructions ? (
                    <Block name="ADDITIONAL-INSTRUCTIONS" attributes={{ description: "You have been given additional instructions for this activity. Please follow them carefully." }}>
                        {trimLines(`
                            \`\`\`
                            ${additionalInstructions}
                            \`\`\`
                        `)}
                    </Block>
                ) : null}
                
                {explainerSections && explainerSections.map((item, index) => (
                    <Block name={`CONTEXT_SECTION_${index}`}>
                        {item}
                    </Block>
                ))}
            </Block>
        );
    }

    static async renderAsync(ai: AI, req: ActivityGenerateRequest & { hydrated: ActivityRequestHydratedValues }): Promise<Priompt.PromptElement> {
        const args = await this.getArgs(ai, req);
        return this.Prompt(args);
    }
}