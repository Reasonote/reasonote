"use client";
import React from "react";

import {motion} from "framer-motion";
import {Code} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import type {UseCase} from "@/components/tools/UseCasesSection";
import UseCasesSection from "@/components/tools/UseCasesSection";
import {Txt} from "@/components/typography/Txt";
import {
  GitHub,
  NorthEast,
  Star,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

import {Footer} from "../components/footer/Footer";
import {ReasonoteBetaIcon} from "../components/icons/FavIcon";

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

// Use Case component
interface UseCaseProps {
  title: string;
  description: React.ReactNode;
  icon: React.ReactNode;
}

function UseCase({ title, description, icon }: UseCaseProps) {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <Card
        sx={{
          p: 4,
          borderRadius: 2,
          height: '100%',
          border: `1px solid ${theme.palette.divider}`,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <Stack spacing={2}>
          <Box
            sx={{
              color: theme.palette.primary.main,
              fontSize: 32,
              mb: 1,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h5" component="h3" fontWeight="bold">
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
        </Stack>
      </Card>
    </motion.div>
  );
}

// Video component that plays based on external active state
const VideoEmbed = ({ 
  videoSrc,
  isActive = false,
  currentActiveIndex
}: { 
  videoSrc: string;
  isActive?: boolean;
  currentActiveIndex: number;
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  // Set playback rate once loaded
  const handleVideoLoaded = React.useCallback(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.5;
      setIsLoaded(true);
    }
  }, []);
  
  // Play/pause the video based on active state
  React.useEffect(() => {
    if (!videoRef.current || !isLoaded) return;
    
    // Only play if this video is the active one and currentActiveIndex isn't -1 (no active video)
    if (isActive && currentActiveIndex !== -1) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing video:", error);
        });
      }
    } else {
      // Always pause and reset non-active videos
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive, isLoaded, currentActiveIndex]);
  
  return (
    <video 
      ref={videoRef}
      src={videoSrc}
      muted
      loop
      playsInline
      preload="auto"
      onLoadedData={handleVideoLoaded}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "8px",
      }}
    />
  );
};

// Creating a type for our internal use cases with the function pattern
interface CustomUseCase {
  title: string;
  description: React.ReactNode;
  imageRenderer: (index: number, activeIndex: number) => React.ReactNode;
}

// Modified custom use cases using our internal type
const internalUseCases: CustomUseCase[] = [
  {
    title: "Upload Document",
    description: "Simply drop a pdf or text file. Reasonote will automatically extract the knowledge and allow you to interact with it. You can think of this as an open-source version of NotebookLM.",
    imageRenderer: (index: number, activeIndex: number) => (
      <VideoEmbed 
        videoSrc="https://qqlmpugonlnzzzgdhtfj.supabase.co/storage/v1/object/public/public-images//document-upload.mp4" 
        isActive={index === activeIndex}
        currentActiveIndex={activeIndex}
      />
    )
  },
  {
    title: "Build a knowledge graph",
    description: "Reasonote automatically builds a knowledge graph from the document, extracting all of the relationships between the different concepts in the document. It then uses this graph to build a personalized study plan for you.",
    imageRenderer: (index: number, activeIndex: number) => (
      <VideoEmbed 
        videoSrc="https://qqlmpugonlnzzzgdhtfj.supabase.co/storage/v1/object/public/public-images//knowledge-graph.mp4" 
        isActive={index === activeIndex}
        currentActiveIndex={activeIndex}
      />
    )
  },
  {
    title: "Interactive Lessons",
    description: "Reasonote creates interactive bite-sized lessons for you to master the material. Since the lessons are 10-20 minutes long, you can squeeze them into your busy schedule.",
    imageRenderer: (index: number, activeIndex: number) => (
      <VideoEmbed 
        videoSrc="https://qqlmpugonlnzzzgdhtfj.supabase.co/storage/v1/object/public/public-images//interactive-lesson.mp4" 
        isActive={index === activeIndex}
        currentActiveIndex={activeIndex}
      />
    )
  },
  {
    title: "Practice Activities",
    description: "Want to practice what you've learned? Reasonote creates practice activities for you to master the material. With citations to the original source, you can see the connections between the material and the original source.",
    imageRenderer: (index: number, activeIndex: number) => (
      <VideoEmbed 
        videoSrc="https://qqlmpugonlnzzzgdhtfj.supabase.co/storage/v1/object/public/public-images//practice-activities.mp4" 
        isActive={index === activeIndex}
        currentActiveIndex={activeIndex}
      />
    )
  }
];

