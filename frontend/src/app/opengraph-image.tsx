import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TM Dashboard — Organize Your Work, Simply";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #115e59 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1.5px solid rgba(255,255,255,0.3)",
            }}
          >
            <span style={{ color: "white", fontWeight: 700, fontSize: 16, letterSpacing: -1 }}>
              TM
            </span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: 24 }}>
            TM Dashboard
          </span>
        </div>

        {/* Main copy */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <h1
            style={{
              color: "white",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              margin: 0,
            }}
          >
            Organize your work,
            <br />
            <span style={{ color: "rgba(255,255,255,0.75)" }}>simply.</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 26, margin: 0, fontWeight: 400 }}>
            Task management · Team collaboration · Real-time notifications
          </p>
        </div>

        {/* Bottom strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {["Free Forever", "Secure", "Real-time"].map((tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 999,
                padding: "10px 20px",
                color: "white",
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
