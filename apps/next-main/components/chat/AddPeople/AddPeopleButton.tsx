import React from "react";

import _ from "lodash";

import {PersonAdd} from "@mui/icons-material";
import {
  Avatar,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  useTheme,
} from "@mui/material";
import Chip, {ChipProps} from "@mui/material/Chip/Chip";
import {blue} from "@mui/material/colors";

export interface SimpleListOptions<TOptKeys extends string> {
  text: TOptKeys;
  subtext?: string;
  avatar?: React.ReactNode;
  avatarBadgeContent?: React.ReactNode;
}

export interface SimpleListProps<TOptKeys extends string> {
  handleListItemClick: (choice: TOptKeys) => void;
  opts: SimpleListOptions<TOptKeys>[];
}

function SimpleList({ opts, handleListItemClick }: SimpleListProps<string>) {
  return (
    <List sx={{ pt: 0 }}>
      {opts.map(({ text, subtext, avatar, avatarBadgeContent }) => (
        <ListItem key={text} disableGutters>
          <ListItemButton onClick={() => handleListItemClick(text)} key={text}>
            <ListItemAvatar>
              <Badge
                invisible={!avatarBadgeContent}
                badgeContent={avatarBadgeContent}
              >
                <Avatar
                  sx={{
                    bgcolor: blue[100],
                    color: blue[600],
                  }}
                >
                  {avatar}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText primary={text} secondary={subtext} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

export interface SimpleDialogProps<TOptKeys extends string> {
  header: React.ReactNode;
  open: boolean;
  onCancel: () => void;
  onComplete: (choice: TOptKeys) => void;
  opts: {
    text: TOptKeys;
    subtext?: string;
    avatar?: React.ReactNode;
    avatarBadgeContent?: React.ReactNode;
  }[];
}

export function AddPersonasStyled(props: ChipProps) {
  const theme = useTheme();
  return (
    <Chip
      variant="outlined"
      avatar={
        <Avatar sx={{ backgroundColor: theme.palette.text.primary }}>
          <PersonAdd sx={{ width: "15px", height: "15px" }} />
        </Avatar>
      }
      label={<b>Add Personas</b>}
      color="primary"
      {...props}
    />
  );
}