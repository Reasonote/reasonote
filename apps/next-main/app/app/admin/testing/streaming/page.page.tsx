'use client'
import React, {useState} from "react";

import {aib} from "@/clientOnly/ai/aib";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
} from "@mui/material";

const PartialObjectStreamDemo = () => {
  const [streamData, setStreamData] = useState<any>({});
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = async (type: 'array' | 'json' | 'ai') => {
    setIsStreaming(true);
    setStreamData({});

    try {
        //@ts-ignore
        await aib.streamCustomObject<any>({
            routeUrl: '/api/ai/gen-stream-test',
            args: {
                type: type
            },
            onPartialObject: (data: any) => {
                console.log(data);
                setStreamData(data);
            },
            onFinish: (o) => {
                console.log(o)
                setIsStreaming(false);
            }
        })
    } catch (error) {
      console.error('Error:', error);
      setIsStreaming(false);
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <h2 className="text-2xl font-bold">Partial Object Stream Demo</h2>
      </CardHeader>
      <CardContent>
        <Button onClick={() => startStream('array')} disabled={isStreaming}>
          {isStreaming ? 'Streaming...' : 'Start Array Stream'}
        </Button>
        <Button onClick={() => startStream('json')} disabled={isStreaming}>
          {isStreaming ? 'Streaming...' : 'Start JSON Stream'}
        </Button>
        <Button onClick={() => startStream('ai')} disabled={isStreaming}>
          {isStreaming ? 'Streaming...' : 'Start AI Stream'}
        </Button>
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Received Data:</h3>
          <pre className=" p-2 rounded mt-2 text-sm">
            {JSON.stringify(streamData, null, 2)}
          </pre>
        </div>
        {streamData.progress !== undefined && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Progress:</h3>
            <LinearProgress value={streamData.progress} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PartialObjectStreamDemo;