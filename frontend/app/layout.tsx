import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ECOMATS 多智能体控制台",
  description: "基于 CrewAI 的材料化学设计多智能体系统 Web 界面"
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

