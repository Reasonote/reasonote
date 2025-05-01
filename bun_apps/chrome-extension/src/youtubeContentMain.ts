// Setup logger for debugging
const logger = {
    log: (...args: any[]) => console.log('[RSN_YT_EXT]', ...args),
    error: (...args: any[]) => console.error('[RSN_YT_EXT]', ...args),
    warn: (...args: any[]) => console.warn('[RSN_YT_EXT]', ...args),
    info: (...args: any[]) => console.info('[RSN_YT_EXT]', ...args),
    debug: (...args: any[]) => console.debug('[RSN_YT_EXT]', ...args),
};

interface YouTubeVideoData {
    videoId: string;
    title: string;
    url: string;
    channelName: string;
    channelUrl: string | null;
    thumbnailUrl: string | null;
    viewedAt: string; // ISO string
}

interface TranscriptCacheEntry {
    transcript: string;
    fetchedAt: string; // ISO string
}

interface TranscriptCache {
    [videoId: string]: TranscriptCacheEntry;
}

// Store the current video ID to avoid duplicate reporting
let currentVideoId: string | null = null;
// Timer to track view duration
let viewTimer: number | null = null;
// Minimum view time in milliseconds before reporting
const MIN_VIEW_TIME = 5000; // 5 seconds
// Maximum cache size (number of transcripts)
const MAX_CACHE_SIZE = 50;
// Cache expiration time (30 days in milliseconds)
const CACHE_EXPIRATION_TIME = 30 * 24 * 60 * 60 * 1000;

// Function to extract video data from the current page
function extractVideoData(): YouTubeVideoData | null {
    try {
        // For youtube.com/watch pages
        const url = window.location.href;
        const urlParams = new URLSearchParams(window.location.search);
        let videoId = urlParams.get('v');
        
        if (!videoId) {
            // Try to extract from different YouTube URL formats
            const pathParts = window.location.pathname.split('/');
            if (pathParts.includes('shorts')) {
                // For YouTube Shorts
                const shortsIndex = pathParts.indexOf('shorts');
                if (shortsIndex >= 0 && pathParts.length > shortsIndex + 1) {
                    videoId = pathParts[shortsIndex + 1];
                }
            } else if (pathParts.includes('embed')) {
                // For embedded videos
                const embedIndex = pathParts.indexOf('embed');
                if (embedIndex >= 0 && pathParts.length > embedIndex + 1) {
                    videoId = pathParts[embedIndex + 1];
                }
            }
        }

        if (!videoId) {
            logger.warn('Could not extract video ID from URL:', url);
            return null;
        }

        // Get video title
        const titleElement = document.querySelector('h1.title.style-scope.ytd-video-primary-info-renderer, .ytp-title-link, meta[property="og:title"]') as HTMLElement | null;
        const title = titleElement ? 
            (titleElement.innerText || (titleElement as HTMLMetaElement).content) : 
            document.title.replace(' - YouTube', '');

        // Get channel information
        const channelElement = document.querySelector('ytd-channel-name #text-container, #owner-name a, meta[property="og:video:tag"]') as HTMLElement | null;
        const channelName = channelElement ? 
            channelElement.innerText : 
            'Unknown Channel';

        // Get channel URL
        const channelLinkElement = document.querySelector('#owner-name a, ytd-channel-name a') as HTMLAnchorElement | null;
        const channelUrl = channelLinkElement ? channelLinkElement.href : null;

        // Get thumbnail URL (use YouTube API image format)
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        return {
            videoId,
            title,
            url,
            channelName,
            channelUrl,
            thumbnailUrl,
            viewedAt: new Date().toISOString()
        };
    } catch (error) {
        logger.error('Error extracting video data:', error);
        return null;
    }
}

// Function to check if video is actually playing
function isVideoPlaying(): boolean {
    const video = document.querySelector('video');
    return video !== null && !video.paused && video.currentTime > 0;
}

// Function to start tracking video view
function startTracking(videoData: YouTubeVideoData) {
    logger.debug('Starting to track video view:', videoData.title);
    
    // Clear any existing timer
    if (viewTimer !== null) {
        clearTimeout(viewTimer);
    }
    
    // Start a new timer
    viewTimer = setTimeout(() => {
        sendVideoData(videoData);
        fetchTranscriptIfNeeded(videoData);
    }, MIN_VIEW_TIME) as unknown as number;
}

// Function to stop tracking
function stopTracking() {
    if (viewTimer !== null) {
        clearTimeout(viewTimer);
        viewTimer = null;
    }
}

// Function to send video data to background script
function sendVideoData(videoData: YouTubeVideoData) {
    logger.info('Sending video data to background script:', videoData.title);
    
    try {
        chrome.runtime.sendMessage({
            action: 'youtube_video_viewed',
            data: videoData
        }, (response: any) => {
            if (chrome.runtime.lastError) {
                logger.error('Error sending message:', chrome.runtime.lastError);
                return;
            }
            
            logger.debug('Background script response:', response);
        });
    } catch (error) {
        // Handle extension context invalidated errors
        logger.error('Failed to send video data - extension context may be invalid:', error);
        
        // Reset tracking state to allow future attempts
        currentVideoId = null;
        if (viewTimer !== null) {
            clearTimeout(viewTimer);
            viewTimer = null;
        }
    }
}

