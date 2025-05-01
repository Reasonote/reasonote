"use client";

import React from "react";

import {motion} from "framer-motion";
import {useRouter} from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {AccountTree as GraphIcon} from "@mui/icons-material";
import DocumentScannerIcon from "@mui/icons-material/DocumentScanner";
import {
  Box,
  Card,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

export default function ToolsIndexPage() {
  const router = useRouter();
  const isSmallDevice = useIsSmallDevice();

  const tools = [
    {
      id: "knowledge-graph",
      name: "Knowledge Graph Explorer",
      description: "Visualize and explore knowledge graphs for any topic",
      icon: <GraphIcon sx={{ fontSize: { xs: 48, sm: 56 }, color: 'primary.main' }} />,
      path: "/app/tools/knowledge-graph"
    },
    {
      id: "documentor",
      name: "DocuMentor",
      description: "Create personalized study plans for any document",
      icon: <DocumentScannerIcon sx={{ fontSize: { xs: 48, sm: 56 }, color: 'primary.main' }} />,
      path: "/app/tools/documentor"
    }
  ];

  return (
    <Stack spacing={6} padding={isSmallDevice ? 2 : 4} alignItems="center" sx={{ maxWidth: '48rem', margin: '0 auto' }}>
      <Stack spacing={3} alignItems="center" textAlign="center" sx={{ maxWidth: '42rem' }}>
        <Typography variant="h4" component="h1">
          Learning Tools
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            maxWidth: '36rem'
          }}
        >
          Explore our collection of learning tools to enhance your knowledge journey
        </Typography>
      </Stack>

      <Box sx={{ width: '100%' }}>
        <Grid
          container
          spacing={3}
        >
          {tools.map((tool) => (
            <Grid
              item
              xs={12}
              sm={6}
              key={tool.id}
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%' }}
              >
                <Card
                  sx={{
                    height: '100%',
                    minHeight: { sm: 200 },
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    boxShadow: 3,
                    ":hover": {
                      cursor: 'pointer',
                    }
                  }}
                  onClick={() => router.push(tool.path)}
                >
                    <Stack
                      spacing={2}
                      padding={2}
                      alignItems="center"
                      justifyContent="center"
                      sx={{ height: '100%' }}
                    >
                      <Box
                        sx={{
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {tool.icon}
                      </Box>
                      <Typography
                        variant={isSmallDevice ? "h6" : "h5"}
                        align="center"
                        sx={{ mb: 1 }}
                      >
                        {tool.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                        sx={{
                          maxWidth: '90%',
                          lineHeight: 1.6
                        }}
                      >
                        {tool.description}
                      </Typography>
                    </Stack>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Stack>
  );
} 