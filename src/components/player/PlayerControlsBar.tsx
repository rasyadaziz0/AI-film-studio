"use client";

import React from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Repeat, RotateCcw, RotateCw } from "lucide-react";
import { VideoPlayerController } from "./VideoPlayerController";

interface PlayerControlsBarProps {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  progress: number;
  currentTime: number;
  duration: number;
  isLooping: boolean;
  playbackRate: number;
  onTogglePlay: () => void;
  onSkip: (seconds: number) => void;
  onToggleMute: () => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScrub: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleLoop: () => void;
  onRateChange: (rate: number) => void;
  onFullscreen: () => void;
}

export function PlayerControlsBar({
  isPlaying,
  isMuted,
  volume,
  progress,
  currentTime,
  duration,
  isLooping,
  playbackRate,
  onTogglePlay,
  onSkip,
  onToggleMute,
  onVolumeChange,
  onScrub,
  onToggleLoop,
  onRateChange,
  onFullscreen
}: PlayerControlsBarProps) {
  return (
    <div className="bg-[#101014] border-t border-[#22222a] px-6 py-4 space-y-3.5">
      {/* Sleek Custom Progress Track (Solid Minimalist) */}
      <div className="flex items-center gap-3.5">
        <span className="text-[11px] font-mono font-medium text-[#a0a0ab] w-11 text-right select-none">
          {VideoPlayerController.formatTime(currentTime)}
        </span>
        
        <div className="flex-1 relative h-1.5 bg-[#22222c] hover:bg-[#2b2b38] rounded-full cursor-pointer transition-all group/timeline flex items-center">
          {/* Solid Filled Track */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-white rounded-full transition-all pointer-events-none"
            style={{ width: `${Math.min(Math.max(progress || 0, 0), 100)}%` }}
          />
          {/* Thumb Indicator */}
          <div
            className="absolute w-3 h-3 bg-white rounded-full transform -translate-x-1/2 scale-0 group-hover/timeline:scale-100 transition-transform pointer-events-none"
            style={{ left: `${Math.min(Math.max(progress || 0, 0), 100)}%` }}
          />
          {/* Invisible Range Input for Native Scrubbing */}
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress || 0}
            onChange={onScrub}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>

        <span className="text-[11px] font-mono font-medium text-[#6c6c78] w-11 select-none">
          {VideoPlayerController.formatTime(duration)}
        </span>
      </div>

      {/* Primary Control Buttons */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-2">
          {/* Play/Pause Button (Solid White) */}
          <button
            onClick={onTogglePlay}
            className="p-2 rounded-lg bg-white hover:bg-zinc-200 text-black transition-all cursor-pointer flex items-center justify-center font-bold"
            title={isPlaying ? "Pause (Spasi)" : "Play (Spasi)"}
          >
            {isPlaying ? <Pause size={16} className="fill-black" /> : <Play size={16} className="fill-black ml-0.5" />}
          </button>

          {/* 5s Skip Backward */}
          <button
            onClick={() => onSkip(-5)}
            className="p-2 rounded-lg bg-[#181820] hover:bg-[#22222d] border border-[#272733] text-[#a0a0ab] hover:text-white transition-all cursor-pointer flex items-center gap-1"
            title="Mundur 5 Detik (←)"
          >
            <RotateCcw size={14} />
            <span className="text-[10px] font-bold">-5s</span>
          </button>

          {/* 5s Skip Forward */}
          <button
            onClick={() => onSkip(5)}
            className="p-2 rounded-lg bg-[#181820] hover:bg-[#22222d] border border-[#272733] text-[#a0a0ab] hover:text-white transition-all cursor-pointer flex items-center gap-1"
            title="Maju 5 Detik (→)"
          >
            <span className="text-[10px] font-bold">+5s</span>
            <RotateCw size={14} />
          </button>

          <div className="h-4 w-[1px] bg-[#272733] mx-1" />

          {/* Volume Control */}
          <div className="flex items-center gap-2 group/vol">
            <button
              onClick={onToggleMute}
              className="p-2 rounded-lg hover:bg-[#22222d] text-[#a0a0ab] hover:text-white transition-colors cursor-pointer"
              title={isMuted ? "Unmute (M)" : "Mute (M)"}
            >
              {isMuted || volume === 0 ? <VolumeX size={16} className="text-zinc-500" /> : <Volume2 size={16} />}
            </button>
            <div className="relative w-20 h-1.5 bg-[#22222c] rounded-full flex items-center">
              <div
                className="absolute left-0 top-0 bottom-0 bg-white rounded-full pointer-events-none"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={onVolumeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>

          <div className="h-4 w-[1px] bg-[#272733] mx-1" />

          {/* Loop Button */}
          <button
            onClick={onToggleLoop}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
              isLooping
                ? "bg-[#252530] text-white border border-[#3c3c4c]"
                : "bg-[#181820] hover:bg-[#22222d] border border-[#272733] text-[#8c8c8c]"
            }`}
            title="Ulang Otomatis (Loop)"
          >
            <Repeat size={13} />
            <span>{isLooping ? "Loop Aktif" : "Loop"}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Playback speed selector */}
          <div className="flex items-center gap-0.5 bg-[#14141a] border border-[#272733] rounded-lg p-1">
            {[0.5, 1, 1.5, 2].map((rate) => (
              <button
                key={rate}
                onClick={() => onRateChange(rate)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  playbackRate === rate
                    ? "bg-white text-black"
                    : "text-[#8c8c8c] hover:text-white hover:bg-[#1f1f28]"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Fullscreen button */}
          <button
            onClick={onFullscreen}
            className="p-2 rounded-lg bg-[#181820] hover:bg-[#22222d] border border-[#272733] text-[#a0a0ab] hover:text-white transition-all cursor-pointer"
            title="Layar Penuh (F)"
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
