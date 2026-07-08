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
  title: "AI Film Studio",
  description: "Visual scripting workspace for AI film production",
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
