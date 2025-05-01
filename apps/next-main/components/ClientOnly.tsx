"use client";
import { useEffect, useState } from "react";

export default function ClientOnly({ children, ...delegated }: any) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted ? children : null;
}
