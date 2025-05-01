import * as Priompt from '@anysphere/priompt';
import {
  ActivityGenConfig,
  ActivityGenerateRequest,
} from '@reasonote/core';
import { Block } from '@reasonote/lib-ai';

import {
  ActivityRequestHydratedValues,
  NewActivityTypeServer,
} from '../types';
import { ResourceMetadata } from './ResourceMetadata.priompt';

// Interface for the component props
export interface FinalSystemPromptProps {
  /**
   * The request object containing hydrated values
   */
  req: ActivityGenerateRequest & { hydrated: ActivityRequestHydratedValues };

  /**
   * Array of activity type servers with their generation configurations
   */
  servers: (NewActivityTypeServer & { genConfig: ActivityGenConfig })[];
  
  /**
   * Pre-resolved server elements (since finalInstructions is async)
   */
  serverElements: Priompt.PromptElement[];
}

export class FinalSystemPrompt {
  static async getArgs(
    req: ActivityGenerateRequest & { hydrated: ActivityRequestHydratedValues },
    servers: (NewActivityTypeServer & { genConfig: ActivityGenConfig })[]
  ): Promise<FinalSystemPromptProps> {
    // Pre-resolve all the async finalInstructions calls
    const serverElements = await Promise.all(servers.map(async (server) => (
      <Block name={server.type}>
        {await server.genConfig?.finalInstructions?.(req) || ""}
      </Block>
    )));

    return {
      req,
      servers,
      serverElements
    };
  }

  static Prompt(props: FinalSystemPromptProps): Priompt.PromptElement {
    const { req, serverElements } = props;

    return (
      <Block name="FINAL_INSTRUCTIONS" attributes={{ description: "Final instructions and reminders for generating the activities." }}>
        <Block name="ACTIVITY_TYPE_FINAL_INSTRUCTIONS" attributes={{ description: "Final instructions and reminders for generating each type of activity. BE SURE TO FOLLOW THESE INSTRUCTIONS FOR EACH ACTIVITY TYPE YOU GENERATE." }}>
          {serverElements}
        </Block>

        {req.hydrated.resources.length > 0 ? (
          <Block name="RESOURCE_CITATION_INSTRUCTIONS" attributes={{ description: "You should use the resources you are provided to generate the activities. You should cite the resources in the activities you generate." }}>
            <Block name="INSTRUCTIONS">
              You should use the resources you are provided to generate the activities. You should cite the resources in the activities you generate.
            </Block>
            
            <Block name="RESOURCES_TO_CITE" attributes={{ description: "The resources you should cite in the activities you generate." }}>
              {req.hydrated.resources.map((resource) => (
                <ResourceMetadata resource={resource} />
              ))}
            </Block>
          </Block>
        ) : null}
      </Block>
    );
  }

  static async renderAsync(
    req: ActivityGenerateRequest & { hydrated: ActivityRequestHydratedValues },
    servers: (NewActivityTypeServer & { genConfig: ActivityGenConfig })[]
  ): Promise<Priompt.PromptElement> {
    const args = await this.getArgs(req, servers);
    return this.Prompt(args);
  }
} 