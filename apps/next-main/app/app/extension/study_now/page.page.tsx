"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  SuggestPartialSkillRoute,
} from "@/app/api/skills/suggest_partial_skill/routeSchema";
import {GenerateSubtopicsRoute} from "@/app/api/subtopics/generate/routeSchema";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
} from "@mui/material";

/**
 * Helper function to process content and create a skill
 * @param input Input for suggesting a partial skill
 * @param onError Callback for error handling
 * @param router Next.js router for navigation
 * @param supabase Supabase client
 * @param rsnUserId User ID
 * @returns Promise that resolves when process is complete
 */
const processContentAndCreateSkill = async (
  input: {
    userInput?: string;
    documents?: Array<{ resourceId: string }>;
  },
  router: any,
  supabase: any,
  rsnUserId: string | undefined,
  onError?: (message: string) => void
): Promise<void> => {
  try {
    // Call SuggestPartialSkillRoute with the input
    const { data, error } = await SuggestPartialSkillRoute.call(input);
    
    if (error) {
      console.error('Error processing input:', error);
      onError?.("Error processing input. Please try again.");
      return;
    }
    
    if (data?.skillId) {
      // Fire and forget - generate subtopics in background
      void (async () => {
        try {
          for await (const topic of GenerateSubtopicsRoute.callArrayStream({
            skillId: data.skillId,
            numTopics: 7,
          })) {
            if (topic.topic) {
              // Save subtopic as skill
              try {
                if (rsnUserId) {
                  await supabase.from('skill').insert({
                    _name: topic.topic.name,
                    _description: topic.topic.description,
                    emoji: topic.topic.emoji,
                  }).then(async ({ data: newSkill }) => {
                    if (newSkill?.[0]?.id) {
                      await supabase.from('skill_link').insert({
                        upstream_skill: newSkill[0].id,
                        downstream_skill: data.skillId,
                        _type: 'subtopic',
                      });
                    }
                  });
                }
              } catch (error) {
                console.error('Error saving subtopic:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error in background subtopics generation:', error);
        }
      })();
    }
    
    if (data?.partialSkillId) {
      router.push(`/app/partial_skill?partialSkillId=${data.partialSkillId}`);
    }
  } catch (error: any) {
    console.error('Error processing input:', error);
    onError?.('Failed to process input. Please try again.');
  }
};

export default function StudyNowPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rsnUserId, loading: userLoading, hasLoggedIn } = useRsnUser();
  const { supabase, sb } = useSupabase();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snip, setSnip] = useState<any | null>(null);
  
  const snipId = searchParams?.get("snipId");
  
  // Handle errors in the process
  const handleError = useCallback((message: string) => {
    setError(message);
    setIsProcessing(false);
    setLoading(false);
  }, []);

  // Check if user is logged in and redirect if not
  useEffect(() => {
    if (!userLoading && !hasLoggedIn) {
      // Construct the current URL to use as redirectTo parameter
      const currentPath = `/app/extension/study_now${snipId ? `?snipId=${snipId}` : ''}`;
      const encodedRedirectPath = encodeURIComponent(currentPath);
      
      // Redirect to login page with redirectTo parameter
      router.push(`/app/login?redirectTo=${encodedRedirectPath}`);
    }
  }, [userLoading, hasLoggedIn, router, snipId]);
  
  useEffect(() => {
    async function fetchAndProcess() {
      if (!snipId || !rsnUserId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the snip first
        const { data, error } = await supabase
          .from('snip')
          .select('*')
          .eq('id', snipId)
          .single();
        
        if (error) {
          throw error;
        }
        
        setSnip(data);
        setIsProcessing(true);
        
        // Process the content and create a skill
        await processContentAndCreateSkill(
          {
            documents: [{
              resourceId: snipId,
            }],
          },
          router,
          sb,
          rsnUserId,
          handleError
        );
      } catch (err) {
        setError('Failed to load or process content. Please try again.');
        console.error('Error:', err);
        setIsProcessing(false);
      } finally {
        setLoading(false);
      }
    }
    
    // Only proceed if user is logged in and not loading
    if (!userLoading && hasLoggedIn) {
      fetchAndProcess();
    }
  }, [snipId, rsnUserId, userLoading, hasLoggedIn, supabase, sb, router, handleError]);
  
  // If still loading user data or content, show loading view
  if (userLoading || loading) {
    return (
      <LoadingView />
    );
  }
  
  // If there's an error, show error view
  if (error) {
    return (
      <ErrorView error={error} onRetry={() => router.push('/app')} />
    );
  }
  
  // User is logged in and content is being processed
  return (
    <ProcessingView 
      name={snip?._name || "Your content"} 
      isProcessing={isProcessing}
      title={snip?._name || "Processing Content"}
      thumbnailUrl={snip?.metadata?.thumbnailUrl || null}
      sourceUrl={snip?.source_url || null}
    />
  );
}

// Loading component
const LoadingView = () => (
  <Container maxWidth="md" sx={{ py: 8 }}>
    <Box 
      display="flex" 
      flexDirection="column"
      justifyContent="center" 
      alignItems="center" 
      minHeight="60vh"
      gap={3}
    >
      <CircularProgress size={60} />
      <Txt variant="h6" color="text.secondary" textAlign="center">
        Loading your content...
      </Txt>
    </Box>
  </Container>
);

// Error component
const ErrorView = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
  <Container maxWidth="md" sx={{ py: 8 }}>
    <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
      <Stack spacing={4} alignItems="center">
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={onRetry}
        >
          Return to Dashboard
        </Button>
      </Stack>
    </Paper>
  </Container>
);

// Processing component
const ProcessingView = ({ 
  name, 
  isProcessing, 
  title, 
  thumbnailUrl, 
  sourceUrl 
}: { 
  name: string, 
  isProcessing: boolean,
  title: string,
  thumbnailUrl: string | null,
  sourceUrl: string | null
}) => (
  <Container maxWidth="md" sx={{ py: 8 }}>
    <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
      <Stack spacing={4} alignItems="center">
        <Txt variant="h4" textAlign="center" gutterBottom>
          {isProcessing ? "Creating your learning path..." : "Processing complete"}
        </Txt>
        
        {/* Content Information */}
        <Paper 
          elevation={1}
          sx={{ 
            p: 3, 
            width: '100%', 
            borderRadius: 2, 
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Stack spacing={2}>
            <Txt variant="h5" gutterBottom fontWeight="medium">
              {title}
            </Txt>
            
            {thumbnailUrl && (
              <Box 
                sx={{ 
                  width: '100%', 
                  maxHeight: '240px',
                  overflow: 'hidden',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <img 
                  src={thumbnailUrl} 
                  alt={`Thumbnail for ${title}`}
                  style={{ 
                    width: '100%', 
                    maxHeight: '240px',
                    objectFit: 'contain'
                  }}
                />
              </Box>
            )}
            
            {sourceUrl && (
              <Txt variant="body2" color="text.secondary">
                Source: <a href={sourceUrl} target="_blank" rel="noopener noreferrer">{sourceUrl}</a>
              </Txt>
            )}
          </Stack>
        </Paper>
        
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={80} thickness={4} />
        </Box>
        
        <Txt variant="body1" textAlign="center" color="text.secondary">
          We're analyzing "{name}" and creating a personalized learning path for you. 
          This may take a moment. You'll be automatically redirected when it's ready.
        </Txt>
      </Stack>
    </Paper>
  </Container>
); 