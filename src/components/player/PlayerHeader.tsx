"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, HardDrive } from "lucide-react";

export function PlayerHeader() {
  const router = useRouter();

  const handleBack = () => {
    try {
      if (typeof window !== "undefined" && window.opener && !window.opener.closed) {
        window.opener.focus();
        window.close();
        return;
      }
    } catch {
      // ignore cross-origin or opener check issues
    }
    window.location.href = "/studio";
  };

  return (
    <header className="h-16 border-b border-[#1f1f23] bg-[#0c0c0e] px-6 flex items-center justify-between z-20 sticky top-0">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#222228] border border-[#2a2a30] text-xs font-semibold text-[#a0a0ab] hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft size={14} /> Kembali ke Studio
        </button>
        <div className="h-5 w-[1px] bg-[#2a2a30]" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold tracking-wider uppercase text-white">
            AI Film Studio — Cinema Player
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold bg-[#18181c] text-zinc-300 border border-[#2a2a30]">
          <Sparkles size={12} className="text-zinc-400" /> Wan 2.7 Video Engine
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold bg-[#18181c] text-zinc-300 border border-[#2a2a30]">
          <HardDrive size={12} className="text-zinc-400" /> Cloud Edge
        </span>
      </div>
    </header>
  );
}
