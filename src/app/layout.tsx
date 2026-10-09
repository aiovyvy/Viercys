import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "VIERCYS | Where Earth Meets the Sea",
  description:
    "Discover a slower rhythm at VIERCYS Santorini. A Mediterranean escape, shaped by the sea.",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  manifest: "/manifest.webmanifest",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
