'use client'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import NextLink from "next/link";
import {useSearchParams} from "next/navigation";

import {
  ChatViewer,
  ChatViewerSidebar,
} from "@/app/app/skills/[skillId]/_tabsv3/ChatViewerSidebar";
import {
  ResourceViewer,
  ResourceViewerSidebar,
} from "@/app/app/skills/[skillId]/_tabsv3/ResourceViewerSidebar";
import {useParentSkills} from "@/clientOnly/hooks/useParentSkills";
import {useResources} from "@/clientOnly/hooks/useResources";
import {
  Chat,
  ChevronRight,
  Description,
  LibraryBooks,
  MoreHoriz,
  PictureAsPdf,
  VideoLibrary,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Link as MuiLink,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {alpha} from "@mui/material/styles";
import {useSkillFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import {
  getOrderedTabs,
  ToolTabsRenderer,
} from "./tabs/_TabsRegistry";

// Define a custom event for opening the resource viewer
export interface OpenResourceViewerEvent {
  resourceUrl: string;
  resourceTitle: string;
  resourceType: 'pdf' | 'video' | 'text';
}

// Create a ResourceViewer context/event system
export const OPEN_RESOURCE_VIEWER_EVENT = 'open-resource-viewer';

interface SkillHomeTabV3Props {
    skillId: string;
    currentTab: string | null;
    setCurrentTab: (tab: string | null) => void;
}

// Default and min/max widths for the resource viewer panel
const DEFAULT_PANEL_WIDTH = 30; // 30% of parent width
const MIN_PANEL_WIDTH = 20; // 20% minimum
const MAX_PANEL_WIDTH = 60; // 60% maximum

// Helper to truncate text - modify to use the number of breadcrumbs
const truncateText = (text: string, maxLength: number, totalBreadcrumbs: number) => {
    // Adjust maximum length based on number of breadcrumbs
    let adjustedLength = maxLength;
    
    // Show more text when fewer breadcrumbs
    if (totalBreadcrumbs <= 1) {
        // If only one breadcrumb, show full text or up to 60 chars
        adjustedLength = 60;
    } else if (totalBreadcrumbs === 2) {
        // If two breadcrumbs, show more text
        adjustedLength = maxLength * 1.5;
    }
    
    if (text.length <= adjustedLength) return text;
    return `${text.substring(0, adjustedLength)}...`;
};

// Helper function to check if URL is a YouTube link
const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Resource Item component for the Resources panel
const ResourceItem = ({ 
  resource, 
  isSelected, 
  onSelect 
}: { 
  resource: any, 
  isSelected: boolean, 
  onSelect: () => void 
}) => {
  let icon = <Description />;
  let resourceType = 'text';
  
  // Check for PDF
  if (resource.childPage?.storagePath?.toLowerCase().endsWith('.pdf') || 
      resource.childPage?.fileType === 'application/pdf') {
    icon = <PictureAsPdf />;
    resourceType = 'pdf';
  } 
  // Check for YouTube
  else if (resource.childSnip?.sourceUrl && isYouTubeUrl(resource.childSnip.sourceUrl)) {
    icon = <VideoLibrary />;
    resourceType = 'video';
  }
  
  // Get title for the resource
  const title = resource.name || 
    resource.childPage?.name || 
    resource.childSnip?.name || 
    resource.childSnip?.autoTitle || 
    resource.childPage?.originalFilename ||
    resource.childPage?.filename ||
    'Untitled Resource';
  
  return (
    <ListItemButton 
      selected={isSelected}
      onClick={onSelect}
      sx={{
        borderLeft: isSelected ? '3px solid' : '3px solid transparent',
        borderColor: isSelected ? 'primary.main' : 'transparent',
        backgroundColor: isSelected ? 'action.selected' : 'transparent',
        px: 1.5, // Reduced padding
        py: 0.75,
        '&:hover': {
          backgroundColor: isSelected ? 'action.selected' : 'action.hover',
        }
      }}
    >
      <ListItemIcon sx={{ minWidth: 32, mr: 0.5 }}>
        {icon}
      </ListItemIcon>
      <ListItemText 
        primary={title}
        primaryTypographyProps={{
          noWrap: true,
          sx: { 
            fontWeight: isSelected ? 'medium' : 'normal',
            fontSize: '0.875rem',
          }
        }}
      />
    </ListItemButton>
  );
};

const SkillHomeTabV3 = ({ skillId, currentTab: _currentTab, setCurrentTab }: SkillHomeTabV3Props) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const searchParams = useSearchParams();

    // Get ordered tabs
    const orderedTabs = useMemo(() => getOrderedTabs(), []);

    const currentTab = _currentTab ?? 'all';

    // State for the resource viewer sidebar
    const [resourceViewerOpen, setResourceViewerOpen] = useState(false);
    // State for the chat viewer sidebar
    const [chatViewerOpen, setChatViewerOpen] = useState(false);
    
    // State for resizable panels
    const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
    const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
    const [isLeftResizing, setIsLeftResizing] = useState(false);
    const [isRightResizing, setIsRightResizing] = useState(false);
    const resizeContainerRef = useRef<HTMLDivElement>(null);

    // Get resources count for badge
    const { data: resourcesData } = useResources({ skills: [skillId] });
    const resourcesCount = useMemo(() => {
      return resourcesData?.resourceCollection?.edges?.length || 0;
    }, [resourcesData]);

    // Load the skill data
    const { data: skillData, loading: skillLoading } = useSkillFlatFragLoader(skillId);
    
    // Load parent skills for breadcrumbs
    const { data: parentSkills, loading: parentsLoading } = useParentSkills(skillId);

    // Sync sidebar states with URL parameters
    useEffect(() => {
        if (!isMobile) return;
        const leftSidebar = searchParams?.get('leftSidebar');
        const rightSidebar = searchParams?.get('rightSidebar');
        
        setResourceViewerOpen(leftSidebar === 'resources');
        setChatViewerOpen(rightSidebar === 'chat');
    }, [searchParams]);

    // Extract the skills we want to display in breadcrumbs
    const displayedBreadcrumbs = useMemo(() => {
        if (!parentSkills.length) return [];
        
        if (parentSkills.length <= 2) {
            // If we have just 1 or 2 skills, show them all
            return parentSkills;
        }
        
        // Show only root and current skill
        return [
            parentSkills[0], // Root skill
            { id: 'ellipsis', name: 'ellipsis' }, // Middle ellipsis
            parentSkills[parentSkills.length - 1] // Current skill
        ];
    }, [parentSkills]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setCurrentTab(newValue);
    };

    const handleToggleResources = () => {
        if (isMobile) {
            // On mobile, navigate to the resources tab
            setCurrentTab('resources');
        } else {
            // On desktop, toggle the sidebar
            setResourceViewerOpen(prev => !prev);
        }
    };

    const handleToggleChat = () => {
        if (isMobile) {
            // On mobile, navigate to the chat tab
            setCurrentTab('chat');
        } else {
            // On desktop, toggle the sidebar
            setChatViewerOpen(prev => !prev);
        }
    };

    // Handle the start of left panel resizing
    const handleLeftResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsLeftResizing(true);
    };

    // Handle the start of right panel resizing
    const handleRightResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsRightResizing(true);
    };

    // Handle mouse movement during resize
    useEffect(() => {
        const handleResize = (e: MouseEvent) => {
            if ((isLeftResizing || isRightResizing) && resizeContainerRef.current) {
                const containerRect = resizeContainerRef.current.getBoundingClientRect();
                const containerWidth = containerRect.width;
                
                if (isLeftResizing) {
                    const mouseX = e.clientX - containerRect.left;
                    // Calculate percentage of container width
                    let newWidth = (mouseX / containerWidth) * 100;
                    // Clamp to min/max width
                    newWidth = Math.min(Math.max(newWidth, MIN_PANEL_WIDTH), MAX_PANEL_WIDTH);
                    setLeftPanelWidth(newWidth);
                }
                
                if (isRightResizing) {
                    const mouseX = containerRect.right - e.clientX;
                    // Calculate percentage of container width
                    let newWidth = (mouseX / containerWidth) * 100;
                    // Clamp to min/max width
                    newWidth = Math.min(Math.max(newWidth, MIN_PANEL_WIDTH), MAX_PANEL_WIDTH);
                    setRightPanelWidth(newWidth);
                }
            }
        };

        const handleResizeEnd = () => {
            setIsLeftResizing(false);
            setIsRightResizing(false);
        };

        if (isLeftResizing || isRightResizing) {
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', handleResizeEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [isLeftResizing, isRightResizing]);

    // Render different content based on the current tab and device
    const renderMainContent = () => {
        // On mobile, handle special tabs (resources, chat)
        if (isMobile) {
            if (currentTab === 'resources') {
                return (
                    <Box sx={{ height: '100%', width: '100%' }}>
                        <ResourceViewer skillId={skillId} />
                    </Box>
                );
            } else if (currentTab === 'chat') {
                return (
                    <Box sx={{ height: '100%', width: '100%' }}>
                        <ChatViewer skillId={skillId} />
                    </Box>
                );
            }
        }

        // For other tabs or on desktop, render the normal content
        if (currentTab !== 'sources') {
            return <ToolTabsRenderer skillId={skillId} selectedTabId={currentTab} />;
        }
        
        return null;
    };

    if (skillLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box 
            ref={resizeContainerRef}
            sx={{ 
                width: '100%', 
                height: '100%', 
                overflow: 'hidden', 
                border: { xs: 'none', sm: '1px solid #505050' }, 
                borderRadius: { xs: 0, sm: 2 }, 
                display: 'flex',
                position: 'relative',
                cursor: isLeftResizing || isRightResizing ? 'col-resize' : 'default',
            }}
        >
            {/* Resource Viewer Column (Left sidebar) - Only on desktop */}
            {!isMobile && resourceViewerOpen && (
                <>
                    <Box 
                        sx={{ 
                            width: `${leftPanelWidth}%`, 
                            height: '100%', 
                            borderRight: '1px solid', 
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            transition: isLeftResizing ? 'none' : 'width 0.2s ease',
                        }}
                    >
                        <ResourceViewerSidebar
                            skillId={skillId}
                            onClose={handleToggleResources}
                        />
                    </Box>

                    {/* Left resizable handle - only on desktop */}
                    <Box
                        sx={{
                            position: 'absolute',
                            height: '100%',
                            width: '12px',
                            left: `calc(${leftPanelWidth}% - 6px)`,
                            cursor: 'col-resize',
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover': {
                                '& .resizer-handle': {
                                    backgroundColor: 'primary.main',
                                    opacity: 0.7,
                                }
                            }
                        }}
                        onMouseDown={handleLeftResizeStart}
                    >
                        <Box 
                            className="resizer-handle"
                            sx={{
                                width: '4px',
                                height: '40px',
                                backgroundColor: 'divider',
                                borderRadius: '4px',
                                transition: 'background-color 0.2s ease, opacity 0.2s ease',
                                opacity: isLeftResizing ? 0.7 : 0.3,
                            }}
                        /> 
                    </Box>
                </>
            )}

            {/* Main Content Column */}
            <Box 
                sx={{ 
                    flexGrow: 1, 
                    height: '100%', 
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    width: isMobile 
                        ? '100%' // Mobile: always take full width
                        : (() => {
                            const leftWidth = resourceViewerOpen ? leftPanelWidth : 0;
                            const rightWidth = chatViewerOpen ? rightPanelWidth : 0;
                            return `calc(100% - ${leftWidth}% - ${rightWidth}%)`;
                        })(),
                    position: 'relative',
                    transition: (isLeftResizing || isRightResizing) ? 'none' : 'width 0.2s ease',
                }}
                id="skill-home-tab-content"
            >
                {/* Header area - hidden on mobile */}
                <Box
                    sx={{
                        position: 'relative',
                        background: theme => theme.palette.mode === 'dark' 
                            ? `linear-gradient(to bottom, 
                                ${alpha(theme.palette.common.black, 0.85)} 0%, 
                                ${alpha(theme.palette.common.black, 0.6)} 40%, 
                                ${alpha(theme.palette.common.black, 0.3)} 70%, 
                                ${alpha(theme.palette.common.black, 0)} 100%)`
                            : `linear-gradient(to bottom, 
                                ${alpha(theme.palette.grey[400], 0.7)} 0%, 
                                ${alpha(theme.palette.grey[300], 0.5)} 40%, 
                                ${alpha(theme.palette.grey[200], 0.3)} 70%, 
                                ${alpha(theme.palette.grey[100], 0)} 100%)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        pt: 2,
                        px: 2,
                        color: theme => theme.palette.common.white,
                        overflow: 'visible',
                        flexShrink: 0,
                        '&::after': {
                            content: 'none'
                        },
                        display: { xs: 'none', sm: 'block' }
                    }}
                    id="skill-home-tab-content-header"
                >
                    {/* Background emoji */}
                    {skillData?.emoji && (
                        <Box
                            sx={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%) rotate(-10deg)',
                                fontSize: '300px',
                                opacity: 0.12,
                                background: 'transparent',
                                filter: 'blur(10px)',
                                maskImage: `radial-gradient(circle at center, white 0%, transparent 70%)`,
                                WebkitMaskImage: `radial-gradient(circle at center, white 0%, transparent 70%)`,
                                pointerEvents: 'none',
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 0,
                            }}
                        >
                            {skillData?.emoji}
                        </Box>
                    )}

                    {/* Top content */}
                    <Box sx={{ maxWidth: '900px', margin: '0 auto' }}>
                        {/* Breadcrumb */}
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, position: 'relative', zIndex: 2, flexWrap: 'wrap' }}>
                            {parentsLoading ? (
                                <CircularProgress size={16} sx={{ mr: 1 }} />
                            ) : (
                                displayedBreadcrumbs.map((skill, index) => (
                                    <Stack key={skill.id} direction="row" alignItems="center" spacing={1}>
                                        {index > 0 && <ChevronRight fontSize="small" />}
                                        
                                        {skill.id === 'ellipsis' ? (
                                            <Tooltip title="More skills in hierarchy" arrow>
                                                <MoreHoriz fontSize="small" />
                                            </Tooltip>
                                        ) : skill.id === skillId ? (
                                            <Tooltip title={skill.name} arrow>
                                                <Typography 
                                                    variant="h6" 
                                                    component="span" 
                                                    noWrap 
                                                    sx={{ 
                                                        ...(displayedBreadcrumbs.length <= 1 
                                                            ? { maxWidth: 'none' }
                                                            : { maxWidth: { xs: '150px', sm: '200px', md: '250px' } }
                                                        ),
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                    color={theme => theme.palette.mode === 'dark' ? 'white' : 'black'}
                                                >
                                                    {truncateText(skill.name, 30, displayedBreadcrumbs.length)}
                                                </Typography>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip title={skill.name} arrow>
                                                <MuiLink 
                                                    component={NextLink}
                                                    href={`/app/skills/${skill.id}`} 
                                                    sx={{ 
                                                        color: 'white', 
                                                        textDecoration: 'underline',
                                                        '&:hover': { opacity: 0.8 },
                                                        ...(displayedBreadcrumbs.length <= 2
                                                            ? { maxWidth: '100%' }
                                                            : { maxWidth: { xs: '100px', sm: '150px', md: '200px' } }
                                                        ),
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        display: 'block'
                                                    }}
                                                    variant="body2"
                                                >
                                                    {truncateText(skill.name, 25, displayedBreadcrumbs.length)}
                                                </MuiLink>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                ))
                            )}
                        </Stack>

                        {/* Navigation area with buttons and tabs */}
                        <Box sx={{ 
                            position: 'relative', 
                            mt: 2, 
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            {/* Resources Button - Left */}
                            <Box>
                                <Tooltip title="Resources Library" arrow>
                                    <Button
                                        sx={{
                                            minHeight: 42,
                                            width: 42,
                                            minWidth: 42,
                                            color: 'white',
                                            backgroundColor: resourceViewerOpen ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                            border: resourceViewerOpen ? '1px solid rgba(255, 255, 255, 0.5)' : 'none',
                                            borderRadius: '4px',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            },
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: resourceViewerOpen ? 'bold' : 'normal',
                                        }}
                                        onClick={handleToggleResources}
                                    >
                                        <LibraryBooks fontSize="small" />
                                    </Button>
                                </Tooltip>
                            </Box>
                                
                            {/* Tabs Container - Center */}
                            <Box sx={{ 
                                flexGrow: 1,
                                maxWidth: 'calc(100% - 110px)',
                                mx: 1,
                                overflow: 'hidden',
                                display: 'flex',
                                justifyContent: 'center',
                            }}>
                                <Tabs
                                    value={currentTab}
                                    onChange={handleTabChange}
                                    variant="scrollable"
                                    scrollButtons={true}
                                    allowScrollButtonsMobile
                                    sx={{
                                        minHeight: 42,
                                        maxWidth: '100%',
                                        width: 'auto',
                                        '& .MuiTabs-scroller': {
                                            overflowX: 'auto',
                                            scrollbarWidth: 'thin',
                                            scrollBehavior: 'smooth',
                                            msOverflowStyle: 'none',
                                            '&::-webkit-scrollbar': {
                                                height: 4,
                                                backgroundColor: 'transparent',
                                            },
                                            '&::-webkit-scrollbar-thumb': {
                                                backgroundColor: theme => theme.palette.mode === 'dark' 
                                                    ? 'rgba(255,255,255,0.2)' 
                                                    : 'rgba(0,0,0,0.2)',
                                                borderRadius: 2,
                                            }
                                        },
                                        '& .MuiTabs-flexContainer': {
                                            display: 'flex',
                                            flexWrap: 'nowrap',
                                            justifyContent: 'flex-start', // Left align tabs to ensure scrolling works
                                        },
                                        '& .MuiTab-root': {
                                            minHeight: 42,
                                            padding: '8px 16px',
                                            fontSize: '0.9375rem',
                                            textTransform: 'none',
                                            fontWeight: 'normal',
                                            minWidth: 'auto',
                                            marginRight: 1.5,
                                            whiteSpace: 'nowrap',
                                            '&:first-of-type': {
                                                paddingLeft: 0, // No padding on first tab
                                            },
                                            '& .MuiSvgIcon-root': {
                                                fontSize: '1rem',
                                                marginBottom: 0,
                                                marginRight: 0.75
                                            }
                                        },
                                        '& .Mui-selected': {
                                            fontWeight: 'bold'
                                        },
                                        '& .MuiTabs-scrollButtons': {
                                            opacity: 1,
                                            color: theme => theme.palette.mode === 'dark' ? 'white' : 'rgba(0,0,0,0.7)',
                                            backgroundColor: theme => theme.palette.mode === 'dark' 
                                                ? 'rgba(0,0,0,0.3)' 
                                                : 'rgba(255,255,255,0.5)',
                                            borderRadius: '50%',
                                            margin: '0 2px',
                                            padding: 0,
                                            width: 36,
                                            height: 36,
                                            '&.Mui-disabled': {
                                                opacity: 0,
                                            },
                                            '&:hover': {
                                                opacity: 1,
                                                backgroundColor: theme => theme.palette.mode === 'dark' 
                                                    ? 'rgba(0,0,0,0.5)' 
                                                    : 'rgba(255,255,255,0.8)',
                                            },
                                            '&.MuiTabScrollButton-root:first-of-type': {
                                                zIndex: 3,
                                                boxShadow: 2,
                                                left: 0,
                                                backgroundColor: theme => theme.palette.mode === 'dark' 
                                                    ? 'rgba(0,0,0,0.5)' 
                                                    : 'rgba(255,255,255,0.8)',
                                            },
                                            '&.MuiTabScrollButton-root:last-of-type': {
                                                zIndex: 3,
                                                boxShadow: 2,
                                                right: 0,
                                            }
                                        },
                                        '& .MuiTabs-indicator': {
                                            height: 2.5
                                        }
                                    }}
                                >
                                    {orderedTabs.map(tab => {
                                        // Create the icon element based on customIcon or icon
                                        const iconElement = tab.customIcon
                                            ? tab.customIcon(currentTab === tab.id)
                                            //@ts-ignore
                                            : tab.icon ? <tab.icon fontSize="small" /> : undefined;

                                        return (
                                            <Tab
                                                key={tab.id}
                                                //@ts-ignore
                                                icon={iconElement}
                                                iconPosition="start"
                                                label={tab.label}
                                                value={tab.id}
                                            />
                                        );
                                    })}
                                </Tabs>
                            </Box>
                            
                            {/* Chat Button - Right */}
                            <Box>
                                <Tooltip title="Open Chat" arrow>
                                    <Button
                                        sx={{
                                            minHeight: 42,
                                            width: 42,
                                            minWidth: 42,
                                            color: 'white',
                                            backgroundColor: chatViewerOpen ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                            border: chatViewerOpen ? '1px solid rgba(255, 255, 255, 0.5)' : 'none',
                                            borderRadius: '4px',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            },
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: chatViewerOpen ? 'bold' : 'normal',
                                        }}
                                        onClick={handleToggleChat}
                                    >
                                        <Chat fontSize="small" />
                                    </Button>
                                </Tooltip>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Tabs divider - hidden on mobile */}
                <Box sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider', 
                    flexShrink: 0,
                    display: { xs: 'none', sm: 'block' }
                }}/>

                {/* Content */}
                <Box sx={{ 
                    p: { xs: 1, sm: 2 }, 
                    maxWidth: '900px', 
                    margin: '0 auto', 
                    flexGrow: 1, 
                    width: '100%', 
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                    id="skill-home-tab-content-body"
                >
                    {/* Render the content based on the current tab and device */}
                    {renderMainContent()}
                </Box>
            </Box>
            
            {/* Chat Viewer Column (Right sidebar) - Only on desktop */}
            {!isMobile && chatViewerOpen && (
                <>
                    {/* Right resizable handle - only on desktop */}
                    <Box
                        sx={{
                            position: 'absolute',
                            height: '100%',
                            width: '12px',
                            right: `calc(${rightPanelWidth}% - 6px)`,
                            cursor: 'col-resize',
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover': {
                                '& .resizer-handle': {
                                    backgroundColor: 'primary.main',
                                    opacity: 0.7,
                                }
                            }
                        }}
                        onMouseDown={handleRightResizeStart}
                    >
                        <Box 
                            className="resizer-handle"
                            sx={{
                                width: '4px',
                                height: '40px',
                                backgroundColor: 'divider',
                                borderRadius: '4px',
                                transition: 'background-color 0.2s ease, opacity 0.2s ease',
                                opacity: isRightResizing ? 0.7 : 0.3,
                            }}
                        />
                    </Box>
                    
                    <Box 
                        sx={{ 
                            width: `${rightPanelWidth}%`, 
                            height: '100%', 
                            borderLeft: '1px solid', 
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            transition: isRightResizing ? 'none' : 'width 0.2s ease',
                        }}
                    >
                        <ChatViewerSidebar
                            skillId={skillId}
                            onClose={handleToggleChat}
                        />
                    </Box>
                </>
            )}
        </Box>
    );
};

export default SkillHomeTabV3;
