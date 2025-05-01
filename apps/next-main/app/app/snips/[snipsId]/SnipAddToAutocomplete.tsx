import _ from "lodash";

import {
  AddtoUserSkillSetRoute,
} from "@/app/api/skills/add_to_user_skill_set/routeSchema";
import {useToken} from "@/clientOnly/hooks/useToken";
import {useUserSkills} from "@/clientOnly/hooks/useUserSkills";
import {SkillIcon} from "@/components/icons/SkillIcon";
import {
  useMutation,
  useQuery,
} from "@apollo/client";
import {
  jwtBearerify,
  notEmpty,
} from "@lukebechtel/lab-ts-utils";
import {
  Autocomplete,
  AutocompleteProps,
  Chip,
  createFilterOptions,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  deleteResourceFlatMutDoc,
  GetResourceDeepDocument,
  OrderByDirection,
} from "@reasonote/lib-sdk-apollo-client";
import {useSnipFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

const filter = createFilterOptions<any>();

export function SnipAddToAutocomplete({snipId, autocompleteProps}: {snipId: string, autocompleteProps?: Partial<AutocompleteProps<any, any, any, any>>}) {
    const {data: snip} = useSnipFlatFragLoader(snipId);
    const {skills: userSkills, loading, refetch: refetchUserSkills} = useUserSkills();
    const {token} = useToken();
    const [deleteResource] = useMutation(deleteResourceFlatMutDoc);

    const skillResourceRes = useQuery(GetResourceDeepDocument, {
        variables: {
          filter: {
            childSnipId: {
              eq: snipId,
            },
          },
          orderBy: {
            createdDate: OrderByDirection.AscNullsFirst
          }
        }
    });
    
    const addSkillsToSnip = async (skillArg: ({type: 'needs-creation', name: string} | {type: 'created', id: string})[]) => {
      if (skillArg.length === 0) {
        return;
      } 
      
      const createResult = await AddtoUserSkillSetRoute.call(
            {
              addSkills: skillArg.filter((skill) => skill.type === 'needs-creation').map((skill) => ({name: (skill as any).name})),
              addIds: skillArg.filter((skill) => skill.type === 'created').map((skill) => (skill as any).id),
              addSkillResources: [{
                snipId
              }]
            },
            {
              headers: {
                Authorization: jwtBearerify(token ?? '') ?? '',
              },
            }
          )
        console.log({createResult})
        
        refetchUserSkills();
        skillResourceRes?.refetch();
    }

    const removeSkillFromSnip = async (skillIds: string[]) => {
      const deleteRes = await deleteResource({
        variables: {
          filter: {
            childSnipId: {
              eq: snipId,
            },
            parentSkillId: {
              in: skillIds
            }
          },
          atMost: 1
        }
      })
      
      console.debug({deleteRes})

      refetchUserSkills();
      skillResourceRes?.refetch();
    }

    const options = userSkills.filter((sk) => {
      return !skillResourceRes.data?.resourceCollection?.edges?.map((edge) => edge?.node?.parentSkill?.id).includes(sk.id);
    })

    return <Autocomplete
        multiple
        id="tags-filled"
        filterOptions={(options, params) => {
          const filtered = filter(options, params);

          // Suggest the creation of a new value
          if (params.inputValue !== '') {
            filtered.push({
              label: `Create "${params.inputValue}"`,
              name: params.inputValue,
            });
          }
          return filtered;
        }}
        {
          ...autocompleteProps
        }
        options={options}
        value={skillResourceRes.data?.resourceCollection?.edges?.map((edge) => edge?.node?.parentSkill as any ?? null).filter(notEmpty) ?? []}
        getOptionLabel={(option) => _.isString(option) ? option : (option.label ?? option.name ?? '')}
        defaultValue={skillResourceRes.data?.resourceCollection?.edges?.map((edge) => edge?.node?.parentSkill as any ?? null).filter(notEmpty) ?? []}
        freeSolo
        renderTags={(value, getTagProps) =>
          value.map((option, index: number) => (
            <Chip variant="outlined" label={_.isString(option) ? option : (option.name ?? '')} {...getTagProps({ index })} />
          ))
        }
        sx={{
          ...autocompleteProps?.sx,
        }}
        onChange={(event, newValue) => {
            const existingSkillNames = skillResourceRes.data?.resourceCollection?.edges?.map((e) => e.node.parentSkill).filter(notEmpty).map((skill) => skill.name).filter(notEmpty) ?? [];
            const newSkillNameList = newValue.map((skill) => _.isString(skill) ? skill : (skill.name ?? ''));

            const newSkillNames = newSkillNameList.filter((skill) => !existingSkillNames.includes(skill));
            const removedSkills = existingSkillNames.filter((skill) => !newSkillNameList.includes(skill));
 
            addSkillsToSnip(newSkillNames.map((name) => {
              // If this skill already exists, just add it
              const existingSkill = userSkills.find((skill) => skill.name === name);
              if (existingSkill && existingSkill.id) {
                  return {type: 'created', id: existingSkill.id};
              } else {
                  return {type: 'needs-creation', name};
              }
            }))

            if (removedSkills.length > 0) {
              const removingIds = removedSkills.map((skillName) => {
                const skill = userSkills.find((skill) => skill.name === skillName);
                if (skill && skill.id) {
                    return skill.id;
                }
              }).filter(notEmpty);
              removeSkillFromSnip(removingIds);
            }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            maxRows={1}
            variant="filled"
            label={<Stack direction="row" gap={1} alignItems={'center'}>
              <SkillIcon fontSize="small"/>
              <Typography variant="caption">Skills</Typography>
            </Stack>}
            placeholder="Add Skills"
          />
        )}
    />
}