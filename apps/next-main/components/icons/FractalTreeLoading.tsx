import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

const FractalTreeLoading = ({ 
  color = "white", 
  maxDepth = 5, 
  growthSpeed = 500,
  className = "",
  style = {},
  numCycles = 0 // 0 means infinite cycles, 1 means static (draw once and stay)
}) => {
  const [depth, setDepth] = useState(numCycles === 1 ? maxDepth : 0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  useEffect(() => {
    // If numCycles is 1, we're in static mode - just set depth to maxDepth and don't animate
    if (numCycles === 1) {
      setDepth(maxDepth);
      return;
    }
    
    const growTree = () => {
      setDepth(prevDepth => {
        const newDepth = (prevDepth + 1) % (maxDepth + 1);
        
        // If we've completed a cycle (returned to 0)
        if (newDepth === 0) {
          setCyclesCompleted(prev => prev + 1);
        }
        
        return newDepth;
      });
    };
    
    // Only set up the interval if we're not in static mode and haven't reached the cycle limit
    if (numCycles === 0 || cyclesCompleted < numCycles) {
      const timer = setInterval(growTree, growthSpeed);
      return () => clearInterval(timer);
    }
  }, [maxDepth, growthSpeed, numCycles, cyclesCompleted]);

  const drawTree = useCallback((x1, y1, angle, currentDepth) => {
    if (currentDepth === 0) return null;
    const length = 60 / (maxDepth + 1); // Increased base length
    const x2 = x1 + length * Math.cos(angle);
    const y2 = y1 - length * Math.sin(angle);
    return (
      <g key={`${x1}-${y1}-${angle}-${currentDepth}`}>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={3} // Increased stroke width
          strokeLinecap="round"
        />
        {currentDepth > 1 && drawTree(x2, y2, angle - Math.PI / 5, currentDepth - 1)}
        {currentDepth > 1 && drawTree(x2, y2, angle + Math.PI / 5, currentDepth - 1)}
      </g>
    );
  }, [color, maxDepth]);

  return (
    <div style={{
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      ...style
    }} className={className}>
      <svg 
        style={{
          width: '100%', 
          height: '100%', 
          maxWidth: '100%', 
          maxHeight: '100%'
        }} 
        viewBox="-25 -20 50 90" // Adjusted viewBox to zoom out
        preserveAspectRatio="xMidYMid meet"
      >
        {drawTree(0, 50, Math.PI / 2, depth)} // Moved the tree base lower
      </svg>
    </div>
  );
};

export default FractalTreeLoading;