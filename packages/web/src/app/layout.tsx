import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import ChatWidget from "@/components/ChatWidget";
import { Geist, Noto_Serif_SC, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-serif",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Shizhe.dev — 全栈工程师 · AI Explorer",
  description:
    "全栈工程师的个人网站，记录前端、AI 和全栈开发的技术思考与项目经验。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={cn(
        "dark",
        "font-sans",
        geist.variable,
        notoSerifSC.variable,
        jetbrainsMono.variable
      )}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased overflow-x-hidden">
        <AuthProvider>
          {children}
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
