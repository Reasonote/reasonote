import React from "react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useQuery} from "@apollo/client";
import {Stack} from "@mui/material";
import Box from "@mui/material/Box";
import {
  GetUserLessonResultsDeepDocument,
} from "@reasonote/lib-sdk-apollo-client";

import {
  LessonTreeItem,
  LessonTreeItemSkeleton,
} from "./LessonTreeItem";

export interface LessonTreeProps {
  lessonIds: string[];
  skillIdPath: string[];
  disableStartTooltips?: boolean;
  offsetCount?: number;
}

export interface VerticalSineWaveComponentProps {

}


function VerticalSineWaveComponent({children, offsetCount, disableStartTooltips}: {children: React.ReactNode[], offsetCount?: number, disableStartTooltips?: boolean}) {
    const isSmallDevice = useIsSmallDevice();
    const amplitude = isSmallDevice ? 60 : 100; // width of the wave
    const frequency = 0.01; // how many waves
    const childSpacing = 75; // space between each child
  
    const generatePath = (height) => {
      let path = `M ${amplitude} 0`;
      for (let i = 0; i < height; i++) {
        const x = amplitude + amplitude * Math.sin(i * frequency);
        path += ` L ${x} ${i}`;
      }
      return path;
    };

    // TODO: this isn't taking into account height of kids
    const verticalSpaceRequired = children.length * childSpacing 
 
    return (
      <Box sx={{padding: 2, background: 'transparent', position: 'relative' }}>
        <svg width="100%" height={verticalSpaceRequired} viewBox={`0 0 ${amplitude*2} ${verticalSpaceRequired}`}>
          {/* Draw the vertical sine wave */}
          {/* <path d={generatePath(verticalSpaceRequired)} stroke="white" strokeWidth={5} fill="transparent" strokeDasharray="8,8" /> */}
          {/* Draw white circles along the sine wave */}
          {/* {circles.map((pos, index) => {
            const y = pos * 100; // position each circle 100 units apart
            const x = amplitude + amplitude * Math.sin(y * frequency);
            return (
              <circle key={index} cx={x} cy={y} r="10" fill="white" />
            );
          })} */}
          {/* <circle cx={0} cy={0} r="10" fill="white" /> */}
        </svg>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{position: 'relative', width: '50%', height: '100%'}}>
                {children?.map((child, index) => {
                    // Position the child basd on the sine wave x y pos
                    const yOffset = (index + (offsetCount ?? 0)) * childSpacing;
                    const x = amplitude + amplitude * Math.sin(yOffset * frequency);
                    const y = index * childSpacing;

                    return <>
                        {/* If there was an element before this, draw a path to that element. */}
                        {/* {index > 0 && <svg width="100%" height="100%" viewBox={`0 0 ${amplitude*2} ${verticalSpaceRequired}`}>
                            <path d={`M ${amplitude + amplitude * Math.sin((index - 1) * frequency)} ${index - 1} L ${x} ${y}`} stroke="white" strokeWidth={5} fill="transparent" strokeDasharray="8,8" />
                        </svg>} */}

                        <div key={index} style={{ position: "absolute", top: y, left: x }}>
                            {/* <div style={{ position: "relative"}}> */}
                                {/* <div style={{ position: "absolute", top: 50, left: 50 }}> */}
                                {/* {index} */}
                                {child}
                                {/* </div> */}
                            {/* </div> */}
                        </div>
                    </>
                })}
            </div>
            
        </div>
      </Box>
    );
  }

export function LessonTreeSkeleton({ numLessons, offsetCount, variant = 'skeleton' }: { numLessons: number, offsetCount?: number, variant?: 'skeleton' | 'assessment-needed'}) {
    return (
        <Stack className="lesson-tree" width={'100%'}>
            <VerticalSineWaveComponent 
              children={Array.from({length: numLessons}).map((_, index) => (
                  <div
                      key={index}
                      className={`lesson-item ${index % 2 === 0 ? "left" : "right"}`}
                  >
                      <LessonTreeItemSkeleton variant={variant}/>
                  </div>
              ))} 
              offsetCount={offsetCount}
            />
    </Stack>
  );
}


export function LessonTree({ skillIdPath, lessonIds, disableStartTooltips, offsetCount }: LessonTreeProps) {
    const userId = useRsnUserId();

    const lessonResultRes = useQuery(GetUserLessonResultsDeepDocument, {
        variables: {
            filter: {
                user: {
                    eq: userId
                },
                lesson: {
                    in: lessonIds
                }
            }
        },
        fetchPolicy: 'network-only'
    })

    const firstNotCompletedLesson = lessonResultRes.data ? lessonIds.find((lessonId) => !lessonResultRes.data?.userLessonResultCollection?.edges?.find((result) => result.node.lesson?.id === lessonId)) : undefined;

    return (
        <Stack className="lesson-tree">
            <VerticalSineWaveComponent 
              children={lessonIds.map((lessonId, index) => (
                  <div
                      key={lessonId}
                      className={`lesson-item ${index % 2 === 0 ? "left" : "right"}`}
                  >
                      <LessonTreeItem
                          lessonId={lessonId} 
                          isCompleted={!!lessonResultRes.data?.userLessonResultCollection?.edges?.find((result) => result.node.lesson?.id === lessonId)}
                          isNextLesson={lessonId === firstNotCompletedLesson}
                          isFirstInList={index === 0}
                          disableStartTooltips={disableStartTooltips}
                      />
                  </div>
              ))} 
              offsetCount={offsetCount}

              disableStartTooltips={disableStartTooltips}
            />
    </Stack>
  );
}