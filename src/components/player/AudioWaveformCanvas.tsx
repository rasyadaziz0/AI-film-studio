"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface AudioWaveformCanvasProps {
  isPlaying: boolean;
  isLoading?: boolean;
  error?: string | null;
  barCount?: number;
  accentColor?: "amber" | "yellow" | "emerald" | "sky";
}

export function AudioWaveformCanvas({
  isPlaying,
  isLoading = false,
  error = null,
  barCount = 36,
  accentColor = "amber",
}: AudioWaveformCanvasProps) {
  const activeGradient = {
    amber: "bg-gradient-to-t from-amber-600 via-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.4)] animate-pulse",
    yellow: "bg-gradient-to-t from-yellow-600 via-yellow-400 to-amber-300 shadow-[0_0_8px_rgba(234,179,8,0.4)] animate-pulse",
    emerald: "bg-gradient-to-t from-emerald-600 via-emerald-400 to-teal-300 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse",
    sky: "bg-gradient-to-t from-sky-600 via-sky-400 to-cyan-300 shadow-[0_0_8px_rgba(14,165,233,0.4)] animate-pulse",
  }[accentColor];

  return (
    <div className="w-full h-28 rounded-xl bg-[#0a0a0f] border border-[#22222c] p-4 flex items-center justify-center gap-1.5 overflow-hidden relative shadow-inner">
      {Array.from({ length: barCount }).map((_, i) => {
        const baseHeight = 15 + Math.sin(i * 0.5) * 20 + Math.cos(i * 0.8) * 15;
        const heightPct = isPlaying ? Math.min(90, Math.max(15, baseHeight + ((i * 13) % 40))) : 15;
        const delay = (i * 0.05).toFixed(2);
        return (
          <div
            key={i}
            style={{
              height: `${heightPct}%`,
              transitionDelay: `${delay}s`,
            }}
            className={`w-1.5 sm:w-2 rounded-full transition-all duration-300 ${
              isPlaying ? activeGradient : "bg-[#252532]"
            }`}
          />
        );
      })}

      {isLoading && !error && (
        <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-xs flex items-center justify-center gap-2 text-amber-400 text-xs font-medium">
          <Loader2 size={16} className="animate-spin" /> Memuat Stream Audio...
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-red-950/80 backdrop-blur-xs flex items-center justify-center text-red-300 text-xs font-medium px-4 text-center">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
