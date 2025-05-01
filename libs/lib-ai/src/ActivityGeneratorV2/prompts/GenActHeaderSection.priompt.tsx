import * as Priompt from '@anysphere/priompt';
import { trimLines } from '@lukebechtel/lab-ts-utils';
import { ActivityGenerateManyRequestSequencingEntry } from '@reasonote/core';
import {
  Block,
  UnifiedResource,
} from '@reasonote/lib-ai';

/**
 * Props for the SequenceInstructionsForActivities component
 * @interface SequenceInstructionsForActivitiesProps
 */
export interface SequenceInstructionsForActivitiesProps {
    /**
     * Array of activity sequencing entries to be generated
     */
    activities: ActivityGenerateManyRequestSequencingEntry[];
    
    /**
     * List of allowed activity types that can be generated
     */
    allowedActivityTypes: readonly string[];
}

/**
 * Interface for the GenerateHeaderPrimaryInstructions component props
 * @interface GenerateHeaderPrimaryInstructionsProps
 */
interface GenerateHeaderPrimaryInstructionsProps {
    /**
     * The core concept that the user needs to learn with context
     */
    skillStringWithContext: string;
    
    /**
     * The resources that define the full parameters of the skill
     */
    resources: UnifiedResource[];
    
    /**
     * The number of activities to generate
     */
    numActivities?: number;
    
    /**
     * Additional instructions for the activity generation
     */
    additionalInstructions?: string;
}

const SequenceInstructionsForActivities: (props: SequenceInstructionsForActivitiesProps) => Priompt.PromptElement = ({ activities, allowedActivityTypes }: SequenceInstructionsForActivitiesProps): Priompt.PromptElement => {
    return <Block name="INSTRUCTIONS_FOR_EACH_ACTIVITY" attributes={{ description: "YOU MUST GENERATE ACTIVITIES THAT PERFECTLY MATCH THE INSTRUCTIONS IN THIS SEQUENCE." }}>
        {activities.map((a, idx) =>
            <Block
                name={`ACTIVITY-${idx}`}
                attributes={{ types: (a.activityTypes ?? allowedActivityTypes).join(',') }}
            >
                {a.additionalInstructions}
            </Block>
        )}
    </Block>
}

const GenerateHeaderPrimaryInstructions = ({ skillStringWithContext, resources, numActivities, additionalInstructions }: GenerateHeaderPrimaryInstructionsProps): Priompt.PromptElement => {
    return <>
        <Block name="CORE_TASK">
            You are responsible for helping the user learn the CORE_CONCEPT provided.
            {resources.length > 0 ? 'You MUST pull information ONLY FROM THE RESOURCES YOU ARE PROVIDED.' : ''}

            <Block name="CORE_CONCEPT" attributes={{ description: 'The core concept that the user needs to learn.' }}>
                {skillStringWithContext}
            </Block>

            <Block name="PRIMARY_INSTRUCTIONS" attributes={{ description: 'A list of different instructions you must follow as you generate the activities.' }}>
                {resources.length > 0 ?
                    <Block name="UseResources">
                        THE INFORMATION IN THE RESOURCES IS THE ONLY SOURCE OF INFORMATION YOU MAY PULL FROM TO PRODUCE THIS ACTIVITY.

                        <Block name="Citations">
                            You must provide VALID CITATIONS for each activity you generate, to the resources you are provided.
                            The citations must be EXACT, CHARACTER-FOR-CHARACTER matches to the text in the resources.

                            IF YOU HALLUCINATE, OR FABRICATE CITATIONS, YOUR ENTIRE RESPONSE WILL BE DISQUALIFIED, YOU AND YOUR DEPARTMENT WILL BE FIRED.
                        </Block>
                    </Block>
                : null}
                {numActivities !== undefined && numActivities !== null ?
                    <Block name="NumberOfActivities">
                        {trimLines(
                            `Please generate ${numActivities} ${numActivities === 1 ? 'activity' : 'activities'} that will help the user learn this concept.`
                        )}
                    </Block>
                : null}
                {additionalInstructions ?
                    <Block name="SpecialInstructions" attributes={{ description: 'Special additional instructions that the user provided.' }}>
                        {trimLines(additionalInstructions)}
                    </Block>
                : null}
            </Block>
        </Block>
        
    </>
}

/**
 * Props for the GenerateHeader component
 * @interface GenerateHeaderProps
 */
export interface GenerateHeaderProps {
    /**
     * The core concept that the user needs to learn.
     */
    skillStringWithContext: string;

    /**
     * The resources that define the full parameters of the skill.
     */
    resources: UnifiedResource[];
    
    /**
     * The number of activities to generate.
     */
    numActivities?: number;
    
    /**
     * Additional instructions for the activity generation.
     */
    additionalInstructions?: string;
    
    /**
     * Formatted activity configurations to use as reference.
     */
    activityConfigsFormatted?: string[];
    
    /**
     * Sequence of activities to generate with specific instructions.
     */
    sequence?: ActivityGenerateManyRequestSequencingEntry[];
    
    /**
     * All available activity types that can be generated.
     */
    allowedActivityTypes: readonly string[];
}

/**
 * Component that generates the header section for activity generation prompts
 * @param props - The GenerateHeader component props
 * @returns A Priompt element containing the header section
 */
export const GenerateHeader = ({ 
    skillStringWithContext, 
    resources, 
    numActivities, 
    additionalInstructions, 
    activityConfigsFormatted, 
    sequence, 
    allowedActivityTypes,
}: GenerateHeaderProps): Priompt.PromptElement => {

    return <Block name="YOUR_TASK">
        <GenerateHeaderPrimaryInstructions 
            skillStringWithContext={skillStringWithContext} 
            resources={resources} 
            numActivities={numActivities} 
            additionalInstructions={additionalInstructions} 
        />
        {
            sequence ? <SequenceInstructionsForActivities activities={sequence} allowedActivityTypes={allowedActivityTypes} /> : null
        }
    </Block>
}