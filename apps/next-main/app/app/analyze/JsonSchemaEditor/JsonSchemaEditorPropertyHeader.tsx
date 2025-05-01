import React from "react";

import {TxtField} from "@/components/textFields/TxtField";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {Description} from "@mui/icons-material";
import {Stack} from "@mui/material";

import {JsonSchemaTypeSelect} from "./JsonSchemaTypeSelect";

export interface JsonSchemaEditorPropertyHeaderProps {
    title?: string;
    type: string;
    description?: string;
    level: number;
    label?: string;
    startIcon?: any;
    updateOwnName: (newName: string) => any;
    updateDescription?: (newDescription: string) => any;
    handleItemTypeChange: (newType: string) => any;
    rightSection?: React.ReactNode;
}


export function JsonSchemaEditorPropertyHeader({
    title,
    type,
    updateOwnName,
    label,
    handleItemTypeChange,
    description,
    updateDescription,
    startIcon,
    rightSection
}: JsonSchemaEditorPropertyHeaderProps) {
    const [tmpTitle, setTmpTitle] = React.useState(title);
    const [tmpDescription, setTmpDescription] = React.useState(description);

    // TODO: failure handle
    const handleTitleChange = (s: string) => {
        setTmpTitle(s);

        updateOwnName(s);
    }

    // TODO: handle failure
    const handleDescriptionChange = (s: string) => {
        setTmpDescription(s);

        updateDescription?.(s);
    }

    return (<>
        <Stack gap={1} width={'100%'}>
            <Stack direction="row" gap={2} width={'100%'}>
                <JsonSchemaTypeSelect
                    type={type}
                    onTypeChange={handleItemTypeChange}
                />
                {notEmpty(title) && <TxtField
                    size="small"
                    label={label || "Title"}
                    variant="standard"
                    value={tmpTitle}
                    startIcon={startIcon}
                    onChange={(e) => handleTitleChange(e.target.value)}
                />}
                
                
                {rightSection}
            </Stack>
            <TxtField
                size="small"
                variant="standard"
                label="Description"
                startIcon={<Description htmlColor="grey"/>}
                multiline
                value={tmpDescription}
                onChange={(e) => handleDescriptionChange(e.target.value)}
            />
        </Stack>
        
    </>
    );
}