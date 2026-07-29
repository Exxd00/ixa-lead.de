import { ImageResponse } from "next/og";

export const alt =
  "IXA Leads – Messbare Kundengewinnung für Nürnberg und Franken";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "radial-gradient(circle at 15% 10%, #3f66ec 0, transparent 35%), linear-gradient(145deg, #171d28, #0b0f14)",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                alignItems: "center",
                background: "#fff",
                borderRadius: 18,
                color: "#1d2430",
                display: "flex",
                height: 62,
                justifyContent: "center",
                marginRight: 22,
                width: 82,
              }}
            >
              IXA
            </span>
            IXA Leads · Nürnberg
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: "-0.05em",
              lineHeight: 1.02,
              marginTop: 66,
              maxWidth: 980,
            }}
          >
            Mehr messbare Anfragen.
            <span style={{ color: "#9ca5b5" }}>
              Weniger digitales Rätselraten.
            </span>
          </div>
          <div
            style={{
              color: "#b9c1ce",
              display: "flex",
              fontSize: 27,
              marginTop: 45,
            }}
          >
            Website · Local SEO · Google Ads · Tracking · Automation
          </div>
        </div>
      </div>
    ),
    size,
  );
}
