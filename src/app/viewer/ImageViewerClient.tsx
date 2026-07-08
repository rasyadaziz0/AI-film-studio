"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Image as ImageIcon, Download, Loader2 } from "lucide-react";
import { PlayerHeader } from "@/components/player/PlayerHeader";
import { PlayerInfoPanel } from "@/components/player/PlayerInfoPanel";
import { clientDirectDownload } from "@/lib/utils/download";

interface ImageViewerClientProps {
  initialUrl?: string;
  initialTitle?: string;
}

function ImageViewerContent({ initialUrl = "", initialTitle = "AI Studio Image Output" }: ImageViewerClientProps) {
  const searchParams = useSearchParams();
  const [isDownloading, setIsDownloading] = useState(false);

  const rawUrl = searchParams?.get("url") || initialUrl;
  const title = searchParams?.get("title") || initialTitle;

  const handleBack = () => {
    try {
      if (typeof window !== "undefined" && window.opener && !window.opener.closed) {
        window.opener.focus();
        window.close();
        return;
      }
    } catch {
      // ignore
    }
    window.location.href = "/studio";
  };

  const handleDownload = async () => {
    if (!rawUrl || isDownloading) return;
    setIsDownloading(true);
    await clientDirectDownload(rawUrl, `AI_Film_Studio_${Date.now()}.png`);
    setIsDownloading(false);
  };

  if (!rawUrl) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
        <div className="w-16 h-16 rounded-full bg-[#181820] border border-[#272730] flex items-center justify-center text-zinc-400">
          <ImageIcon size={28} />
        </div>
        <h1 className="text-xl font-bold">Media URL Tidak Ditemukan</h1>
        <p className="text-sm text-[#8c8c8c] max-w-md">
          Silakan buka penampil gambar ini langsung melalui tombol Buka Gambar di dalam AI Film Studio.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="px-5 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-sm transition-all cursor-pointer"
        >
          Kembali ke Studio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e0e0e0] flex flex-col selection:bg-zinc-700 selection:text-white relative font-sans">
      <PlayerHeader />

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 max-w-5xl mx-auto w-full space-y-6">
        <div className="w-full text-left space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ImageIcon className="text-zinc-300" /> {title}
          </h1>
          <p className="text-xs text-[#8c8c8c]">
            Generated autonomously via Alibaba Cloud Model Studio & persisted on Cloud Distributed Storage Network.
          </p>
        </div>

        {/* Image Container */}
        <div className="w-full rounded-xl overflow-hidden bg-[#0c0c0e] border border-[#22222a] flex flex-col">
          <div className="relative aspect-[16/9] md:aspect-auto md:min-h-[60vh] w-full flex items-center justify-center bg-[#050505] p-4">
            <img
              src={rawUrl}
              alt={title}
              className="max-w-full max-h-[80vh] object-contain rounded-md shadow-2xl"
            />
          </div>
          
          <div className="h-14 bg-[#111116] border-t border-[#22222a] flex items-center justify-end px-4">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 disabled:opacity-75 px-4 py-2 rounded-[6px] transition-colors cursor-pointer"
            >
              {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {isDownloading ? "Mengunduh..." : "Download Gambar"}
            </button>
          </div>
        </div>

        <PlayerInfoPanel rawUrl={rawUrl} />
      </main>
    </div>
  );
}

export default function ImageViewerClient(props: ImageViewerClientProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
      </div>
    }>
      <ImageViewerContent {...props} />
    </Suspense>
  );
}
