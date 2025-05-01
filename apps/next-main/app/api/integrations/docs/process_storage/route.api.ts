import "core-js";

import * as fs from "fs";
import * as mammoth from "mammoth";
import {NextResponse} from "next/server";
import path from "path";
import * as pdfjs from "pdfjs-dist/build/pdf.min.mjs";

import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";

import {IntegrationsDocsProcessStorageRoute} from "./routeSchema";

await import('pdfjs-dist/build/pdf.worker.min.mjs');

// @ts-ignore
Promise.withResolvers || (Promise.withResolvers = function () {
  var rs, rj, pm = new this((resolve, reject) => {
    rs = resolve;
    rj = reject;
  });
  return {
    resolve: rs,
    reject: rj,
    promise: pm,
  };
});

// Helper function to clean up temporary files and directories
function cleanup(paths: string[]): void {
  for (const filePath of paths) {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  }
}

// Tells next.js to set the maximum duration of the request to 300 seconds.
export const maxDuration = 300;

// Function to read text from a PDF file using pdf.js
async function readPDFText(filePath: string): Promise<{ text: string, pageStartCharacterOffsets: number[] }> {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdfDoc = await pdfjs.getDocument(data).promise;
  let pdfText = '';
  const pageStartCharacterOffsets: number[] = [0]; // First page starts at offset 0

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join('');
    pdfText += pageText;

    // Store the offset for the next page (if there is one)
    if (pageNum < pdfDoc.numPages) {
      pageStartCharacterOffsets.push(pdfText.length);
    }
  }

  return { text: pdfText, pageStartCharacterOffsets };
}

// Function to read text from a file
async function readFileText(filePath: string): Promise<{ text: string, pageStartCharacterOffsets?: number[] }> {
  const fileExtension = path.extname(filePath).toLowerCase();
  switch (fileExtension) {
    case ".pdf":
      const pdfData = await readPDFText(filePath);
      return { text: pdfData.text, pageStartCharacterOffsets: pdfData.pageStartCharacterOffsets };
    case ".docx":
      const docxData = await mammoth.extractRawText({ path: filePath });
      return { text: docxData.value };
    case ".md":
    case ".txt":
      return { text: fs.readFileSync(filePath, "utf8") };
    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }
}

// POST handler to process file from storage
export const { POST } = makeServerApiHandlerV3({
  route: IntegrationsDocsProcessStorageRoute,
  handler: async (ctx) => {
    const { parsedReq, user, supabase, SUPERUSER_supabase } = ctx;
    const { storagePath, fileName, fileType } = parsedReq;

    if (!user?.rsnUserId) {
      return NextResponse.json({ error: "User not authenticated." }, { status: 401 });
    }

    const tempDir = "/tmp/reasonote/documents";
    fs.mkdirSync(tempDir, { recursive: true });
    const cleanupPaths = [tempDir];

    const MAX_DOC_PAGES = 50; // Maximum number of pages per document
    const MAX_NUM_CHARS = 200_000; // Maximum number of characters across all documents

    try {
      const tempFilePath = path.join(tempDir, fileName);

      // Download the file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('attachment-uploads')
        .download(storagePath);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download file from storage: ${downloadError?.message || 'No file data'}`);
      }

      // Write the file to the temp directory
      const buffer = await fileData.arrayBuffer();
      fs.writeFileSync(tempFilePath, new Uint8Array(buffer));

      // Read the text from the file
      const fileResult = await readFileText(tempFilePath);
      const fileText = fileResult.text;

      // Check if the file exceeds the maximum number of pages for PDFs
      if (fileType === "application/pdf") {
        const pdfBuffer = new Uint8Array(buffer);
        const pdfDoc = await pdfjs.getDocument(pdfBuffer).promise;
        if (pdfDoc.numPages > MAX_DOC_PAGES) {
          throw new Error(`PDF file "${fileName}" exceeds the maximum allowed number of pages (${MAX_DOC_PAGES}).`);
        }
      }

      // Check character count
      if (fileText.length > MAX_NUM_CHARS) {
        throw new Error(`The document exceeds the maximum allowed number of characters (${MAX_NUM_CHARS}).`);
      }

      // Sanitize text before inserting
      function sanitizeText(text: string): string {
        // Remove null characters and other control characters
        return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      }

      // Prepare metadata with page offsets if available
      const metadata: Record<string, any> = {};
      if (fileResult.pageStartCharacterOffsets) {
        metadata.pageStartCharacterOffsets = fileResult.pageStartCharacterOffsets;
      }

      // Insert the document into the database
      const { data: pageData, error: pageError } = await supabase.from('rsn_page').insert({
        _name: fileName,
        body: sanitizeText(fileText),
        original_filename: fileName,
        storage_path: storagePath,
        file_type: fileType,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
      }).select('*').single();

      if (pageError || !pageData) {
        throw new Error(`Failed to create page for document: ${pageError?.message || 'No page data'}`);
      }

      return {
        documents: [{
          content: fileText,
          title: fileName,
          fileName: fileName,
          fileType: fileType,
          pageId: pageData.id,
          storagePath: storagePath,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        }],
      };
    } catch (error: any) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    } finally {
      cleanup(cleanupPaths);
    }
  },
}); 