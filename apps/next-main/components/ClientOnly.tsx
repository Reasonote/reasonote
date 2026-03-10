"use client";
import { useEffect, useState } from "react";

export default function ClientOnly({ children, fallback, ...delegated }: any) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback ?? (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#121212",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: "4px solid rgba(255,255,255,0.1)",
            borderTopColor: "rgba(255,255,255,0.6)",
            borderRadius: "50%",
            animation: "rsn-spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes rsn-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return children;
}
