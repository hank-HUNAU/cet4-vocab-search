import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { DataProvider } from "@/context/DataContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CET4 词汇匹配标注检索系统",
  description: "CET4 Part III Section A 选词填空标注数据检索与分析平台",
  keywords: ["CET4", "选词填空", "词汇匹配", "知识点检索", "英语四级"],
  authors: [{ name: "CET4 Annotation Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "CET4 词汇匹配标注检索系统",
    description: "CET4 Part III Section A 选词填空标注数据检索与分析平台",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CET4 词汇匹配标注检索系统",
    description: "CET4 Part III Section A 选词填空标注数据检索与分析平台",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <DataProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster />
          <SonnerToaster />
        </DataProvider>
      </body>
    </html>
  );
}
