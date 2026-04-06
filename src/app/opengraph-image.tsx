import { ImageResponse } from "next/og";

export const alt = "ReadLog — Track books and audiobooks you've read";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #5c4033 0%, #3e2723 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 120, marginBottom: 8, display: "flex" }}>📚</div>
      <div style={{ fontSize: 72, fontWeight: 700, marginBottom: 16, display: "flex" }}>
        ReadLog
      </div>
      <div style={{ fontSize: 32, opacity: 0.85, display: "flex" }}>
        Track books and audiobooks you&apos;ve read
      </div>
    </div>,
    { ...size },
  );
}
