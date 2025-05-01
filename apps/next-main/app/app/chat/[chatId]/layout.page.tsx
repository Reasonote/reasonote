"use client";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

export default function ChatLayout({ children }: any) {
  const isSmallDevice = useIsSmallDevice();

  return (
    <div
      style={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        height: isSmallDevice ? "100%" : "90vh",
        alignItems: "center",
        alignContent: "center",
        justifyContent: "center",
        justifyItems: "center",
        padding: isSmallDevice ? "0px" : "10px",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}
