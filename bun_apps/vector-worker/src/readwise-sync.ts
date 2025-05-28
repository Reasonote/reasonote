import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Configuration
const INTEGRATION_INGESTION_BATCH_SIZE = parseInt(process.env.INTEGRATION_INGESTION_BATCH_SIZE || '25');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ReadwiseExportHighlight {
  id: number;
  is_deleted: boolean;
  text: string;
  location: number | null;
  location_type: string;
  note: string | null;
  color: string;
  highlighted_at: string;
  created_at: string;
  updated_at: string;
  external_id: string | null;
  end_location: number | null;
  url: string | null;
  book_id: number;
  tags: { name: string }[];
  is_favorite: boolean;
  is_discard: boolean;
  readwise_url: string;
}

interface ReadwiseExportBook {
  user_book_id: number;
  is_deleted: boolean;
  title: string;
  author: string | null;
  readable_title: string;
  source: string;
  cover_image_url: string | null;
  unique_url: string;
  book_tags: { name: string }[];
  category: string;
  document_note: string;
  summary: string;
  readwise_url: string;
  source_url: string | null;
  asin: string | null;
  highlights: ReadwiseExportHighlight[];
}

interface ReadwiseExportResponse {
  count: number;
  nextPageCursor: string | null;
  results: ReadwiseExportBook[];
}

