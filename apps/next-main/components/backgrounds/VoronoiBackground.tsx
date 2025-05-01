import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Delaunator from "delaunator";

interface VoronoiBackgroundProps {
  baseColor: string;
  pulseColor: string;
  NodeComponents: React.ComponentType[] | React.ReactElement[];
  scalingFactor?: number;
  smallScreenScalingFactor?: number;
  smallScreenCutoffPx?: number;
  backgroundColor?: string;
}

interface Pulse {
  start: [number, number];
  end: [number, number];
  progress: number;
  speed: number;
}

function createGrid(ctx, numPointsX, numPointsY, scaleFactor = 1) {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;

  // Calculate spacing
  const spacingX = width / (numPointsX - 1) * scaleFactor;
  const spacingY = height / (numPointsY - 1) * scaleFactor;

  // Calculate offset to center the grid
  const offsetX = (width - spacingX * (numPointsX - 1)) / 2;
  const offsetY = (height - spacingY * (numPointsY - 1)) / 2;

  // Set up canvas style
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;

  // Draw vertical lines
  for (let i = 0; i < numPointsX; i++) {
      const x = offsetX + i * spacingX;
      ctx.beginPath();
      ctx.moveTo(x, offsetY);
      ctx.lineTo(x, height - offsetY);
      ctx.stroke();
  }

  // Draw horizontal lines
  for (let i = 0; i < numPointsY; i++) {
      const y = offsetY + i * spacingY;
      ctx.beginPath();
      ctx.moveTo(offsetX, y);
      ctx.lineTo(width - offsetX, y);
      ctx.stroke();
  }

  // Draw points at intersections
  ctx.fillStyle = '#FF0000';
  for (let i = 0; i < numPointsX; i++) {
      for (let j = 0; j < numPointsY; j++) {
          const x = offsetX + i * spacingX;
          const y = offsetY + j * spacingY;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, 2 * Math.PI);
          ctx.fill();
      }
  }
}


