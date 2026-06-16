import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AssetMind 智能资料库",
  description: "面向中国用户的知识资产检索与智能问答工作台。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