// Wrapper function to handle Readwise API calls with retry-after logic
async function fetchWithRetryAfter(url: string, token: string): Promise<Response> {
  while (true) {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default to 60 seconds
      console.log(`Rate limited on ${url}. Waiting ${waitTime}ms before retrying...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue; // Retry the same URL
    }

    if (!response.ok) {
      throw new Error(`Readwise API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }
}

export async function syncReadwiseHighlights() {
  console.log('Starting Readwise sync process...');
  
  // Log batch size configuration
  if (!process.env.INTEGRATION_INGESTION_BATCH_SIZE) {
    console.log(`Using default integration batch size: ${INTEGRATION_INGESTION_BATCH_SIZE}`);
  } else {
    console.log(`Using configured integration batch size: ${INTEGRATION_INGESTION_BATCH_SIZE}`);
  }

  try {
    // Get integrations that need syncing
    const { data: integrations, error: integrationsError } = await supabase
      .from('integration')
      .select(`
        id,
        for_user,
        last_synced,
        sync_in_progress_since,
        metadata,
        integration_token (
          token
        )
      `)
      .eq('_type', 'readwise')
      .or('last_synced.is.null,last_synced.lt.now() - interval \'1 hour\'')
      .is('sync_in_progress_since', null);

    if (integrationsError) {
      console.error('Error fetching integrations:', integrationsError);
      return;
    }

    if (!integrations || integrations.length === 0) {
      console.log('No Readwise integrations need syncing');
      return;
    }

    console.log(`Found ${integrations.length} integrations to sync`);
    console.log(`Processing integrations in batches of ${INTEGRATION_INGESTION_BATCH_SIZE}`);

    // Process integrations in batches concurrently
    const integrationBatches = [];
    for (let i = 0; i < integrations.length; i += INTEGRATION_INGESTION_BATCH_SIZE) {
      integrationBatches.push(integrations.slice(i, i + INTEGRATION_INGESTION_BATCH_SIZE));
    }

    for (const batch of integrationBatches) {
      console.log(`Processing batch of ${batch.length} integrations concurrently`);
      await Promise.all(batch.map(integration => syncIntegration(integration)));
    }

  } catch (error) {
    console.error('Error in Readwise sync process:', error);
  }
}

async function syncIntegration(integration: any) {
  const integrationId = integration.id;
  const userId = integration.for_user;
  const token = integration.integration_token?.[0]?.token;

  if (!token) {
    console.error(`No token found for integration ${integrationId}`);
    await updateSyncError(integrationId, 'No API token found');
    return;
  }

  console.log(`Syncing integration ${integrationId} for user ${userId}`);

  try {
    // Mark sync as in progress
    await supabase
      .from('integration')
      .update({
        sync_in_progress_since: new Date().toISOString(),
        sync_error: null,
        sync_error_count: 0,
      })
      .eq('id', integrationId);

    // Get the last sync date to only fetch new/updated highlights
    const lastSynced = integration.last_synced;
    const updatedAfter = lastSynced ? new Date(lastSynced).toISOString() : null;

    // Fetch books with embedded highlights using export API
    const books = await fetchReadwiseExport(token, updatedAfter);
    
    console.log(`Fetched ${books.length} books for integration ${integrationId}`);

    // Process all highlights from all books
    let totalHighlights = 0;
    for (const book of books) {
      if (book.highlights && book.highlights.length > 0) {
        // Filter out deleted highlights
        const activeHighlights = book.highlights.filter(h => !h.is_deleted);
        totalHighlights += activeHighlights.length;
        
        // Process highlights in batches
        const highlightBatchSize = 100;
        for (let i = 0; i < activeHighlights.length; i += highlightBatchSize) {
          const batch = activeHighlights.slice(i, i + highlightBatchSize);
          await processHighlightsBatch(batch, book, integrationId, userId);
        }
      }
    }

    console.log(`Processed ${totalHighlights} highlights for integration ${integrationId}`);

    // Mark sync as complete
    await supabase
      .from('integration')
      .update({
        last_synced: new Date().toISOString(),
        sync_in_progress_since: null,
        sync_error: null,
        sync_error_count: 0,
      })
      .eq('id', integrationId);

    console.log(`Successfully synced integration ${integrationId}`);

  } catch (error) {
    console.error(`Error syncing integration ${integrationId}:`, error);
    await updateSyncError(integrationId, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function fetchReadwiseExport(token: string, updatedAfter?: string | null): Promise<ReadwiseExportBook[]> {
  const books: ReadwiseExportBook[] = [];
  let nextPageCursor: string | null = null;

  while (true) {
    const queryParams = new URLSearchParams();
    if (nextPageCursor) {
      queryParams.append('pageCursor', nextPageCursor);
    }
    if (updatedAfter) {
      queryParams.append('updatedAfter', updatedAfter);
    }

    const url = `https://readwise.io/api/v2/export/?${queryParams.toString()}`;
    console.log('Making export API request with params:', queryParams.toString());
    
    const response = await fetchWithRetryAfter(url, token);
    const data: ReadwiseExportResponse = await response.json();
    
    books.push(...data.results);
    nextPageCursor = data.nextPageCursor;
    
    if (!nextPageCursor) {
      break;
    }

    // Add a small delay to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return books;
}

async function processHighlightsBatch(
  highlights: ReadwiseExportHighlight[], 
  book: ReadwiseExportBook,
  integrationId: string,
  userId: string
) {
  const highlightsToInsert = highlights.map(highlight => {
    const metadata = {
      title: book.title,
      author: book.author,
      category: book.category,
      source: book.source,
      cover_image_url: book.cover_image_url,
      source_url: book.source_url,
      asin: book.asin,
      readwise_book_id: book.user_book_id,
      readwise_highlight_id: highlight.id,
      color: highlight.color,
      location_type: highlight.location_type,
      is_favorite: highlight.is_favorite,
      book_tags: book.book_tags,
      readable_title: book.readable_title,
    };
    
    return {
      content: highlight.text,
      note: highlight.note,
      location: highlight.location?.toString() || null,
      highlighted_at: highlight.highlighted_at,
      tags: highlight.tags.map(tag => tag.name),
      source_external_id: highlight.id.toString(),
      source_integration_id: integrationId,
      source_name: inferSourceName(metadata),
      source_metadata: metadata,
      target_url: highlight.readwise_url, // Use the provided readwise_url
      created_by: userId,
      updated_by: userId,
    };
  });

  // Use upsert to handle duplicates
  const { error } = await supabase
    .from('highlight')
    .upsert(highlightsToInsert, {
      onConflict: 'source_external_id,source_integration_id',
      ignoreDuplicates: false,
    });

  if (error) {
    console.error('Error inserting highlights batch:', error);
    throw error;
  }

  console.log(`Processed batch of ${highlights.length} highlights`);
}

async function updateSyncError(integrationId: string, errorMessage: string) {
  // Get current error count
  const { data: integration } = await supabase
    .from('integration')
    .select('sync_error_count')
    .eq('id', integrationId)
    .single();

  const errorCount = (integration?.sync_error_count || 0) + 1;

  await supabase
    .from('integration')
    .update({
      sync_error: errorMessage,
      sync_error_count: errorCount,
      sync_in_progress_since: null,
      last_synced: new Date().toISOString(), // Update to prevent immediate retry
    })
    .eq('id', integrationId);
}

export async function readwiseSyncLoop() {
  console.log('Starting Readwise sync loop...');
  
  while (true) {
    try {
      await syncReadwiseHighlights();
    } catch (error) {
      console.error('Error in Readwise sync loop:', error);
    }
    
    // Wait 5 minutes before next sync check
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
  }
}

// Helper function to infer source name from Readwise metadata
function inferSourceName(metadata: any): string {
  if (!metadata) return 'Unknown Source';
  
  // Use title if available, otherwise fall back to source type
  if (metadata.title) {
    return metadata.title;
  }
  
  // Capitalize and format source type
  if (metadata.source) {
    return metadata.source.charAt(0).toUpperCase() + metadata.source.slice(1);
  }
  
  return 'Unknown Source';
} 