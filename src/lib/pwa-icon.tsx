type PwaIconProps = {
  size: number;
};

export function PwaIcon({ size }: PwaIconProps) {
  const innerInset = Math.round(size * 0.08);
  const innerRadius = Math.round(size * 0.19);
  const lineHeight = Math.max(10, Math.round(size * 0.075));
  const lineGap = Math.max(10, Math.round(size * 0.067));
  const lineWidth = Math.round(size * 0.42);
  const lineStart = Math.round(size * 0.29);
  const firstLineY = Math.round(size * 0.32);

  return (
    <div
      style={{
        alignItems: "center",
        background: "#184A45",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "#FFFDF8",
          border: `${Math.max(8, Math.round(size * 0.035))}px solid #9F6F18`,
          borderRadius: innerRadius,
          display: "flex",
          height: size - innerInset * 2,
          position: "relative",
          width: size - innerInset * 2,
        }}
      >
        <div
          style={{
            background: "#184A45",
            borderRadius: 999,
            height: lineHeight,
            left: lineStart,
            position: "absolute",
            top: firstLineY,
            width: lineWidth,
          }}
        />
        <div
          style={{
            background: "#184A45",
            borderRadius: 999,
            height: lineHeight,
            left: lineStart,
            position: "absolute",
            top: firstLineY + lineGap,
            width: Math.round(lineWidth * 0.8),
          }}
        />
        <div
          style={{
            background: "#184A45",
            borderRadius: 999,
            height: lineHeight,
            left: lineStart,
            position: "absolute",
            top: firstLineY + lineGap * 2,
            width: Math.round(lineWidth * 0.56),
          }}
        />
        <div
          style={{
            alignItems: "center",
            border: `${Math.max(8, Math.round(size * 0.03))}px solid #9F6F18`,
            borderRadius: "999px",
            display: "flex",
            height: Math.round(size * 0.22),
            justifyContent: "center",
            left: Math.round(size * 0.54),
            position: "absolute",
            top: Math.round(size * 0.47),
            width: Math.round(size * 0.22),
          }}
        >
          <div
            style={{
              borderBottom: `${Math.max(5, Math.round(size * 0.018))}px solid transparent`,
              borderLeft: `${Math.round(size * 0.06)}px solid #9F6F18`,
              borderTop: `${Math.max(5, Math.round(size * 0.018))}px solid transparent`,
              height: 0,
              marginLeft: Math.round(size * 0.01),
              width: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
