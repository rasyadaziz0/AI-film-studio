import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "goey-toast/styles.css";
import { GoeyToasterProvider } from "@/components/ui/goey-toaster";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_BASE_URL || "https://ai-film-studio-zeta.vercel.app"),
  title: "AI Film Studio | Visual Scripting for AI Video Generation",
  description: "A powerful node-based visual workspace for producing AI films. Create, iterate, and orchestrate AI Agents (Qwen & Wan Video) to automatically generate videos based on your niche.",
  openGraph: {
    title: "AI Film Studio",
    description: "Visual scripting workspace for AI film production. Fully autonomous and manual modes.",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Film Studio",
    description: "Visual scripting workspace for AI film production.",
    images: ["/og-image.png"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} font-sans h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#1e1e1e] text-[#e0e0e0] font-sans">
        {children}
        <GoeyToasterProvider />
      </body>
    </html>
  );
}
