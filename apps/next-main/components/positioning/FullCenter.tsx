export default function FullCenter({ children, sx }: any) {
  return (
    <div
      className="rsn-full-center-container"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        justifyItems: "center",
        alignContent: "center",
        alignItems: "center",
        ...sx,
      }}
    >
      {children}
    </div>
  );
}
