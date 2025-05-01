'use client';
import {BlogHeader} from "@/components/blog/BlogHeader";
import {
  Box,
  Paper,
} from "@mui/material";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <Paper 
      sx={{
        padding: 0,
        borderRadius: 0,
        height: '100%',
        overflow: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <BlogHeader />
        <Box component="main" sx={{ flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Paper>
  );
}