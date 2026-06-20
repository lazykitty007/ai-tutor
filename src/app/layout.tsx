import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/client/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "幼小衔接 AI 个性化辅导",
  description: "iPad 优先的 AI 个性化学习伙伴，覆盖每日旅程、识字任务、家长报告和 AI 计划。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D2B4C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
