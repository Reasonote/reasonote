import {
  Button,
  ButtonProps,
  keyframes,
  styled,
} from "@mui/material";

export interface BtnProps extends ButtonProps {
    isWorking?: boolean;
    workingChildren?: React.ReactNode;
}

// Define the keyframes
const pulseFade = keyframes`
0% {
    opacity: 1;
    scale: .95;
}
50% {
    opacity: 0.9;
    scale: 1;
}
100% {
    opacity: 1;
    scale: .95;
}
`;

// Extend IconButton with styled-components and apply the animation
const AnimatedButton: typeof Button = (styled(Button)`
    &.pulsingEffect {
        animation: ${pulseFade} 2s infinite;
    }
`) as any;


export function Btn({children, isWorking, ...iconButtonProps}: BtnProps){
    return <AnimatedButton {...iconButtonProps}
        disabled={isWorking}
        className={isWorking ? 'pulsingEffect' : ''}
    >
        {isWorking && iconButtonProps.workingChildren ? iconButtonProps.workingChildren : children}
    </AnimatedButton>
}