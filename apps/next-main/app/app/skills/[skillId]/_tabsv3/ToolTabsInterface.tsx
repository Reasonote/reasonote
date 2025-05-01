'use client'

import {
  ElementType,
  ReactNode,
} from "react";

import {SvgIconProps} from "@mui/material";
import {SimpleSkillTreeNode} from "@reasonote/lib-ai-common";

// Define the interface for each tool tab
export interface ToolTabConfig {
  id: string;        // Unique identifier for the tab
  label: string;     // Display label
  icon: ElementType<SvgIconProps>; // Icon component
  color: string;     // Background color for card/elements
  renderer: (props: ToolTabRendererProps) => JSX.Element; // Component to render tab content
  hideOnAllToolsPage?: boolean;
  hideFromTabsBar?: boolean; // Whether to hide this tab from the tabs bar
  customIcon?: (isActive: boolean) => ReactNode;
  chipIndicator?: boolean;
}

// Props that will be passed to each tab's renderer component
export interface ToolTabRendererProps {
  skillId: string;
  skillTree?: SimpleSkillTreeNode | null;
  loading?: boolean;
  error?: Error | null;
}