'use client';
import React from "react";

import {useRouter} from "next/navigation";

import {BlogSubscribe} from "@/components/blog/BlogSubscribe";
import {Txt} from "@/components/typography/Txt";
import {ArrowForward} from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

// Blog post data
const blogPosts = [
  {
    id: 'open-sourcing-reasonote',
    title: 'Open-Sourcing Reasonote',
    description: 'Convert any content into an adaptive course -- open source, graph‑aware, and extensible.',
    date: 'May 2023',
    slug: '/blog/open-sourcing-reasonote'
  },
  // Add more blog posts as they become available
];

export default function BlogPage() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 8 }}>
      {/* <Txt variant="h3" sx={{ mb: 4, fontWeight: 'bold', textAlign: 'center' }}>
        Reasonote Blog
      </Txt>
      */}
      <Grid container spacing={4}>
        {blogPosts.map((post) => (
          <Grid item xs={12} md={6} key={post.id}>
            <Card 
              variant="outlined" 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                  cursor: 'pointer'
                },
              }}
              onClick={() => router.push(post.slug)}
            >
              <CardActionArea 
                component="div"
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'stretch',
                  height: '100%'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ mb: 1, display: 'block' }}
                  >
                    {post.date}
                  </Typography>
                  <Typography variant="h5" component="h2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {post.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {post.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
                  <Typography 
                    variant="button" 
                    color="primary"
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontWeight: 500 
                    }}
                  >
                    Read more
                    <ArrowForward sx={{ ml: 1, fontSize: '1rem' }} />
                  </Typography>
                </CardActions>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Subscribe component at the bottom */}
      <Box sx={{ mt: 8, mb: 4 }}>
        <Divider sx={{ mb: 6 }} />
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Txt variant="h4" fontWeight="bold">
            Never Miss an Update
          </Txt>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
            Subscribe to our newsletter to receive the latest updates on Reasonote, educational technology trends, and tips for more effective learning.
          </Typography>
          <Box sx={{display: 'flex', maxWidth: 500, width: '100%', mt: 2, mx: 'auto', alignItems: 'center', justifyContent: 'center' }}>
            <BlogSubscribe 
              variant="compact"
              title=""
              description=""
              buttonText="Subscribe Now"
            />
          </Box>
        </Stack>
      </Box>
    </Container>
  );
}