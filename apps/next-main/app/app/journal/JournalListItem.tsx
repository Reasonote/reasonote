import React from "react";

import {useRouter} from "next/navigation";

import {
  ListItem,
  ListItemText,
} from "@mui/material";

interface JournalListItemProps {
  journal: {
    id: string;
    name?: string | null;
    createdDate: string;
  };
}

export function JournalListItem({ journal }: JournalListItemProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/app/journal/${journal.id}`);
  };

  return (
    <ListItem button onClick={handleClick}>
      <ListItemText
        primary={journal.name}
        secondary={new Date(journal.createdDate).toLocaleString()}
      />
    </ListItem>
  );
}