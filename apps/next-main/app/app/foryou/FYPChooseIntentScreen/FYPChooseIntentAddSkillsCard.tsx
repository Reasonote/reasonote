'use client'
import React from "react";

import {TxtField} from "@/components/textFields/TxtField";

import {
  AddCircle,
  Search,
} from "@mui/icons-material";
import {
  Button,
  Card,
  CardActionAreaProps,
  CardProps,
  Grid,
  Stack,
} from "@mui/material";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

interface FYPChooseIntentAddSkillsCardProps {
    title?: string | React.ReactNode;
    subtitle?: string | React.ReactNode;
    onClick?: () => void;
    avatar?: React.ReactNode;
    cardProps?: CardProps;
    cardActionAreaProps?: CardActionAreaProps;
    searchValue: string | null;
    setSearchValue: (newValue: string | null) => void;
    onCreateSkill: (skillName: string) => void;
    showCreateSuggestion: boolean;
}


export function FYPChooseIntentAddSkillsCard({ ...props }: FYPChooseIntentAddSkillsCardProps) {
    const isSmallDevice = useIsSmallDevice();
    
    const isExpanded = true;

    return <Card {...props.cardProps} elevation={20} sx={{ 
        borderRadius: "20px",
        padding: '20px',
        transition: "background-color 0.5s ease",
        ...props.cardProps?.sx 
    }} color="primary" >
            <Stack gap={1} alignContent={'center'} justifyContent={'center'}>
                <Grid container alignItems={'center'} alignContent={'center'} justifyContent={'center'} justifyItems={'center'} gap={1}>
                    <Grid item xs={12} onClick={(ev) => ev.stopPropagation()}>
                        <TxtField 
                            startIcon={<Search/>} 
                            fullWidth 
                            label="Search Or Add a Skill"
                            value={props.searchValue}
                            onChange={(ev) => props.setSearchValue(ev.target.value)}
                        />
                    </Grid> 
                    {/* <Grid item xs={1} onClick={props.onClick}>
                        <Stack direction={'row'}>
                            <IconButton onClick={() => {
                                if (props.searchValue){
                                    props.onCreateSkill(props.searchValue)
                                }
                            }} disabled={!props.searchValue || props.searchValue.trim().length === 0}>
                                <AddCircle/>
                                <ArrowForwardIos fontSize="medium"/>
                            </IconButton>
                        </Stack>
                    </Grid> */}
                </Grid>
                {props.searchValue && props.searchValue.trim().length > 0 && (
                    <Button
                        startIcon={<AddCircle/>}
                        variant="text"
                        color="primary"
                        onClick={() => {
                            if (props.searchValue){
                                props.onCreateSkill(props.searchValue)
                            }
                        }}
                        sx={{
                            textTransform: "none",
                        }}
                    >
                        Create "{props.searchValue}"
                    </Button>
                )}
            </Stack>
    </Card>
}