// Instructions to add at the top of the file as a comment for future reference
// Note: Add your MP4 videos to the public/videos directory with the following names:
// - document-upload.mp4
// - knowledge-graph.mp4
// - interactive-quizzes.mp4
// 
// Optionally, add poster images (video thumbnails) to display before video play:
// - document-upload-poster.jpg
// - knowledge-graph-poster.jpg
// - interactive-quizzes-poster.jpg

// Custom component that wraps UseCasesSection to handle activeIndex
function CustomUseCasesSection() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const isSmallDevice = useIsSmallDevice();
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const [observerSetup, setObserverSetup] = React.useState(false);

  // Initial mounting effects
  React.useEffect(() => {
    // Force an initial run of the observer setup after component mounts
    setTimeout(() => {
      setObserverSetup(true);
    }, 500);
  }, []);

  // A callback that will be called by UseCasesSection when an item becomes visible
  const onVisibleItemChange = React.useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // Process internalUseCases to create proper UseCase objects
  const processedUseCases: UseCase[] = internalUseCases.map((useCase, index) => ({
    title: useCase.title,
    description: useCase.description,
    image: useCase.imageRenderer(index, activeIndex)
  }));

  // Handle mobile IntersectionObserver setup
  React.useEffect(() => {
    if (!isSmallDevice || !observerSetup) return;
    
    const setupObserver = () => {
      // Clean up any existing observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Create a simplified IntersectionObserver for mobile
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            const sectionEl = entry.target as HTMLElement;
            const indexStr = sectionEl.getAttribute('data-screenshot')?.split('-')[1];
            
            if (!indexStr) return;
            
            const index = parseInt(indexStr, 10);
            
            // If the element is fully visible (100% intersection), make it active
            if (entry.intersectionRatio === 1) {
              if (index !== activeIndex) {
                setActiveIndex(index);
              }
            } 
            // If this was the active element but is now partially hidden, find another to make active
            else if (index === activeIndex) {
              // Find the first fully visible element
              const allSections = document.querySelectorAll('[data-screenshot]');
              let newActiveIndex = -1;
              
              for (let i = 0; i < allSections.length; i++) {
                const section = allSections[i];
                const sectionIndex = parseInt(section.getAttribute('data-screenshot')?.split('-')[1] || '-1', 10);
                
                const rect = section.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                
                // Check if the element is fully visible
                if (rect.top >= 0 && rect.bottom <= windowHeight) {
                  newActiveIndex = sectionIndex;
                  break;
                }
              }
              
              // If we found a new fully visible element, make it active
              if (newActiveIndex !== -1 && newActiveIndex !== activeIndex) {
                setActiveIndex(newActiveIndex);
              }
              // If no element is fully visible, set no active element (-1)
              else if (newActiveIndex === -1) {
                setActiveIndex(-1);
              }
            }
          });
        },
        {
          threshold: [1.0], // Only trigger when element is 100% visible
          rootMargin: '0px'
        }
      );

      // Target all screenshot elements for observation
      const screenshots = document.querySelectorAll('[data-screenshot]');
      if (screenshots.length > 0) {
        screenshots.forEach(item => {
          if (observerRef.current) {
            observerRef.current.observe(item);
          }
        });
      } else {
        // If no elements found yet, try again after a short delay
        setTimeout(setupObserver, 200);
      }
    };

    // Initial setup
    setupObserver();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [isSmallDevice, activeIndex, observerSetup]);

  // Desktop visibility handling
  React.useEffect(() => {
    if (isSmallDevice) return;

    // Desktop behavior
    const handleVisibilityChange = () => {
      // Wait for DOM to update
      setTimeout(() => {
        // Get all screenshot elements
        const sections = Array.from(document.querySelectorAll('[data-screenshot]'));
        if (sections.length === 0) return;

        // Calculate visibility scores for each section
        const visibilityScores = sections.map((section, index) => {
          const rect = section.getBoundingClientRect();
          const windowHeight = window.innerHeight;

          // Skip if completely out of view
          if (rect.bottom <= 0 || rect.top >= windowHeight) {
            return { index, score: 0 };
          }

          // Calculate what percentage of the element is visible
          const visibleTop = Math.max(0, rect.top);
          const visibleBottom = Math.min(windowHeight, rect.bottom);
          const visibleHeight = visibleBottom - visibleTop;
          const visibilityPercentage = (visibleHeight / rect.height) * 100;

          // Calculate how centered the element is (0-1, with 1 being perfectly centered)
          const elementCenter = rect.top + rect.height / 2;
          const windowCenter = windowHeight / 2;
          const distanceFromCenter = Math.abs(elementCenter - windowCenter);
          const maxDistance = windowHeight / 2;
          const centeringScore = 1 - (distanceFromCenter / maxDistance);

          // Combined score - weight visibility more than centering
          const combinedScore = (visibilityPercentage * 0.7) + (centeringScore * 100 * 0.3);

          return { index, score: combinedScore };
        });

        // Find the section with the highest visibility score
        const highestScore = visibilityScores.reduce((highest, current) =>
          current.score > highest.score ? current : highest,
          { index: -1, score: -1 }
        );

        // Only update if we have a valid section and it's different from current
        if (highestScore.index !== -1 && highestScore.index !== activeIndex) {
          setActiveIndex(highestScore.index);
        }
      }, 10);
    };

    // Initial check
    handleVisibilityChange();

    // Add scroll event listener
    window.addEventListener('scroll', handleVisibilityChange, { passive: true });

    // Set up a timer to periodically check for visibility
    const intervalId = setInterval(handleVisibilityChange, 200);

    // Clean up
    return () => {
      window.removeEventListener('scroll', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [activeIndex, isSmallDevice]);

  return (
    <UseCasesSection 
      useCases={processedUseCases} 
      onVisibleItemChange={onVisibleItemChange}
      activeIndex={activeIndex}
    />
  );
}

export default function LandingPage() {
  const theme = useTheme();
  const isSmallDevice = useIsSmallDevice();
  const router = useRouter();

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(8px)',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            py={isSmallDevice ? 1 : 1.5}
          >
            <Link href="/" style={{ textDecoration: "none" }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ReasonoteBetaIcon size={isSmallDevice ? 24 : 30} />
                <Typography
                  variant="h6"
                  component="span"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    letterSpacing: '0.5px',
                    fontSize: isSmallDevice ? '0.9rem' : '1.25rem',
                  }}
                >
                  Reasonote
                </Typography>
              </Stack>
            </Link>
            <Stack direction="row" spacing={isSmallDevice ? 1 : 2} alignItems="center">
              <GitHubStarButton />
              <Link href="/blog" style={{ textDecoration: "none" }}>
                <Typography
                  variant="body1"
                  component="span"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    '&:hover': {
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  Blog
                </Typography>
              </Link>
              <Button
                variant="contained"
                size="medium"
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
          </Stack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 4, md: 10 },
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="lg">
          <Stack alignItems="center" spacing={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ width: '100%', textAlign: 'center' }}
            >
              <Stack spacing={4} alignItems="center" sx={{ mx: 'auto', width: '100%', maxWidth: '48rem' }}>
                <Stack spacing={0} alignItems="center" width="100%">
                  <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                      fontSize: { xs: '3.5rem', sm: '4.5rem', md: '5.5rem' },
                      fontWeight: 400,
                      lineHeight: 1,
                      mb: 1.5,
                      width: '100%',
                      textAlign: 'center',
                    }}
                  >
                    Your Highway to
                  </Typography>
                  <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                      fontSize: { xs: '3.5rem', sm: '4.5rem', md: '5.5rem' },
                      fontWeight: 400,
                      lineHeight: 1,
                      mb: 0,
                      background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.primary.main} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      color: 'transparent',
                      textShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                      width: '100%',
                      textAlign: 'center',
                    }}
                  >
                    Deep Expertise
                  </Typography>
                </Stack>

                <Txt
                  variant="h5"
                  component="h2"
                  color="text.secondary"
                  sx={{
                    mx: 'auto',
                    fontWeight: 400,
                    lineHeight: 1.5,
                    mt: 5,
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  Reasonote is the hub for mastering the information you value most. It's built on{' '}
                  <Box 
                    component="a" 
                    href="https://github.com/reasonote/reasonote" 
                    target="_blank"
                    sx={{ 
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      borderBottom: `1px dotted ${theme.palette.primary.main}`,
                      '&:hover': {
                        borderBottom: `1px solid ${theme.palette.primary.main}`,
                      }
                    }}
                  >
                    open‑source
                  </Box>{' '}
                  foundations, so you can see under the hood and make it your own.
                </Txt>
              </Stack>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                variant="contained"
                size="large"
                color="primary"
                onClick={() => router.push('/app')}
                startIcon={<NorthEast height={20} width={20} />}
                sx={{
                  py: 1.5,
                  px: 4,
                  fontSize: '1.1rem',
                  borderRadius: '28px',
                  textTransform: 'none',
                }}
              >
                Try Reasonote
              </Button>
            </motion.div>

            <Txt
              variant="h3"
              component="h3"
              color="text.primary"
              sx={{
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.5,
                mt: 5,
                textAlign: 'center',
                width: '100%'
              }}
            >
              Your personal AI learning assistant.
            </Txt>
          </Stack>
        </Container>
      </Box>

      {/* How It Works Section - with embedded videos */}
      <CustomUseCasesSection />

      {/* Open Source & Data Ownership */}
      <Container maxWidth="lg">
        <Box
          sx={{
            py: { xs: 2, md: 4 },
            px: { xs: 3, md: 6 },
            borderRadius: 4,
            bgcolor: 'background.default',
            my: isSmallDevice ? 4 : 8,
          }}
        >
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={4}>
                <Typography variant="h3" fontWeight="700" color="primary.main">
                  Own Your Learning Data
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                  Reasonote is open source, giving you full transparency into how your learning data is processed.
                  Since we are open source, you can host your own instance of Reasonote, so your knowledge stays yours.
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                  <strong>For businesses:</strong> Looking to implement Reasonote in your organization or integrate with your existing tools?
                  Contact us for custom deployment options, enterprise support, and integration services tailored to your needs.
                </Typography>
                <Box>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="large"
                      component="a"
                      href="mailto:info@reasonote.com"
                      sx={{
                        mt: 2,
                        width: 'fit-content',
                        fontWeight: 600,
                        borderWidth: 2,
                        textDecoration: 'none',
                        '&:hover': {
                          borderWidth: 2
                        }
                      }}
                    >
                      Contact for Business Inquiries
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: { xs: 1, sm: 2 } }}>
                      Email us at: <Box component="span" sx={{ fontWeight: 'medium', color: 'primary.main' }}>info@reasonote.com</Box>
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 3
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <Code size={180} color={theme.palette.primary.main} strokeWidth={1} />
                </motion.div>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Open Source Contribution */}
      <Box
        sx={{
          py: 2,
          mt: 4,
          textAlign: 'center',
          bgcolor: 'background.default'
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={3} alignItems="center">
            <Typography variant="h4" fontWeight="bold">
              Any feature you want to see? Join the open source community
            </Typography>

            <Typography variant="body1" sx={{ fontSize: '1.1rem', maxWidth: '650px', mx: 'auto' }}>
              Reasonote is built and maintained by a community of developers who believe in transparent and accessible education technology.
              We welcome contributions of all kinds, be it code, documentation, feature requests, or bug reports.
            </Typography>

            <Button
              variant="outlined"
              color="primary"
              size="large"
              startIcon={<GitHub height={20} width={20} />}
              onClick={() => window.open('https://github.com/reasonote/reasonote', '_blank')}
              sx={{
                fontWeight: 600,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2
                }
              }}
            >
              GitHub Repository
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Final CTA */}
      <Container maxWidth="md" sx={{ py: isSmallDevice ? 4 : 8 }}>
        <Card
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 4,
            boxShadow: theme.shadows[10],
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Typography
              variant="h3"
              component="h3"
              sx={{ fontWeight: 'bold', mb: 2, fontSize: isSmallDevice ? '2rem' : '2.5rem' }}
            >
              Master the information you value most.
            </Typography>
            <Button
              variant="contained"
              size="medium"
              color="primary"
              onClick={() => router.push('/app')}
              startIcon={<NorthEast height={20} width={20} />}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                borderRadius: '28px',
                textTransform: 'none',
              }}
            >
              Try Reasonote
            </Button>
          </motion.div>
        </Card>
      </Container>

      <Footer />
    </Box>
  );
} 