import React from "react";

import {
  ListItem,
  ListItemIcon,
  Theme,
  Typography,
} from "@mui/material";

interface SidebarListSectionHeaderProps {
  icon: React.ReactNode;
  title: string;
}

export function SidebarListSectionHeader({ icon, title }: SidebarListSectionHeaderProps) {
  return (
    <ListItem disablePadding sx={{ pl: .5, mt: 1, mb: 0.5 }}>
      <ListItemIcon sx={{ minWidth: 30 }} color="gray">
        {icon}
      </ListItemIcon>
      <Typography
        variant="subtitle2"
        sx={(theme: Theme) => ({
          fontWeight: 'bold',
          color: theme.palette.text.secondary,
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
        })}
      >
        {title}
      </Typography>
    </ListItem>
  );
}