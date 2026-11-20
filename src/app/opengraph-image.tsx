import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE } from "@/lib/site";

export const alt = "KAMPLY : vos pubs Google & Meta en 5 minutes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ORANGE = "#ff5b23";
const PAPER = "#f5f5f3";

export default async function Image() {
  const [robinco, wordmark] = await Promise.all([
    readFile(join(process.cwd(), "src/app/fonts/Robinco-Regular.otf")),
    readFile(join(process.cwd(), "src/assets/kamply-wordmark-white.svg")),
  ]);
  const logo = `data:image/svg+xml;base64,${wordmark.toString("base64")}`;
  const host = new URL(SITE.url).host;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#000",
          color: PAPER,
          fontFamily: "Robinco",
          padding: "56px 64px",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", position: "relative" }}>
          <img src={logo} alt="" height={46} style={{ height: 46 }} />

          <div style={{ display: "flex", flexDirection: "column", fontSize: 132, lineHeight: 0.82, textTransform: "uppercase" }}>
            <span>Vos pubs</span>
            <span style={{ color: ORANGE }}>Google &amp; Meta</span>
            <span>en 5 min.</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 30, textTransform: "uppercase", letterSpacing: 1 }}>
            <span style={{ color: "#a3a3a0" }}>Campagnes créées par l&apos;IA</span>
            <span style={{ color: "#a3a3a0" }}>{host}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Robinco", data: robinco, style: "normal", weight: 400 }],
    },
  );
}
