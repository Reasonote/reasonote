'use client'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {useResources} from "@/clientOnly/hooks/useResources";
import {PdfViewer} from "@/components/pdf/PdfViewer";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  ChevronLeft,
  Close,
  Description,
  FormatListBulleted,
  LibraryBooks,
  OpenInNew,
  PictureAsPdf,
  VideoLibrary,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import {alpha} from "@mui/material/styles";
import {useAsyncMemo} from "@reasonote/lib-utils-frontend";

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

// ResourceViewer component - just the content portion without the sidebar chrome
export const ResourceViewer = ({ skillId }: { skillId: string }) => {
  const { data, loading, error } = useResources({ skills: [skillId] });
  const [selectedResourceIndex, setSelectedResourceIndex] = useState<number | null>(null);
  const { supabase } = useSupabase();
  
  // Add state for the resources list width
  const [listWidth, setListWidth] = useState(200);
  const [isListResizing, setIsListResizing] = useState(false);
  const listResizeRef = useRef<HTMLDivElement>(null);
  
  // State for collapsible sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  const resources = data?.resourceCollection?.edges?.map(edge => edge.node) || [];
  const selectedResource = (selectedResourceIndex !== null && resources.length > selectedResourceIndex) 
                          ? resources[selectedResourceIndex] 
                          : null;
  
  /**
   * Get the resource URL based on the resource type (PDF, etc.)
   */
  const getResourceUrl = async (resource: any): Promise<string | null> => {
    if (!resource) return null;
    
    // Check if resource has a childPage with a storagePath (PDF)
    if (resource.childPage?.storagePath) {
      const storagePath = resource.childPage.storagePath;
      const { data, error } = await supabase.storage.from('attachment-uploads').createSignedUrl(storagePath, 900);
      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }
      return data.signedUrl;
    }
    
    // Check if resource has a childSnip with a sourceUrl
    if (resource.childSnip?.sourceUrl) {
      return resource.childSnip.sourceUrl;
    }
    
    return null;
  };
  
  const resourceUrl = useAsyncMemo(async () => {
    return await getResourceUrl(selectedResource);
  }, [selectedResource]);
  
  // Safely get the resource title from potentially missing properties
  const resourceTitle = useMemo(() => {
    if (!selectedResource) return '';
    
    // Try to get from the different possible properties, in order of preference
    if (selectedResource.childPage?.name) {
      return selectedResource.childPage.name;
    }
    
    if (selectedResource.childSnip?.name) {
      return selectedResource.childSnip.name;
    }
    
    if (selectedResource.childSnip?.autoTitle) {
      return selectedResource.childSnip.autoTitle;
    }
    
    if (selectedResource.childPage?.originalFilename) {
      return selectedResource.childPage.originalFilename;
    }
    
    return 'Untitled Resource';
  }, [selectedResource]);
  
  // Determine resource type
  const resourceType = useMemo(() => {
    if (!selectedResource || !resourceUrl) return 'text';
    
    if (selectedResource.childPage?.storagePath?.toLowerCase().endsWith('.pdf') || 
        resourceUrl.toLowerCase().endsWith('.pdf')) {
      return 'pdf';
    }
    
    if (resourceUrl && isYouTubeUrl(resourceUrl)) {
      return 'video';
    }
    
    return 'text';
  }, [selectedResource, resourceUrl]);
  
  // Select first resource by default if available
  useEffect(() => {
    if (resources.length > 0 && selectedResourceIndex === null) {
      setSelectedResourceIndex(0);
    }
  }, [resources, selectedResourceIndex]);
  
  // Handle the resource list resizer
  const handleListResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsListResizing(true);
  };
  
  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Handle list resize
  useEffect(() => {
    const handleListResize = (e: MouseEvent) => {
      if (isListResizing && listResizeRef.current) {
        const containerRect = listResizeRef.current.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        
        // Set min/max widths for the resources list
        const minWidth = 150;
        const maxWidth = 400;
        
        // Clamp the width
        const newWidth = Math.min(Math.max(mouseX, minWidth), maxWidth);
        setListWidth(newWidth);
      }
    };
    
    const handleListResizeEnd = () => {
      setIsListResizing(false);
    };
    
    if (isListResizing) {
      document.addEventListener('mousemove', handleListResize);
      document.addEventListener('mouseup', handleListResizeEnd);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleListResize);
      document.removeEventListener('mouseup', handleListResizeEnd);
    };
  }, [isListResizing]);

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error loading resources: {error.message}</Typography>
      </Box>
    );
  }

  if (resources.length === 0) {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <LibraryBooks sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
        <Typography align="center" color="text.secondary">
          No resources available for this skill.
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      ref={listResizeRef}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%'
      }}
    >
      {/* Split view - Resources list and viewer */}
      <Box sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Resources list sidebar */}
        <Box sx={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
          {/* Resources list - Show in both collapsed and expanded modes */}
          <Box sx={{ 
            width: sidebarCollapsed ? 'auto' : `${listWidth}px`, 
            borderRight: '1px solid',
            borderColor: 'divider',
            overflowY: 'auto',
            flexShrink: 0,
            py: 0, // No padding for the list container
            position: 'relative',
            transition: 'width 0.2s ease',
          }}>
            {sidebarCollapsed ? (
              // Collapsed view - show minimalist list with toggle button at the top
              <List disablePadding>
                {/* Toggle button as first list item */}
                <ListItemButton
                  onClick={toggleSidebar}
                  sx={{
                    minWidth: 'auto',
                    px: 1,
                    py: 1,
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.2)',
                    }
                  }}
                >
                  <Tooltip title="Expand resources list">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormatListBulleted fontSize="small" />
                    </Box>
                  </Tooltip>
                </ListItemButton>
                
                {/* Resource items */}
                {resources.map((resource, index) => {
                  // Determine icon based on resource type
                  let icon = <Description fontSize="small" />;
                  
                  // Check for PDF
                  if (resource.childPage?.storagePath?.toLowerCase().endsWith('.pdf') || 
                      resource.childPage?.fileType === 'application/pdf') {
                    icon = <PictureAsPdf fontSize="small" />;
                  } 
                  // Check for YouTube
                  else if (resource.childSnip?.sourceUrl && isYouTubeUrl(resource.childSnip.sourceUrl)) {
                    icon = <VideoLibrary fontSize="small" />;
                  }
                  
                  return (
                    <ListItemButton
                      key={resource.id || index}
                      selected={index === selectedResourceIndex}
                      onClick={() => setSelectedResourceIndex(index)}
                      sx={{
                        minWidth: 'auto',
                        px: 1,
                        py: 0.5,
                        justifyContent: 'flex-start',
                        '&.Mui-selected': {
                          backgroundColor: 'action.selected',
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        {icon}
                      </ListItemIcon>
                    </ListItemButton>
                  );
                })}
              </List>
            ) : (
              // Expanded view - show full list
              <List disablePadding>
                {/* Toggle button as first list item */}
                <ListItemButton
                  onClick={toggleSidebar}
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, mr: 0.5 }}>
                    <ChevronLeft />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Collapse List"
                    primaryTypographyProps={{
                      fontSize: '0.825rem',
                      color: 'text.secondary'
                    }}
                  />
                </ListItemButton>
                
                {/* Resource items */}
                {resources.map((resource, index) => (
                  <ResourceItem 
                    key={resource.id || index}
                    resource={resource}
                    isSelected={index === selectedResourceIndex}
                    onSelect={() => setSelectedResourceIndex(index)}
                  />
                ))}
              </List>
            )}
          </Box>
        </Box>
        
        {/* Resizable handle for resource list - only visible when sidebar is expanded */}
        {!sidebarCollapsed && (
          <Box
            sx={{
              position: 'absolute',
              height: '100%',
              width: '12px',
              left: `${listWidth - 6}px`,
              cursor: 'col-resize',
              zIndex: 5,
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
            onMouseDown={handleListResizeStart}
          >
            <Box 
              className="resizer-handle"
              sx={{
                width: '4px',
                height: '40px',
                backgroundColor: 'divider',
                borderRadius: '4px',
                transition: 'background-color 0.2s ease, opacity 0.2s ease',
                opacity: isListResizing ? 0.7 : 0.3,
              }}
            />
          </Box>
        )}
        
        {/* Resource viewer */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>
          {selectedResource && resourceUrl ? (
            <>
              {/* Resource title/actions overlay */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                p: 1.5,
                background: theme => theme.palette.mode === 'dark'
                  ? 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)'
                  : `linear-gradient(to bottom, 
                      ${alpha(theme.palette.grey[400], 0.7)} 0%, 
                      ${alpha(theme.palette.grey[300], 0.5)} 40%, 
                      ${alpha(theme.palette.grey[200], 0.3)} 70%, 
                      ${alpha(theme.palette.grey[100], 0)} 100%)`,
                zIndex: 5, 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: theme => theme.palette.mode === 'dark' ? 'white' : 'black',
                    fontWeight: 'medium', 
                    textShadow: theme => theme.palette.mode === 'dark' 
                      ? '1px 1px 2px rgba(0,0,0,0.7)'
                      : 'none',
                    maxWidth: 'calc(100% - 100px)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {resourceTitle}
                </Typography>
                <Button 
                  startIcon={<OpenInNew sx={{ fontSize: '1rem' }} />}
                  href={resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  variant="contained"
                  color="primary"
                  sx={{
                    py: 0.5,
                    px: 1,
                    fontSize: '0.75rem',
                    minWidth: 'auto',
                  }}
                >
                  Open
                </Button>
              </Box>
              
              {/* Resource content - Fix scrolling */}
              <Box sx={{ 
                flexGrow: 1, 
                overflow: 'auto', // Ensure all content can scroll 
                pt: '60px', /* Padding top to avoid overlap with title */
                height: 'calc(100vh - 120px)', // Give the container enough height
                position: 'relative'
              }}>
                {/* PDF Viewer */}
                {resourceType === 'pdf' && (
                  <Box sx={{ 
                    height: 'calc(100% - 60px)', 
                    overflow: 'auto', // Make sure PDF is scrollable
                    position: 'absolute',
                    top: '60px',
                    left: 0,
                    right: 0,
                    bottom: 0
                  }}>
                    <PdfViewer url={resourceUrl} />
                  </Box>
                )}
                
                {/* YouTube Video */}
                {resourceType === 'video' && isYouTubeUrl(resourceUrl) && (
                  <Box sx={{ p: 2 }}>
                    {getYouTubeVideoId(resourceUrl) ? (
                      <Box sx={{ position: 'relative', width: '100%', height: 0, paddingTop: '56.25%' }}>
                        <iframe
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 'none'
                          }}
                          src={`https://www.youtube.com/embed/${getYouTubeVideoId(resourceUrl)}`}
                          title={resourceTitle}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </Box>
                    ) : (
                      <Typography>Invalid YouTube URL</Typography>
                    )}
                  </Box>
                )}
                
                {/* Text/URL */}
                {resourceType === 'text' && (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="body1" component="div">
                      <a href={resourceUrl} target="_blank" rel="noopener noreferrer">
                        {resourceUrl}
                      </a>
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          ) : (
            // Placeholder when no resource is selected or URL is loading
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
              {loading ? (
                <CircularProgress /> 
              ) : (
                <Typography color="text.secondary">Select a resource from the list</Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

interface ResourceViewerSidebarProps {
  skillId: string;
  onClose: () => void;
}

export const ResourceViewerSidebar = ({
  skillId,
  onClose
}: ResourceViewerSidebarProps) => {
  const { data, loading } = useResources({ skills: [skillId] });
  const resources = data?.resourceCollection?.edges?.map(edge => edge.node) || [];
  
  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        bgcolor: 'background.paper'
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" component="h2" sx={{ fontSize: '1.1rem' }}>
          Resources
          <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
            {resources.length} found
          </Typography>
        </Typography>
        <IconButton onClick={onClose} edge="end" aria-label="close" size="small">
          <Close />
        </IconButton>
      </Box>
      
      {/* Resource Viewer Content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <ResourceViewer skillId={skillId} />
      </Box>
    </Box>
  );
}; 