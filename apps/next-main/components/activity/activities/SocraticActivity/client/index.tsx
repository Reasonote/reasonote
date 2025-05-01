import {TxtField} from "@/components/textFields/TxtField";
import {Txt} from "@/components/typography/Txt";
import {
  Add,
  Delete,
  PsychologyAlt,
  School,
} from "@mui/icons-material";
import {
  Button,
  Divider,
  Grid,
  IconButton,
  Stack,
  SvgIconProps,
  TextField,
  Typography,
} from "@mui/material";
import {
  SocraticActivityConfig,
  SocraticResult,
} from "@reasonote/activity-definitions";
import {
  ActivityRenderArgs,
  ActivityResultSkippedBase,
  staticValidateActivityTypeClient,
} from "@reasonote/core";

import {SocraticActivity} from "./render";

/**
 * A helper class for multiple choice activities.
 * 
 * We prefer static methods, so that we are encouraged to 
 * rely on the backend for state.
 */
export class SocraticActivityTypeClient {
    static type = "socratic" as const;

    /**
     * Render the multiple choice activity.
     * @param args The arguments to render the activity.
     * @returns The rendered activity.
     */
    static render(args: ActivityRenderArgs<SocraticActivityConfig, SocraticResult | ActivityResultSkippedBase>){
        //@ts-ignore
        return <SocraticActivity {...args}/>
    }

    static renderTypeIcon = (iconProps: SvgIconProps) => {
        return <PsychologyAlt {...iconProps}/>
    }

    static renderEditor({config, setConfig}: {config: SocraticActivityConfig, setConfig: (config: SocraticActivityConfig) => void}){
      return <Stack gap={2}>
          <Txt startIcon={<School/>}>Setting</Txt>
          <TxtField fullWidth label="Setting Emoji" value={config.setting.emoji} onChange={(e) => {
              setConfig({
                  ...config,
                  setting: {
                      ...config.setting,
                      emoji: e.target.value
                  }
              })
          }}/>
          <TxtField fullWidth label="Setting Name" value={config.setting.name} onChange={(e) => {
              setConfig({
                  ...config,
                  setting: {
                      ...config.setting,
                      name: e.target.value
                  }
              })
          }} />

          <TxtField fullWidth label="Setting Description" value={config.setting.description} onChange={(e) => {
              setConfig({
                  ...config,
                  setting: {
                      ...config.setting,
                      description: e.target.value
                  }
              })
          }} />
         
          <Divider/>

          
          <Grid container rowGap={2}>
              <Grid item xs={2}>
                  <Typography variant="caption">Correct?</Typography>
              </Grid>
              <Grid item xs={9}>
                  <Typography variant="caption">Answer Choice</Typography>
              </Grid>
              <Grid item xs={1}/>
              <Stack direction={'column'}>

              
              {
                  config.learningObjectives.map((objective, idx) => {
                      return <Stack gap={1}>
                          <Stack gap={2} paddingLeft={'15px'}>
                              <Stack direction={'row'} alignItems={'center'} gap={2}>
                                  <Typography variant="body1">Objective {idx + 1}</Typography>
                                  <IconButton
                                      size="small"
                                          onClick={() => {
                                          const learningObjectives = [...config.learningObjectives];
                                          learningObjectives.splice(idx, 1);
                                          setConfig({
                                              ...config,
                                              learningObjectives
                                          })
                                      }}
                                  >
                                      <Delete fontSize="small"/>
                                  </IconButton>
                              </Stack>
                              <TextField
                                  fullWidth
                                  multiline
                                  maxRows={5}
                                  label={"Name"}
                                  size="small"
                                  value={objective.name}
                                  
                                  onChange={(e) => {
                                      const newObjectives = [...config.learningObjectives];
                                      newObjectives[idx].name = e.target.value;  

                                      setConfig({
                                          ...config,
                                          learningObjectives: newObjectives
                                      })
                                  }}
                              />
                              <TextField
                                  fullWidth
                                  multiline
                                  maxRows={5}
                                  label={"Description"}
                                  size="small"
                                  value={objective.objective}
                                  onChange={(e) => {
                                      const newObjectives = [...config.learningObjectives];
                                      newObjectives[idx].objective = e.target.value;  

                                      setConfig({
                                          ...config,
                                          learningObjectives: newObjectives
                                      })
                                  }}
                              />
                          </Stack>
                          <Divider/>
                      </Stack>
                  })
              }
              </Stack>
              <Button 
                  startIcon={<Add/>}
                  onClick={() => {
                      setConfig({
                          ...config,
                          learningObjectives: [...config.learningObjectives, {name: "", objective: ""}]
                      })
                  }}
              >
                  Add Objective
              </Button>
          </Grid>
      </Stack>
  }

  static renderEditorPreview({config, ai}: {config: SocraticActivityConfig, ai?: any}){
      // TODO: ai hmm..
      return <SocraticActivity config={config} ai={ai}/>
  }

  static async getCompletedTip(result: SocraticResult | ActivityResultSkippedBase): Promise<string | undefined> {    
    if (result?.feedback?.aboveTheFoldAnswer) {
        return result.feedback.aboveTheFoldAnswer;
    }
    return undefined;
  }
}


staticValidateActivityTypeClient(SocraticActivityTypeClient);
