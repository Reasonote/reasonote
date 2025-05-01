// Don't need this, handled by Next.js
// import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

import _ from "lodash";
import { NextResponse } from "next/server";

import { notEmpty, tryUntilAsync } from "@lukebechtel/lab-ts-utils";
import { Client } from "@notionhq/client";
import { getAllItemsFromNotionDatabase } from "@reasonote/utils-notion";

import { BasicApiError } from "../../../helpers/errors";
import { makeServerApiHandlerV2 } from "../../../helpers/serverApiHandlerV2";
import { NotionIngestRoute } from "./routeSchema";

export const POST = makeServerApiHandlerV2({
  route: NotionIngestRoute,
  handler: async (ctx) => {
    const { req, parsedReq,  supabase, logger } = ctx;

    let NOTION_TOKEN = "";
    if (process.env.NODE_ENV === "development") {
      logger.debug("Using dev notion token.");
      NOTION_TOKEN = process.env.DEV_NOTION_TOKEN ?? "";
    } else {
      logger.debug("Using user integration notion token.");
      // TODO: get the notion token for this user.
      throw new BasicApiError("Not yet implemented.", 501);
    }

    if (!NOTION_TOKEN || NOTION_TOKEN.trim().length === 0) {
      throw new BasicApiError("No notion token found.", 400);
    }

    // TODO: make a notion client based on the api token for this user.
    const notion = new Client({
      auth: NOTION_TOKEN,
    });

    // TODO: fetch pages based on request.
    // Configure drivers

    const { targets } = parsedReq;

    if (targets.length > 1) {
      throw new BasicApiError("Multiple targets not yet implemented.", 501);
    }

    const firstDbItem = targets.find((t) => t.type === "database");

    if (firstDbItem?.type !== "database") {
      throw new BasicApiError("First target must be a database.", 400);
    }

    // TODO: make this not just first page of databases
    const dbSearch = await notion.search({
      filter: {
        property: "object",
        value: "database",
      },
    });

    // For all our databases in this notion integration, get all the pages.
    // And check if we need to update them.
    const results: (
      | undefined
      | {
          rsnPageId: string;
          notionPageId: any;
          title: string | null;
        }[]
    )[] = await Promise.all(
      dbSearch.results.slice(0, 1).map((r) => {
        const ret = tryUntilAsync({
          func: async () => {
            if (r.object !== "database") {
              return undefined;
            }

            logger.debug(`Ingesting ${r.properties.title}...`);

            const items = await getAllItemsFromNotionDatabase({
              databaseId: r.id,
              notion,
            });

            // First off, let's find out if we already have these pages in our database.
            const itemsWithSameId = await supabase
              .from("rsn_page")
              .select("*")
              .eq("metadata->ingest->>type", "notion-page")
              .in(
                "metadata->ingest->>notionPageId",
                items.pages.map((i) => i.pageId)
              );

            // Next, perform an upsert.
            // This will update any items that have changed,
            // and ALSO insert new items. :)
            const ret = await supabase
              .from("rsn_page")
              .upsert(
                items.pages.map((p) => ({
                  // If we already have an item with the same notionPageId, then we should just update that database item.
                  // Otherwise, this will cause an insert.
                  id: itemsWithSameId.data?.find(
                    //@ts-ignore
                    (i) => i.metadata?.ingest?.notionPageId === p.pageId
                  )?.id,
                  _name: p.extracted.title,
                  body: p.extracted.mdText,
                  metadata: {
                    ingest: {
                      type: "notion-page",
                      foreignId: p.pageId,
                      notionPageId: p.pageId,
                      notionPage: p,
                    },
                  } as any,
                }))
              )
              .select("*");

            return ret.data?.map((r) => ({
              rsnPageId: r.id,
              //@ts-ignore
              notionPageId: r.metadata?.ingest?.foreignId,
              title: r._name,
            }));
          },
          tryLimits: {
            maxAttempts: 3,
          },
          delay: {
            type: "expBackoff",
          },
        });

        return ret;
      })
    );

    // Flatten the results
    const finalResults = _.flatten(results.filter(notEmpty));

    return NextResponse.json(
      {
        items: {
          pages: finalResults,
        },
      },
      { status: 200 }
    );
  },
});
