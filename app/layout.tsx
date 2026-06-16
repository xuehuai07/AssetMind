import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AssetMind Workbench",
  description: "Knowledge asset retrieval and agent answer workbench."
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
