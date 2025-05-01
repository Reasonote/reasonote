// import { TypeOf, z } from "zod";

// import { SupabaseClient } from "@supabase/supabase-js";

// import { getMatchingChunks } from "../../pages/getMatchingChunks";
// import { RESITool } from "./RESITool";

// interface PageSearchToolOptions {
//   sb: SupabaseClient;
//   /**
//    * Override the name of the tool. Useful when trying to search different page collections.
//    */
//   name?: string;
//   /**
//    * Override the description of the tool. Useful when trying to search different page collections.
//    */
//   description?: string;
// }

// export class PageSearchTool extends RESITool {
//   sb: SupabaseClient;
//   name: string;
//   description: string;

//   constructor(options: PageSearchToolOptions) {
//     super();
//     this.sb = options.sb;
//     this.name = options.name ?? "page_search";
//     this.description =
//       options.description ??
//       "This allows you to use semantic search to find pages that match a given query.";
//   }

//   inputSchema = z.object({
//     query: z.string(),
//   });

//   outputSchema = z.object({
//     chunks: z.array(
//       z.object({
//         matchContent: z.string(),
//         vecId: z.string(),
//         similarity: z.number(),
//       })
//     ),
//   });

//   async _run(
//     input: TypeOf<this["inputSchema"]>
//   ): Promise<TypeOf<this["outputSchema"]>> {
//     const result = await getMatchingChunks({
//       sb: this.sb,
//       targetText: input.query,
//     });

//     if (result.success) {
//       return {
//         chunks: result.data,
//       };
//     } else {
//       throw result.error;
//     }
//   }
// }

export default 1;