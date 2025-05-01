import React from "react";

import {TxtField} from "@/components/textFields/TxtField";
import {Txt} from "@/components/typography/Txt";
import {
  CheckBoxOutlineBlank,
  CheckBoxOutlined,
  Description,
  Edit,
  Person,
  Save,
} from "@mui/icons-material";
import {
  Card,
  IconButton,
  Stack,
} from "@mui/material";

export function EditablePersona({ persona, onSelect, isSelected, isEditing, setIsEditing, onChange }) {
    return (
        <Card sx={{ padding: '10px' }}>
            <Stack gap={1} direction="row">
                <IconButton
                    size="small"
                    sx={{ backgroundColor: isSelected ? 'primary.main' : 'gray' }}
                    onClick={() => onSelect(!isSelected)}
                >
                    {isSelected ? <CheckBoxOutlined /> : <CheckBoxOutlineBlank />}
                </IconButton>

                <IconButton size="small" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? <Save /> : <Edit />}
                </IconButton>
            </Stack>
            {isEditing ? (
                <Stack gap={1} width={'100%'}>
                    <TxtField
                        startIcon={<Person />}
                        label="Name"
                        value={persona.name}
                        onChange={(e) => onChange({ ...persona, name: e.target.value })}
                    />
                    <TxtField
                        startIcon={<Description />}
                        label="Description"
                        value={persona.description}
                        onChange={(e) => onChange({ ...persona, description: e.target.value })}
                        multiline
                    />
                </Stack>
            ) : (
                <Stack gap={1}>
                    <Txt startIcon={<Person />} variant="h6">
                        {persona.name}
                    </Txt>
                    <Txt>{persona.description}</Txt>
                </Stack>
            )}
        </Card>
    );
}