import "core-js";
import "@/app/utils/promisePolyfills"; // Import Promise polyfills

import * as fs from "fs";
import {isError} from "lodash";
import * as mammoth from "mammoth";
import {NextResponse} from "next/server";
import path from "path";
import * as pdfjs from "pdfjs-dist/build/pdf.min.mjs";
import {v4 as uuidv4} from "uuid";

import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";

import {IntegrationsDocsIngestRoute} from "./routeSchema";

await import('pdfjs-dist/build/pdf.worker.min.mjs');


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


// Function to read text from a file
async function readFileText(filePath: string): Promise<string> {
  const fileExtension = path.extname(filePath).toLowerCase();
  switch (fileExtension) {
    case ".pdf":
      const pdfData = await readPDFText(filePath);
      return pdfData;
    case ".docx":
      const docxData = await mammoth.extractRawText({ path: filePath });
      return docxData.value;
    case ".md":
    case ".txt":
      return fs.readFileSync(filePath, "utf8");
    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }
}

// Function to read text from a PDF file using pdf.js
async function readPDFText(filePath: string): Promise<string> {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdfDoc = await pdfjs.getDocument(data).promise;
  let pdfText = '';

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join('');
    pdfText += pageText;
  }

  return pdfText;
}


// POST handler to process file upload
export const {POST} = makeServerApiHandlerV3({
  route: IntegrationsDocsIngestRoute,
  handler: async (ctx) => {
    const {formData, supabase, SUPERUSER_supabase} = ctx;

    if (!formData) {
      return NextResponse.json({ error: "No form data provided." }, { status: 400 });
    }

    const tempDir = "/tmp/reasonote/documents";
    fs.mkdirSync(tempDir, { recursive: true });
    const cleanupPaths = [tempDir];

    const MAX_DOC_PAGES = 500; // Maximum number of pages per document
    const MAX_NUM_CHARS = 1_000_000; // Maximum number of characters across all documents

    try {
      // Check if the bucket exists, if not create it
      const { data: buckets } = await SUPERUSER_supabase.storage.listBuckets();
      const attachmentUploadsBucket = buckets?.find(bucket => bucket.name === 'attachment-uploads');
      
      if (!attachmentUploadsBucket) {
        const { error: createBucketError } = await SUPERUSER_supabase.storage.createBucket('attachment-uploads', {
          public: false // Set to true if you want the bucket to be public
        });
        if (createBucketError) {
          throw new Error(`Failed to create attachment-uploads bucket: ${createBucketError.message}`);
        }
      }

      const files = formData.getAll("files");

      if (files.length === 0) {
        return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
      }

      let totalChars = 0;
      const fileTexts = await Promise.all(
        files.map(async (f) => {
          if (!(f instanceof Blob)) {
            return new Error("Expected a file.");
          }

          const theFile = f;
          const fileExtension = path.extname(theFile.name);
          const uniqueFileName = `${uuidv4()}${fileExtension}`;

          // Upload file to storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('attachment-uploads')
            .upload(uniqueFileName, theFile);

          if (uploadError) {
            return new Error(`Failed to upload file: ${uploadError.message}`);
          }

          // Save the uploaded file to the server (temporary, for text extraction)
          const filePath = path.join(tempDir, theFile.name);
          const buffer = Buffer.from(await theFile.arrayBuffer());

          // @ts-ignore
          fs.writeFileSync(filePath, buffer);

          // Read the text from the file
          const fileText = await readFileText(filePath);

          // Check if the file exceeds the maximum number of pages
          if (theFile.type === "application/pdf") {
            const pdfData = new Uint8Array(buffer);
            const pdfDoc = await pdfjs.getDocument(pdfData).promise;
            if (pdfDoc.numPages > MAX_DOC_PAGES) {
              return new Error(`PDF file "${theFile.name}" exceeds the maximum allowed number of pages (${MAX_DOC_PAGES}).`);
            }
          }

          totalChars += fileText.length;
          if (totalChars > MAX_NUM_CHARS) {
            return new Error(`The total number of characters across all documents exceeds the maximum allowed (${MAX_NUM_CHARS}).`);
          }

          return {
            content: fileText,
            title: theFile.name,
            fileName: theFile.name,
            fileType: theFile.type,
            storagePath: uploadData.path,
          };
        })
      );

      // If any are errors, throw a 400
      const errors = fileTexts.filter(fileText => isError(fileText));
      if (errors.length > 0) {
        return NextResponse.json({ error: errors.map((error) => (error as any).message).join('\n') }, { status: 400 });
      }

      const nonErrors: {
        content: string;
        fileName: string;
        fileType: string;
        title: string;
        storagePath: string;
      }[] = fileTexts.filter(fileText => !isError(fileText)) as any[];

      function sanitizeText(text: string): string {
        // Remove null characters and other control characters
        return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      }
      
      const {data: pagesData, error: pagesError} = await supabase.from('rsn_page').insert(nonErrors.map(fileText => ({
        _name: fileText.fileName,
        body: sanitizeText(fileText.content),
        original_filename: fileText.fileName,
        storage_path: fileText.storagePath,
        file_type: fileText.fileType,
      }))).select('*');

      if (!pagesData) {
        throw new Error(`Failed to create pages for ${nonErrors.length} documents, Error: ${JSON.stringify(pagesError)}`);
      }

      return {
        documents: nonErrors.map((fileText, index) => ({
          ...fileText,
          pageId: pagesData?.[index].id,
        })),
      };
    } catch (error: any) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    } finally {
      cleanup(cleanupPaths);
    }
  },
});




