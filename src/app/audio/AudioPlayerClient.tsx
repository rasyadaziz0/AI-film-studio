"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Headphones,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Repeat,
  Download,
  Loader2,
  FastForward,
} from "lucide-react";
import { MediaHeader } from "@/components/player/MediaHeader";
import { AudioWaveformCanvas } from "@/components/player/AudioWaveformCanvas";
import { AudioPlaybackController, AudioPlaybackState } from "@/components/player/AudioPlaybackController";

interface AudioPlayerClientProps {
  initialUrl?: string;
  initialTitle?: string;
}

function AudioPlayerContent({ initialUrl = "", initialTitle = "AI Studio Voiceover Output" }: AudioPlayerClientProps) {
  const searchParams = useSearchParams();
  const rawUrl = searchParams?.get("url") || initialUrl;
  const title = searchParams?.get("title") || initialTitle;

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [state, setState] = useState<AudioPlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isLooping: false,
    playbackRate: 1,
    isLoading: true,
    isDownloading: false,
    error: null,
  });

  const controller = new AudioPlaybackController(audioRef, state, setState);

  useEffect(() => {
    controller.syncEffects();
  }, [state.volume, state.isMuted, state.isLooping, state.playbackRate]);

  if (!rawUrl) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
        <div className="w-16 h-16 rounded-full bg-[#181820] border border-[#272730] flex items-center justify-center text-amber-400">
          <Headphones size={28} />
        </div>
        <h1 className="text-xl font-bold">Audio URL Tidak Ditemukan</h1>
        <p className="text-sm text-[#8c8c8c] max-w-md">
          Silakan buka penampil audio ini langsung melalui tombol Putar di Audio Studio dari dalam node TTS AI Film Studio.
        </p>
        <button
          type="button"
          onClick={() => (window.location.href = "/studio")}
          className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all cursor-pointer"
        >
          Kembali ke Studio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans selection:bg-amber-500/30">
      <MediaHeader
        title="AI Film Studio — Audio & Voiceover Soundstage"
        badgeTitle="Qwen3-TTS / CosyVoice"
        badgeSub="Cloud R2 Network"
        accentColor="amber"
      />

      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full max-w-2xl rounded-2xl border border-amber-500/20 bg-gradient-to-b from-[#14141e]/90 via-[#101018]/90 to-[#0c0c12]/90 p-8 shadow-2xl shadow-amber-950/20 backdrop-blur-xl flex flex-col items-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-6">
            <Headphones size={13} /> Voiceover Narration Track
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white text-center max-w-lg mb-2 truncate">
            {decodeURIComponent(title)}
          </h2>
          <p className="text-xs text-[#8c8c8c] text-center mb-8">
            Dihasilkan secara otonom oleh agen <strong className="text-amber-400 font-medium">TTS (Text-to-Speech)</strong> AI Film Studio.
          </p>

          <AudioWaveformCanvas
            isPlaying={state.isPlaying}
            isLoading={state.isLoading}
            error={state.error}
            barCount={36}
            accentColor="amber"
          />

          <audio
            ref={audioRef}
            src={rawUrl}
            onTimeUpdate={() => audioRef.current && setState((s) => ({ ...s, currentTime: audioRef.current!.currentTime }))}
            onLoadedMetadata={() => audioRef.current && setState((s) => ({ ...s, duration: audioRef.current!.duration, isLoading: false }))}
            onEnded={() => setState((s) => ({ ...s, isPlaying: false }))}
            onPlay={() => setState((s) => ({ ...s, isPlaying: true }))}
            onPause={() => setState((s) => ({ ...s, isPlaying: false }))}
            onError={() => setState((s) => ({ ...s, isLoading: false, error: "Gagal memuat file audio. URL tidak valid atau kadaluwarsa." }))}
          />

          {/* Scrubber */}
          <div className="w-full space-y-2 mb-8">
            <input
              type="range"
              min={0}
              max={state.duration || 100}
              value={state.currentTime}
              onChange={(e) => controller.seek(parseFloat(e.target.value))}
              disabled={state.isLoading || !!state.error}
              className="w-full h-1.5 bg-[#252532] rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
            />
            <div className="flex justify-between text-[11px] font-mono text-[#a0a0ab]">
              <span>{AudioPlaybackController.formatTime(state.currentTime)}</span>
              <span>{AudioPlaybackController.formatTime(state.duration)}</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => controller.toggleMute()}
                className="p-2 rounded-lg text-[#a0a0ab] hover:text-white hover:bg-[#1f1f2a] transition-all cursor-pointer"
              >
                {state.isMuted || state.volume === 0 ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={state.isMuted ? 0 : state.volume}
                onChange={(e) => controller.setVolume(parseFloat(e.target.value))}
                className="w-16 sm:w-20 h-1 bg-[#252532] rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => controller.togglePlay()}
                disabled={state.isLoading || !!state.error}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {state.isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => controller.cycleSpeed()}
                className="px-2 py-1 rounded-md bg-[#181822] border border-[#2a2a38] text-[11px] font-bold text-amber-300 hover:bg-[#222230] transition-all cursor-pointer flex items-center gap-1"
              >
                <FastForward size={12} /> {state.playbackRate}x
              </button>

              <button
                type="button"
                onClick={() => controller.toggleLoop()}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  state.isLooping ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "text-[#a0a0ab] hover:text-white hover:bg-[#1f1f2a]"
                }`}
              >
                <Repeat size={16} />
              </button>

              <button
                type="button"
                onClick={() => controller.download(rawUrl)}
                disabled={state.isDownloading}
                className="p-2 rounded-lg text-[#a0a0ab] hover:text-white hover:bg-[#1f1f2a] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                {state.isDownloading ? <Loader2 size={16} className="animate-spin text-amber-400" /> : <Download size={16} />}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AudioPlayerClient(props: AudioPlayerClientProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-amber-400 text-sm font-semibold">
        <Loader2 size={24} className="animate-spin mr-2" /> Memuat Audio Studio...
      </div>
    }>
      <AudioPlayerContent {...props} />
    </Suspense>
  );
}
