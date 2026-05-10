import type { ImageProvider } from "@/lib/providers/types";

export const fakeProvider: ImageProvider = {
  async generateImage(prompt) {
    const escapedPrompt = prompt
      .slice(0, 180)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="900" viewBox="0 0 1200 900" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="900" fill="#F8F1E4"/>
  <rect x="40" y="40" width="1120" height="820" rx="36" fill="#FFF9F0" stroke="#D8C7AE" stroke-width="4"/>
  <circle cx="1030" cy="170" r="84" fill="#D86E43" fill-opacity="0.18"/>
  <circle cx="180" cy="710" r="120" fill="#6D8B74" fill-opacity="0.12"/>
  <text x="96" y="170" fill="#B44F2F" font-size="28" font-family="Georgia, serif" letter-spacing="4">FAKE PROVIDER OUTPUT</text>
  <text x="96" y="280" fill="#1F1B16" font-size="64" font-family="Georgia, serif">Prompt Telephone</text>
  <foreignObject x="96" y="340" width="1008" height="360">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Georgia, serif; font-size: 38px; line-height: 1.35; color: #3A312A;">
      ${escapedPrompt}
    </div>
  </foreignObject>
  <text x="96" y="800" fill="#665E54" font-size="24" font-family="Georgia, serif">This is a local placeholder so the queue and worker path can be verified before wiring a real image provider.</text>
</svg>`;

    return {
      mimeType: "image/svg+xml",
      bytes: Buffer.from(svg, "utf8"),
    };
  },
};
