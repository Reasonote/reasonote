'use client'
import {
  Handle,
  Position,
} from "reactflow";

import {
  breakSkillIntoSubskills,
} from "@/clientOnly/functions/breakSkillIntoSubskills";
import {
  useApolloClient,
  useMutation,
} from "@apollo/client";
import {
  Delete,
  PlusOne,
} from "@mui/icons-material";
import {
  Card,
  IconButton,
  IconButtonProps,
  Stack,
  Typography,
} from "@mui/material";
import {
  createSkillFlatMutDoc,
  createSkillLinkFlatMutDoc,
  getSkillFlatQueryDoc,
} from "@reasonote/lib-sdk-apollo-client";

export function SkillTreeIconButton(props: IconButtonProps){
  return <IconButton size="small" color="gray" {...props} sx={{width: '10px', height: '10px', ...props.sx}} >
    {props.children}
  </IconButton>
}

export function SkillTreeNodeHeader(){
  return <Stack direction={'row'} justifyContent={'end'} padding={'3px'}>
    <SkillTreeIconButton>
      <Delete fontSize="small" sx={{width: '10px', height: '10px'}}/>
    </SkillTreeIconButton>
  </Stack>
}

export function SkillTreeAddSubButton({skillName, skillIdPath}: {skillName: string, skillIdPath: string[]}){
  const [addSkillLink] = useMutation(createSkillLinkFlatMutDoc);
  const ac = useApolloClient();

  return <SkillTreeIconButton onClick={async () => {
    // Call the API to generate subskills.
    const subskillsResult = await breakSkillIntoSubskills(skillName);

    // const subSkillsResult = {
    //   success: true;
    //   data: {
    //     subskillTree: [{
    //       name: 'Hello',

    //     }]
    //   }
    // }

    if (subskillsResult.success){
      const allSkillNames = [...subskillsResult.data.subskillTree.map((subskill) => subskill.name), skillName]
      // TODO: get all existing skills with the same name
      const skillsMatchingResult = await ac.query({
        query: getSkillFlatQueryDoc,
        variables: {
          filter: {
            name: {
              in: allSkillNames
            }
          }
        }
      })

      // Create any skills that don't exist.
      const skillNamesToCreate = allSkillNames.filter((skillName) => {
        return !skillsMatchingResult.data.skillCollection?.edges.find((edge) => edge.node.name === skillName)
      })


      // root skill id is the first skill in the skillIdPath
      const createSkillResult = await ac.mutate({
        mutation: createSkillFlatMutDoc,
        variables: {
          objects: skillNamesToCreate.map((skname) => ({
            name: skname,
            root_skill_id: skillIdPath[0],
            generatedFromSkillPath: skillIdPath,
          }))
        }
      });

      const allSkills = [
        ...(skillsMatchingResult.data.skillCollection?.edges.map((edge) => edge.node) ?? []), 
        ...(createSkillResult.data?.insertIntoSkillCollection?.records ?? [])
      ]

      // For each downstream skill, create a link to the upstream skill.

      // Get the upstream skill
      const upstreamSkill = allSkills.find((skill) => skill.name === skillName)

      if (!upstreamSkill){
        console.error('Upstream skill not found.')
        return;
      }

      // Add all downstream skills
      const addSkillResult = await addSkillLink({
        variables: {
          objects: subskillsResult.data.subskillTree.map((subskill) => ({
            upstreamSkill: upstreamSkill.id,
            downstreamSkill: allSkills.find((skill) => skill.name === subskill.name)?.id,
          }))
        }
      })

      console.log(addSkillResult)
    }
  }}>
    <PlusOne fontSize="small" sx={{width: '10px', height: '10px'}}/>
  </SkillTreeIconButton>
}

export function SkillTreeNode({ data, id }: { data: any; id: string }) {
  return (
    <Card elevation={10}>
      <Stack padding={'5px'}>
        <SkillTreeNodeHeader />
        <Stack>
          <Typography variant="body1">{data.label}</Typography>  
        </Stack>
      </Stack>
       {/* @ts-ignore  */}
      <Handle type="target" position={Position.Top} id={id} />
      {/* @ts-ignore */}
      <Handle type="source" position={Position.Bottom} id={id} />
    </Card> 
  );
}
