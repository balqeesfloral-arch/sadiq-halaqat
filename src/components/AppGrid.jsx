export default function AppGrid({
  children,
  minWidth = 280,
  gap = 20,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit,minmax(${minWidth}px,1fr))`,
        gap,
      }}
    >
      {children}
    </div>
  );
}