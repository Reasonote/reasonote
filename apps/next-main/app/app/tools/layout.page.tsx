"use client";

import React from "react";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="tools-layout">
      {children}
    </div>
  );
} 