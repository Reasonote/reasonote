'use client'
import React, {useState} from "react";

import {aib} from "@/clientOnly/ai/aib";
import {Activity} from "@/components/activity/Activity";
import {
  Button,
  CardContent,
  CardHeader,
  LinearProgress,
  Stack,
} from "@mui/material";

const PartialObjectStreamDemo = () => {
  const [streamData, setStreamData] = useState<any>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = async (type: 'array' | 'json' | 'ai') => {
    setIsStreaming(true);
    setStreamData([]);

    try {
        //@ts-ignore
        await aib.streamCustomObject<any>({
            routeUrl: '/api/activity/gen-stream',
            args: {
                context: {
                    skill: {
                        name: 'Calculus'
                    }
                },
            },
            onPartialObject: (data: any) => {
                console.log(data);
                setStreamData(data);
            },
            onFinish: (o: any) => {
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
    <Stack>
      <CardHeader>
        <h2 className="text-2xl font-bold">Activity Streaming Demo</h2>
      </CardHeader>
      <CardContent> 
        <Button onClick={() => startStream('ai')} disabled={isStreaming}>
          {isStreaming ? 'Streaming...' : 'Start Activity Stream'}
        </Button>
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Received Data:</h3>
            <Stack gap={2}>
              {streamData?.map((act: any) => 
                <Stack>
                  <Activity 
                    activityId={act.id}
                  key={act.id}
                  disableEdit
                />
                </Stack>
              )}
            </Stack>
        </div>
        {streamData?.progress !== undefined && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Progress:</h3>
            <LinearProgress value={streamData.progress} className="w-full" />
          </div>
        )}
        </CardContent>
    </Stack>
  );
};

export default PartialObjectStreamDemo;