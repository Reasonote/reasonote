import _ from "lodash";

import {ActivityGenerateRoute} from "@/app/api/activity/generate/routeSchema";
import {ApolloClient} from "@apollo/client";
import {
  ActivityType,
  ActivityTypesPublic,
  LessonConfig,
  UserActivityGeneratedFor,
} from "@reasonote/core";
import {Database} from "@reasonote/lib-sdk";
import {
  createSkillFlatMutDoc,
  getActivityFlatQueryDoc,
  getSkillFlatQueryDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {JSONSafeParse} from "@reasonote/lib-utils";
import {SupabaseClient} from "@supabase/supabase-js";

interface GenerateActivityForSkillArgs {
  ac: ApolloClient<any>;
  sb: SupabaseClient<Database>;
  skill: {
    name: string;
    skillIdPath?: string[];
  } | {
    id: string;
    skillIdPath?: string[];
  };
  /** The lesson this activity is being generated in the context of. */
  lesson?: LessonConfig;
  /** The user this activity is being generated for. */
  generatedforUser?: UserActivityGeneratedFor;
  /** The activity type to generate. */
  activityType?: ActivityType;
  /** Allowed activity types to generate. */
  allowedActivityTypes?: ActivityType[];
  /** The activities this is being generated from. */
  generatedFromActivityIds?: string[];
  /** Any additional instructions to provide. */
  additionalInstructions?: string;
}

export async function getSkill(ac: ApolloClient<any>, id: string) {
  return await ac.query({
    query: getSkillFlatQueryDoc,
    variables: {
      filter: {
        id: {
          eq: id,
        }
      }
    },
  });
}

export async function getActivity(ac: ApolloClient<any>, id: string) {
  return await ac.query({
    query: getActivityFlatQueryDoc,
    variables: {
      filter: {
        id: {
          eq: id,
        }
      }
    },
  });
}

export async function generateActivityForSkill(
  args: GenerateActivityForSkillArgs
) {
  const { ac, sb, generatedforUser } = args;

  const parentSkillIds = args.skill.skillIdPath?.slice(0, -1);

  const parentSkills = parentSkillIds ? (await sb.from('skill').select('*').in('id', parentSkillIds))?.data : undefined;
  const parentSkillNames = parentSkills && parentSkillIds ?
    _.sortBy(
      parentSkills,
      (a) => parentSkillIds.indexOf(a.id)
    )
      .map((sk) => sk._name)
    : undefined;

  var skill: {
    id: string,
    name: string,
    parentSkillNames?: string[]
    parentSkillIds?: string[]
  } | null = null;

  if ('id' in args.skill) {
    const skillResult = await getSkill(ac, args.skill.id);
    const firstSkill = skillResult.data.skillCollection?.edges?.[0]?.node
    if (!firstSkill) {
      throw new Error(`Failed to find skill with id ${args.skill.id}`)
    }

    skill = {
      id: firstSkill.id,
      name: firstSkill.name,
      parentSkillNames,
      parentSkillIds
    }
  }
  else {
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

      skill = {
        id: firstSkillNode.id,
        name: firstSkillNode.name,
        parentSkillNames,
        parentSkillIds,
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
                parentSkillNames
              }),
              generatedFromSkillPath: args.skill.skillIdPath
            },
          ],
        },
      });

      const skillCreated = creationResult.data?.insertIntoSkillCollection?.records?.[0];

      if (!skillCreated) {
        throw new Error(`Failed to create skill ${args.skill.name}`)
      }

      skill = {
        id: skillCreated.id,
        name: skillCreated?.name ?? "Unknown Skill",
        parentSkillNames: skillCreated?.metadata ? JSONSafeParse(skillCreated.metadata)?.data?.parentSkillNames : undefined,
        parentSkillIds: args.skill.skillIdPath?.slice(0, -1)
      }
    }
  }

  const allowedActivityTypes = args.allowedActivityTypes ?? ActivityTypesPublic;

  const activityType = args.activityType ?? _.sample(allowedActivityTypes);

  if (!activityType) {
    console.warn("No activity type found!")
    return null;
  }

  const ret = await ActivityGenerateRoute.call({
    from: {
      skill: {
        name: skill.name,
        id: skill.id,
        parentIds: skill.parentSkillIds,
      }
    },
    additionalInstructions: args.additionalInstructions,
    lesson: args.lesson ? {
      id: args.lesson?.id,
      name: args.lesson?.basic.name,
      description: args.lesson?.basic?.summary,
      learningObjectives: args.lesson?.learningObjectives ?? [],
    } : undefined,
    activityTypes: allowedActivityTypes as ActivityType[],
    // TODO: user,
    // user: generatedforUser,
    // TODO: existingActivityConfig
    // existingActivityConfig: activityConfigs && activityConfigs.length > 0 ? activityConfigs[0] : undefined,
  })

  return ret;
}
