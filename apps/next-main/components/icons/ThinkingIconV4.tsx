import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Activity,
  Atom,
  Biohazard,
  BookAudio,
  BookOpen,
  BookOpenText,
  Brain,
  BrainCircuit,
  Circle,
  CircleCheck,
  CircleDashed,
  CirclePlus,
  CircuitBoard,
  Code,
  Dna,
  FlaskConical,
  FlaskRound,
  Gauge,
  Lightbulb,
  Magnet,
  Microscope,
  NotebookPen,
  NotepadTextDashed,
  Orbit,
  PenTool,
  Puzzle,
  Radio,
  Satellite,
  Sigma,
  Stethoscope,
  Telescope,
  TestTube,
  TestTubes,
} from "lucide-react";

const iconComponents = [
    Brain, 
    Lightbulb, 
    Code, 
    PenTool, 
    BookOpen, 
    Telescope, 
    Atom, 
    Puzzle, 
    Dna, 
    Circle, 
    CircleCheck, 
    CirclePlus,  
    CircleDashed, 
    Magnet, 
    Radio, 
    Biohazard, 
    FlaskConical, 
    FlaskRound, 
    Orbit, 
    Satellite, 
    BrainCircuit, 
    Microscope, 
    TestTube, 
    TestTubes, 
    Activity, 
    CircuitBoard,
    Stethoscope,
    Gauge,
    Sigma,
    NotebookPen,
    NotepadTextDashed,
    BookOpenText,
    BookAudio
];

const distance = (p1, p2) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);

const generateIconPosition = (padding, innerVariation, outerVariation, existingIcons, iconSize, maxAttempts = 50) => {
  const baseInnerRadius = 20 - padding / 2;
  const baseOuterRadius = 45 - padding / 2;
  const minDistance = iconSize * 1.5; // Minimum distance between icons as a percentage of container size

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const isCenter = Math.random() < 1/3;
    const radius = isCenter 
      ? baseInnerRadius + (Math.random() - 0.5) * innerVariation
      : baseOuterRadius + (Math.random() - 0.5) * outerVariation;
    
    const angle = Math.random() * 2 * Math.PI;
    
    const newPosition = {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle)
    };

    // Check if the new position is far enough from all existing icons
    if (existingIcons.every(icon => distance(newPosition, icon) > minDistance)) {
      return newPosition;
    }
  }

  // If we couldn't find a non-intersecting position after maxAttempts, return null
  return null;
};

export const ThinkingIconV4 = ({ 
  maxIcons, 
  minIcons, 
  animationSpeed, 
  iconSize, 
  padding, 
  backgroundColor, 
  iconColor, 
  lineColor, 
  innerVariation, 
  outerVariation 
}) => {
  const [icons, setIcons] = useState<any>([]);
  const animationRef = useRef<any>(null);

  const animateIcons = useCallback(() => {
    setIcons((prevIcons: any) => {
      let updatedIcons = prevIcons.map(icon => ({
        ...icon,
        size: Math.min(icon.size + 0.1, 1),
        opacity: icon.age < 100 ? Math.min(icon.opacity + 0.1, 1) : Math.max(icon.opacity - 0.05, 0),
        age: icon.age + 1,
      })).filter(icon => icon.opacity > 0);

      // Add new icons if below minIcons
      while (updatedIcons.length < minIcons) {
        const newPosition = generateIconPosition(padding, innerVariation, outerVariation, updatedIcons, iconSize);
        if (newPosition) {
          updatedIcons.push({
            id: Math.random(),
            Icon: iconComponents[Math.floor(Math.random() * iconComponents.length)],
            x: newPosition.x,
            y: newPosition.y,
            size: 0,
            opacity: 0,
            age: 0,
          });
        } else {
          // If we couldn't find a non-intersecting position, break to avoid infinite loop
          break;
        }
      }

      // Remove excess icons if above maxIcons
      if (updatedIcons.length > maxIcons) {
        updatedIcons = updatedIcons.slice(-maxIcons);
      }

      // Randomly add a new icon with some probability
      if (updatedIcons.length < maxIcons && Math.random() < 0.1) {
        const newPosition = generateIconPosition(padding, innerVariation, outerVariation, updatedIcons, iconSize);
        if (newPosition) {
          updatedIcons.push({
            id: Math.random(),
            Icon: iconComponents[Math.floor(Math.random() * iconComponents.length)],
            x: newPosition.x,
            y: newPosition.y,
            size: 0,
            opacity: 0,
            age: 0,
          });
        }
      }

      return updatedIcons;
    });

    animationRef.current = requestAnimationFrame(animateIcons);
  }, [maxIcons, minIcons, padding, innerVariation, outerVariation, iconSize]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animateIcons);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animateIcons]);

  return (
    <div className={`relative w-32 h-32 ${backgroundColor} rounded-full overflow-hidden`}>
      {icons.map(({ id, Icon, x, y, size, opacity }) => (
        <div
          key={id}
          className={`absolute transition-all duration-500 ease-in-out ${iconColor} z-[1]`}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            opacity: opacity,
          }}
        >
          <Icon
            size={iconSize}
            style={{
              transform: `scale(${size})`,
            }}
          />
        </div>
      ))}
      {icons.map((icon, index) => (
        icons.slice(index + 1).map(otherIcon => (
          <svg
            key={`${icon.id}-${otherIcon.id}`}
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-[0]"
            style={{ opacity: Math.min(icon.opacity, otherIcon.opacity) * 0.5 }}
          >
            <line
              x1={`${icon.x}%`}
              y1={`${icon.y}%`}
              x2={`${otherIcon.x}%`}
              y2={`${otherIcon.y}%`}
              stroke={lineColor}
              strokeWidth="2"
            />
          </svg>
        ))
      ))}
    </div>
  );
};