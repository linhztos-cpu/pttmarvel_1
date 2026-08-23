import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marvel 靈異故事板",
  description: "以經典終端機風格呈現的靈異故事看板介面。",
  other: {
    "codex-preview": "development",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
