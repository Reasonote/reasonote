import React from "react";

import {
  Add,
  Delete,
  EmojiPeople,
  KeyboardArrowDown,
  Place,
  SportsScore,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {RoleplayActivityConfig} from "@reasonote/activity-definitions";

export function RoleplayActivityEditor({config, setConfig}: {config: RoleplayActivityConfig, setConfig: (config: RoleplayActivityConfig) => void}) {
    const [expanded, setExpanded] = React.useState<'setting' | 'objectives' | 'characters' | null>(null);

        return <Stack>
            <Accordion expanded={expanded === 'setting'} onChange={() => setExpanded(expanded === 'setting' ? null : 'setting')}>
                <AccordionSummary expandIcon={<KeyboardArrowDown/>} aria-controls="panel1d-content" id="panel1d-header">
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                        <Place/>
                        <Typography variant={"body1"}>Edit Setting</Typography>
                    </Stack>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack gap={2}>
                        <TextField
                            fullWidth
                            label="Setting Name"
                            size="small"
                            value={config.setting.name} 
                            onChange={(e) => {
                                setConfig({
                                    ...config,
                                    setting: {
                                        ...config.setting,
                                        name: e.target.value
                                    }
                                })
                            }}
                            multiline
                            maxRows={5}
                        />
                        <TextField
                            fullWidth
                            label="Setting Description"
                            size="small"
                            value={config.setting.description} onChange={(e) => {
                                setConfig({
                                    ...config,
                                    setting: {
                                        ...config.setting,
                                        description: e.target.value
                                    }
                                })
                            }}
                            multiline
                            maxRows={5}
                        />
                    </Stack>
                </AccordionDetails>
            </Accordion>
            <Accordion expanded={expanded === 'objectives'} onChange={() => setExpanded(expanded === 'objectives' ? null : 'objectives')}>
                <AccordionSummary expandIcon={<KeyboardArrowDown/>} aria-controls="panel1d-content" id="panel1d-header">
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                        <SportsScore/>
                        <Typography variant={"body1"}>Edit Objectives</Typography>
                    </Stack>
                </AccordionSummary>
                <AccordionDetails>
                    {
                        config.userCharacter.objectives.map((objective, idx) => {
                            return <Stack gap={1}>
                                <Stack gap={2} paddingLeft={'15px'}>
                                    <Stack direction={'row'} alignItems={'center'} gap={2}>
                                        <Typography variant="body1">Objective {idx + 1}</Typography>
                                        <IconButton
                                            size="small"
                                                onClick={() => {
                                                const newUserCharacter = {...config.userCharacter};
                                                newUserCharacter.objectives.splice(idx, 1);
                                                setConfig({
                                                    ...config,
                                                    userCharacter: newUserCharacter
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
                                        value={objective.objectiveName}
                                        
                                        onChange={(e) => {
                                            const newUserCharacter = {...config.userCharacter};
                                            newUserCharacter.objectives[idx].objectiveName = e.target.value;
                                            setConfig({
                                                ...config,
                                                userCharacter: newUserCharacter
                                            })
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        multiline
                                        maxRows={5}
                                        label={"Description"}
                                        size="small"
                                        value={objective.objectiveDescription}
                                        onChange={(e) => {
                                            const newUserCharacter = {...config.userCharacter};
                                            newUserCharacter.objectives[idx].objectiveDescription = e.target.value;
                                            setConfig({
                                                ...config,
                                                userCharacter: newUserCharacter
                                            })
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        multiline
                                        maxRows={5}
                                        label={"Grading Criteria"}
                                        size="small"
                                        value={objective.private.gradingCriteria}
                                        onChange={(e) => {
                                            const newUserCharacter = {...config.userCharacter};
                                            newUserCharacter.objectives[idx].objectiveAction = e.target.value;
                                            setConfig({
                                                ...config,
                                                userCharacter: newUserCharacter
                                            })
                                        }}
                                    />
                                </Stack>
                                <Divider/>
                            </Stack>
                        })
                    }
                    <Button 
                        startIcon={<Add/>}
                        onClick={() => {
                            const newUserCharacter = {...config.userCharacter};
                            newUserCharacter.objectives.push({
                                objectiveName: "",
                                objectiveDescription: "",
                                objectiveAction: "",
                                private: {
                                    gradingCriteria: ""
                                }
                            });
                            setConfig({
                                ...config,
                                userCharacter: newUserCharacter
                            })
                        }}
                    >
                        Add Objective
                    </Button>
                </AccordionDetails>
            </Accordion>
            <Accordion expanded={expanded === 'characters'} onChange={() => setExpanded(expanded === 'characters' ? null : 'characters')}>
                <AccordionSummary expandIcon={<KeyboardArrowDown/>} aria-controls="panel1d-content" id="panel1d-header">
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                        <EmojiPeople/>
                        <Typography variant={"body1"}>Edit Characters</Typography>
                    </Stack>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack alignItems={'center'} gap={1}>
                        {
                            config.characters.map((character, idx) => {
                                return <Stack gap={1} width={'100%'}>
                                    <Stack gap={2} paddingLeft={'15px'}>
                                        <Stack direction={'row'} alignItems={'center'} gap={2}>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const newCharacters = [...config.characters];
                                                    newCharacters.splice(idx, 1);
                                                    setConfig({
                                                        ...config,
                                                        characters: newCharacters
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
                                            label={"Emoji"}
                                            size="small"
                                            value={character.public.emoji}
                                            onChange={(e) => {
                                                const character = {...config.characters[idx]};
                                                character.public.emoji = e.target.value;
                                                setConfig({
                                                    ...config,
                                                    characters: config.characters.map((c, i) => i === idx ? character : c)
                                                })
                                            }}
                                        />
                                        <TextField
                                            fullWidth
                                            multiline
                                            maxRows={5}
                                            label={"Name"}
                                            size="small"
                                            value={character.public.name}
                                            onChange={(e) => {
                                                const character = {...config.characters[idx]};
                                                character.public.name = e.target.value;
                                                setConfig({
                                                    ...config,
                                                    characters: config.characters.map((c, i) => i === idx ? character : c)
                                                })
                                            }}
                                        />
                                        <TextField
                                            fullWidth
                                            multiline
                                            maxRows={5}
                                            label={"Description"}
                                            size="small"
                                            value={character.public.description}
                                            onChange={(e) => {
                                                const character = {...config.characters[idx]};
                                                character.public.description = e.target.value;
                                                setConfig({
                                                    ...config,
                                                    characters: config.characters.map((c, i) => i === idx ? character : c)
                                                })
                                            }}
                                        />
                                        <TextField
                                            fullWidth
                                            multiline
                                            maxRows={5}
                                            label={"Personality"}
                                            size="small"
                                            value={character.private.personality}
                                            onChange={(e) => {
                                                const character = {...config.characters[idx]};
                                                character.private.personality = e.target.value;
                                                setConfig({
                                                    ...config,
                                                    characters: config.characters.map((c, i) => i === idx ? character : c)
                                                })
                                            }}
                                        />
                                        <TextField
                                            fullWidth
                                            multiline
                                            maxRows={5}
                                            label={"Motivation"}
                                            size="small"
                                            value={character.private.motivation}
                                            onChange={(e) => {
                                                const character = {...config.characters[idx]};
                                                character.private.motivation = e.target.value;
                                                setConfig({
                                                    ...config,
                                                    characters: config.characters.map((c, i) => i === idx ? character : c)
                                                })
                                            }}
                                        />
                                    </Stack>
                                    <Divider/>
                                </Stack>
                            })
                        }
                        <Button 
                            startIcon={<Add/>}
                            onClick={() => {
                                setConfig({
                                    ...config,
                                    characters: [...config.characters, {
                                        public: {
                                            emoji: "",
                                            name: "",
                                            description: ""
                                        },
                                        private: {
                                            personality: "",
                                            motivation: ""
                                        }
                                    }]
                                })
                            }}
                        >
                            Add Character
                        </Button>
                    </Stack>
                </AccordionDetails>
            </Accordion>
        </Stack>
}