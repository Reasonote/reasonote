# YouTube Video Detection Feature - PRD

## Overview
This feature will allow the Chrome extension to detect and collect information about YouTube videos that the user is watching, and send this data to the Reasonote backend.

## Requirements
1. Detect when a user is watching a YouTube video
2. Extract video metadata (title, channel, video ID, URL, thumbnail if available)
3. Track when a user watches a video for longer than 5 seconds
4. Send collected data to the backend when user is logged in
5. Store video viewing data in Supabase database

## Technical Implementation
1. Update manifest.json to include YouTube-specific permissions
2. Create a YouTube-specific content script to detect and extract video data
3. Implement view time tracking (minimum 5 seconds)
4. Create a backend API route to receive YouTube video data
5. Create a Supabase migration to add table for storing YouTube video data
6. Add authentication checks to ensure data is only sent for logged-in users

## Backend Components
1. New API route following standard route pattern (`route.api.ts` & `routeSchema.ts`)
2. Supabase table for storing video viewing data
3. Support for tracking video metadata, viewing time, and user information

## User Experience
- The extension should detect videos automatically without user intervention
- Detection should not affect the YouTube viewing experience
- Detection should work for both embedded and standard YouTube videos
- Data should only be sent to backend if user is logged in and views video for >5 seconds

## Data to Collect
- Video title
- Video URL
- Video ID
- Channel information
- Thumbnail URL (if available)
- Watch time (when video was viewed)
- User identifier (from authenticated session)

## Implementation Challenges and Considerations

### Manifest V3 Limitations
1. **Service Worker Lifetime**: In Manifest V3, background scripts are replaced by service workers that can be terminated when inactive. We need to ensure our timer logic is resilient to service worker termination and restart.
2. **Content Script Execution**: Content scripts in Manifest V3 might not always execute on dynamic page loads. We'll need to use the `chrome.scripting` API to ensure scripts are injected properly.
3. **Host Permission Handling**: We'll need to handle host permissions correctly, possibly using the `activeTab` permission combined with specific host permissions for YouTube.

### YouTube-Specific Challenges
1. **YouTube SPA Architecture**: YouTube is a Single Page Application (SPA) that dynamically loads content. We'll need to use mutation observers to detect when new videos are loaded.
2. **YouTube's DOM Structure Changes**: YouTube occasionally changes its DOM structure. We should implement robust selectors that can handle minor DOM changes.
3. **Embedded Videos**: Detecting YouTube videos embedded in other sites might require different detection strategies than on youtube.com.

### Data Security and Performance
1. **Authentication Token Handling**: Ensure secure handling of authentication tokens when sending data to the backend.
2. **Bandwidth and Storage Consideration**: Be mindful of the amount of data being sent, especially if thumbnail URLs are included.
3. **Rate Limiting**: Implement rate limiting to prevent overwhelming the backend with data if a user watches many videos in succession.

### Testing Limitations
- Manual testing will be required for most Chrome extension functionality since automated testing is challenging.
- Consider implementing logging mechanisms to help with debugging during manual testing.

## Questions
- Do we need to track watch history or just the currently playing video?
- Should we capture screenshots or thumbnails of the video?
- Should we track watch time or just detect the video being watched?
- What specific actions should be available when a YouTube video is detected? 