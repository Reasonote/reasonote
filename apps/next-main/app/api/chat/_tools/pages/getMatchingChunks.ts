import _ from "lodash";

import {Database} from "@reasonote/lib-sdk";
import {Maybe} from "@reasonote/lib-utils";
import {
  PostgrestError,
  SupabaseClient,
} from "@supabase/supabase-js";

import {jaccardSimilarity} from "../../../../../utils/stringUtils";
import XenovaTransformersPipelineSingleton from "../../../_common/Pipeline";

class PostgrestErrorWrapper extends Error {
  constructor(public readonly pgError: PostgrestError) {
    super("PostgrestErrorWrapper");
  }
}

interface RequiredOptions {
  sb: SupabaseClient<Database>;
  targetText: string;
}

interface OptionalOptions {}

/**
 * Get the most similar chunks of text to the target text.
 *
 * @param opts The options for this function.
 * @param opts.sb The supabase client to use.
 * @param opts.targetText The target text to search for.
 * @param opts.rsnPageIds The ids of the pages to search in.
 * @param opts.disableIlike Whether to disable the ilike search. Defaults to false.
 * @param opts.similarityThreshold The similarity threshold to use. Defaults to 0.6.
 * @param opts.minContentLength The minimum content length to use. Defaults to 5.
 * @param opts.matchCount The number of matches to return. Defaults to 10.
 *
 *
 * @returns The matching chunks.
 * @throws {PostgrestErrorWrapper} If there was an error.
 */
export async function getMatchingChunks(_opts: {
  sb: SupabaseClient<Database>;
  targetText: string;
  disableIlike?: boolean;
  similarityThreshold?: number;
  minContentLength?: number;
  matchCount?: number;
}): Promise<
  Maybe<
    {
      matchType: "ilike" | "semantic";
      matchContent: string;
      vecId: string;
      similarity: number;
    }[]
  >
> {
  ///////////////
  // Args
  const opts: typeof _opts & {
    similarityThreshold: number;
    matchCount: number;
    minContentLength: number;
  } = _.defaultsDeep({}, _opts, {
    similarityThreshold: 0.6,
    matchCount: 10,
    minContentLength: 5,
  });
  const {
    sb,
    targetText,
    disableIlike,
    similarityThreshold,
    minContentLength,
    matchCount,
  } = opts;

  ///////////////
  // Logic
  const generateEmbedding =
    await XenovaTransformersPipelineSingleton.getInstance();

  // Generate an embedding for the random line
  const randomLineEmbeddingResult = await generateEmbedding(targetText, {
    pooling: "mean",
    normalize: true,
  });

  // console.log("Got randomLineEmbeddingResult", randomLineEmbeddingResult)
  const randomLineEmbedding = Array.from(randomLineEmbeddingResult.data);

  // Find the most similar result
  const { error: matchError, data: matchVectors } = await sb.rpc(
    "match_rsn_vec",
    {
      match_embedding: randomLineEmbedding as any,
      match_threshold: similarityThreshold,
      match_count: matchCount,
      min_content_length: minContentLength,
    }
  );

  let ilikeMatchVectors: any[] | null | undefined;
  if (!disableIlike) {
    ilikeMatchVectors = (
      await sb
        .from("rsn_vec")
        .select("id, raw_content")
        .ilike("raw_content", `%${targetText}%`)
        .limit(10)
    ).data;
  }

  // Find any exact string ilike matches as well...
  if (matchError) {
    return {
      error: new PostgrestErrorWrapper(matchError),
      success: false,
    };
  } else {
    return {
      data: [
        ...matchVectors.map((v: any) => ({
          matchType: "semantic" as const,
          vecId: v.id,
          matchContent: v.raw_content,
          similarity: v.similarity,
        })),
        ...(ilikeMatchVectors?.map((v: any) => ({
          matchType: "ilike" as const,
          vecId: v.id,
          matchContent: v.raw_content,
          // Similarity here is number of characters that match.
          similarity: jaccardSimilarity(v.raw_content, targetText),
        })) ?? []),
      ],
      success: true,
    };
  }
}
