import React, {ReactNode} from "react";

import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {Box} from "@mui/material";

interface MDXWrapperProps {
  children: ReactNode;
}

export function MDXWrapper({ children }: MDXWrapperProps) {
  if (typeof children === "string") {
    return <MuiMarkdownDefault>{children}</MuiMarkdownDefault>;
  }
  
  return <Box sx={{ "& p": { margin: 0, marginBottom: 1 } }}>{children}</Box>;
} 