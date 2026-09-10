export default function ResponsiveContainer({
  children,
  maxWidth = "1600px",
  padding = "0",
  style = {},
}) {
  return (
    <div
      className="responsive-container"
      style={{
        width: "100%",
        maxWidth,
        margin: "0 auto",
        padding,
        boxSizing: "border-box",
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}