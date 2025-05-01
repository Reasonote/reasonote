import {useState} from "react";

import {Chat} from "@mui/icons-material";
import {
  Button,
  Card,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import {
  explainTopic,
  SkillChip,
} from "./SkillChip/SkillChip";

export function TopicExplainer({topic}: {topic: string}) {
    const [explainingState, setExplainingState] = useState<{type: 'idle'} | {type: 'explaining'} | {type: 'done', data: Awaited<ReturnType<typeof explainTopic>>  }>({type: 'idle'});
  
    
    return <Stack>
      <div>
        <Button
          variant='contained'
          startIcon={<Chat/>}
          fullWidth={false}
          onClick={() => {
            setExplainingState({type: 'explaining'})
            explainTopic({topic}).then((result) => {
              setExplainingState({type: 'done', data: result})
            })
          }}
        >
          Explain This
        </Button>
      </div>
      {
        explainingState.type === 'explaining' &&
        <>
          <Typography variant="body1">
            Explaining...
          </Typography>
          <LinearProgress />
        </>
      }
      {
        explainingState.type === 'done' ?
          (
            explainingState.data.data ?
              <Card elevation={5} sx={{padding: '10px', overflowY: 'scroll'}}>
                <Stack gap={2}>
                  <Card elevation={8} sx={{padding: '5px', maxHeight: '500px', overflowY: 'scroll'}}>
                    <Typography variant="body1">
                      {explainingState.data.data.explanation}
                    </Typography>
                  </Card>
                  <Card elevation={8} sx={{padding: '5px', maxHeight: '200px', overflowY: 'scroll'}}>
                    <Grid container gap={1}>
                      {
                        explainingState.data.data.relatedTopics ?
                          explainingState.data.data.relatedTopics.map((topic, idx) => {
                            return <Grid item><SkillChip key={idx} topicOrId={topic} disableModal/></Grid>
                          })
                          :
                          null
                      }
                    </Grid>
                  </Card>
                </Stack>
              </Card>
              :
              <>
                <Typography variant="body1">
                  Error: {JSON.stringify(explainingState.data.error)}
                </Typography>
              </>
          )
          :
          null
      }
    </Stack>
  }