import { z } from "zod";

export const CitationSchema = z.object({
    docId: z.string().describe('The id of the document that the citation is from.'),
    startText: z.string().describe('The EXACT QUOTE from the corresponding document constituting the start of the citation. This is  a hint for the citation compiler -- all text between the start and end text is included in the citation. THIS MUST BE AN EXACT, CHARACTER-FOR-CHARACTER MATCH.'),
    endText: z.string().describe('The EXACT QUOTE from the corresponding document constituting the end of the citation. This is a hint for the citation compiler -- all text between the start and end text is included in the citation. THIS MUST BE AN EXACT, CHARACTER-FOR-CHARACTER MATCH.'),
});
export type Citation = z.infer<typeof CitationSchema>;