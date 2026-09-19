import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "无事发生 · Still",
  description: "记录那些‘什么都没发生’的时间。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
