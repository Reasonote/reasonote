'use client';
import React, {
  useCallback,
  useEffect,
  useRef,
} from "react";

const AudioWaveformVisualizer = ({ 
  audioContext, 
  sourceNode,
  disabled = false,
  inertia = 0.8,
  barSpacing = 10,
  barWidth = 30,
  numBars = 5,
  minBarHeight = 10,
  barColor = [30, 215, 96],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const previousDataRef = useRef<Float32Array | null>(null);
  const isConnectedRef = useRef<boolean>(false);

  useEffect(() => {
    if (audioContext && sourceNode) {
      // Function to safely disconnect
      const safeDisconnect = () => {
        if (isConnectedRef.current && analyserRef.current) {
          try {
            sourceNode.disconnect(analyserRef.current);
          } catch (error) {
            console.warn("Failed to disconnect:", error);
          }
          isConnectedRef.current = false;
        }
      };

      // Check if we need to create a new AnalyserNode
      if (!analyserRef.current || analyserRef.current.context !== audioContext) {
        // Safely disconnect the old analyser if it exists
        safeDisconnect();
        
        // Create a new AnalyserNode
        const newAnalyser = audioContext.createAnalyser();
        newAnalyser.fftSize = 1024;
        analyserRef.current = newAnalyser;
      }

      // Connect the source to the analyser if not already connected
      if (!isConnectedRef.current) {
        try {
          sourceNode.connect(analyserRef.current);
          isConnectedRef.current = true;
        } catch (error) {
          console.error("Failed to connect sourceNode to analyser:", error);
          // Handle the error appropriately (e.g., notify the user, try to recover)
        }
      }

      return () => {
        // Safely disconnect on cleanup
        safeDisconnect();
      };
    }
  }, [audioContext, sourceNode]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    if (!previousDataRef.current) {
      previousDataRef.current = new Float32Array(numBars).fill(minBarHeight);
    }

    const frequencyBands = [
      { start: 0, end: 200 },
      { start: 200, end: 500 },
      { start: 500, end: 2000 },
      { start: 2000, end: 5000 },
      { start: 5000, end: 20000 }
    ];

    const drawFrame = () => {
      animationRef.current = requestAnimationFrame(drawFrame);

      if (disabled) {
        dataArray.fill(0);
      } else {
        analyser.getByteFrequencyData(dataArray);
      }

      ctx.fillStyle = 'rgb(20, 20, 20)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barHeights = frequencyBands.map((band) => {
        const startIndex = Math.floor(band.start / (audioContext.sampleRate / 2) * bufferLength);
        const endIndex = Math.floor(band.end / (audioContext.sampleRate / 2) * bufferLength);
        const bandValues = dataArray.slice(startIndex, endIndex);
        const average = bandValues.reduce((sum, value) => sum + value, 0) / bandValues.length;
        return Math.max(average / 255 * (canvas.height / 2 - barWidth / 2), minBarHeight);
      });

      const totalWidth = numBars * (barWidth + barSpacing) - barSpacing;
      let x = (canvas.width - totalWidth) / 2;
      const centerY = canvas.height / 2;

      barHeights.forEach((height, i) => {
        const targetHeight = Math.max(height, minBarHeight);
        previousDataRef.current![i] = previousDataRef.current![i] * inertia + targetHeight * (1 - inertia);
        const barHeight = previousDataRef.current![i];

        const [r, g, b] = barColor;
        ctx.fillStyle = `rgb(${r},${g},${b})`;

        const top = centerY - barHeight;
        const bottom = centerY + barHeight;

        ctx.beginPath();
        ctx.arc(x + barWidth / 2, top, barWidth / 2, Math.PI, 0);
        ctx.lineTo(x + barWidth, bottom);
        ctx.arc(x + barWidth / 2, bottom, barWidth / 2, 0, Math.PI);
        ctx.closePath();
        ctx.fill();

        x += barWidth + barSpacing;
      });
    };

    drawFrame();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioContext, barColor, barSpacing, barWidth, disabled, inertia, minBarHeight, numBars]);

  useEffect(() => {
    draw();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  return (
    <div style={{ width: '100%', height: '100px', backgroundColor: 'black', borderRadius: '8px', overflow: 'hidden' }}>
      <canvas ref={canvasRef} width={500} height={100} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default AudioWaveformVisualizer;