'use client';
import React from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import useIsSmallDevice from '@/clientOnly/hooks/useIsSmallDevice';
import { ReasonoteBetaIcon } from '@/components/icons/FavIcon';
import {
  GitHub,
  NorthEast,
  Star,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

// GitHub Star Button Component
const GitHubStarButton = () => {
  const theme = useTheme();
  const isSmallDevice = useIsSmallDevice();
  const [starCount, setStarCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    // Fetch GitHub stars count
    const fetchStars = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/reasonote/reasonote');
        const data = await response.json();
        if (data && data.stargazers_count) {
          setStarCount(data.stargazers_count);
        }
      } catch (error) {
        console.error('Error fetching GitHub stars:', error);
        // Fallback to a default value
        setStarCount(100);
      }
    };

    fetchStars();
  }, []);

  const formattedStarCount = starCount ? starCount.toLocaleString() : '...';

  // Just show icon on mobile
  if (isSmallDevice) {
    return (
      <Tooltip title="View on GitHub">
        <Button
          variant="text"
          size="small"
          color="inherit"
          onClick={() => window.open('https://github.com/reasonote/reasonote', '_blank')}
          sx={{
            minWidth: '36px',
            width: '36px',
            height: '36px',
            p: 0,
            color: theme.palette.text.secondary,
            '&:hover': {
              color: theme.palette.primary.main,
            },
          }}
        >
          <GitHub fontSize="small" />
        </Button>
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Star us on GitHub">
      <Button
        variant="outlined"
        size="small"
        color="inherit"
        onClick={() => window.open('https://github.com/reasonote/reasonote', '_blank')}
        startIcon={<GitHub fontSize="small" />}
        endIcon={
          starCount !== null && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ display: 'inline-flex' }}>
              <Star fontSize="small" sx={{ fontSize: '0.9rem', display: 'flex' }} />
              <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>{formattedStarCount}</Box>
            </Stack>
          )
        }
        sx={{
          borderRadius: '8px',
          textTransform: 'none',
          color: theme.palette.text.secondary,
          borderColor: theme.palette.divider,
          '&:hover': {
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
          },
          height: '36px',
        }}
      >
        {starCount === null && 'GitHub'}
      </Button>
    </Tooltip>
  );
};

export function BlogHeader() {
  const theme = useTheme();
  const router = useRouter();
  const isSmallDevice = useIsSmallDevice();

  return (
    <AppBar 
      position="static" 
      elevation={0} 
      sx={{ 
        bgcolor: 'background.paper', 
        borderBottom: `1px solid ${theme.palette.divider}`
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between', px: 0, py: isSmallDevice ? 0.5 : 1 }}>
          <Stack direction="row" spacing={isSmallDevice ? 1 : 2} alignItems="center">
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <ReasonoteBetaIcon size={isSmallDevice ? 24 : 30} />
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  ml: isSmallDevice ? 0.5 : 1, 
                  fontWeight: 'bold',
                  color: theme.palette.text.primary,
                  fontSize: isSmallDevice ? '0.9rem' : undefined
                }}
              >
                Reasonote
              </Typography>
            </Link>
            <Link href="/blog" style={{ textDecoration: 'none' }}>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 'normal',
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                  fontSize: isSmallDevice ? '0.9rem' : undefined
                }}
              >
                Blog
              </Typography>
            </Link>
          </Stack>

          <Stack direction="row" spacing={isSmallDevice ? 1 : 2} alignItems="center">
            <GitHubStarButton />
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => router.push('/app')}
              startIcon={<NorthEast height={isSmallDevice ? 16 : 20} width={isSmallDevice ? 16 : 20} />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                px: isSmallDevice ? 1.5 : 3,
                py: isSmallDevice ? 0.5 : undefined,
                minWidth: isSmallDevice ? '60px' : '100px',
                fontSize: isSmallDevice ? '0.85rem' : '1rem',
              }}
            >
              {isSmallDevice ? 'App' : 'Go to App'}
            </Button>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
} 