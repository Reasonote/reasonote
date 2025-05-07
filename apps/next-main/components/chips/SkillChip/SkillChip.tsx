import {
  useCallback,
  useEffect,
  useState,
} from "react";

import _ from "lodash";
import {z} from "zod";

import {
  SkillsAddToSkillTreeRoute,
} from "@/app/api/skills/add_to_skill_tree/routeSchema";
import {
  AddtoUserSkillSetRoute,
} from "@/app/api/skills/add_to_user_skill_set/routeSchema";
import {
  RemoveFromUserSkillSetRoute,
} from "@/app/api/skills/remove_from_user_skill_set/routeSchema";
import {aib} from "@/clientOnly/ai/aib";
import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
// import {useUserSkillLevel} from "@/clientOnly/hooks/useUserSkillLevel";
import {useUserSkills} from "@/clientOnly/hooks/useUserSkills";
import {
  gql,
  useApolloClient,
} from "@apollo/client";
import {
  isTypedUuidV4,
  jwtBearerify,
  notEmpty,
  trimLines,
} from "@lukebechtel/lab-ts-utils";
import {
  Chip,
  ChipProps,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {SkillLevel} from "@reasonote/core";
import {
  createSkillLinkFlatMutDoc,
  getSkillFlatQueryDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {useSkillFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import {CurUserAvatar} from "../../users/profile/CurUserAvatar";
import {SkillChipDumb} from "./SkillChipDumb";

// Global cache for emoji generation attempts
// Structure: { skillNameOrId: { emoji: string | null, state: 'idle' | 'generating' | 'generated' | 'failed' } }
const globalEmojiCache: Record<string, { emoji: string | null, state: 'idle' | 'generating' | 'generated' | 'failed' }> = {};

// Default placeholder emoji to use when generation fails
const PLACEHOLDER_EMOJI = '❓';

export interface SkillChipProps extends ChipProps {
  topicOrId: string;
  onAddSkill?: (args: { topic: string }) => void;
  onSimpleClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  disableModal?: boolean;
  disableAddDelete?: boolean;
  disableLevelIndicator?: boolean;
  skillIdPath?: string[];

  /**
   * If true, an emoji will be automatically generated for this skill.
   */
  createAutoEmoji?: true;

  /**
   * If this is being displayed in the context of a lesson, which lesson?
   */
  lessonId?: string;
  
  /**
   * The Root Skill Id. This is usually equal to skillIdPath[0].
   * 
   * There are situations where we know we want this skill chip to be "under" another skill,
   * but we aren't sure where in the tree to put it -- that's where this comes in.
   * 
   * Put another way -- We might know the start and end of the skillIdPath, but not the middle.
   *
   */
  rootSkillId?: string;

  /**
   * Overrides the skill add icon.
   */
  addSkillIconOverride?: React.ReactElement;

  /**
   * 
   * @returns {Promise<void>} Called after the skill is added.
   */
  onAfterAddSkill?: () => void;
  // onDetailsClick?: (args: { topicOrId: string }) => void | {type: 'override', func: (args: {topicOrId: string}) => void};
}

const explanationSchema = z.object({
  explanation: z.string(),
})

export async function explainTopic({topic}: {topic: string}){
  return await oneShotAIClient({
    systemMessage: "You are responsible for explaining a topic to a student, using analogies appropriate to their skill level.",
    functionName: "explainTopic",
    functionDescription: "Explain a topic to the student, using analogies & examples appropriate to their skill level.",
    functionParameters: z.object({
      explanation: z.string(),
      relatedTopics: z.array(z.string()).optional().describe('Related topics the student can search (i.e. on wikipedia) to learn more about this topic.'),
    }),
    otherMessages: [
      {
        role: 'user',
        content: trimLines(`
        Can you explain the following topic for me?
        # Topic
        ${topic}
        `),
      }
    ]
  })
}

export function SkillChipWithLoading(props: Omit<SkillChipProps, 'topicOrId'> & {topicOrId?: string | null | undefined}) {
  const usingTopicOrId = props.topicOrId;
  
  if (notEmpty(usingTopicOrId)) {
    return <SkillChip 
      //@ts-ignore
      topicOrId={(usingTopicOrId as any) as string}
      {...props}
    />
  }
  else {
    return <Skeleton variant="rounded" width="100%" height={100}>
      <Chip/>
    </Skeleton>
  }
}

export function SkillChip({ topicOrId, lessonId, onSimpleClick, rootSkillId, onAddSkill, onAfterAddSkill, disableModal, disableAddDelete, disableLevelIndicator, skillIdPath, createAutoEmoji, ...rest }: SkillChipProps) {
  const ac = useApolloClient();
  const { sbSession } = useRsnUser();
  const {skills, loading} = useUserSkills();
  const token = sbSession?.session?.access_token;
  const [emoji, setEmoji] = useState<string | null>(null);
  const [emojiGenerationState, setEmojiGenerationState] = useState<'idle' | 'generating' | 'generated' | 'failed'>('idle');

  const isAlreadyAdded = skills?.some((skill) => {
    return skill.name === topicOrId || skill.id === topicOrId
  });

  const onRemoveSkill = useCallback(async ({ topic }) => {
    // Get the skill with this name.
    // TODO: this is a HACK
    const skillWithNameResult = await ac.query({
      query: getSkillFlatQueryDoc,
      variables: {
        filter: {
          name: {
            eq: topic,
          },
        },
      },
      fetchPolicy: "network-only",
    })

    const skillIds = skillWithNameResult.data?.skillCollection?.edges?.map((edge) => edge.node.id);

    if (!skillIds || skillIds.length === 0) {
      console.error(`Could not find skill with name ${topic} to remove.`)
      return;
    }

    await RemoveFromUserSkillSetRoute.call({
      removeSkillIds: skillIds
    }, {
      headers: {
        Authorization: token ?? '',
      },
    })

    await ac.refetchQueries({
      include: ["getSkillSetWithSkills"],
    });
  }, [ac, token]);

  // const {
  //   level
  // } = useUserSkillLevel({topicOrId});

  const skillData = useSkillFlatFragLoader(topicOrId);
  const skillDataLoading = skillData.loading;

  // Make sure we have a valid skill name to display
  const skillName = isTypedUuidV4(topicOrId) 
    ? (skillData.data?.name || `Skill ${topicOrId.substring(0, 8)}...`) 
    : topicOrId;
  
  // Force a string type for skillName to avoid any type issues
  const safeSkillName = String(skillName || '');
  
  const onAddSkillInternal = useCallback(async () => {
    if (disableAddDelete) return;
          onAddSkill?.({ topic: skillName ?? ''});

          const useIds = isTypedUuidV4(topicOrId);

          const newSkillResult = await AddtoUserSkillSetRoute.call(
            {
              addSkills: useIds ? undefined : (!skillName ? undefined : [{ name: skillName }]),
              addIds: useIds ? [topicOrId] : undefined,
            },
            {
              headers: {
                Authorization: jwtBearerify(token ?? '') ?? '',
              },
            }
          )

          const newSkillId = newSkillResult?.data?.skillIds?.[0];

          if (!newSkillId) {
            console.error(`Could not add skill to skill set.`)
            return;
          }

          // If this happened in the context of a skill path,
          // add a link to the parent skill.
          if (skillIdPath){
            await ac.mutate({
              mutation: createSkillLinkFlatMutDoc,
              variables: {
                objects: [
                  { 
                    downstreamSkill: skillIdPath[skillIdPath.length - 1],
                    upstreamSkill: newSkillId,
                    weight: .5,
                    metadata: JSON.stringify({
                      levelOnParent: 'INTERMEDIATE'
                    })
                  }
                ]
              },
            });
          }

          if (rootSkillId){
            await SkillsAddToSkillTreeRoute.call({
              lessonId,
              skill: {
                id: rootSkillId,
              },
              skillsToAdd: [
                {
                  id: newSkillId,
                }
              ]
            })
          }


          await ac.refetchQueries({
            include: ["getSkillSetWithSkills"],
          });

          onAfterAddSkill?.();
  }, [ac, disableAddDelete, lessonId, onAfterAddSkill, onAddSkill, rootSkillId, skillIdPath, skillName, token, topicOrId]);

  // Handle emoji generation
  useEffect(() => {
    // Only proceed if createAutoEmoji is true and we have a skill name
    if (!createAutoEmoji || !skillName) return;
    
    // Don't generate emoji for fallback skill names (those that start with "Skill ")
    if (skillName.startsWith("Skill ")) return;

    // If we're still loading the skill data, wait
    if (skillDataLoading) return;

    // If this is a skill ID and the skill already has an emoji in the database, use that
    if (isTypedUuidV4(topicOrId) && skillData.data?.emoji) {
      setEmoji(skillData.data.emoji);
      setEmojiGenerationState('generated');
      return;
    }

    const cacheKey = skillName;
    
    // Check if we already have this emoji in the global cache
    if (globalEmojiCache[cacheKey]) {
      const cachedData = globalEmojiCache[cacheKey];
      setEmoji(cachedData.emoji);
      setEmojiGenerationState(cachedData.state);
      return;
    }

    // Initialize in the global cache
    globalEmojiCache[cacheKey] = { emoji: null, state: 'generating' };
    setEmojiGenerationState('generating');

    // Generate the emoji
    const generateEmoji = async () => {
      try {
        const result = await aib.genObject({
          prompt: `
          Output a single-character emoji that represents this skill best: "${skillName}"

          <EXAMPLES>
              
              <GOOD_EXAMPLE>
                  <INPUT>Output a single-character emoji that represents this skill best: "Cooking"</INPUT>
                  <OUTPUT>🍳</OUTPUT>
              </GOOD_EXAMPLE>
              
              <GOOD_EXAMPLE>
                  <INPUT>Output a single-character emoji that represents this skill best: "Painting"</INPUT>
                  <OUTPUT>🎨</OUTPUT>
              </GOOD_EXAMPLE>
              
              <GOOD_EXAMPLE>
                  <INPUT>Output a single-character emoji that represents this skill best: "Coding"</INPUT>
                  <OUTPUT>💻</OUTPUT>
              </GOOD_EXAMPLE>
              
              <GOOD_EXAMPLE>
                  <INPUT>Output a single-character emoji that represents this skill best: "Gardening"</INPUT>
                  <OUTPUT>🌱</OUTPUT>
              </GOOD_EXAMPLE>
              
              <GOOD_EXAMPLE>
                  <INPUT>Output a single-character emoji that represents this skill best: "Writing"</INPUT>
                  <OUTPUT>✍️</OUTPUT>
              </GOOD_EXAMPLE>
          </EXAMPLES>
          `,
          functionName: 'outputEmoji',
          functionDescription: 'Output a single-character emoji that represents this skill best',
          schema: z.object({
            emoji: z.string(),
          }),
          models: ['openai:fastest'],
        });

        const generatedEmoji = result.object.emoji;
        
        // Update the global cache
        globalEmojiCache[cacheKey] = { emoji: generatedEmoji, state: 'generated' };
        
        // Update component state
        setEmoji(generatedEmoji);
        setEmojiGenerationState('generated');

        // If this is a skill ID, store the emoji in the database
        if (isTypedUuidV4(topicOrId) && skillData.data?.id) {
          try {
            await ac.mutate({
              mutation: gql`
                mutation UpdateSkillEmoji($id: UUID!, $emoji: String!) {
                  updateSkill(
                    by: { id: $id }
                    input: { emoji: $emoji }
                  ) {
                    skill {
                      id
                      emoji
                    }
                  }
                }
              `,
              variables: {
                id: skillData.data.id,
                emoji: generatedEmoji,
              },
            });
          } catch (error) {
            console.error(`Failed to store emoji for skill "${skillName}" in database:`, error);
          }
        }
      } catch (error) {
        console.error(`Failed to generate emoji for skill "${skillName}":`, error);
        
        // Set placeholder emoji on failure
        globalEmojiCache[cacheKey] = { emoji: PLACEHOLDER_EMOJI, state: 'failed' };
        setEmoji(PLACEHOLDER_EMOJI);
        setEmojiGenerationState('failed');
      }
    };

    generateEmoji();
  }, [createAutoEmoji, skillName, topicOrId, skillData.data, ac, skillDataLoading]);

  return (
    <>
      <SkillChipDumb
        className="rsn-skill-chip"
        onSimpleClick={onSimpleClick}
        onAddSkill={async () => {
          onAddSkillInternal();
        }}
        onRemoveSkill={disableAddDelete ? undefined : async ({ topic }) => {
          onRemoveSkill?.({ topic });
        }}
        disableAddDelete={disableAddDelete}
        isAlreadyAdded={isAlreadyAdded}
        isLoading={loading}
        // level={disableLevelIndicator ? undefined : level}
        level={undefined}
        skillName={safeSkillName}
        skillId={skillData.data?.id}
        addSkillIconOverride={rest.addSkillIconOverride}
        emojiOverride={createAutoEmoji ? emoji : undefined}
        emojiLoadingOverride={createAutoEmoji && emojiGenerationState === 'generating'}
        {...rest}
      /> 
    </>
  );
}

function SkillLevelIndicatorChipWrapper({text, background}: {text: string, background: string}) {
  return <Stack direction={'row'} gap={.5} height={'20px'} borderRadius={'10px'} padding={'5px'} sx={{ background, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <CurUserAvatar sx={{width: '15px', height: '15px'}}/>
    <Typography variant={'caption'}>{text}</Typography>
  </Stack>
}

export function SkillLevelIndicatorDumb({level}: {level: SkillLevel | undefined}) {
  const theme = useTheme();
  return level === 'BEGINNER' ?
      <SkillLevelIndicatorChipWrapper text={'Beginner'} background={theme.palette.primary.main}/>
      :
    level === 'NOVICE' ?
      <SkillLevelIndicatorChipWrapper text={'Novice'} background={theme.palette.success.main}/>
      :
    level === 'ADEPT' ?
      <SkillLevelIndicatorChipWrapper text={'Adept'} background={theme.palette.gray.dark}/>
      :
    level === 'PRO' ?
      <SkillLevelIndicatorChipWrapper text={'Pro'} background={theme.palette.error.main}/>
      :
    level === 'EXPERT' ?
      <SkillLevelIndicatorChipWrapper text={'Expert'} background={theme.palette.error.dark}/>
      :
      null
}
