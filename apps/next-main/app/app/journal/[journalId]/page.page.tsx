"use client";
import React, {useState} from "react";

import {
  RsnPageDisplayer,
} from "@/app/app/documents/document-display/RsnPageDisplayer";
import {useRouteParamsSingle} from "@/clientOnly/hooks/useRouteParams";
import {
  Edit,
  Visibility,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Stack,
} from "@mui/material";

export default function JournalEntryPage() {
  const {journalId} = useRouteParamsSingle(['journalId']);

  const [isEditing, setIsEditing] = useState(true);

  const toggleMode = () => {
    setIsEditing(!isEditing);
  };

  return (
    <Stack height="100%" width="100%" spacing={2}>
      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          startIcon={isEditing ? <Visibility /> : <Edit />}
          onClick={toggleMode}
        >
          {isEditing ? "View" : "Edit"}
        </Button>
      </Box>
      <RsnPageDisplayer
        selectedDocId={journalId as string}
        maxRows={30}
        readOnly={!isEditing}
      />
    </Stack>
  );
}