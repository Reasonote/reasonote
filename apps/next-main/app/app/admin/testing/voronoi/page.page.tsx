"use client";

import React, {
  useEffect,
  useState,
} from "react";

import VoronoiBackground from "@/components/backgrounds/VoronoiBackground";
import useTheme from "@mui/material/styles/useTheme";


const CustomNode: React.FC<{}> = () => (
  <div style={{ 
    width: 10, 
    height: 10, 
    borderRadius: '50%', 
    backgroundColor: '#FAFAFA',
    boxShadow: '0 0 5px rgba(255, 255, 255, 0.5)'
  }} />
);

const VoronoiTestPage: React.FC = () => {
  const theme = useTheme();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Caught error:", event.error);
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return (
      <div>
        <h1>Error occurred:</h1>
        <pre>{error.message}</pre>
        <pre>{error.stack}</pre>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden' }}>
      <VoronoiBackground 
        baseColor="#AAAAAA" 
        pulseColor={theme.palette.primary.main}
        NodeComponents={[CustomNode]}
      />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: 'black',
        zIndex: 1,
      }}>
        <h1>Voronoi Background Test</h1>
        <p>This is a full-screen test of the VoronoiBackground component.</p>
      </div>
    </div>
  );
};

export default VoronoiTestPage;
