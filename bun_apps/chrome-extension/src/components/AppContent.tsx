import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  BookOpen,
  ExternalLink,
} from 'lucide-react';

import { useStoreAuthToken } from '@/hooks/useStoreAuthToken';

import { getConfig } from '../config';
import { useSupabase } from '../contexts/SupabaseContext';
import { AuthButtons } from './AuthButtons';
import { ReasonoteIcon } from './ReasonoteIcon';

type ClipState = 'idle' | 'clipping' | 'clipped' | 'error';
type StudyState = 'idle' | 'loading' | 'success' | 'error';

interface PageContent {
    title: string;
    text: string;
    url: string;
    isYouTube: boolean;
    videoId?: string;
    channelName?: string;
    channelUrl?: string;
    thumbnailUrl?: string;
}

function getPageContent() {
    // Check if this is a YouTube page
    const url = window.location.href;
    const isYouTube = url.includes('youtube.com/') || url.includes('youtu.be/');
    
    // Extract YouTube specific info if needed
    let videoId = '';
    let channelName = '';
    let channelUrl = '';
    let thumbnailUrl = '';
    
    if (isYouTube) {
        // Extract video ID from URL
        if (url.includes('youtube.com/watch')) {
            const urlParams = new URLSearchParams(window.location.search);
            videoId = urlParams.get('v') || '';
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
        } else if (url.includes('youtube.com/shorts/')) {
            videoId = url.split('youtube.com/shorts/')[1]?.split('?')[0] || '';
        }
        
        // Get channel info
        const channelElement = document.querySelector('ytd-channel-name #text-container, #owner-name a, meta[property="og:video:tag"]');
        channelName = channelElement ? (channelElement as HTMLElement).innerText : 'Unknown Channel';
        
        // Get channel URL
        const channelLinkElement = document.querySelector('#owner-name a, ytd-channel-name a');
        channelUrl = channelLinkElement ? (channelLinkElement as HTMLAnchorElement).href : '';
        
        // Get thumbnail URL (use YouTube API image format)
        if (videoId) {
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
    }
    
    return {
        title: document.title,
        text: document.body.innerText,
        url: window.location.href,
        isYouTube,
        videoId,
        channelName,
        channelUrl,
        thumbnailUrl
    };
}

export const AppContent = () => {
    const [pageContent, setPageContent] = useState<PageContent | null>(null);
    const { user, supabase, loading } = useSupabase();
    const [insertResult, setInsertResult] = useState<any>();
    const [error, setError] = useState<string | null>(null);
    const [clipState, setClipState] = useState<ClipState>('idle');
    const [studyState, setStudyState] = useState<StudyState>('idle');
    const [studyResult, setStudyResult] = useState<any>(null);
    const hasClippedRef = useRef(false);
    const config = getConfig();

    const clipCurrentPage = useCallback(async () => {
        if (!supabase || !pageContent || hasClippedRef.current) return;

        hasClippedRef.current = true;
        setClipState('clipping');
        setError(null);

        try {
            const result = await supabase.from('rsn_page').insert([
                {
                    _name: pageContent.title,
                    body: pageContent.text,
                }
            ]).select('*');

            setInsertResult(result);

            if (result.error) {
                throw new Error(result.error.message);
            }
            setClipState('clipped');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to clip page');
            console.error('Clipping error:', err);
            setClipState('error');
            hasClippedRef.current = false; // Reset so we can try again
        }
    }, [supabase, pageContent]);

    const studyNow = useCallback(async () => {
        if (!pageContent || studyState === 'loading') return;
        
        setStudyState('loading');
        setError(null);
        
        try {
            // Get the auth token
            const token = await new Promise<string>((resolve, reject) => {
                chrome.storage.local.get(['authToken'], (result: { authToken?: string }) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    
                    if (!result.authToken) {
                        reject(new Error('No auth token found'));
                        return;
                    }
                    
                    resolve(result.authToken);
                });
            });
            
            // Prepare request data
            const requestData = {
                url: pageContent.url,
                title: pageContent.title,
                contentType: pageContent.isYouTube ? 'youtube' : 'webpage',
                pageContent: !pageContent.isYouTube ? pageContent.text : undefined,
                videoId: pageContent.isYouTube ? pageContent.videoId : undefined,
                channelName: pageContent.isYouTube ? pageContent.channelName : undefined,
                channelUrl: pageContent.isYouTube ? pageContent.channelUrl : undefined,
                thumbnailUrl: pageContent.isYouTube ? pageContent.thumbnailUrl : undefined,
            };
            
            // Send to our API
            const apiUrl = `${config.api.baseUrl}/extension/actions/study_now`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create study resource');
            }
            
            const result = await response.json();
            setStudyResult(result);
            setStudyState('success');
            
            // Open the study page
            chrome.tabs.create({
                url: `${config.api.baseUrl.replace('/api', '')}/app/extension/study_now?snipId=${result.snipId}`
            });
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create study resource');
            console.error('Study Now error:', err);
            setStudyState('error');
        }
    }, [pageContent, studyState, config.api.baseUrl]);

    useStoreAuthToken();

    // Get page content when extension opens
    useEffect(() => {
        if (!user) return;

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs: any) {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: getPageContent,
                },
                async (injectionResults: any) => {
                    if (!injectionResults?.length) return;
                    const frameResult = injectionResults[0].result;
                    if (frameResult) {
                        setPageContent(frameResult);
                        // Don't automatically clip anymore
                        // await clipCurrentPage();
                    }
                }
            );
        });
    }, [user]);

    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
            hasClippedRef.current = false; // Reset clip state on logout
            setStudyState('idle');
        }
    };

    const openInReasonnote = () => {
        const id = insertResult?.data?.[0]?.id;
        if (!id) return;
        chrome.tabs.create({
            url: `https://reasonote.com/app/documents?selectedDocId=${id}&focusedMode=true`
        });
    };

    return (
        <div className="w-[400px] p-6 bg-white shadow-lg" style={{ minWidth: '400px' }}>
            <div className="flex items-center gap-2 justify-center mb-4">
                <div className="w-10 h-10">
                    <ReasonoteIcon />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Reasonote Clipper</h2>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500">Loading...</p>
                    </div>
                ) : user ? (
                    <>
                        {/* Study Now button */}
                        <button
                            onClick={studyNow}
                            disabled={studyState === 'loading'}
                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg transition-colors mb-3"
                        >
                            {studyState === 'loading' ? (
                                <span>Creating study resource...</span>
                            ) : (
                                <>
                                    <BookOpen className="w-5 h-5" />
                                    <span>Study Now</span>
                                </>
                            )}
                        </button>

                        {error && (
                            <div className="bg-red-50 p-4 rounded-lg mb-3">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {clipState === 'error' ? (
                            <div className="bg-red-50 p-4 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                                <button
                                    onClick={clipCurrentPage}
                                    className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : clipState === 'clipping' ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-gray-500">Clipping page...</p>
                            </div>
                        ) : clipState === 'clipped' ? (
                            <button
                                onClick={openInReasonnote}
                                className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                            >
                                View in Reasonote
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        ) : null}

                        <div className="pt-2">
                            <button
                                onClick={handleLogout}
                                className="w-full text-sm text-gray-500 hover:text-gray-700"
                            >
                                Sign out
                            </button>
                        </div>
                    </>
                ) : (
                    <AuthButtons />
                )}
            </div>
        </div>
    );
}; 