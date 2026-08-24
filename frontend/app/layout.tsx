import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "水处理催化材料设计多智能体系统（NJU-ECOMATS）",
  description: "基于 Qwen + CrewAI 的水处理催化材料智能设计与协同优化平台"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

