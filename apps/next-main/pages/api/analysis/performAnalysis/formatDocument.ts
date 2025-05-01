import {trimLines} from "@lukebechtel/lab-ts-utils";

import {AnalysisDocument} from "../_route";

export function formatDocument(doc: AnalysisDocument) {
    return trimLines(`
          ${
            doc.description
              ? `
              <DOC_DESCRIPTION>
                  ${doc.description}
              </DOC_DESCRIPTION>
              `
              : ""
          }
  
          ${
            doc.metadata
              ? `
              <DOC_METADATA>
                  ${doc.metadata}
              </DOC_METADATA>
              `
              : ""
          }
  
          <DOCUMENT_CONTENT>
              ${doc.content}
          </DOCUMENT_CONTENT>
      `);
  }