// Function to manage transcript cache size
async function manageTranscriptCache(cache: TranscriptCache): Promise<TranscriptCache> {
    // Get all entries
    const entries = Object.entries(cache);
    
    // If cache size is under the limit, return as is
    if (entries.length <= MAX_CACHE_SIZE) {
        return cache;
    }
    
    // Remove expired entries
    const now = Date.now();
    const validEntries = entries.filter(([_, entry]) => {
        const entryTime = new Date(entry.fetchedAt).getTime();
        return now - entryTime < CACHE_EXPIRATION_TIME;
    });
    
    // If still over limit, remove oldest entries
    if (validEntries.length > MAX_CACHE_SIZE) {
        validEntries.sort((a, b) => {
            const timeA = new Date(a[1].fetchedAt).getTime();
            const timeB = new Date(b[1].fetchedAt).getTime();
            return timeA - timeB; // Sort oldest first
        });
        
        // Keep only the newest MAX_CACHE_SIZE entries
        const newEntries = validEntries.slice(validEntries.length - MAX_CACHE_SIZE);
        
        // Convert back to object
        const newCache: TranscriptCache = {};
        for (const [videoId, entry] of newEntries) {
            newCache[videoId] = entry;
        }
        
        return newCache;
    } else {
        // Convert valid entries back to object
        const newCache: TranscriptCache = {};
        for (const [videoId, entry] of validEntries) {
            newCache[videoId] = entry;
        }
        
        return newCache;
    }
}

// Function to check if transcript is in cache and fetch if needed
async function fetchTranscriptIfNeeded(videoData: YouTubeVideoData) {
    try {
        // Check if transcript is already in cache
        const transcriptCache = await getTranscriptCache();
        
        if (transcriptCache[videoData.videoId]) {
            logger.info('Transcript already in cache for video:', videoData.title);
            return;
        }
        
        logger.info('Fetching transcript for video:', videoData.title);
        
        // Send request to background script to fetch transcript
        chrome.runtime.sendMessage({
            action: 'fetch_youtube_transcript',
            data: {
                videoId: videoData.videoId,
                youtubeUrl: videoData.url
            }
        }, async (response: any) => {
            if (chrome.runtime.lastError) {
                logger.error('Error fetching transcript:', chrome.runtime.lastError);
                return;
            }
            
            if (response && response.transcript) {
                logger.info('Received transcript for video:', videoData.title);
                
                // Add to cache
                const newCache = {
                    ...transcriptCache,
                    [videoData.videoId]: {
                        transcript: response.transcript,
                        fetchedAt: new Date().toISOString()
                    }
                };
                
                // Manage cache size
                const managedCache = await manageTranscriptCache(newCache);
                
                // Save updated cache
                await saveTranscriptCache(managedCache);
                
                logger.debug('Transcript cached for video:', videoData.title);
            } else {
                logger.warn('Failed to fetch transcript for video:', videoData.title);
            }
        });
    } catch (error) {
        logger.error('Error in fetchTranscriptIfNeeded:', error);
    }
}

// Function to get transcript cache from storage
async function getTranscriptCache(): Promise<TranscriptCache> {
    return new Promise((resolve) => {
        chrome.storage.local.get('transcript_cache', (result: { transcript_cache?: TranscriptCache }) => {
            resolve(result.transcript_cache || {});
        });
    });
}

// Function to save transcript cache to storage
async function saveTranscriptCache(cache: TranscriptCache): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.set({ transcript_cache: cache }, () => {
            resolve();
        });
    });
}

// Main function to monitor video changes
function monitorVideoChanges() {
    // YouTube is a SPA, so we use MutationObserver to detect page changes
    const observer = new MutationObserver(() => {
        const videoData = extractVideoData();
        
        if (videoData && isVideoPlaying() && videoData.videoId !== currentVideoId) {
            logger.info('New video detected:', videoData.title);
            currentVideoId = videoData.videoId;
            startTracking(videoData);
        }
    });
    
    // Start observing the body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Also check video state changes through event listeners
    document.addEventListener('play', (event) => {
        const target = event.target as HTMLVideoElement;
        if (target && target.tagName === 'VIDEO') {
            const videoData = extractVideoData();
            if (videoData) {
                logger.debug('Video play event detected');
                startTracking(videoData);
            }
        }
    }, true);
    
    document.addEventListener('pause', (event) => {
        const target = event.target as HTMLVideoElement;
        if (target && target.tagName === 'VIDEO') {
            logger.debug('Video pause event detected');
            stopTracking();
        }
    }, true);
    
    // Initial check
    setTimeout(() => {
        const videoData = extractVideoData();
        if (videoData && isVideoPlaying()) {
            logger.info('Initial video detected:', videoData.title);
            currentVideoId = videoData.videoId;
            startTracking(videoData);
        }
    }, 1000);
}

// Export main function to be called by the content script
export function main() {
    logger.info('YouTube content script loaded');
    
    // Wait for page to be fully loaded
    if (document.readyState === 'complete') {
        monitorVideoChanges();
    } else {
        window.addEventListener('load', () => {
            monitorVideoChanges();
        });
    }
} 