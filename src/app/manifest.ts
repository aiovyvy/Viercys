import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My VIERCYS",
    short_name: "VIERCYS",
    description: "Your Santorini demo stay, itinerary and concierge.",
    start_url: "/my-stay",
    display: "standalone",
    background_color: "#F3EEE5",
    theme_color: "#233F4B",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
