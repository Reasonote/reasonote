import _ from "lodash";

import {ApolloClient} from "@apollo/client";
import {
  createSkillFlatMutDoc,
  getSkillFlatQueryDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {JSONSafeParse} from "@reasonote/lib-utils";

interface GetOrCreateSkillArgs {
    ac: ApolloClient<any>;
    skill: {
      name: string;
      parentSkillNames?: string[];
      skillIdPath?: string[];
    }
    userContextInfo?: string;
}


export async function getOrCreateSkill({ac, ...args}: GetOrCreateSkillArgs){
    var skill: {
        id: string,
        name: string, 
        parentSkillNames?: string[]
      } | null = null;
    
    // TODO: This is not good default behavior, because we are indexing skills by name.
    // this will become problematic shortly after people start using the system,
    // because there may be multiple skills created by different people with the same name.
    // Instead, it should be *possible* to opt-in to this..
    const skillResult = await ac.query({
        query: getSkillFlatQueryDoc,
        variables: {
          filter: {
            name: {
              eq: args.skill.name,
            },
          },
        },
    });

    const firstSkillNode = skillResult.data?.skillCollection?.edges?.[0]?.node;

    if (firstSkillNode) {
        const safeMetadata = JSONSafeParse(firstSkillNode.metadata);

        skill = {
            id: firstSkillNode.id,
            name: firstSkillNode.name,
            // TODO: this may be kinda dirty idk
            parentSkillNames: safeMetadata.data ? safeMetadata.data.parentSkillNames : undefined,
        }
    }
    else {
        // We need to create the skill.
        const creationResult = await ac.mutate({
            mutation: createSkillFlatMutDoc,
            variables: {
            objects: [
                {
                  name: args.skill.name,
                  metadata: JSON.stringify({
                      parentSkillNames: args.skill.parentSkillNames,
                  }),
                  generatedFromSkillPath: args.skill.skillIdPath,
                },
            ],
            },
        });

        const skillCreated = creationResult.data?.insertIntoSkillCollection?.records?.[0];

        if (!skillCreated){
            throw new Error(`Failed to create skill ${args.skill.name}`)
        }

            skill = {
                id: skillCreated.id,
                name: skillCreated?.name ?? "Unknown Skill",
                parentSkillNames: skillCreated?.metadata ? JSONSafeParse(skillCreated.metadata)?.data?.parentSkillNames : undefined,
            }
    }

    return skill;
}