'use client'

import {
  useEffect,
  useState,
} from "react";

import {useRouter} from "next/navigation";

import {
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";

import {ToolTabLayout} from "../ToolTabLayout";
import {ToolTabRendererProps} from "../ToolTabsInterface";

export const VideoTabRenderer = ({ 
  skillId,
  skillTree,
  loading,
  error 
}: ToolTabRendererProps) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    if (skillTree && skillId) {
      // Find the current skill node in the tree
      const findSkill = (nodes: any[], id: string): any | null => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findSkill(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const currentSkill = findSkill(Array.isArray(skillTree) ? skillTree : [skillTree], skillId);
      
      if (currentSkill) {
        setTitle(currentSkill.name || 'Video Resource');
        
        // Find video resources associated with this skill
        // This is a placeholder - implement according to your data structure
        const videoResource = currentSkill.resources?.find((r: any) => 
          r.childSnip?.sourceUrl?.includes('youtube.com') || 
          r.childSnip?.sourceUrl?.includes('youtu.be')
        );
        
        if (videoResource?.childSnip?.sourceUrl) {
          // Extract YouTube ID from the URL
          let videoId = '';
          const url = videoResource.childSnip.sourceUrl;
          
          if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1]?.split('&')[0] || '';
          } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
          } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('embed/')[1]?.split('?')[0] || '';
          }
          
          if (videoId) {
            setVideoUrl(`https://www.youtube.com/embed/${videoId}`);
          } else {
            setVideoUrl(url); // Use as is if we couldn't parse it
          }
        } else {
          setVideoUrl(null);
        }
      }
    }
  }, [skillId, skillTree]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error loading videos: {error.message}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>{title}</Typography>
      
      {videoUrl ? (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <Box
            component="iframe"
            src={videoUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sx={{ 
              width: '100%', 
              height: '100%', 
              minHeight: '400px',
              borderRadius: 1
            }}
          />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography color="text.secondary">No video available for this skill</Typography>
        </Box>
      )}
    </Box>
  );
};

export const VideoTab = ({ skillId }: { skillId: string }) => (
  <ToolTabLayout skillId={skillId}>
    {(props: ToolTabRendererProps) => <VideoTabRenderer {...props} />}
  </ToolTabLayout>
); 