import {
  Skeleton,
  SkeletonProps,
} from "@mui/material";

export function SkeletonWithOverlay(props: SkeletonProps & {children: JSX.Element | null, wrapperProps?: React.HTMLAttributes<HTMLDivElement>}){
    return <div {...props.wrapperProps} style={{position: 'relative', width: props.width ?? '100%', height: props.height ?? '100px', ...props.wrapperProps?.style}}>
        <Skeleton variant="rectangular" width={props.width ?? "100%"} height={props.height ?? "100%"} {...props}/>
        {/* This will overlay on top of the parent */}
        <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            {props.children}
        </div>
    </div>
}