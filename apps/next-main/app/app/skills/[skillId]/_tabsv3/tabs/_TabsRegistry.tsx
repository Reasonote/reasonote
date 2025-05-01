'use client'

import {useSkillSimpleTree} from "@/clientOnly/hooks/useSkillSimpleTree";
import {FitnessCenter} from "@mui/icons-material";
import DescriptionIcon from "@mui/icons-material/Description";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PodcastsIcon from "@mui/icons-material/Podcasts";
import SourceIcon from "@mui/icons-material/Source";
import {
  Box,
  Grid,
} from "@mui/material";

import {ToolTabConfig} from "../ToolTabsInterface";
import {AllTab} from "./AllTab";
import {LessonsTab} from "./LessonsTab";
import {OutlineTab} from "./OutlineTab";
import {PodcastTab} from "./PodcastTab";
import {PracticeTab} from "./PracticeTab";
import {SourcesTab} from "./SourcesTab";

// Registry for tabs
const tabRegistry = new Map<string, ToolTabConfig>();

/**
 * Register a new tool tab
 */
export function registerToolTab(config: ToolTabConfig): ToolTabConfig {
  if (tabRegistry.has(config.id)) {
    console.warn(`Tool tab with id ${config.id} is already registered. Overwriting.`);
  }
  
  tabRegistry.set(config.id, config);
  return config;
}

/**
 * Get a registered tool tab by id
 */
export function getToolTab(id: string): ToolTabConfig | undefined {
  return tabRegistry.get(id);
}

// Custom grid icon for the All tab
const AllTabIcon = ({ isActive }: { isActive: boolean }) => (
  <Box sx={{ display: 'flex', p: 0.5 }}>
    <Grid container spacing={0.5} sx={{ width: 16, height: 16 }}>
      <Grid item xs={6}>
        <Box sx={{ bgcolor: isActive ? 'primary.main' : 'gray.main', width: '100%', height: '100%' }} />
      </Grid>
      <Grid item xs={6}>
        <Box sx={{ bgcolor: isActive ? 'secondary.main' : 'gray.main', width: '100%', height: '100%' }} />
      </Grid>
      <Grid item xs={6}>
        <Box sx={{ bgcolor: isActive ? 'info.main' : 'gray.main', width: '100%', height: '100%' }} />
      </Grid>
      <Grid item xs={6}>
        <Box sx={{ bgcolor: isActive ? 'success.main' : 'gray.main', width: '100%', height: '100%' }} />
      </Grid>
    </Grid>
  </Box>
);

// Register all available tabs
// Register the home/all tab
const allTab = registerToolTab({
  id: 'all',
  label: 'All',
  icon: HomeIcon,
  color: '#673ab7', // Deep purple
  renderer: ({ skillId, skillTree, loading, error }) => (
    <AllTab skillId={skillId} />
  ),
  hideOnAllToolsPage: true,
  customIcon: (isActive: boolean) => <AllTabIcon isActive={isActive} />,
});

// const videoTab = registerToolTab({
//   id: 'videos',
//   label: 'Videos',
//   icon: YouTubeIcon,
//   color: '#FF0000', // YouTube red
//   renderer: ({ skillId, skillTree, loading, error }) => (
//     <VideoTab skillId={skillId} />
//   ),
// });

const lessonsTab = registerToolTab({
  id: 'lessons',
  label: 'Lessons',
  icon: MenuBookIcon,
  color: '#4CAF50', // Green
  renderer: ({ skillId, skillTree, loading, error }) => (
    <LessonsTab skillId={skillId} />
  ),
});

// Register the sources tab but hide it from regular tabs list
// It will be accessed through a separate button
const sourcesTab = registerToolTab({
  id: 'sources',
  label: 'Resources',
  icon: SourceIcon,
  color: '#795548', // Brown
  renderer: ({ skillId, skillTree, loading, error }) => (
    <SourcesTab skillId={skillId} />
  ),
  hideFromTabsBar: true, // Mark this tab to be hidden from the tabs bar
});

const practiceTab = registerToolTab({
  id: 'practice',
  label: 'Practice',
  icon: FitnessCenter,
  color: '#795548', // Brown
  renderer: ({ skillId, skillTree, loading, error }) => (
    <PracticeTab skillId={skillId} />
  ),
});

const podcastTab = registerToolTab({
  id: 'podcast',
  label: 'Podcast',
  icon: PodcastsIcon,
  color: '#9C27B0', // Purple
  renderer: ({ skillId, skillTree, loading, error }) => (
    <PodcastTab skillId={skillId} />
  ),
});

// Register the outline tab
const outlineTab = registerToolTab({
  id: 'outline',
  label: 'Outline',
  icon: DescriptionIcon,
  color: '#2196F3', // Blue
  renderer: ({ skillId, skillTree, loading, error }) => (
    <OutlineTab skillId={skillId} />
  ),
});

// Default tab ordering
const DEFAULT_TAB_ORDER: string[] = [
  'all',     // All tab first
  'outline', // Outline tab second
  'lessons',
  'videos',
  'practice',
  'podcast'
];

/**
 * Get the tabs in a specific order
 * Tabs specified in the order array will appear first, in that order
 * Any tabs not in the order array will appear afterwards in registration order
 */
export function getOrderedTabs(order: string[] = DEFAULT_TAB_ORDER): ToolTabConfig[] {
  const allTabs = getAllRegisteredTabs();
  const orderedTabsMap = new Map<string, ToolTabConfig>();
  const remainingTabs: ToolTabConfig[] = [];
  
  // Add tabs in the specified order
  order.forEach(tabId => {
    const tab = allTabs.find(t => t.id === tabId);
    if (tab) {
      orderedTabsMap.set(tabId, tab);
    }
  });
  
  // Collect remaining tabs that aren't in the order array
  allTabs.forEach(tab => {
    if (!orderedTabsMap.has(tab.id)) {
      remainingTabs.push(tab);
    }
  });
  
  // Combine ordered tabs with remaining tabs
  return [...orderedTabsMap.values(), ...remainingTabs];
}

// Get all registered tabs (optionally filtering out hidden tabs)
export const getAllRegisteredTabs = (includeHidden: boolean = false): ToolTabConfig[] => {
  const tabs = Array.from(tabRegistry.values());
  if (includeHidden) {
    return tabs;
  }
  return tabs.filter(tab => !tab.hideFromTabsBar);
};

// Component that renders the selected tab
export function ToolTabsRenderer({ 
  skillId,
  selectedTabId,
}: { 
  skillId: string;
  selectedTabId: string;
}) {

  const {data: skillTree, loading: skillTreeLoading, error: skillTreeError} = useSkillSimpleTree({topicOrId: skillId});
  const orderedTabs = getOrderedTabs();
  // Include hidden tabs when looking for the renderer
  const allTabs = Array.from(tabRegistry.values());
  const selectedTab = allTabs.find(tab => tab.id === selectedTabId) || orderedTabs[0];
  
  return selectedTab.renderer({ skillId, skillTree, loading: skillTreeLoading, error: skillTreeError as Error | null });
}