const VoronoiBackground: React.FC<VoronoiBackgroundProps> = ({ 
  baseColor, 
  pulseColor,
  NodeComponents,
  scalingFactor = 3,
  smallScreenScalingFactor = 5,
  smallScreenCutoffPx = 550,
  backgroundColor = 'transparent'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<number[]>([]);
  const delaunayRef = useRef<Delaunator<number[]> | null>(null);
  const pulsesRef = useRef<Pulse[]>([]);
  const hasSetupRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const createPoints = useCallback((width: number, height: number) => {
    const newPoints: number[] = [];
    const aspectRatio = width / height;
    const minDistance = 0.05; // Adjust this value to control point density
    const cellSize = minDistance / Math.sqrt(2);
    const gridWidth = Math.ceil(aspectRatio / cellSize);
    const gridHeight = Math.ceil(1 / cellSize);
    const grid: (number[] | null)[][] = new Array(gridWidth).fill(null).map(() => new Array(gridHeight).fill(null));
    const activeList: number[][] = [];

    // Helper function to get neighboring cells
    const getNeighbors = (x: number, y: number, radius: number) => {
      const neighbors: number[][] = [];
      const cellX = Math.floor(x / cellSize);
      const cellY = Math.floor(y / cellSize);
      const startX = Math.max(0, cellX - 2);
      const endX = Math.min(gridWidth - 1, cellX + 2);
      const startY = Math.max(0, cellY - 2);
      const endY = Math.min(gridHeight - 1, cellY + 2);

      for (let i = startX; i <= endX; i++) {
        for (let j = startY; j <= endY; j++) {
          if (grid[i][j]) {
            const dx = grid[i][j]![0] - x;
            const dy = grid[i][j]![1] - y;
            if (dx * dx + dy * dy < radius * radius) {
              neighbors.push(grid[i][j]!);
            }
          }
        }
      }
      return neighbors;
    };

    // Add first point
    const firstPoint = [Math.random() * aspectRatio, Math.random()];
    newPoints.push(...firstPoint);
    activeList.push(firstPoint);
    grid[Math.floor(firstPoint[0] / cellSize)][Math.floor(firstPoint[1] / cellSize)] = firstPoint;

    while (activeList.length > 0) {
      const randomIndex = Math.floor(Math.random() * activeList.length);
      const point = activeList[randomIndex];
      let found = false;

      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = minDistance + Math.random() * minDistance;
        const newX = point[0] + Math.cos(angle) * distance;
        const newY = point[1] + Math.sin(angle) * distance;

        if (newX >= 0 && newX < aspectRatio && newY >= 0 && newY < 1) {
          const neighbors = getNeighbors(newX, newY, minDistance);
          if (neighbors.length === 0) {
            const newPoint = [newX, newY];
            newPoints.push(...newPoint);
            activeList.push(newPoint);
            grid[Math.floor(newX / cellSize)][Math.floor(newY / cellSize)] = newPoint;
            found = true;
            break;
          }
        }
      }

      if (!found) {
        activeList.splice(randomIndex, 1);
      }
    }

    // Normalize points to [-0.5, 0.5] range
    for (let i = 0; i < newPoints.length; i += 2) {
      newPoints[i] = (newPoints[i] / aspectRatio) - 0.5;
      newPoints[i + 1] = newPoints[i + 1] - 0.5;
    }

    return newPoints;
  }, []);

  const forceSimulation = useCallback((points: number[], iterations: number = 50) => {
    // console.log("FORCE SIMULATION");
    const delaunay = new Delaunator(points);
    const forces = new Array(points.length).fill(0);

    for (let iter = 0; iter < iterations; iter++) {
      // Reset forces
      forces.fill(0);

      // Calculate forces
      for (let i = 0; i < delaunay.triangles.length; i += 3) {
        const a = delaunay.triangles[i] * 2;
        const b = delaunay.triangles[i + 1] * 2;
        const c = delaunay.triangles[i + 2] * 2;

        // Calculate centroid
        const cx = (points[a] + points[b] + points[c]) / 3;
        const cy = (points[a + 1] + points[b + 1] + points[c + 1]) / 3;

        // Apply force towards centroid
        for (const p of [a, b, c]) {
          forces[p] += (cx - points[p]) * 0.1;
          forces[p + 1] += (cy - points[p + 1]) * 0.1;
        }
      }

      // Apply forces
      for (let i = 0; i < points.length; i += 2) {
        points[i] += forces[i];
        points[i + 1] += forces[i + 1];

        // Constrain points within bounds
        points[i] = Math.max(-0.5, Math.min(0.5, points[i]));
        points[i + 1] = Math.max(-0.5, Math.min(0.5, points[i + 1]));
      }
    }

    return points;
  }, []);

  const initializePoints = useCallback(({ width, height }: { width: number; height: number }) => {
    // console.log("INITIALIZE POINTS");
    let newPoints = createPoints(width, height);
    // console.log("Points created:", newPoints.length / 2);
    // Print max & min-width points, same for height
    // console.log("Max width point:", Math.max(...newPoints.filter((_, i) => i % 2 === 0)));
    // console.log("Min width point:", Math.min(...newPoints.filter((_, i) => i % 2 === 0)));
    // console.log("Max height point:", Math.max(...newPoints.filter((_, i) => i % 2 === 1)));
    // console.log("Min height point:", Math.min(...newPoints.filter((_, i) => i % 2 === 1)));
    newPoints = forceSimulation(newPoints);
    // console.log("[post-simulation] Max width point:", Math.max(...newPoints.filter((_, i) => i % 2 === 0)));
    // console.log("[post-simulation] Min width point:", Math.min(...newPoints.filter((_, i) => i % 2 === 0)));
    // console.log("[post-simulation] Max height point:", Math.max(...newPoints.filter((_, i) => i % 2 === 1)));
    // console.log("[post-simulation] Min height point:", Math.min(...newPoints.filter((_, i) => i % 2 === 1)));
    pointsRef.current = newPoints;
    delaunayRef.current = new Delaunator(newPoints);
    // console.log("Delaunay triangles:", delaunayRef.current.triangles.length / 3);
  }, [createPoints, forceSimulation]);

  const createPulse = useCallback(() => {
    if (!delaunayRef.current) return;

    const { triangles } = delaunayRef.current;
    const edgeIndex = Math.floor(Math.random() * triangles.length / 3) * 3;
    const start = [
      pointsRef.current[triangles[edgeIndex] * 2],
      pointsRef.current[triangles[edgeIndex] * 2 + 1]
    ];
    const end = [
      pointsRef.current[triangles[edgeIndex + 1] * 2],
      pointsRef.current[triangles[edgeIndex + 1] * 2 + 1]
    ];

    const pulse: Pulse = {
      start: start as [number, number],
      end: end as [number, number],
      progress: 0,
      speed: 0.005 + Math.random() * 0.01 // Randomize speed for variety
    };
    pulsesRef.current.push(pulse);
  }, []);

  const updatePulses = useCallback(() => {
    // console.log("UPDATE PULSES");
    pulsesRef.current.forEach((pulse, index) => {
      pulse.progress += pulse.speed;
      if (pulse.progress > 1) {
        pulsesRef.current.splice(index, 1);
      }
    });

    // Increase the maximum number of pulses and the creation probability
    if (pulsesRef.current.length < 30 && Math.random() < 0.1) {
      createPulse();
    }
  }, [createPulse]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Change alpha to true to properly handle transparent backgrounds
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set up high DPI canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }, []);

  function getCanvasMeta() {
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const logicalWidth = rect.width;
    const logicalHeight = rect.height;
  
    const aspectRatio = logicalWidth / logicalHeight;
    const minDimension = Math.min(logicalWidth, logicalHeight);
    
    const isSmallScreen = minDimension < smallScreenCutoffPx;
    
    const scalingFactorToUse = isSmallScreen ? smallScreenScalingFactor : scalingFactor;
    
    const scale = scalingFactorToUse * minDimension;
    const offsetX = logicalWidth / 2;
    const offsetY = logicalHeight / 2;
  
    return {
      aspectRatio,
      scale,
      offsetX,
      offsetY,
      dpr
    };
  }

  function pointToPixel(x: number, y: number, scale: number, offsetX: number, offsetY: number) {
    return {
      x: x * scale + offsetX,
      y: y * scale + offsetY
    };
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    // Change alpha to true here as well
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx || !delaunayRef.current) return;

    // Clear with clearRect
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const canvasMeta = getCanvasMeta();
    if (!canvasMeta) return;

    const { aspectRatio, scale, offsetX, offsetY } = canvasMeta;

    // Draw edges
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const { triangles } = delaunayRef.current;
    for (let i = 0; i < triangles.length; i += 3) {
      const p0 = triangles[i] * 2;
      const p1 = triangles[i + 1] * 2;
      const p2 = triangles[i + 2] * 2;

      const { x: x0, y: y0 } = pointToPixel(pointsRef.current[p0], pointsRef.current[p0 + 1], scale, offsetX, offsetY);
      const { x: x1, y: y1 } = pointToPixel(pointsRef.current[p1], pointsRef.current[p1 + 1], scale, offsetX, offsetY);
      const { x: x2, y: y2 } = pointToPixel(pointsRef.current[p2], pointsRef.current[p2 + 1], scale, offsetX, offsetY);

      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
    }
    ctx.stroke();

    // Draw pulses
    ctx.strokeStyle = pulseColor;
    ctx.lineWidth = 4;
    pulsesRef.current.forEach(pulse => {
      const { x: x1, y: y1 } = pointToPixel(pulse.start[0], pulse.start[1], scale, offsetX, offsetY);
      const { x: x2, y: y2 } = pointToPixel(pulse.end[0], pulse.end[1], scale, offsetX, offsetY);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(
        x1 + (x2 - x1) * pulse.progress,
        y1 + (y2 - y1) * pulse.progress
      );
      ctx.stroke();
    });
  }, [baseColor, pulseColor, backgroundColor]);

  const animate = useCallback(() => {
    updatePulses();
    draw();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [draw, updatePulses]);

  useEffect(() => {
    if (!canvasRef.current || hasSetupRef.current) return;
    hasSetupRef.current = true;

    // console.log("Setting up VoronoiBackground");

    const handleResize = () => {
      if (!canvasRef.current) return;
      // console.log("window.innerWidth", window.innerWidth);
      // console.log("window.innerHeight", window.innerHeight);
      const newSize = { width: window.innerWidth, height: window.innerHeight };
      setWindowSize(newSize);
      setupCanvas();
      initializePoints(newSize);
      pulsesRef.current = []; // Cancel any currently running pulses
      draw();
    };

    handleResize(); // Set initial size and initialize points
    window.addEventListener('resize', handleResize);

    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [animate, initializePoints, setupCanvas, draw]);

  useEffect(() => {
    if (!animationFrameRef.current) {
      requestAnimationFrame(animate);
    }
  }, [backgroundColor]);

  const nodeComponents = React.useMemo(() => {
    if (!pointsRef.current || NodeComponents.length === 0) return [];
    const canvas = canvasRef.current;
    if (!canvas) return [];

    const canvasMeta = getCanvasMeta();
    if (!canvasMeta) return;
    const { aspectRatio, scale, offsetX, offsetY } = canvasMeta;

    return pointsRef.current.map((_, i) => {
      if (i % 2 === 0) {
        const RandomComponent = NodeComponents[Math.floor(Math.random() * NodeComponents.length)] as any;
        const { x, y } = pointToPixel(pointsRef.current[i], pointsRef.current[i + 1], scale, offsetX, offsetY);

        // Only show this if within the bounds of the window, plus some padding
        if (x < -50 || x > window.innerWidth + 50 || y < -50 || y > window.innerHeight + 50) {
          return null;
        }

        return (
          <div key={i} style={{ 
            position: 'absolute', 
            top: `${y}px`, 
            left: `${x}px`, 
            transform: 'translate(-50%, -50%)' 
          }}>
            {React.isValidElement(RandomComponent) ? RandomComponent : <RandomComponent />}
          </div>
        );
      }
      return null;
    });
  }, [pointsRef.current, canvasRef.current, NodeComponents]);

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%',
    }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
        }} 
      />
      {nodeComponents}
    </div>
  );
};

export default React.memo(VoronoiBackground);