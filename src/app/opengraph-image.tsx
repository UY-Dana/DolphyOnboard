import { ImageResponse } from "next/og";

export const alt = "Start your next website project with DOLPHY";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#fafaf7",
        color: "#232522",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage:
            "linear-gradient(rgba(35,78,232,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(35,78,232,.055) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        style={{
          width: 18,
          height: "100%",
          display: "flex",
          background: "#234ee8",
        }}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px 58px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "flex-start", fontSize: 48, fontWeight: 900, letterSpacing: -4 }}>
            DOLPHY
            <span style={{ color: "#234ee8", fontSize: 18, margin: "2px 0 0 5px" }}>®</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 17, letterSpacing: 3, fontWeight: 700 }}>
            <span style={{ width: 9, height: 9, borderRadius: 99, background: "#234ee8" }} />
            PROJECT START
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 92 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#234ee8", fontSize: 18, letterSpacing: 3, fontWeight: 700 }}>
            <span style={{ width: 42, height: 2, background: "#234ee8" }} />
            YOUR NEXT CHAPTER
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 24, fontSize: 76, lineHeight: 1.02, letterSpacing: -4, fontWeight: 500 }}>
            <span>Let’s build something</span>
            <span style={{ color: "#234ee8", fontFamily: "Georgia, serif", fontStyle: "italic" }}>remarkable.</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
          <div style={{ display: "flex", color: "#686d67", fontSize: 20 }}>
            Tell us about your brand, goals, and vision.
          </div>
          <div style={{ display: "flex", color: "#234ee8", fontSize: 18, fontWeight: 700 }}>
            onboard.thedolphy.com →
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
