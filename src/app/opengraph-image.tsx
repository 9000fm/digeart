import { ImageResponse } from "next/og";

export const alt = "digeart — music discovery for underground diggers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          fontFamily: "monospace",
          color: "#f5f5f5",
        }}
      >
        {/* Top: brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 32 32">
              <polygon points="8,4 24,4 30,13 16,29 2,13" fill="#ffffff" opacity="0.6" />
              <polygon points="12,13 20,13 16,4" fill="#ffffff" opacity="0.5" />
              <polygon points="12,13 20,13 16,29" fill="#ffffff" opacity="0.35" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 28,
              letterSpacing: -0.5,
              opacity: 0.6,
              fontFamily: "monospace",
            }}
          >
            digeart
          </span>
        </div>

        {/* Middle: message */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <span style={{ fontSize: 42, opacity: 0.4, fontWeight: 400 }}>
            {">"} music discovery
          </span>
          <span style={{ fontSize: 42, opacity: 0.4, fontWeight: 400 }}>
            {">"} for underground diggers
          </span>
        </div>

        {/* Bottom: CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              fontSize: 26,
              padding: "14px 28px",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 8,
              opacity: 0.85,
            }}
          >
            [ listen on digeart ]
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
