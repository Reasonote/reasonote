import {useState} from "react";

import {useSuggestedSkills} from "@/clientOnly/hooks/useSuggestedSkills";

import {Info} from "@mui/icons-material";
import {
  Grid,
  Paper,
  Stack,
  Typography,
  useTheme
} from "@mui/material";

import {BaseCallout} from "../cards/BaseCallout";
import {SkillChip} from "../chips/SkillChip/SkillChip";
import {CreateSkillAutocomplete} from "./CreateSkillAutocomplete";

export function NewUserCreateSkillDialog() {
  const theme = useTheme();
  const suggestedSkills = useSuggestedSkills(); 

  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  return (
    <Paper sx={{padding: '10px'}}>
      <Stack gap={2}>
        <Typography variant="h4">Welcome to Reasonote!</Typography> 

        <BaseCallout 
          icon={<Info />}
          header={
            <Typography variant="h6">Adding Skills</Typography>
          }
          backgroundColor={theme.palette.info.dark}
          sx={{paper: {padding: '8px'}}}
        >
          <Typography variant="body1">
            Reasonote is based on skills.
            <br/>
            A skill can be <i>anything</i> you want to learn.
            <br/>
            <hr/>
            Reasonote isn't limited to traditional academic subjects, so try adding some things that interest you!
          </Typography>
        </BaseCallout>
        
        <Stack gap={1}>
          <Typography variant="h5">Here are some skills we suggest...</Typography>
          <Grid container gap={.5}>
            {suggestedSkills.map((s) => (
              <Grid item key={s.name}>
                <SkillChip topicOrId={s.name} />
              </Grid>
            ))}
          </Grid>
        </Stack>
        <Stack gap={1}>
          <Typography variant="h5">Or you can add your own...</Typography>
          <Grid container gap={.5}>
            {
              selectedSkills.map((sk) => (
                <SkillChip topicOrId={sk} />
              ))
            }
          </Grid>
          
          <CreateSkillAutocomplete 
            onSaveComplete={(skills) => {
              setSelectedSkills(skills)
            }}
          />
        </Stack>
      </Stack>
    </Paper>
  );
}
