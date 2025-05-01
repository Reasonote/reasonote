// Import the configuration
import { getConfig } from './config';

const config = getConfig();

// Log when the background script starts
console.log('[RSN_BACKGROUND] Background script started');
console.log('[RSN_BACKGROUND] Current config:', config);

// Let's manually try to read manifest config as a fallback
try {
  const manifest = chrome.runtime.getManifest();
  console.log('[RSN_BACKGROUND] Retrieved manifest:', manifest);
  
  if (manifest.supabase) {
    console.log('[RSN_BACKGROUND] Found Supabase config in manifest:', manifest.supabase);
  }
} catch (error) {
  console.error('[RSN_BACKGROUND] Error retrieving manifest:', error);
}

function contextMenuOnClick(info: any, tab: any) {
    console.log("contextMenuOnClick", info, tab);
    if (info.menuItemId === "reasonoteAddText" && info.selectionText) {
        console.log("reasonoteAddText -- sending message to content script");
        // Save this to local storage
        chrome.storage.local.set({ selectedText: info.selectionText }, () => {
            console.log('Selected text stored.');
        });

        // throw new Error("tab.id: " + tab.id + " info: " + JSON.stringify(info) + " tab: " + JSON.stringify(tab));

        // // Send a message to the popup script
        chrome.tabs.sendMessage(tab.id, { type: "SHOW_POPUP", text: info.selectionText });
    }
    else if (info.menuItemId === "ask-reasonote") {
        console.log("ask-reasonote -- sending message to content script");
        // Send a message to the content script
        chrome.tabs.sendMessage(tab.id, { type: "ASK_REASONOTE" });
    }
}

// Auth token handling
function handleAuthToken(token: string) {
    console.log('[RSN_BACKGROUND] Storing auth token');
    
    // Store the token in chrome.storage.local
    chrome.storage.local.set({ authToken: token }, () => {
        if (chrome.runtime.lastError) {
            console.error('[RSN_BACKGROUND] Error storing auth token:', chrome.runtime.lastError);
        } else {
            console.log('[RSN_BACKGROUND] Auth token stored successfully');
        }
    });
}

// Function to fetch YouTube transcript
async function fetchYouTubeTranscript(youtubeUrl: string, authToken: string) {
    console.log('[RSN_BACKGROUND] Fetching transcript for:', youtubeUrl);
    
    // Use the configured API URL
    const apiUrl = `${config.api.baseUrl}/integrations/youtube/getTranscript`;
    console.log(`[RSN_BACKGROUND] Sending transcript request to: ${apiUrl}`);
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                youtubeUrl: youtubeUrl,
                skipAiProcessing: true
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[RSN_BACKGROUND] Transcript fetched successfully');
        return { success: true, transcript: data.transcript };
    } catch (error) {
        console.error('[RSN_BACKGROUND] Error fetching transcript:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
    // Handle AUTH_TOKEN message
    if (request.type === 'AUTH_TOKEN' && request.token) {
        handleAuthToken(request.token);
        sendResponse({ success: true });
        return;
    }
 
    if (request.action === 'genObject') {
        // Use the configured API URL
        const apiUrl = `${config.api.baseUrl}/ai/serve`;
        console.log(`[RSN_EXT] Sending request to: ${apiUrl}`);
        
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                function: 'genObject',
                args: request.data
            })
        })
            .then(response => response.json())
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));

        return true; // Indicates that the response is sent asynchronously
    }
    
    // Handle YouTube video data
    if (request.action === 'youtube_video_viewed') {
        console.log('[RSN_BACKGROUND] YouTube video viewed:', request.data.title);
        
        // Check if user is logged in by checking for auth token
        chrome.storage.local.get(['authToken'], (result: any) => {
            if (!result.authToken) {
                console.log('[RSN_BACKGROUND] User not logged in, not sending YouTube data');
                sendResponse({ success: false, error: 'User not logged in' });
                return;
            }

            console.log('[RSN_BACKGROUND] User logged in, sending YouTube data -- authToken:', result.authToken);
            
            // Use the configured API URL for the new chrome-extension-event endpoint
            const apiUrl = `${config.api.baseUrl}/chrome-extension-event`;
            console.log(`[RSN_BACKGROUND] Sending YouTube data to: ${apiUrl}`);
            
            // Transform data to match the new API format
            const eventData = {
                site_url: request.data.url,
                page_title: request.data.title,
                event_type: 'page_view',
                metadata: {
                    videoId: request.data.videoId,
                    channelName: request.data.channelName,
                    channelUrl: request.data.channelUrl,
                    thumbnailUrl: request.data.thumbnailUrl
                },
                viewed_at: request.data.viewedAt
            };
            
            // Send data to backend
            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${result.authToken}`
                },
                body: JSON.stringify(eventData)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('[RSN_BACKGROUND] YouTube data sent successfully:', data);
                    sendResponse({ success: true, data });
                })
                .catch(error => {
                    console.error('[RSN_BACKGROUND] Error sending YouTube data:', error);
                    sendResponse({ success: false, error: error.message });
                });
        });
        
        return true; // Indicates that the response is sent asynchronously
    }
    
    // Handle YouTube transcript fetching
    if (request.action === 'fetch_youtube_transcript') {
        console.log('[RSN_BACKGROUND] Fetch YouTube transcript request:', request.data);
        
        // Check if user is logged in by checking for auth token
        chrome.storage.local.get(['authToken'], (result: any) => {
            if (!result.authToken) {
                console.log('[RSN_BACKGROUND] User not logged in, not fetching transcript');
                sendResponse({ success: false, error: 'User not logged in' });
                return;
            }
            
            // Fetch transcript
            fetchYouTubeTranscript(request.data.youtubeUrl, result.authToken)
                .then(response => {
                    sendResponse(response);
                })
                .catch(error => {
                    console.error('[RSN_BACKGROUND] Error in fetchYouTubeTranscript:', error);
                    sendResponse({ 
                        success: false, 
                        error: error instanceof Error ? error.message : String(error)
                    });
                });
        });
        
        return true; // Indicates that the response is sent asynchronously
    }
});

chrome.runtime.onInstalled.addListener(() => {
    console.log('chrome.runtime.onInstalled');
    console.log('[RSN_EXT] Extension configuration:', config);

    try {
        // Create context menu items
        if (chrome.contextMenus) {
            // Clear existing menu items to avoid duplicates
            chrome.contextMenus.removeAll(() => {
                // Create new menu items
                chrome.contextMenus.create({
                    id: "reasonoteAddText",
                    title: "Add to Reasonote",
                    contexts: ["selection"]
                });

                chrome.contextMenus.create({
                    id: "ask-reasonote",
                    title: "Ask Reasonote",
                    contexts: ["all"],
                });

                // Add listener for when the user clicks on the context menu item
                chrome.contextMenus.onClicked.addListener(contextMenuOnClick);
                
                console.log('[RSN_EXT] Context menus created successfully');
            });
        } else {
            console.warn('[RSN_EXT] Context menus API not available');
        }
    } catch (error) {
        console.error('[RSN_EXT] Error creating context menus:', error);
    }
});
