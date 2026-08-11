import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Thai Language Studio",
    short_name: "Thai Studio",
    description:
      "Translate English and phonetic Thai into Thai script, then listen with built-in Thai text-to-speech.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe4",
    theme_color: "#184a45",
    orientation: "portrait",
    icons: [
      {
        src: "/pwa-icon-192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
