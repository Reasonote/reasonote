import React from "react";

import {ImportExport} from "@mui/icons-material";

import {
  ImportApkgFile,
} from "../activity/components/CreateActivitiesModal/_modes/ImportApkgFile";
import {
  FileHandler,
  FileHandlerComponentProps,
  HandlerResult,
} from "./fileHandlerSystem";

export class AnkiFileHandler implements FileHandler {
  accepts = ['.apkg'];

  async handleFile(file: File): Promise<HandlerResult> {
    const formData = new FormData();
    formData.append('apkgFile', file);

    try {
      const response = await fetch('/api/integrations/anki/ingest', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (data.decks) {
        return {
          success: true,
          data: { decks: data.decks.filter((deck: any) => deck.cards.length > 0) }
        };
      } else {
        return { success: false, error: 'No decks found in the response' };
      }
    } catch (error) {
      console.error('Error:', error);
      return { success: false, error: 'Error processing Anki file' };
    }
  }

  TitleIcon = ImportExport;

  Title: React.FC = () => {
    return <span>Importing Anki Decks</span>;
  }

  ReactComponent: React.FC<FileHandlerComponentProps> = ({ result, onComplete }) => {
    if (result.success && result.data.decks) {
      return <ImportApkgFile decks={result.data.decks} />;
    } else {
      return <div>Error: {result.error}</div>;
    }
  }
}