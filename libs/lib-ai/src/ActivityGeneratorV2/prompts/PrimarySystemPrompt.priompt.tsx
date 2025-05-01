import * as Priompt from '@anysphere/priompt';
import {
  ActivityGenConfig,
  ActivityGenerateManyRequest,
} from '@reasonote/core';
import {
  AI,
  Block,
} from '@reasonote/lib-ai';

import { formatExample } from '../Examples';
import {
  ActivityRequestHydratedValues,
  NewActivityTypeServer,
} from '../types';
import { GenerateHeader } from './GenActHeaderSection.priompt';

// Interface for the component props
export interface PrimarySystemPromptProps {
  /**
   * The request object containing hydrated values
   */
  req: ActivityGenerateManyRequest & { hydrated: ActivityRequestHydratedValues };

  /**
   * Array of activity type servers with their generation configurations
   */
  servers: (NewActivityTypeServer & { genConfig: ActivityGenConfig })[];

  /**
   * Pre-resolved server elements
   */
  serverElements: Priompt.PromptElement[];
}

export class PrimarySystemPrompt {
  static async getArgs(
    ai: AI,
    req: ActivityGenerateManyRequest & { hydrated: ActivityRequestHydratedValues },
    servers: (NewActivityTypeServer & { genConfig: ActivityGenConfig })[]
  ): Promise<PrimarySystemPromptProps> {
    // Pre-resolve all the server elements
    const serverElements = await Promise.all(servers.map(async (server) => {
      const props: Record<string, string> = {
        description: `Instructions for generating activities of type ${server.type}.`
      };
      
      if (server.genConfig?.shortDescription) {
        props.activityTypeDescription = server.genConfig.shortDescription;
      }

      return (
        <Block name={server.type} attributes={props}>
          <Block name="INSTRUCTIONS">
            {await server.genConfig?.primaryInstructions?.(req) || ""}
          </Block>
          {(server.genConfig?.whenToUse || server.genConfig?.whenToAvoid) ? (
            <Block name="USAGE" attributes={{ description: "When and when not to use this activity type." }}>
              {server.genConfig?.whenToUse ? (
                <Block name="WHEN_TO_USE">
                  {server.genConfig.whenToUse.map(use => `- ${use}`).join('\n')}
                </Block>
              ) : null}
              {server.genConfig?.whenToAvoid ? (
                <Block name="WHEN_TO_AVOID">
                  {server.genConfig.whenToAvoid.map(avoid => `- ${avoid}`).join('\n')}
                </Block>
              ) : null}
            </Block>
          ) : null}
          {server.genConfig?.examples ? (
            <Block name="EXAMPLES" attributes={{ description: "Examples of good and bad activities of this type." }}>
              {server.genConfig.examples.map((example, exampleIndex) => 
                formatExample(example, exampleIndex)
              )}
            </Block>
          ) : null}
        </Block>
      );
    }));

    return {
      req,
      servers,
      serverElements
    };
  }

  static Prompt(props: PrimarySystemPromptProps): Priompt.PromptElement {
    const { req, serverElements } = props;

    return (
      <Block name="CORE_INSTRUCTIONS" attributes={{ description: "These are the core instructions for generating the activities." }}>
        <GenerateHeader 
          skillStringWithContext={req.hydrated.subjectDefinitionString} 
          resources={req.hydrated.resources} 
          numActivities={req.numActivities} 
          additionalInstructions={req.additionalInstructions} 
          activityConfigsFormatted={req.hydrated.activityConfigsFormatted}
          allowedActivityTypes={req.hydrated.validActivityTypeServers.map((vats) => vats.type)}
        />
        <Block name="ACTIVITY_TYPE_INSTRUCTIONS" attributes={{ description: "Instructions for generating each type of activity. BE SURE TO FOLLOW THESE INSTRUCTIONS FOR EACH ACTIVITY TYPE YOU GENERATE." }}>
          {serverElements}
        </Block>
      </Block>
    );
  }

  static async renderAsync(
    ai: AI,
    req: ActivityGenerateManyRequest & { hydrated: ActivityRequestHydratedValues },
    servers: (NewActivityTypeServer & { genConfig: ActivityGenConfig })[]
  ): Promise<Priompt.PromptElement> {
    const args = await this.getArgs(ai, req, servers);
    return this.Prompt(args);
  }
} 