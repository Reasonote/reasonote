import React, {
  useEffect,
  useMemo,
} from "react";

import {useRouter} from "next/navigation";

import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {
  Check,
  LockOutlined,
  Star,
} from "@mui/icons-material";
import {
  Button,
  Fab,
  Popover,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {useLessonFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import {Txt} from "../typography/Txt";

const icons = [
    <Star/>
]

export function LessonTreeItemIcon({lessonId, isCompleted, isLocked, isNextLesson}: {lessonId: string, isLocked?: boolean, isCompleted?: boolean, isNextLesson?: boolean}){
    const lessonRes = useLessonFlatFragLoader(lessonId);
    
    if (isCompleted){
        return <Check/>
    }
    else {
        return <Star htmlColor={isLocked ? 'gray' : 'white'}/>
    }
}

export function LessonTreeItemSkeleton({variant = 'skeleton'}: {variant?: 'skeleton' | 'assessment-needed'}){
    return variant === 'skeleton' ?
        <Skeleton variant="circular">
            <Fab>
                
            </Fab>
        </Skeleton>
        :
        <Fab disabled>
            <LockOutlined/>
        </Fab>
}

export interface LessonTreeItemProps {
    lessonId: string;
    isCompleted?: boolean;
    isNextLesson?: boolean;
    isFirstInList?: boolean;
    isStarterLesson?: boolean;
    disableStartTooltips?: boolean;
    tooltipTextOverride?: React.ReactNode;
    disableReview?: boolean;
}


export function LessonTreeItem({lessonId, isCompleted, isNextLesson, isStarterLesson, isFirstInList, disableStartTooltips, tooltipTextOverride, disableReview}: LessonTreeItemProps){
    const theme = useTheme();
    const lessonRes = useLessonFlatFragLoader(lessonId);
    const userId = useRsnUserId();

    const icon = icons[Math.floor(Math.random() * icons.length)];
    const [popoverOpen, setPopoverOpen] = React.useState(false);

    const ref = React.useRef(null);
    const router = useRouter();

    const isLocked = !isCompleted && !isNextLesson;

    const [scrolledOut, setScrolledOut] = React.useState(false);


    useEffect(() => {
        const observer = new IntersectionObserver(
          (entries) => {
            // entries[0] is the first element being observed, in this case, our button
            if (entries[0].isIntersecting) {
              setScrolledOut(false); // Set scrolledOut to false when element is in view
            } else {
                setScrolledOut(true); // Set scrolledOut to true when element is out of view
            }
          },
          {
            // Set the threshold and rootMargin according to your needs
            threshold: 0.75  // Threshold of 0.1 means at least 10% of the item should be visible
          }
        );
    
        if (ref.current) {
          observer.observe(ref.current);  // Start observing the ref
        }
    
        // Cleanup function to unobserve the element when the component unmounts
        return () => {
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        };
    }, []);

    const tooltipOpen = useMemo(() => {
        return !scrolledOut && isNextLesson && !popoverOpen;
    }, [isNextLesson, popoverOpen, scrolledOut]);



    // return <div style={{width: '60px', height: '60px', borderRadius: '50%', background: theme.palette.primary.main, display: 'flex', alignContent: 'center', justifyContent: 'center', alignItems: 'center'}}>
    //     {icon}
    // </div>
    return <>
        <Tooltip 
            title={
                tooltipTextOverride ? 
                    tooltipTextOverride :
                    <Txt variant="body2" letterSpacing={1.5}><b>START</b></Txt>
            }
            arrow 
            open={!disableStartTooltips && tooltipOpen} 
            placement={isFirstInList ? 'bottom' : 'top'} 
            slotProps={{
                arrow: {sx: {color: theme.palette.gray.dark}}, 
                tooltip: {sx: {background: theme.palette.gray.dark, color: theme.palette.primary.main, zIndex: 1200, padding: '10px', borderRadius: '8px', top: '5px'}},
                popper: {sx: {zIndex: 1200}},
            }}
        >
            <Fab 
                color={isLocked ? 'gray' as any : 'primary'} 
                aria-label="add" 
                ref={ref} 
                onClick={() => setPopoverOpen(!popoverOpen)}
                sx={{
                    filter: isCompleted ? 'brightness(60%)' : 'none',
                }}
                className={`lesson-tree-item-fab ${isStarterLesson ? 'lesson-tree-item-fab-starter-lesson' : ''}`}
            >
                <LessonTreeItemIcon lessonId={lessonId} isCompleted={isCompleted} isLocked={isLocked} isNextLesson={isNextLesson}/>
            </Fab>
        </Tooltip>
        <Popover 
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
            }}
            sx={{
                zIndex: 2000
            }}
            open={popoverOpen}
            anchorEl={ref.current}
            onClose={() => setPopoverOpen(false)}
        >
            <Stack maxWidth={'300px'} padding={1} gap={1}>
                <Txt startIcon={lessonRes.data?.icon} variant="h6">{lessonRes.data?.name}</Txt>
                <Typography variant="caption">{lessonRes.data?.summary}</Typography>
                {
                    disableReview ?
                        null
                        :
                        <Button 
                            disabled={isLocked}
                            onClick={() => {
                                // Start lesson
                                router.push(`/app/lessons/${lessonId}/new_session`)
                            }} variant="contained"
                        >
                            {
                                isLocked ? 
                                    'Locked' 
                                : 
                                isCompleted ? 
                                    'Review'
                                :
                                    <b>Start</b>
                            }
                            
                        </Button>
                }
                
            </Stack>
        </Popover>
    </>
}