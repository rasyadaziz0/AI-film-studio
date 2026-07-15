"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, HardDrive, LucideIcon } from "lucide-react";

export interface MediaHeaderProps {
  title?: string;
  badgeTitle?: string;
  badgeSub?: string;
  onBackClick?: () => void;
  accentColor?: "amber" | "emerald" | "sky" | "red" | "purple";
}

export function MediaHeader({
  title = "AI Film Studio — Cinema Player",
  badgeTitle = "Wan 2.7 Video Engine",
  badgeSub = "Cloud Edge",
  onBackClick,
  accentColor = "emerald",
}: MediaHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
      return;
    }
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

  const dotColorClass = {
    amber: "bg-amber-400 animate-pulse",
    emerald: "bg-emerald-500",
    sky: "bg-sky-400 animate-pulse",
    red: "bg-red-500 animate-pulse",
    purple: "bg-purple-500 animate-pulse",
  }[accentColor] || "bg-emerald-500";

  const badgeColorClass = {
    amber: "text-amber-300 border-amber-500/30 bg-[#18181c]",
    emerald: "text-zinc-300 border-[#2a2a30] bg-[#18181c]",
    sky: "text-sky-300 border-sky-500/30 bg-[#18181c]",
    red: "text-red-300 border-red-500/30 bg-[#18181c]",
    purple: "text-purple-300 border-purple-500/30 bg-[#18181c]",
  }[accentColor] || "text-zinc-300 border-[#2a2a30] bg-[#18181c]";

  return (
    <header className="h-16 border-b border-[#1f1f23] bg-[#0c0c0e] px-6 flex items-center justify-between z-20 sticky top-0 shadow-lg">
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
          <div className={`w-2 h-2 rounded-full ${dotColorClass}`} />
          <span className="text-xs font-bold tracking-wider uppercase text-white truncate max-w-[200px] sm:max-w-md">
            {title}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold border shadow-sm ${badgeColorClass}`}>
          <Sparkles size={12} className="opacity-80" /> {badgeTitle}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold bg-[#18181c] text-zinc-300 border border-[#2a2a30]">
          <HardDrive size={12} className="text-zinc-400" /> {badgeSub}
        </span>
      </div>
    </header>
  );
}
