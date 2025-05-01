import {NextResponse} from "next/server";
import {YoutubeTranscript} from "youtube-transcript";

import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";

import {StudyNowRoute} from "./routeSchema";

// Helper function to extract video information
async function getYouTubeVideoInfo(videoId: string) {
  try {
    // Using YouTube's oEmbed API to get video information
    // This is a public API that doesn't require API keys
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!response.ok) {
      return {
        title: "",
        channelName: "Unknown Channel",
        channelUrl: null,
      };
    }
    
    const data = await response.json();
    
    // Parse channel name from author field
    const channelName = data.author_name || "Unknown Channel";
    
    // Channel URL is in author_url if available
    const channelUrl = data.author_url || null;
    
    return {
      title: data.title || "",
      channelName,
      channelUrl,
    };
  } catch (error) {
    console.error("Error fetching YouTube video info:", error);
    return {
      title: "",
      channelName: "Unknown Channel",
      channelUrl: null,
    };
  }
}

export const {POST} = makeServerApiHandlerV3({
  route: StudyNowRoute,
  handler: async (ctx) => {
    const { parsedReq, user, supabase, logger } = ctx;
    const { 
      url, 
      title: rawTitle, 
      contentType, 
      videoId, 
      channelName: clientChannelName,
      channelUrl: clientChannelUrl,
      thumbnailUrl,
      pageContent 
    } = parsedReq;

    // Clean up the title by removing " - YouTube" suffix if present
    const title = rawTitle.replace(/ - YouTube$/, '');

    logger.info(`Study Now request for ${contentType}: ${title}`);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Handle different content types
      let textContent = '';
      let metadataObj = {};
      let finalTitle = title; // Default to cleaned up title
      
      if (contentType === 'youtube' && videoId) {
        // Get video information from YouTube
        const videoInfo = await getYouTubeVideoInfo(videoId);
        
        // Use API title if available (more accurate and cleaner)
        if (videoInfo.title) {
          finalTitle = videoInfo.title;
        }
        
        // Get transcript for YouTube videos
        let transcript = '';
        let hasTranscript = false;
        
        try {
          // Fetch transcript directly
          logger.info(`Fetching transcript for video: ${videoId}`);
          const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
          transcript = transcriptArray.map(part => part.text).join(' ');
          hasTranscript = true;
        } catch (error) {
          logger.error(`Failed to fetch transcript for ${videoId}`, error);
          // We'll continue even without a transcript
          hasTranscript = false;
        }
        
        // Set content and metadata
        textContent = transcript || `YouTube video: ${finalTitle}`;
        metadataObj = {
          videoId,
          channelName: videoInfo.channelName || clientChannelName || 'Unknown Channel',
          channelUrl: videoInfo.channelUrl || clientChannelUrl,
          thumbnailUrl: thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          hasTranscript
        };
      } else {
        // For regular webpages
        textContent = pageContent || `Web page: ${title}`;
        metadataObj = {};
      }

      // Create a snip record
      const { data: snip, error } = await supabase
        .from('snip')
        .insert({
          _owner: user.rsnUserId,
          _type: contentType === 'youtube' ? 'youtube_video' : 'webpage',
          _name: finalTitle,
          source_url: url,
          text_content: textContent,
          metadata: metadataObj,
          created_by: user.rsnUserId,
          updated_by: user.rsnUserId,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating snip:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Return success response
      return {
        id: user.rsnUserId,
        url,
        title: finalTitle,
        contentType,
        snipId: snip.id,
        hasTranscript: contentType === 'youtube' ? (metadataObj as any).hasTranscript : undefined
      };
    } catch (error) {
      logger.error('Error in study_now handler:', error);
      return NextResponse.json({ 
        error: 'Failed to process study request' 
      }, { status: 500 });
    }
  }
}); 