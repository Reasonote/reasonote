import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ReadwiseHighlight {
  id: number;
  text: string;
  note: string | null;
  location: number | null;
  location_type: string;
  highlighted_at: string;
  url: string | null;
  color: string;
  updated: string;
  book_id: number;
  tags: { name: string }[];
}

interface ReadwiseBook {
  id: number;
  title: string;
  author: string | null;
  category: string;
  source: string;
  num_highlights: number;
  last_highlight_at: string | null;
  updated: string;
  cover_image_url: string | null;
  highlights_url: string;
  source_url: string | null;
  asin: string | null;
  tags: { name: string }[];
}

interface ReadwiseResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReadwiseHighlight[];
}

interface ReadwiseBooksResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReadwiseBook[];
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
      .or('last_synced.is.null');
      // .or('last_synced.lt.now() - interval \'1 hour\'')
      // .is('sync_in_progress_since', null);

    console.log('integrations', integrations, 'integrationsError', integrationsError);

    if (integrationsError) {
      console.error('Error fetching integrations:', integrationsError);
      return;
    }

    if (!integrations || integrations.length === 0) {
      console.log('No Readwise integrations need syncing');
      return;
    }

    console.log(`Found ${integrations.length} integrations to sync`);

    // Process each integration
    for (const integration of integrations) {
      await syncIntegration(integration);
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

    // First, fetch books to get metadata
    const books = await fetchReadwiseBooks(token);
    const booksMap = new Map(books.map(book => [book.id, book]));

    // Fetch highlights
    const highlights = await fetchReadwiseHighlights(token, updatedAfter);
    
    console.log(`Fetched ${highlights.length} highlights for integration ${integrationId}`);

    // Process highlights in batches
    const batchSize = 100;
    for (let i = 0; i < highlights.length; i += batchSize) {
      const batch = highlights.slice(i, i + batchSize);
      await processHighlightsBatch(batch, booksMap, integrationId, userId);
    }

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

async function fetchReadwiseBooks(token: string): Promise<ReadwiseBook[]> {
  const books: ReadwiseBook[] = [];
  let nextUrl: string | null = 'https://readwise.io/api/v2/books/';

  while (nextUrl) {
    const response = await fetchWithRetryAfter(nextUrl, token);
    const data: ReadwiseBooksResponse = await response.json();
    books.push(...data.results);
    nextUrl = data.next;

    // Add a small delay to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return books;
}

async function fetchReadwiseHighlights(token: string, updatedAfter?: string | null): Promise<ReadwiseHighlight[]> {
  const highlights: ReadwiseHighlight[] = [];
  let nextUrl: string | null = 'https://readwise.io/api/v2/highlights/';
  
  // Add updated_after parameter if provided
  if (updatedAfter) {
    nextUrl += `?updated__gt=${encodeURIComponent(updatedAfter)}`;
  }

  while (nextUrl) {
    console.log('fetchReadwiseHighlights', nextUrl);
    const response = await fetchWithRetryAfter(nextUrl, token);
    const data: ReadwiseResponse = await response.json();
    highlights.push(...data.results);
    nextUrl = data.next;

    // Add a small delay to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return highlights;
}

async function processHighlightsBatch(
  highlights: ReadwiseHighlight[], 
  booksMap: Map<number, ReadwiseBook>,
  integrationId: string,
  userId: string
) {
  const highlightsToInsert = highlights.map(highlight => {
    const book = booksMap.get(highlight.book_id);
    
    return {
      content: highlight.text,
      note: highlight.note,
      location: highlight.location?.toString() || null,
      highlighted_at: highlight.highlighted_at,
      tags: highlight.tags.map(tag => tag.name),
      source_external_id: highlight.id.toString(),
      source_integration_id: integrationId,
      source_metadata: {
        title: book?.title || null,
        author: book?.author || null,
        category: book?.category || null,
        source: book?.source || null,
        cover_image_url: book?.cover_image_url || null,
        source_url: book?.source_url || null,
        asin: book?.asin || null,
        readwise_book_id: highlight.book_id,
        readwise_highlight_id: highlight.id,
        color: highlight.color,
        location_type: highlight.location_type,
      },
      target_url: highlight.url,
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