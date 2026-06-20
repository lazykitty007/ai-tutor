import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "幼小衔接 AI 个性化辅导",
    short_name: "AI辅导",
    description: "iPad 优先的 AI 个性化学习伙伴",
    start_url: "/learn",
    display: "standalone",
    background_color: "#F8F5EF",
    theme_color: "#0D2B4C",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
