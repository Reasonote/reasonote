'use client';

import React from "react";

import {ResendSyncRoute} from "@/app/api/admin/resend-sync/routeSchema";
import {Txt} from "@/components/typography/Txt";
import {
  Button,
  Stack,
} from "@mui/material";

export default function ResendSyncPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);

  const handleSync = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await ResendSyncRoute.call({});
      setResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  
  return (
    <Stack spacing={2}>
      <Txt variant="h4">Resend Sync</Txt>
      <Button 
        variant="contained" 
        onClick={handleSync} 
        disabled={isLoading}
      >
        {isLoading ? 'Syncing...' : 'Sync Users with Resend'}
      </Button>
      {result && (
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {result}
        </pre>
      )}
    </Stack>
  );
}