import React from "react";

/**
 * A simplified static version of FractalTreeLoading that doesn't use React state or effects.
 * This is suitable for use in OG image generation where we need a static tree.
 */
export const FractalTreeLoadingSimpleHTML = ({ 
  color = "white", 
  size = 100,
  maxDepth = 3,
  viewBox = "-50 -50 100 100"
}) => {
  const strokeWidth = size / 30;
  
  // Recursive function to generate the tree branches
  const generateTreePaths = (x1: number, y1: number, angle: number, currentDepth: number): JSX.Element[] => {
    if (currentDepth === 0) return [];
    
    // Increase the length factor to make branches longer
    const length = 70 / (maxDepth + 1);
    const x2 = x1 + length * Math.cos(angle);
    const y2 = y1 - length * Math.sin(angle);
    
    // Current branch
    const currentBranch = (
      <line
        key={`branch-${x1}-${y1}-${angle}-${currentDepth}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );
    
    // Generate child branches if we're not at the leaf level
    // Slightly increase the angle to make the tree wider
    const leftBranches = currentDepth > 1 
      ? generateTreePaths(x2, y2, angle - Math.PI / 4.5, currentDepth - 1) 
      : [];
      
    const rightBranches = currentDepth > 1 
      ? generateTreePaths(x2, y2, angle + Math.PI / 4.5, currentDepth - 1) 
      : [];
    
    return [currentBranch, ...leftBranches, ...rightBranches];
  };
  
  return (
    <div style={{width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <svg 
        width={size} 
        height={size} 
        viewBox={viewBox}
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      >
        <g>
          {generateTreePaths(0, 50, Math.PI / 2, maxDepth)}
        </g>
      </svg>
    </div>
  );
};

export default FractalTreeLoadingSimpleHTML; 