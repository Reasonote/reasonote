// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.5.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as _ from 'lodash';

import { CorsResponse } from '../utils/cors.ts';

// Configuration for Deno runtime
env.useBrowserCache = false;
env.allowLocalModels = false;

console.log("Hello from Functions!")

type RequestContext = {
  req: Request;
  sb: SupabaseClient;
}


async function getPagesNeedingEmbeddings(ctx: RequestContext){
  const {req, sb} = ctx;

  // Create a Supabase client with the Auth context of the logged in user.

  // Now we can get the session or user object
  // const {
  //   data: { user },
  // } = await supabaseClient.auth.getUser()

  // Get items from our queue
  // TODO: better limit on this.
  const { data: vecQueueItems, error: vecQueueError } = await sb.from('rsn_page_vec_queue').select('*').limit(10)


  // TODO: Don't delete here, only delete after we've successfully generated the embeddings.
  // Delete the items from our queue
  const { data: dataResultDelete, error: errorResultDelete } = await sb.from('rsn_page_vec_queue').delete().in('id', vecQueueItems.map((queueItem) => queueItem.id))

  console.log("Deleted items from queue:", dataResultDelete, "error", errorResultDelete)

  // Get pages corresponding to the items in our queue
  const rsnPageIds = vecQueueItems.map((queueItem) => queueItem.rsn_page_id)

  // And we can run queries in the context of our authenticated user
  const { data, error } = await sb.from('rsn_page').select('*').in('id', rsnPageIds)
  
  console.log('Got data:', data, 'Got error:', JSON.stringify(error))

  return data;
}

/**
 * 
 * @param str The string
 * @param size The size of each chunk
 * @returns The string split into chunks of size
 * 
 * (From https://stackoverflow.com/questions/7033639/split-large-string-in-n-size-chunks-in-javascript)
 */
function chunkSubstr(str, size) {
  const numChunks = Math.ceil(str.length / size)
  const chunks = new Array(numChunks)

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size)
  }

  return chunks
}


serve(async (req: Request) => {
  try {
    const ctx = {
      req,
      sb: createClient(
        // Supabase API URL - env var exported by default.
        Deno.env.get('SUPABASE_URL') ?? '',
        // Supabase API ANON KEY - env var exported by default.
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        // Create client with Auth context of the user that called the function.
        // This way your row-level-security (RLS) policies are applied.
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
      )
    }

    // PART 1: Get a batch of pages that need to be updated,
    // TODO: Need to make this some reasonable batch size
    // TODO: Need to mark the database that we are working on this batch
    const dataResultPages = await getPagesNeedingEmbeddings(ctx);

    // // Part 3: Get and post embeddings for each document that needs to be updated
    // // TODO: postgres-level mutex on documents that are being processed
    await Promise.all(dataResultPages.map(async (page) => {
      console.log('Got page:', page.body.slice(0, 100))

      // Split the page by lines.
      const pageByLines = page.body.split('\n').map((l, idx) => ({line_idx: idx, text: l}))

      // Segment the lines into chunks.
      const chunkSize = 20;
      const chunks = _.chunk(pageByLines, chunkSize)

      const maxChunksAtOnce = 50;
      const processingChunks = _.chunk(chunks, maxChunksAtOnce)
      var idx = 0;

      for (const procChnk of processingChunks) {
          console.log(`Handling chunks ${idx * maxChunksAtOnce} to ${(idx * maxChunksAtOnce) + procChnk.length}`)
          idx += 1;
          
          // For each chunk, post to vectorize_page_chunk 
          await Promise.all(procChnk.map(async (chunk) => {
              const firstLine = chunk.reduce(
                  (acc, c) => {
                      if (acc === undefined) {
                          return c.line_idx;
                      }
                      else {
                          return Math.min(acc, c.line_idx);
                      }
                  },
                  undefined as number | undefined
              )

              const chunkText = chunk.map((c) => c.text).join('\n');

              // Store the embedding in Postgres
              // Generate a vector using Transformers.js
              const vectorize_params = {
                  firstLine: firstLine,
                  rsnPageId: page.id,
                  chunkText: chunkText,
              }
              console.log("Calling vectorize_page_chunk with", vectorize_params)
              
              const output = await ctx.sb.functions.invoke('vectorize_page_chunk', {
                headers: {
                  Authorization: req.headers.get('Authorization')!,
                },
                body: vectorize_params
              })

              console.log('OUTPUT FROM VECTORIZE_PAGE_CHUNK', output)
          }))
      }
    }))

    // TODO: make this accurate
    const data = {
      message: `Generated embeddings for ${dataResultPages.length} pages!`,
    }

    console.log("Returning data...")
    return new CorsResponse(new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json" } },
    ))
  }
  // Unhandled error are 500.
  catch (err) {
    console.error(err)

    return new CorsResponse(new Response(JSON.stringify({
      error: err.message,
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      }
    }))
  }
})