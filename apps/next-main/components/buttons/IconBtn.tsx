import {
  IconButton,
  IconButtonProps,
  keyframes,
  styled,
} from "@mui/material";

export type IconBtnProps = IconButtonProps & {
    isWorking?: boolean;
}


// Define the keyframes
const pulseFade = keyframes`
0% {
    opacity: 1;
    scale: 1.25;
}
50% {
    opacity: 0.5;
    
    scale: 1;
}
100% {
    opacity: 1;
    scale: 1.25;
}
`;

// Extend IconButton with styled-components and apply the animation
const AnimatedIconButton: typeof IconButton = (styled(IconButton)`
    &.pulsingEffect {
        animation: ${pulseFade} 2s infinite;
    }
`) as any;


export function IconBtn({children, isWorking, ...iconButtonProps}: IconBtnProps){
    return <AnimatedIconButton {...iconButtonProps}
        disabled={isWorking}
        className={isWorking ? 'pulsingEffect' : ''}
    >
        {children}
    </AnimatedIconButton>
}