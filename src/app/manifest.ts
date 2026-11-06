import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lumen — A new home for learning",
    short_name: "Lumen",
    description: "A world built around knowledge.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b111b",
    theme_color: "#0b111b",
    icons: [
      {
        src: "/assets/lumen-app-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      { src: "/assets/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
