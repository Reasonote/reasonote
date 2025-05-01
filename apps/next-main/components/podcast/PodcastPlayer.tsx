import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {GitFork} from "lucide-react";
import {useRouter} from "next/navigation";
import posthog from "posthog-js";

import {ForkPodcastRoute} from "@/app/api/podcast/fork/routeSchema";
import {SharePodcastRoute} from "@/app/api/podcast/share/routeSchema";
import {
  DigDeeperTopicsRoute,
} from "@/app/api/speech/podcast/dig-deeper-topics/routeSchema";
import {
  SpeechPodcastVoiceRoute,
} from "@/app/api/speech/podcast/voice/routeSchema";
import {useIsOverLicenseLimit} from "@/clientOnly/hooks/useIsOverLicenseLimit";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useReasonoteLicense} from "@/clientOnly/hooks/useReasonoteLicense";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useToken} from "@/clientOnly/hooks/useToken";
import {useApolloClient} from "@apollo/client";
import {
  AddCircle,
  ChangeCircle,
  ContentCopy,
  Info,
  InfoOutlined,
  PlayCircle,
  Podcasts,
  Share,
  Share as ShareIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Link,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {Database} from "@reasonote/lib-sdk";
import {updatePodcastFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";
import {usePodcastFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";
import {
  JSONSafeParse,
  jwtBearerify,
  processCompleteJSONObjects,
} from "@reasonote/lib-utils";
import {
  useAsyncEffect,
  useStateWithRef,
} from "@reasonote/lib-utils-frontend";

import {useUserInteraction} from "../../contexts/UserInteractionContext";
import {ChatTextField} from "../chat/TextField/ChatTextField";
import {EnhancedChip} from "../chips/EnhancedChip";
import {LinearProgressCountdown} from "../progress/LinearProgressCountdown";
import {SkeletonWithOverlay} from "../smart-skeleton/SkeletonWithOverlay";
import AudioWaveformVisualizer from "../sounds/AudioWaveformVisualizer";
import {useSupabase} from "../supabase/SupabaseProvider";
import {Txt} from "../typography/Txt";
import {PodcastControls} from "./PodcastControls";
import {PodcastNextTopicDialog} from "./PodcastNextTopicDialog";
import {PodcastUpsellModal} from "./PodcastUpsellModal";
import {QueuedItemsDialog} from "./QueuedItemsDialog";

interface AudioData {
  base64Audio: string;
  transcriptLineId: string;
  speed: number;
}

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const uint8Array = new Uint8Array(buffer);
  const chunksSize = 0x8000; // Process in chunks to avoid call stack limits
  let result = '';

  for (let i = 0; i < uint8Array.length; i += chunksSize) {
    const chunk = uint8Array.subarray(i, i + chunksSize);
    result += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }

  return btoa(result);
};

export function PodcastPlayer({
  podcastId,
}: {
  podcastId: string;
}) {
  const ac = useApolloClient();
  const { supabase } = useSupabase();
  const podcastRes = usePodcastFlatFragLoader(podcastId)
  const [podcast, setPodcast] = useState<Database['public']['Tables']['podcast']['Row'] | null>(null);
  const [transcript, setTranscript] = useState<Database['public']['Tables']['podcast_line']['Row'][]>([]);
  const [transcriptFetched, setTranscriptFetched, transcriptFetchedRef] = useStateWithRef(false);
  const [numFailedTranscriptGeneration, setNumFailedTranscriptGeneration, numFailedTranscriptGenerationRef] = useStateWithRef(0);

  useEffect(() => {
    posthog.capture('podcast_view', {
      podcast_id: podcastId,
    }, {send_instantly: true});
  }, [podcastId]);

  const outline = JSONSafeParse(podcastRes.data?.outline)?.data ?? null;
  const setOutline = useCallback(async (newOutline: any) => {
    await ac.mutate({
      mutation: updatePodcastFlatMutDoc,
      variables: {
        set: {
          outline: newOutline ? JSON.stringify(newOutline) : null,
        },
        filter: {
          id: {
            eq: podcastId,
          },
        },
        atMost: 1,
      },
    });
  }, [podcastId, podcastRes.data]);
  const topic = podcastRes.data?.topic;
  const documents = podcastRes.data?.metadata?.documents;
  const specialInstructions = podcastRes.data?.specialInstructions;
  const podcastType = podcastRes.data?.podcastType;


  /** Which transcript line ids are we currently generating audio for? */
  const generatingAudioTranscriptLineIdsRef = useRef<string[]>([]);
  const [isGenerating, setIsGenerating, isGeneratingRef] = useStateWithRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const {
    tokenRef,
  } = useToken();
  const rawAudioDataRef = useRef<AudioData[]>([]);
  const [rawAudioUpdateCount, setRawAudioUpdateCount] = useState(0);
  const [visualizerSource, setVisualizerSource] = useState<MediaElementAudioSourceNode | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(true); // Start paused by default
  const [speed, setSpeed] = useState<number>(1.25);
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  const audioIsPlayingRef = useRef(false);
  const [changingTopicsTo, setChangingTopicsTo] = useState<string | null>(null);
  const [userText, setUserText] = useState<string>('');
  const [isTopicChangeDialogOpen, setIsTopicChangeDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);

  const [podlineDigDeeperAttempts, setPodlineDigDeeperAttempts, podlineDigDeeperAttemptsRef] = useStateWithRef<Record<string, {status: 'pending' | 'success' | 'error', data?: {digDeeperTopics: string[]} | null, error: string | null}>>({});

  const AUDIO_GENERATION_RANGE = 3; // Number of steps ahead and behind to generate audio

  const isAudioAvailable = useMemo(() => {
    return rawAudioDataRef.current.length > 0;
  }, [rawAudioUpdateCount]);

  const isSharedVersion = useMemo(() => {
    return podcast?.is_shared_version;
  }, [podcast]);

  const originalPodcastId = useMemo(() => {
    return podcast?.original_podcast_id;
  }, [podcast]);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const router = useRouter();

  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [cloneReason, setCloneReason] = useState<'type' | 'send' | 'dig-deeper' | null>(null);

  const [openSnackbar, setOpenSnackbar] = useState(false);

  const [currentLineHasAudio, setCurrentLineHasAudio] = useState(true);
  
  const {data: subData, loading: isSubLoading} = useReasonoteLicense();
  const {data: isOverLimit, loading: isOverLimitLoading, refetch: refetchIsOverLimit} = useIsOverLicenseLimit('podcasts_generated');

  const { hasInteracted } = useUserInteraction();

  const [canAutoplay, setCanAutoplay] = useState(false);

  const [userScrolled, setUserScrolled] = useState(false);
  const [userHovered, setUserHovered] = useState(false);
  const lastInteractionTimeRef = useRef(0);
  const currentCardRef = useRef<HTMLDivElement>(null);

  const { rsnUserId } = useRsnUser();

  const [isPodcastEndedDialogOpen, setIsPodcastEndedDialogOpen] = useState(false);
  const [isQueueDialogOpen, setIsQueueDialogOpen] = useState(false);
  const [isNextTopicLoading, setIsNextTopicLoading] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [podcastsGenerated, setPodcastsGenerated] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    // If we change podcast, we need to refetch the isOverLimit query
    refetchIsOverLimit();
  }, [podcastId])

  const trackPodcastVisit = async () => {
    if (!rsnUserId) {
      console.log("User not authenticated, skipping podcast visit tracking");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_history')
        .upsert({
          rsn_user_id: rsnUserId,
          podcast_id: podcastId,
          created_by: rsnUserId,
          updated_by: rsnUserId,
        }, {
          onConflict: 'rsn_user_id, podcast_id'
        })
        .select();

      if (error) {
        console.error("Error tracking podcast visit:", error);
      } else {
        console.log("Podcast visit tracked successfully:", data);
      }
    } catch (error) {
      console.error("Error tracking podcast visit:", error);
    }
  };

  useEffect(() => {
    trackPodcastVisit();
  }, [podcastId, rsnUserId]);

  useEffect(() => {
    if (hasInteracted) {
      setCanAutoplay(true);
      setIsPaused(false); // Unpause when we can autoplay
    }
  }, [hasInteracted]);

  // Add this useEffect to check if the current line has audio
  useEffect(() => {
    const currentLine = transcript[currentDialogueIndex];
    if (currentLine) {
      const hasAudio = rawAudioDataRef.current.some(r => r.transcriptLineId === currentLine.id);
      setCurrentLineHasAudio(hasAudio);
    }
  }, [currentDialogueIndex, transcript, rawAudioUpdateCount]);

  const suggestedTopics = useMemo(() => {
    return transcript
      .flatMap(line => line.dig_deeper_topics || [])
      .filter((value, index, self) => self.indexOf(value) === index);
  }, [transcript]);

  const handleAudioEnd = useCallback(async (index: number) => {
    setCurrentDialogueIndex(index + 1);
    if (index === transcript.length - 1 && !isGeneratingRef.current) {
      handlePodcastEnd();
    }
  }, [transcript.length, setCurrentDialogueIndex]);

  const handlePodcastEnd = useCallback(async () => {
    if (!rsnUserId) {
      console.log("User not authenticated, skipping podcast queue handling");
      return;
    }

    const { data: nextPodcastId, error } = await supabase
      .rpc('pop_from_podcast_queue');

    if (error) {
      console.error('Error popping from queue:', error);
      return;
    }

    if (nextPodcastId) {
      // Navigate to the next podcast
      router.push(`/app/podcast/${nextPodcastId}/player`);
    } else {
      setIsPodcastEndedDialogOpen(true);
    }
  }, [rsnUserId, supabase, router]);

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  const handleShare = async () => {
    if (isGenerating) {
      // Don't attempt to share if generation is in progress
      return;
    }

    posthog.capture('share_podcast', {
      podcast_id: podcastId,
    }, {send_instantly: true});

    setIsSharing(true);
    try {
      const response = await SharePodcastRoute.call({ podcastId });
      if (response.success) {
        setShareUrl(`${window.location.origin}/app/podcast/${response.data.newPodcastId}/player`);
      }
      else {
        console.error("Error sharing podcast:", response.error);
      }
    } catch (error) {
      console.error("Error sharing podcast:", error);
      // Show an error message or toast notification
    } finally {
      setIsSharing(false);
    }
  };

  const handleFork = async () => {
    try {
      const response = await ForkPodcastRoute.call({ podcastId });

      if (response.success) {
        router.push(`${window.location.origin}/app/podcast/${response.data.id}`);
      }
      else {
        console.error("Error forking podcast:", response.error);
      }
    } catch (error) {
      console.error("Error forking podcast:", error);
    }
  };

  // Whenever we have a podline for which we don't have dig deeper topics,
  // And which we haven't already tried to generate dig deeper topics for,
  // Generate them
  useEffect(() => {
    const generateDigDeeperTopics = async (podcastLineId: string) => {
      try {
        const result = await DigDeeperTopicsRoute.call({
          podcastLineId
        });

        if (!result.success) {
          throw new Error(result.error);
        }
        
        // Update the local state to mark this line as processed
        setPodlineDigDeeperAttempts(prev => ({
          ...prev,
          [podcastLineId]: {
            status: 'success',
            data: result.data,
            error: null
          }
        }));

        return result.data.digDeeperTopics;
      } catch (error) {
        console.error('Failed to generate dig deeper topics:', error);
        
        // Mark as attempted even if it failed to prevent repeated attempts
        setPodlineDigDeeperAttempts(prev => ({
          ...prev,
          [podcastLineId]: {
            status: 'error',
            data: null,
            error: JSON.stringify(error)
          }
        }));
        
        return null;
      }
    };

    // For all podcast lines, check if they don't have dig deeper topics
    // And if we haven't already tried to generate dig deeper topics for them
    transcript.forEach(line => {
      if (
        line && 
        (!line.dig_deeper_topics || line.dig_deeper_topics.length === 0) && 
        !podlineDigDeeperAttemptsRef.current?.[line.id]
      ) {
        generateDigDeeperTopics(line.id);
      }
    });
  }, [transcript]);

  // Add this new ref for the audio element
  const audioRef = useRef<HTMLAudioElement>(null);

  const isMobile = useIsSmallDevice();

  // Add this new state
  const [useAudioElement, setUseAudioElement] = useState(isMobile);

  useEffect(() => {
    if (audioRef.current && !audioContextRef.current) {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create source from audio element
      const source = audioContextRef.current.createMediaElementSource(audioRef.current);
      
      // Create analyzer
      const analyser = audioContextRef.current.createAnalyser();
      
      // Connect nodes
      source.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      
      // Set visualizer source
      setVisualizerSource(source);
    }
  }, [audioRef.current]);

  const setRawAudioData = (newRawAudioData: AudioData[]) => {
    rawAudioDataRef.current = newRawAudioData;
    setRawAudioUpdateCount(prev => prev + 1);
  }

  const markAudioIsPlaying = useCallback(() => {
    audioIsPlayingRef.current = true;
    setAudioIsPlaying(true);
  }, []);

  const markAudioIsNotPlaying = useCallback(() => {
    audioIsPlayingRef.current = false;
    setAudioIsPlaying(false);
  }, []);

  const playAudio = useCallback(async (base64Audio: string, speed: number = 1) => {
    if (audioRef.current) {
      console.log("Setting audio source");
      audioRef.current.src = `data:audio/wav;base64,${base64Audio}`;
      audioRef.current.volume = 1; // Ensure volume is at maximum

      // Enable pitch preservation
      audioRef.current.preservesPitch = true;
      try {
        console.log("Playing audio");
        await audioRef.current.play();
        setIsPaused(false);
        markAudioIsPlaying();
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    } else {
      console.error('Audio element not found');
    }
  }, [audioRef.current]);

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
      markAudioIsNotPlaying();
    }
  };

  const forceStopAudio = useCallback(() => {
    if (audioRef.current) {
      console.log(`Force Stopping current audio`);
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      markAudioIsNotPlaying();
    }
  }, [markAudioIsNotPlaying]);

  const updateMediaSessionPositionState = useCallback(() => {
    if ('mediaSession' in navigator) {
      const totalLines = transcript.length;
      const currentPosition = currentDialogueIndex + 1; // Adding 1 to make it 1-based instead of 0-based
      const playbackRate = speed;

      navigator.mediaSession.setPositionState({
        duration: totalLines > currentPosition ? totalLines : currentPosition,
        playbackRate: playbackRate,
        position: currentPosition
      });
    }
  }, [currentDialogueIndex, transcript.length, speed]);

  // Add this new function to update media session metadata
  const updateMediaSessionMetadata = useCallback(() => {
    if ('mediaSession' in navigator && transcript[currentDialogueIndex]) {
      const currentLine = transcript[currentDialogueIndex];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: topic || 'Podcast',
        artist: 'Reasonote',
        artwork: [
          { src: '/favicon.ico', sizes: '512x512', type: 'image/png' },
        ],
      });
      updateMediaSessionPositionState();
    }
  }, [currentDialogueIndex, transcript, topic, updateMediaSessionPositionState]);

  const forcePlayAudioAtIndex = useCallback(async (index) => {
    if (!canAutoplay) {
      console.log("Cannot autoplay due to lack of user interaction");
      setIsPaused(true);
      return;
    }

    if (isOverLimit && !isOverLimitLoading) {
      console.log("Cannot autoplay due to user being over plan limit");
      setIsPaused(false);
      return;
    }

    forceStopAudio(); // Stop any currently playing audio

    markAudioIsPlaying();
    try {
      console.log(`Attempting to play audio at index: ${index}`);
      const transcriptLine = transcript[index];
      if (!transcriptLine) {
        console.warn(`Transcript line not found for audio at index ${index}`);
        setVisualizerSource(null);
        setCurrentSpeaker(null);
        markAudioIsNotPlaying();
        return;
      }

      if (transcriptLine.speaker === "USER") {
        console.log("Skipping USER dialogue");
        setCurrentDialogueIndex(index + 1);
        return;
      }

      setCurrentDialogueIndex(index);

      const rawAudioData = rawAudioDataRef.current.find(r => r.transcriptLineId === transcriptLine.id);

      if (!rawAudioData) {
        console.warn(`Raw audio data not found for transcript line ${transcriptLine.id} at index ${index}`);
        setVisualizerSource(null);
        setCurrentSpeaker(null);
        markAudioIsNotPlaying();
        return;
      }

      setCurrentSpeaker(transcriptLine.speaker);

      await playAudio(rawAudioData.base64Audio);

      if (audioRef.current) {
        audioRef.current.onended = () => {
          markAudioIsNotPlaying();
          handleAudioEnd(index);
        };
      }

      updateMediaSessionMetadata();
    }
    catch (error) {
      console.error("Error playing audio:", error);
    }
  }, [canAutoplay, isOverLimit, isOverLimitLoading, transcript, speed, updateMediaSessionMetadata, markAudioIsPlaying, markAudioIsNotPlaying, setCurrentDialogueIndex, setCurrentSpeaker, setVisualizerSource, forceStopAudio, playAudio, handleAudioEnd]);

  const lastAutoplayAttemptTimeRef = useRef<number | undefined>(undefined);


  useEffect(() => {
    // Only try to autoplay once every 250ms
    const now = Date.now();
    if (lastAutoplayAttemptTimeRef.current && now - lastAutoplayAttemptTimeRef.current < 100) {
      console.debug(`Skipping autoplay due to cooldown`);
      return;
    }

    if (canAutoplay && !isOverLimit && !isOverLimitLoading && !audioIsPlayingRef.current && !isPaused) {
      lastAutoplayAttemptTimeRef.current = now;
      console.debug(`Autoplaying audio at index: ${currentDialogueIndex}`);
      forcePlayAudioAtIndex(currentDialogueIndex);
    }
  }, [canAutoplay, audioIsPlaying, rawAudioUpdateCount, currentDialogueIndex, forcePlayAudioAtIndex, isOverLimit, isOverLimitLoading]);

  const processAudioData = useCallback((base64Audio, transcriptLineId, speed) => {
    console.log(`Processing audio data for transcript line: ${transcriptLineId}`);
    setRawAudioData([...rawAudioDataRef.current, { base64Audio, transcriptLineId, speed }]);
  }, []);

  // Update the audio element's playback rate when speed changes
  useAsyncEffect(async () => {
    const currentRawAudioData = rawAudioDataRef.current[currentDialogueIndex];
    if (audioRef.current && currentRawAudioData) {
      // the currentRawAudioData has a speed associated with it -- `trackSpeed`
      //   In Legacy, these audio files would have speeds that were different from 1.
      // The "target" speed is `speed`.
      // We need to determine the playbackRate in terms of `speed` and `trackSpeed`
      // So, if speed is 1.5, and trackSpeed is 1, then playbackRate should be 1.5
      // If speed is 1, and trackSpeed is 1.5, then playbackRate should be 2/3
      // playbackRate = targetSpeed / currentSpeed

      // Always preserve pitch
      audioRef.current.preservesPitch = true;      
      const targetPlaybackRate = speed / currentRawAudioData.speed;
      audioRef.current.playbackRate = targetPlaybackRate;

      console.log(`Setting playback rate to ${targetPlaybackRate}`);

      // Enable pitch preservation
      audioRef.current.preservesPitch = true;
    }
  }, [speed, currentDialogueIndex, rawAudioUpdateCount, isPaused]);

  const generateAudioForTranscriptLine = useCallback(async (transcriptLine: string) => {
    if (generatingAudioTranscriptLineIdsRef.current.includes(transcriptLine)) {
      return;
    }

    // Check if audio data already exists for this transcript line
    const existingAudioData = rawAudioDataRef.current.find(r => r.transcriptLineId === transcriptLine);
    if (existingAudioData) {
      console.log(`Audio data already exists for transcript line: ${transcriptLine}`);
      return;
    }

    generatingAudioTranscriptLineIdsRef.current.push(transcriptLine);
    try {
      console.log(`Generating audio for transcript line: ${transcriptLine}`);

      const response = await SpeechPodcastVoiceRoute.call({
        podcast_line_id: transcriptLine,
      });

      if (response.success) {
        console.log(`Audio generated for transcript line: ${transcriptLine}`);
        const { data } = await supabase.storage
          .from('podcast_audio')
          .createSignedUrl(response.data.audioFile, 3600); // 1 hour expiration

        if (data?.signedUrl) {
          const audioResponse = await fetch(data.signedUrl);
          console.log('Got response');
          const audioArrayBuffer = await audioResponse.arrayBuffer();
          console.log('Got buffer');
          const base64Audio = arrayBufferToBase64(audioArrayBuffer);
          console.log('Got base64Audio');
          processAudioData(base64Audio, transcriptLine, response.data.speed);
        } else {
          console.error("Failed to get signed URL for audio file");
        }
      } else {
        console.error("Error generating audio:", response.error);
      }
    } catch (error) {
      console.error("Error generating or fetching audio:", error);
    } finally {
      generatingAudioTranscriptLineIdsRef.current = generatingAudioTranscriptLineIdsRef.current.filter(i => i !== transcriptLine);
    }
  }, [transcript, outline, processAudioData, podcastId, supabase]);

  const generateAudioForRange = useCallback(async () => {
    const start = Math.max(0, currentDialogueIndex - AUDIO_GENERATION_RANGE);
    const end = Math.min(transcript.length - 1, currentDialogueIndex + AUDIO_GENERATION_RANGE);

    for (let i = start; i <= end; i++) {
      const transcriptLine = transcript[i];
      const hasAudio = rawAudioDataRef.current.find(r => r.transcriptLineId === transcriptLine.id);
      if (transcriptLine && transcriptLine.id && !hasAudio) {
        await generateAudioForTranscriptLine(transcriptLine.id);
      }
    }
  }, [currentDialogueIndex, transcript, generateAudioForTranscriptLine]);

  useEffect(() => {
    generateAudioForRange();
  }, [currentDialogueIndex, transcript, speed, generateAudioForRange]);

  const fetchTranscript = useCallback(async () => {
    const { data, error } = await supabase
      .from('podcast_line')
      .select('*')
      .eq('podcast_id', podcastId)
      .order('line_number', { ascending: true });

    if (error) {
      console.error('Error fetching transcript:', error);
    } else {
      setTranscript(data);
      setTranscriptFetched(true);
    }
  }, [podcastId, supabase]);

  const fetchPodcast = useCallback(async () => {
    const { data, error } = await supabase
      .from('podcast')
      .select('*')
      .eq('id', podcastId)
      .single();

    if (error) {
      console.error('Error fetching podcast:', error);
    } else {
      setPodcast(data);
    }
  }, [podcastId, supabase]);

  useEffect(() => {
    fetchPodcast();
    fetchTranscript();
  }, [fetchPodcast, fetchTranscript]);

  const handleGenerate = useCallback(async (opts?: {
    chooseNewTopic?: {
      newTopic: string;
      startAfterIndex: number;
    },
    userMessage?: {
      message: string;
      startAfterIndex: number;
    }
  }) => {
    if (isSharedVersion) {
      console.error("Cannot generate podcast for shared version");
      return;
    }

    if (isGeneratingRef.current) {
      return;
    }

    if (numFailedTranscriptGenerationRef?.current && numFailedTranscriptGenerationRef.current > 5) {
      console.error("Too many failed transcript generations");
      return;
    }

    setIsGenerating(true);
    console.log("Starting podcast generation");
    try {
      if (!tokenRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!tokenRef.current) {
          throw new Error("No token found");
          return;
        }
      }

      if (!opts?.chooseNewTopic) {
        if (!opts?.userMessage) {
          // Placeholder for now
        }
        else {
          // Placeholder for now
        }
      } else {
        const startAfterIndex = opts.chooseNewTopic.startAfterIndex !== null ? opts.chooseNewTopic.startAfterIndex : transcript.length - 1;
        // If it's a new topic, keep the existing transcript up to the startAfterIndex
        setRawAudioData(rawAudioDataRef.current.slice(0, startAfterIndex + 1));
        setCurrentDialogueIndex(startAfterIndex + 1);
        setChangingTopicsTo(opts.chooseNewTopic.newTopic);
      }
      abortControllerRef.current = new AbortController();

      let remainingChunks = '';

      const startAfterIndex = opts?.chooseNewTopic ? opts.chooseNewTopic.startAfterIndex :
        opts?.userMessage ?
          opts.userMessage.startAfterIndex
          :
          null;


      const response = await fetch('/api/speech/podcast/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': jwtBearerify(tokenRef.current),
        },
        body: JSON.stringify({
          podcastId,
          startAfterIndex,
          newTopic: opts?.chooseNewTopic ? opts.chooseNewTopic.newTopic : null,
          userMessage: opts?.userMessage?.message ? opts.userMessage.message : null,

          // topic: topic,
          // documents: documents.map(d => JSON.stringify(d, null, 2)),
          // existingOutline,
          // existingTranscript: newTranscript,
          // specialInstructions,
          // podcastType,
        }),
        signal: abortControllerRef.current.signal,
      });

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get reader');
      }
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const { objects, remainingChunks: newRemainingChunks } = processCompleteJSONObjects(remainingChunks + chunk);
        remainingChunks = newRemainingChunks;

        for (const object of objects) {
          console.log("Received object:", object);

          const { type, data } = object;
          switch (type) {
            case 'outline':
              setOutline(data);
              break;
            case 'transcript':
              // addTranscriptLine(data);
              fetchTranscript();
              break;
            case 'transcript-reset':
              fetchTranscript();
              break;
            case 'error':
              throw new Error(data);
            case 'generation-complete':
              setIsGenerationComplete(true);
              break;
          }
        }
      }
      // Reset the number of failed transcript generations when we finish here.
      setNumFailedTranscriptGeneration(0);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        setNumFailedTranscriptGeneration(old => old + 1);
        console.error('Error generating podcast:', error);
      }
    } finally {
      console.log("Podcast generation completed");
      setIsGenerating(false);
      setChangingTopicsTo(null);
    }
    setPodcastsGenerated(prev => prev + 1);
  }, [documents, outline, processAudioData, topic, transcript, specialInstructions, podcastType, fetchTranscript, isSharedVersion]);

  // Generate the podcast if we have less than 5 transcript lines.
  useEffect(() => {
    if (!podcastRes.loading && transcriptFetchedRef.current && transcript.length < 5) {
      handleGenerate();
    }
  }, [podcastRes, transcript]);

  const handleStop = useCallback(() => {
    console.log("Stopping podcast generation and playback");
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    forceStopAudio();
    setVisualizerSource(null);
    setCurrentSpeaker(null);
    setIsGenerating(false);
    setIsPaused(true);
  }, [forceStopAudio]);

  const handleSkipTo = useCallback((index) => {
    console.log(`Skipping to index: ${index}`);
    forceStopAudio();
    setCurrentDialogueIndex(index);
    forcePlayAudioAtIndex(index);
  }, [forceStopAudio, forcePlayAudioAtIndex]);

  const handlePlayPause = useCallback(() => {
    console.log(`Play/Pause clicked. Current state: ${isPaused ? 'Paused' : 'Playing'}`);
    if (isPaused) {
      console.log("Attempting to resume playback");
      forcePlayAudioAtIndex(currentDialogueIndex);
    } else {
      console.log("Pausing playback");
      pauseAudio();
    }
  }, [currentDialogueIndex, isPaused, forcePlayAudioAtIndex]);

  const handleRewind = useCallback(() => {
    console.log("Rewinding");
    const newIndex = Math.max(0, currentDialogueIndex - 1);
    handleSkipTo(newIndex);
  }, [currentDialogueIndex, handleSkipTo]);

  const handleSkip = useCallback(() => {
    console.log("Skipping forward");
    const newIndex = Math.min(rawAudioDataRef.current.length - 1, currentDialogueIndex + 1);
    handleSkipTo(newIndex);
  }, [currentDialogueIndex, handleSkipTo]);

  const interruptGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleTopicChange = useCallback((newTopic, index) => {
    interruptGeneration();
    console.log(`Changing topic to "${newTopic}" at index ${index}`);
    handleGenerate({ chooseNewTopic: { newTopic, startAfterIndex: index } });
  }, [handleGenerate]);

  useEffect(() => {
    const assumedLength = isGenerating ? transcript.length + 10 : transcript.length;
    setProgress(Math.min(100, Math.max(0, (currentDialogueIndex / Math.max(1, assumedLength - 1)) * 100)));
  }, [currentDialogueIndex, transcript.length]);

  const handleSendMessage = useCallback((message: string, index?: number) => {
    if (isSharedVersion) {
      showCloneDialog('send');
    } else {
      interruptGeneration();
      setUserText('');
      handleGenerate({ userMessage: { message, startAfterIndex: index ?? currentDialogueIndex } });
    }
  }, [handleGenerate, currentDialogueIndex, isSharedVersion]);

  const handleSpeedChange = useCallback(async (newSpeed: number) => {
    if (speed === newSpeed) {
      return;
    }

    setSpeed(newSpeed);
    updateMediaSessionPositionState();

    // Save the new speed preference if user is logged in
    if (rsnUserId) {
      await supabase
        .from('user_setting')
        .upsert({
          rsn_user: rsnUserId,
          podcast_playback_speed: newSpeed
        }, {
          onConflict: 'rsn_user'
        });
    }
  }, [speed, rsnUserId, supabase, updateMediaSessionPositionState]);

  const handleTopicChipClick = (topic: string) => {
    if (isSharedVersion) {
      showCloneDialog('dig-deeper');
    } else {
      setIsTopicChangeDialogOpen(true);
      setSelectedTopic(topic);
    }
  };

  const handleTopicChangeNow = useCallback((newTopic: string) => {
    posthog.capture('podcast_change_topic_now', {
      podcast_id: podcastId,
      topic: newTopic,
    }, {send_instantly: true});

    setIsTopicChangeDialogOpen(false);
    console.log(`Changing topic to "${newTopic}" now`);
    interruptGeneration();
    handleGenerate({ chooseNewTopic: { newTopic, startAfterIndex: currentDialogueIndex } });
    setSnackbarMessage(`Changing topic to "${newTopic}"`);
    setSnackbarOpen(true);
  }, [handleGenerate, currentDialogueIndex, interruptGeneration]);

  const handleAddToQueue = useCallback(async (topic: string, desiredPosition?: number) => {
    if (!rsnUserId) {
      console.log("User not authenticated, skipping podcast queue handling");
      return;
    }

    posthog.capture('podcast_add_to_queue', {
      podcast_id: podcastId,
      topic,
    }, {send_instantly: true});

    const podcastTitle = podcast?.title;

    const { data, error } = await supabase
      .rpc('add_to_podcast_queue', {
        p_topic: `${topic} ${podcastTitle ? `(${podcastTitle})` : ''}`,
        p_special_instructions: specialInstructions ?? '',
        p_podcast_type: podcastType ?? 'layman-expert',
        p_desired_position: desiredPosition,
        p_for_skill_path: podcast?.for_skill_path ?? undefined,
        p_from_podcast_id: podcastId
      });

    if (error) {
      console.error('Error adding to queue:', error);
      setSnackbarMessage('Failed to add topic to queue');
    } else {
      console.log('Added to queue:', data);
      setSnackbarMessage('Topic added to queue successfully');
    }

    setSnackbarOpen(true);
    setIsTopicChangeDialogOpen(false);
  }, [rsnUserId, podcastId, specialInstructions, podcastType, supabase, podcast?.title]);

  const handleReorderQueueItem = useCallback(async (itemId: string, newPosition: number) => {
    if (!rsnUserId) {
      console.log("User not authenticated, skipping queue reordering");
      return;
    }

    const { error } = await supabase
      .rpc('reorder_podcast_queue_item', {
        p_item_id: itemId,
        p_new_position: newPosition
      });

    if (error) {
      console.error('Error reordering queue item:', error);
    } else {
      console.log('Queue item reordered successfully');
    }
  }, [rsnUserId, supabase]);

  const handleClone = async () => {
    try {
      const response = await ForkPodcastRoute.call({ podcastId });

      if (response.success) {
        router.push(`/app/podcast/${response.data.id}/player`);
      } else {
        console.error("Error cloning podcast:", response.error);
      }
    } catch (error) {
      console.error("Error cloning podcast:", error);
    }
  };

  const showCloneDialog = (reason: 'type' | 'send' | 'dig-deeper') => {
    setCloneReason(reason);
    setIsCloneDialogOpen(true);
  };

  const handleScroll = useCallback(() => {
    setUserScrolled(true);
    lastInteractionTimeRef.current = Date.now();
  }, []);

  const handleCardHover = useCallback(() => {
    setUserHovered(true);
    lastInteractionTimeRef.current = Date.now();
  }, []);

  const scrollToCurrentDialogue = useCallback(() => {
    console.debug('scrollToCurrentDialogue', {currentCardRef});
    if (currentCardRef.current) {
      const now = Date.now();
      const timeSinceLastInteraction = now - lastInteractionTimeRef.current;

      if (timeSinceLastInteraction > 10000 && !userScrolled && !userHovered) {
        currentCardRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }

    setUserScrolled(false);
    setUserHovered(false);
  }, [userScrolled, userHovered]);

  useEffect(() => {
    scrollToCurrentDialogue();
  }, [currentDialogueIndex, scrollToCurrentDialogue]);


  // Add this useEffect to set up media session handlers
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', handlePlayPause);
      navigator.mediaSession.setActionHandler('pause', handlePlayPause);
      navigator.mediaSession.setActionHandler('previoustrack', handleRewind);
      navigator.mediaSession.setActionHandler('nexttrack', handleSkip);
    }
  }, [handlePlayPause, handleRewind, handleSkip]);

  useEffect(() => {
    console.log({ currentDialogueIndex });
  }, [currentDialogueIndex]);

  const handleSeekPrevious = useCallback(() => {
    if (currentDialogueIndex > 0) {
      forceStopAudio();
      setCurrentDialogueIndex(prevIndex => prevIndex - 1);
    }
  }, [currentDialogueIndex, forceStopAudio]);

  const handleSeekNext = useCallback(() => {
    if (currentDialogueIndex < transcript.length - 1) {
      forceStopAudio();
      setCurrentDialogueIndex(prevIndex => prevIndex + 1);
    }
  }, [currentDialogueIndex, transcript.length, forceStopAudio]);

  const handleSkipToPreviousPodcast = useCallback(() => {
    // TODO: Implement skipping to previously played podcast
    console.log("Skipping to previous podcast - Not implemented yet");
  }, []);

  const handleSkipToNextPodcast = useCallback(async () => {
    if (!rsnUserId) {
      console.log("User not authenticated, skipping podcast queue handling");
      return;
    }

    setIsNextTopicLoading(true);

    try {
      const { data: nextPodcastId, error } = await supabase
        .rpc('pop_from_podcast_queue');

      if (error) {
        console.error('Error popping from queue:', error);
        return;
      }

      if (nextPodcastId) {
        // Navigate to the next podcast
        router.push(`/app/podcast/${nextPodcastId}/player`);
      } else {
        console.log("No more podcasts in the queue");
        setIsQueueDialogOpen(true);
      }
    } finally {
      setIsNextTopicLoading(false);
    }
  }, [rsnUserId, supabase, router]);

  const handleNextTopicSelection = useCallback(async (topic: string) => {
    setIsNextTopicLoading(true);
    try {
      // Step 1: Add the topic to the queue
      await handleAddToQueue(topic);
      
      // Step 2: Skip to the next podcast (which should be the one we just added)
      await handleSkipToNextPodcast();
    } catch (error) {
      console.error('Error handling next topic selection:', error);
    } finally {
      setIsNextTopicLoading(false);
      setIsPodcastEndedDialogOpen(false);
    }
  }, [handleAddToQueue, handleSkipToNextPodcast]);

  const handleQueueOpen = useCallback(() => {
    setIsQueueDialogOpen(true);
  }, []);

  const handleQueueDialogClose = useCallback(() => {
    setIsQueueDialogOpen(false);
  }, []);

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };



  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (!isPaused) {
      intervalId = setInterval(() => {
        updateMediaSessionPositionState();
      }, 1000); // Update every second
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPaused, updateMediaSessionPositionState]);

  // Load user's preferred speed on component mount
  useAsyncEffect(async () => {
      if (!rsnUserId) return;
      
      const { data, error } = await supabase
        .from('user_setting')
        .select('podcast_playback_speed')
        .eq('rsn_user', rsnUserId)
        .single();

      if (!error && data?.podcast_playback_speed) {
        setSpeed(data.podcast_playback_speed);
      }
  }, [rsnUserId, supabase]);

  useEffect(() => {
    if (hasInteracted && audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, [hasInteracted]);

  // Track when users leave podcast mode
  useEffect(() => {
    return () => {
      posthog.capture('podcast_session_ended', {
        session_duration_ms: Date.now() - startTime.current,
        podcasts_generated: podcastsGenerated,
      }, {
        send_instantly: true
      });
    };
  }, [podcastsGenerated]);

  const licenseType = subData?.currentPlan?.type;

  return (
    <Stack height="100%" maxHeight="100%" width="100%">

      {licenseType && (
        <PodcastUpsellModal isOverLimit={!!isOverLimit} licenseType={licenseType} />
      )}
      
      <div style={{height: '1px', overflow: 'hidden'}}>
        <audio 
          ref={audioRef} 
          controls={false}
        >
          Your browser does not support the audio element.
        </audio>
      </div>
      
      {isSharedVersion && (
        <Box sx={{ borderRadius: 2, bgcolor: 'gray.main', color: 'info.contrastText', p: 2, mb: 2, display: 'flex', alignItems: 'center', flexDirection: 'row', gap: 2 }}>
          <Stack justifyContent="space-between" flexGrow={1}>
            <Txt startIcon={<Info sx={{ mt: .75 }} />} stackOverrides={{ alignItems: 'start' }}>
              This is a publicly shared version of a podcast.
              <span style={{ display: 'block', zoom: .6 }} >If you are the owner, you can view the original podcast <Link href={`/app/podcast/${originalPodcastId}/player`}>here</Link>.</span>
            </Txt>
          </Stack>
          <Button size="small" startIcon={<GitFork />} onClick={handleFork} variant="contained" sx={{ mt: 1, textTransform: 'none' }}>
            Copy To Interact
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt startIcon={<Podcasts sx={{ mt: .75 }} />} variant="h6" stackOverrides={{ alignItems: 'start' }}>{topic}</Txt>
        <IconButton
          onClick={() => setIsShareModalOpen(true)}
          disabled={isGenerating}
        >
          <ShareIcon />
        </IconButton>
      </Box>

      {visualizerSource && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Box key='Speaker-1' sx={{ width: '48%', opacity: currentSpeaker === outline?.hosts?.[0]?.name ? 1 : 0.3 }}>
            <Typography variant="subtitle1" align="center">{outline?.hosts?.[0]?.name}</Typography>
            <AudioWaveformVisualizer
              audioContext={audioContextRef.current}
              sourceNode={visualizerSource}
              disabled={currentSpeaker !== outline?.hosts?.[0]?.name}
              inertia={0.9}
              barSpacing={2}
              barWidth={40}
              minBarHeight={3}
              barColor={[66, 135, 245]} // A vibrant blue
            />
          </Box>
          <Box key='Speaker-2' sx={{ width: '48%', opacity: currentSpeaker === outline?.hosts?.[1]?.name ? 1 : 0.3 }}>
            <Typography variant="subtitle1" align="center">{outline?.hosts?.[1]?.name}</Typography>
            <AudioWaveformVisualizer
              audioContext={audioContextRef.current}
              sourceNode={visualizerSource}
              disabled={currentSpeaker !== outline?.hosts?.[1]?.name}
              inertia={0.9}
              barSpacing={2}
              barWidth={40}
              minBarHeight={3}
              barColor={[245, 131, 66]} // A complementary orange
            />
          </Box>
        </Box>
      )}

      <Box 
        sx={{ mt: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        onScroll={handleScroll}
      >
        <Box sx={{ overflowY: 'auto', flexGrow: 1, minHeight: 0 }}>
          {transcript.map((dialogue, index) => {
            const isCurrent = index === currentDialogueIndex;
            const handleCardClick = (index: number) => {
              handleSkipTo(index);
            }

            const handleChipClick = (subject: string, event: React.MouseEvent) => {
              event.stopPropagation();
              handleTopicChipClick(subject);
            }

            return (
              <Card
                key={index}
                ref={isCurrent ? currentCardRef : null}
                sx={{
                  p: 1,
                  mb: 1,
                  bgcolor: isCurrent ? 'action.selected' : 'background.paper',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => handleCardClick(index)}
                onMouseEnter={handleCardHover}
                onMouseLeave={() => setUserHovered(false)}
              >
                <CardContent sx={{ p: 1 }}>
                  <Grid container alignItems="center">
                    <Grid item xs={12}>
                      <Txt variant="subtitle1" color="primary">{dialogue.speaker}</Txt>
                      <Txt variant="body1" color={isCurrent ? undefined : 'grey'}>{dialogue.dialogue}</Txt>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                        {dialogue.dig_deeper_topics?.map((subject, chipIndex) => (
                          <EnhancedChip
                            size="small"
                            key={chipIndex}
                            color={isCurrent ? "primary" : "default"}
                            label={subject}
                            onClick={(event) => handleChipClick(subject, event)}
                            icon={<ChangeCircle />}
                            sx={{
                              opacity: isCurrent ? 1 : 0.6,
                              '&:hover': {
                                opacity: 1,
                              },
                            }}
                          />
                        ))}
                      </Box>
                      {isCurrent && !currentLineHasAudio && (
                        <LinearProgress sx={{ mt: 1 }} />
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            );
          })}
          {isGenerating && (
            <SkeletonWithOverlay
              sx={{ height: 400, animationDuration: "3s" }}
              variant="rounded"
            >
              {transcript.length === 0 ? (
                <Stack>
                  <Typography variant="body1">Setting Up Your Podcast...</Typography>
                  <Txt variant="body2">This should only take a few seconds.</Txt>
                </Stack>
              ) : (
                <Stack>
                  <Typography variant="body1">Continuing Your Podcast...</Typography>
                  {changingTopicsTo && (
                    <Typography variant="body2">Changing topics to {changingTopicsTo}...</Typography>
                  )}
                </Stack>
              )}
            </SkeletonWithOverlay>
          )}
        </Box>
      </Box>

      <PodcastControls
        isPaused={isPaused}
        isAudioAvailable={isAudioAvailable}
        currentDialogueIndex={currentDialogueIndex}
        transcriptLength={transcript.length}
        isNextTopicLoading={isNextTopicLoading}
        speed={speed}
        onPlayPause={handlePlayPause}
        onSkipToPrevious={handleSkipToPreviousPodcast}
        onSeekPrevious={handleSeekPrevious}
        onSeekNext={handleSeekNext}
        onSkipToNext={handleSkipToNextPodcast}
        onSpeedChange={handleSpeedChange}
        onQueueOpen={handleQueueOpen}
      />

      <Box sx={{ mt: 2 }}>
        {currentLineHasAudio ? (
          <LinearProgress
            variant="determinate"
            value={progress}
          />
        ) : (
          <LinearProgress variant="indeterminate" />
        )}
      </Box>
      <ChatTextField
        text={userText}
        setText={(text) => {
          if (isSharedVersion && text.length > 0 && userText.length === 0) {
            showCloneDialog('type');
          } else {
            setUserText(text);
          }
        }}
        sendButtonClick={() => {
          handleSendMessage(userText);
        }}
        textSendIsDisabled={false}
        onKeyUp={function (ev: React.KeyboardEvent<HTMLDivElement>): void {
          if (ev.key === 'Enter') {
            handleSendMessage(userText);
          }
        }}
        placeholder="Join the conversation..."
      />

      <Dialog open={isTopicChangeDialogOpen} onClose={() => setIsTopicChangeDialogOpen(false)}>
        <DialogTitle>Change Topic or Add to Queue</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            How would you like to proceed with the topic "{selectedTopic}"?
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => handleTopicChangeNow(selectedTopic)}
              >
                <PlayCircle sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6">Change Now</Typography>
                <Typography variant="body2" align="center">
                  Switch to this topic immediately
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => handleAddToQueue(selectedTopic)}
              >
                <AddCircle sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6">Add to Queue</Typography>
                <Typography variant="body2" align="center">
                  Add this topic to your podcast queue
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTopicChangeDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isShareModalOpen} onClose={() => setIsShareModalOpen(false)}>
        <DialogTitle>
          <Txt startIcon={<Share />} variant="h5">Share Your Podcast</Txt>
        </DialogTitle>
        <DialogContent>
          {isGenerating ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
              <CircularProgress />
              <Typography>
                Your podcast is still being generated. Please check back later to share it.
              </Typography>
            </Box>
          ) : shareUrl ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
              <Typography>Great! Your podcast is ready to be shared. Here's the link:</Typography>
              <TextField
                fullWidth
                value={shareUrl}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        setOpenSnackbar(true);
                      }}
                    >
                      <ContentCopy />
                    </IconButton>
                  ),
                }}
                margin="normal"
              />
              <Typography variant="body2" color="text.secondary">
                Anyone with this link can listen to your shared podcast.
              </Typography>
            </Box>
          ) : (
            <Stack gap={2}>
              <Typography>
                Ready to share your podcast with the world?
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2, bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 2, p: 2 }}>

                <Txt startIcon={<InfoOutlined />} variant="body2">
                  Sharing will create a static version of your podcast that can be accessed by anyone with the link.
                  Any changes you make to the podcast after this point will not be shared.
                </Txt>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsShareModalOpen(false)}>Close</Button>
          {!shareUrl && !isGenerating && (
            <Button
              onClick={handleShare}
              disabled={isSharing}
              startIcon={isSharing ? <CircularProgress size={20} /> : <ShareIcon />}
              variant="contained"
            >
              {isSharing ? 'Sharing...' : 'Share Podcast'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={isCloneDialogOpen} onClose={() => setIsCloneDialogOpen(false)}>
        <DialogTitle>Clone Podcast to Interact</DialogTitle>
        <DialogContent>
          <Typography>
            {cloneReason === 'type' && "To type and interact with this podcast, "}
            {cloneReason === 'send' && "To send messages and interact with this podcast, "}
            {cloneReason === 'dig-deeper' && "To explore new topics and interact with this podcast, "}
            you need to clone a copy to your own account. Would you like to do this now?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCloneDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClone} variant="contained" color="primary">
            Clone Podcast
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Share link copied to clipboard!
        </Alert>
      </Snackbar>

      <PodcastNextTopicDialog
        open={isPodcastEndedDialogOpen}
        onClose={() => setIsPodcastEndedDialogOpen(false)}
        onAddToQueue={handleNextTopicSelection}
        isLoading={isNextTopicLoading}
        suggestedTopics={suggestedTopics}
      />

      {isQueueDialogOpen && (
        <QueuedItemsDialog
          open={isQueueDialogOpen}
          onClose={handleQueueDialogClose}
        />
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={4200} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
          <LinearProgressCountdown
            totalDuration={4000}
            direction={"down"}
          />
        </Alert>
        
      </Snackbar>
    </Stack>
  );
}