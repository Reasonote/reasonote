export default function Component({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          alignContent: "center",
          justifyContent: "center",
          justifyItems: "center",
          padding: "10px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            minWidth: "340px",
            height: "95vh",
            boxSizing: "border-box",
            width: "100%",
            maxWidth: "50vw",
            padding: "10px",
            justifyContent: "begin",
            alignItems: "center",
            backgroundColor: "#fafafa",
            borderRadius: "10px",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
