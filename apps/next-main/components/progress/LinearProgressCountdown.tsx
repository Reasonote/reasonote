import React, { useCallback, useEffect } from "react";

import { LinearProgress, LinearProgressProps } from "@mui/material";
import { useInterval } from "@reasonote/lib-utils-frontend";

interface LinearProgressCountdownProps extends LinearProgressProps {
  startValue?: number;
  totalDuration: number;
  direction: "down" | "up";
  onEnd?: () => void;
  resetSignal?: number;
  restartOnEnd?: boolean;
}

export function LinearProgressCountdown(props: LinearProgressCountdownProps) {
  const { startValue, direction, totalDuration, onEnd, ...rest } = props;
  const [progress, setProgress] = React.useState(
    startValue ?? (direction === "up" ? 0 : 100)
  );
  const [isRunning, setIsRunning] = React.useState(true);

  const interval = 10;

  const incrementPerInterval = (interval / totalDuration) * 100;

  useEffect(() => {
    // If we were passed a reset signal, reset the progress bar.
    if (props.resetSignal) {
      setProgress(startValue ?? (direction === "up" ? 0 : 100));
      setIsRunning(true);
    }
  }, [props.resetSignal]);

  const intervalCb = useCallback(() => {
    setProgress((prevProgress) =>
      direction === "up"
        ? prevProgress >= 100
          ? 100
          : prevProgress + incrementPerInterval
        : prevProgress <= 0
        ? 0
        : prevProgress - incrementPerInterval
    );

    if (
      (direction === "up" && progress >= 100) ||
      (direction === "down" && progress <= 0)
    ) {
      onEnd?.();
      setIsRunning(false);
    }
  }, [progress, direction, onEnd]);

  useInterval(intervalCb, isRunning ? interval : null);

  return <LinearProgress variant="determinate" value={progress} {...rest} />;
}
