"use client";

import React, { useState } from "react";
import { Copy, Check, ShieldCheck, Download, Sparkles, Cpu, Film, Loader2 } from "lucide-react";
import { VideoPlayerController } from "./VideoPlayerController";
import { clientDirectDownload } from "@/lib/utils/download";

interface PlayerInfoPanelProps {
  rawUrl: string;
}

export function PlayerInfoPanel({ rawUrl }: PlayerInfoPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopy = async () => {
    const success = await VideoPlayerController.copyToClipboard(rawUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    await clientDirectDownload(rawUrl, `AI_Film_Studio_${Date.now()}.mp4`);
    setIsDownloading(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {/* R2 Storage card */}
      <div className="p-5 rounded-xl bg-[#0e0e13] border border-[#22222a] space-y-3 col-span-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#181822] border border-[#2d2d3c] text-zinc-300">
              <ShieldCheck size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Cloud Permanent Edge URL</span>
              <span className="text-[10px] text-[#8c8c8c]">Terdistribusi global dengan proteksi SSL 256-bit</span>
            </div>
          </div>
          
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#181822] hover:bg-[#222230] border border-[#2d2d3c] text-xs font-semibold text-white transition-all cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? "Tersalin!" : "Salin Link"}
          </button>
        </div>

        <div className="p-3 rounded-lg bg-[#07070a] border border-[#1c1c24] font-mono text-[11px] text-[#a0a0ab] truncate select-all">
          {rawUrl}
        </div>

        <div className="flex items-center gap-4 pt-1 text-[10px] text-[#70707c] font-medium">
          <span className="flex items-center gap-1"><Film size={12} className="text-zinc-400" /> H.264 Video Codec</span>
          <span className="flex items-center gap-1"><Cpu size={12} className="text-zinc-400" /> Alibaba Wan 2.7 AI Engine</span>
          <span className="flex items-center gap-1"><Sparkles size={12} className="text-zinc-400" /> 60 FPS Smooth Render</span>
        </div>
      </div>

      {/* Export card */}
      <div className="p-5 rounded-xl bg-[#0e0e13] border border-[#22222a] flex flex-col justify-between space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Download size={14} className="text-zinc-300" /> Export Video Final
          </span>
          <p className="text-[11px] text-[#a0a0ab] leading-relaxed">
            Unduh berkas video asli kualitas resolusi tinggi langsung ke perangkat Anda.
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-zinc-200 disabled:opacity-75 text-black text-xs font-bold flex items-center justify-center gap-2 transition-all text-center cursor-pointer"
        >
          {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          {isDownloading ? "Mengunduh ke Perangkat..." : "Unduh Video HD MP4"}
        </button>
      </div>
    </div>
  );
}
