import type { Metadata } from "next";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
import { Shell } from "@/components/shell";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000"),
  title: { default: "Lumen — A new home for learning", template: "%s · Lumen" },
  description:
    "Curiosity deserves a better platform. Explore connected subjects, follow learning journeys and make a space for your ideas.",
  icons: { icon: "/assets/favicon.svg" },
  openGraph: {
    title: "Lumen — A new home for learning",
    description: "A world built around knowledge.",
    images: ["/assets/share-preview.webp"],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
