"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  FillSubskillTreeRoute,
} from "@/app/api/skills/fill_subskill_tree/routeSchema";
import {useToken} from "@/clientOnly/hooks/useToken";
import {SkillChip} from "@/components/chips/SkillChip/SkillChip";
import FractalTreeLoading from "@/components/icons/FractalTreeLoading";
import {BackToToolsButton} from "@/components/navigation/BackToToolsButton";
import {SkillTreeV2} from "@/components/skill/SkillTreeV2/SkillTreeV2";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Search as SearchIcon} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {typedUuidV4} from "@reasonote/lib-utils";
import {useStateWithRef} from "@reasonote/lib-utils-frontend";

export default function KnowledgeGraphPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [skillId, setSkillId] = useState<string | undefined>(undefined);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [processingSkills, setProcessingSkills, processingSkillsRef] = useStateWithRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const { token } = useToken();
  const { supabase } = useSupabase();
  const searchParams = useSearchParams();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Handle skillId query parameter
  useEffect(() => {
    const loadSkillFromQueryParam = async () => {
      const skillIdParam = searchParams?.get('skillId');

      if (skillIdParam && !initialLoadComplete) {
        // Check if we're already processing this skill
        if (processingSkillsRef.current && processingSkillsRef.current.has(skillIdParam)) {
          return;
        }

        // Mark this skill as being processed
        setProcessingSkills(prev => {
          const next = new Set(prev);
          next.add(skillIdParam);
          return next;
        });

        setIsSearching(true);

        try {
          // Check if the skill exists
          const { data: skillData, error: skillError } = await supabase
            .from('skill')
            .select('id, _name')
            .eq('id', skillIdParam)
            .single();

          if (skillError) {
            console.error("Error fetching skill:", skillError);
            setError("Skill not found. Please try another search.");
            setIsSearching(false);
            setInitialLoadComplete(true);
            return;
          }

          // Set the search term to the skill name
          setSearchTerm(skillData._name);

          // Check if the skill has sub-nodes
          const { data: treeData, error: treeError } = await supabase.rpc('get_linked_skills', {
            input_skill_id: skillIdParam,
            user_id: '',
            direction: 'upstream'
          });

          if (treeError) {
            console.error("Error checking skill tree:", treeError);
            setError("Failed to check skill tree. Please try again.");
            setIsSearching(false);
            setInitialLoadComplete(true);
            return;
          }

          // Find the skill in the tree data
          const skillInTree = treeData?.find(sk => sk.skill_id === skillIdParam);
          const hasSubNodes = skillInTree?.skill_links && skillInTree.skill_links.length > 0;

          // If the skill doesn't have sub-nodes, generate them
          if (!hasSubNodes) {
            const response = await FillSubskillTreeRoute.call({
              skill: {
                id: skillIdParam,
                parentSkillIds: [],
                rootSkillId: null,
              },
              maxDepth: 2,
              extraContext: [
                {
                  title: "SearchTerm",
                  description: "The search term used to generate the skill tree",
                  body: skillData._name,
                }
              ],
            });

            if (response.error) {
              console.error("Error generating skill tree:", response.error);
              setError("Failed to generate knowledge graph. Please try again.");
              setIsSearching(false);
              setInitialLoadComplete(true);
              return;
            }
          }

          // Set the skill ID to display the generated tree
          setSkillId(skillIdParam);
          setHasSearched(true);
          setIsSearching(false);
          setInitialLoadComplete(true);
        } catch (err) {
          console.error("Error processing skill from query parameter:", err);
          setError("Failed to load knowledge graph. Please try again.");
          setIsSearching(false);
          setInitialLoadComplete(true);
        } finally {
          // Remove this skill from the processing set
          setProcessingSkills(prev => {
            const next = new Set(prev);
            next.delete(skillIdParam);
            return next;
          });
        }
      } else if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
    };

    loadSkillFromQueryParam();
  }, [searchParams, supabase, initialLoadComplete, setProcessingSkills, processingSkillsRef]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);

    // Generate a UUID for the new skill
    const newSkillId = typedUuidV4('skill');

    try {
      // Check if we're already processing this skill
      if (processingSkillsRef.current && processingSkillsRef.current.has(newSkillId)) {
        return;
      }

      // Mark this skill as being processed
      setProcessingSkills(prev => {
        const next = new Set(prev);
        next.add(newSkillId);
        return next;
      });

      // First, create the skill in the database
      const { data: skillData, error: skillError } = await supabase
        .from('skill')
        .insert({
          id: newSkillId,
          _name: searchTerm,
          metadata: {
            genData: {
              topicName: searchTerm,
            }
          }
        })
        .select('id')
        .single();

      if (skillError) {
        console.error("Error creating skill:", skillError);
        setError("Failed to create skill. Please try again.");
        setIsSearching(false);
        return;
      }

      // Now call the FillSubskillTreeRoute API to generate the skill tree
      const response = await FillSubskillTreeRoute.call({
        skill: {
          id: newSkillId,
          parentSkillIds: [],
          rootSkillId: null,
        },
        maxDepth: 2,
        extraContext: [
          {
            title: "SearchTerm",
            description: "The search term used to generate the skill tree",
            body: searchTerm,
          }
        ],
      });

      if (response.error) {
        console.error("Error generating skill tree:", response.error);
        setError("Failed to generate knowledge graph. Please try again.");
        setIsSearching(false);
        return;
      }

      // Set the skill ID to display the generated tree
      setSkillId(newSkillId);
      setHasSearched(true);
      setIsSearching(false);

      // Update the URL with the skillId parameter without triggering a page reload
      const url = new URL(window.location.href);
      url.searchParams.set('skillId', newSkillId);
      router.push(url.pathname + url.search, { scroll: false });

      // For better sharing, also update the URL to use the path parameter format
      // This will be picked up by social media platforms for OG images
      setTimeout(() => {
        router.replace(`/app/tools/knowledge-graph/${newSkillId}`, { scroll: false });
      }, 100);
    } catch (err) {
      console.error("Error generating skill tree:", err);
      setError("Failed to generate knowledge graph. Please try again.");
      setIsSearching(false);
    } finally {
      // Remove this skill from the processing set
      setProcessingSkills(prev => {
        const next = new Set(prev);
        next.delete(newSkillId);
        return next;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleReset = () => {
    setSearchTerm("");
    setHasSearched(false);
    setSkillId(undefined);
    setError(null);

    // Remove the skillId parameter from the URL without triggering a page reload
    const url = new URL(window.location.href);
    url.searchParams.delete('skillId');
    router.push(url.pathname + url.search, { scroll: false });
  };

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key to exit fullscreen
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }

      // F key to toggle fullscreen
      if (event.key === 'f' && !isSearching && hasSearched) {
        toggleFullscreen();
      }

      // N key to start a new search when in graph view
      if (event.key === 'n' && !isSearching && hasSearched) {
        handleReset();
      }

      // Enter key to submit search when focused on search field
      if (event.key === 'Enter' && document.activeElement?.tagName === 'INPUT') {
        handleSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, isSearching, hasSearched]);

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        height: 'calc(100vh - 64px)',
        width: '100vw',
        padding: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <BackToToolsButton />

      {hasSearched && !isSearching && skillId && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ 
            position: 'absolute',
            top: 10,
            left: 72,
            zIndex: 20,
          }}
        >
          <SkillChip 
            topicOrId={skillId}
            size="medium"
            disableAddDelete
            disableLevelIndicator
            disableModal
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.9rem' },
              height: 'auto',
              padding: { xs: '4px 8px', sm: '6px 12px' },
              bgcolor: 'background.default',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderRadius: '16px',
              opacity: 0.9,
            }}
          />
        </motion.div>
      )}

      {/* Keyboard shortcuts dialog */}
      <Dialog
        open={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        aria-labelledby="keyboard-shortcuts-dialog-title"
      >
        <DialogTitle id="keyboard-shortcuts-dialog-title">
          Keyboard Shortcuts
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">F</Typography>
              <Typography variant="body2">Toggle fullscreen mode</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">N</Typography>
              <Typography variant="body2">Start a new search</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">Esc</Typography>
              <Typography variant="body2">Exit fullscreen mode</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">Enter</Typography>
              <Typography variant="body2">Submit search when typing</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowKeyboardShortcuts(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Stack
        ref={containerRef}
        sx={{
          height: '100%',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'manipulation',
        }}
      >
        <AnimatePresence>
          {!hasSearched && !isSearching ? (
            <motion.div
              key="search-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                <Box sx={{ width: '45px', height: '45px', display: 'flex', alignItems: 'center' }}>
                  <FractalTreeLoading color={theme.palette.primary.main} maxDepth={5} numCycles={1} />
                </Box>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  Knowledge Graph Explorer
                </Typography>
              </Stack>
              <Typography variant="body1" gutterBottom align="center">
                Enter a topic to visualize its knowledge graph
              </Typography>

              <Box sx={{
                my: 5,
                width: isMobile ? '90%' : '60%',  // Match search card width
                maxWidth: '600px',                // Match search card maxWidth
                mx: 'auto'
              }}>
                <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center' }}>
                  Suggested topics:
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { name: "JavaScript", emoji: "💻" },
                    { name: "Machine Learning", emoji: "🤖" },
                    { name: "Biology", emoji: "🧬" },
                    { name: "World History", emoji: "🌍" }
                  ].map((topic) => (
                    <Grid item xs={6} sm={6} key={topic.name}>
                      <Card
                        onClick={() => setSearchTerm(topic.name)}
                        sx={{
                          borderRadius: 2,
                          height: '70px',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: 0.9,
                          '&:hover': {
                            opacity: 1,
                            transform: 'scale(1.02)',
                            boxShadow: theme.shadows[3],
                          }
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{
                            width: '100%',
                            px: 2,
                          }}
                        >
                          <span role="img" aria-label={topic.name} style={{ fontSize: '1.2rem' }}>
                            {topic.emoji}
                          </span>
                          <Typography variant="body2">
                            {topic.name}
                          </Typography>
                        </Stack>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  width: isMobile ? '90%' : '60%',
                  maxWidth: '600px',
                }}
              >
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Enter a topic or skill"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isSearching}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    error={!!error}
                    helperText={error}
                  />

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSearch}
                    disabled={isSearching || !searchTerm.trim()}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    {isSearching ? "Generating Graph..." : "Explore Knowledge Graph"}
                  </Button>
                </Stack>
              </Paper>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {isSearching && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <Box sx={{ width: '200px', height: '200px', mb: 3 }}>
                <FractalTreeLoading color={theme.palette.primary.main} maxDepth={5} />
              </Box>
              <Typography variant="h6" align="center" fontWeight="bold">
                Generating Knowledge Graph
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                This may take a minute as we build a comprehensive graph for "{searchTerm}"
              </Typography>

              {/* SkillChip for the loading topic */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: 2,
                animation: 'pulse 2s infinite ease-in-out',
                '@keyframes pulse': {
                  '0%': { opacity: 0.7 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.7 },
                }
              }}>
                <SkillChip
                  topicOrId={searchTerm}
                  size="medium"
                  disableAddDelete
                  disableLevelIndicator
                  disableModal
                  createAutoEmoji
                  sx={{
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    height: 'auto',
                    padding: { xs: '8px 16px', sm: '10px 20px' },
                    bgcolor: theme.palette.background.paper,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                    borderRadius: '20px',
                    opacity: 0.9,
                    transform: 'scale(1.1)',
                  }}
                />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hasSearched && !isSearching && skillId && (
            <motion.div
              key="graph-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                zIndex: 10,
              }}
            >
              <SkillTreeV2
                skillId={skillId}
                variant="graph"
                containerRef={containerRef}
                rightHeaderExtras={
                  <>

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<SearchIcon />}
                      onClick={handleReset}
                      sx={{
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                      }}
                    >
                      New Search
                    </Button>

                    {/* <Tooltip title="Keyboard Shortcuts">
                      <IconButton 
                        onClick={() => setShowKeyboardShortcuts(true)}
                        color="primary"
                        sx={{ 
                          bgcolor: 'background.paper', 
                          boxShadow: 1,
                          '&:hover': { bgcolor: 'background.paper', opacity: 0.9 }
                        }}
                      >
                        <KeyboardIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                      <IconButton 
                        onClick={toggleFullscreen}
                        color="primary"
                        sx={{ 
                          bgcolor: 'background.paper', 
                          boxShadow: 1,
                          '&:hover': { bgcolor: 'background.paper', opacity: 0.9 }
                        }}
                      >
                        {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                      </IconButton>
                    </Tooltip> */}
                  </>
                }
                graphExtraProps={{
                  rootSkillId: skillId || '',
                  width: containerRef.current?.clientWidth || window.innerWidth,
                  height: containerRef.current?.clientHeight,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Stack>
    </Container>
  );
}