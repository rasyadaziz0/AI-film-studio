"use client";

import React, { useState, useRef, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Play, Film } from "lucide-react";
import { PlayerHeader } from "@/components/player/PlayerHeader";
import { PlayerControlsBar } from "@/components/player/PlayerControlsBar";
import { PlayerInfoPanel } from "@/components/player/PlayerInfoPanel";
import { VideoPlayerController } from "@/components/player/VideoPlayerController";

interface CinemaPlayerClientProps {
  initialUrl?: string;
  initialTitle?: string;
}

function CinemaPlayerContent({ initialUrl = "", initialTitle = "AI Studio Video Production" }: CinemaPlayerClientProps) {
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);

  const rawUrl = searchParams?.get("url") || initialUrl;
  const title = searchParams?.get("title") || initialTitle;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (!videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            if (err.name !== "AbortError") {
              console.debug("Playback error:", err);
            }
            setIsPlaying(false);
          });
      }
    }
  }, []);

  const handleSkip = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), videoRef.current.duration || 0);
  }, []);

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

  // Keyboard Navigation Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handleSkip(-5);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleSkip(5);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.muted = !isMuted;
          setIsMuted(!isMuted);
        }
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        VideoPlayerController.requestFullscreen(videoRef.current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, handleSkip, isMuted]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setProgress(VideoPlayerController.calculateProgress(videoRef.current.currentTime, videoRef.current.duration));
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current || duration === 0) return;
    const scrubPercent = parseFloat(e.target.value);
    videoRef.current.currentTime = VideoPlayerController.calculateScrubTime(scrubPercent, duration);
    setProgress(scrubPercent);
  };

  if (!rawUrl) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
        <div className="w-16 h-16 rounded-full bg-[#181820] border border-[#272730] flex items-center justify-center text-zinc-400">
          <Film size={28} />
        </div>
        <h1 className="text-xl font-bold">Media URL Tidak Ditemukan</h1>
        <p className="text-sm text-[#8c8c8c] max-w-md">
          Silakan buka pemutar video ini langsung melalui tombol koneksi Cloud atau Video Generator di dalam AI Film Studio.
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
            <Film className="text-zinc-300" /> {title}
          </h1>
          <p className="text-xs text-[#8c8c8c]">
            Rendered autonomously via Alibaba Cloud Model Studio & persisted on Cloud Distributed Storage Network.
          </p>
        </div>

        {/* Video Cinema Container (Clean Solid Monochrome) */}
        <div className="w-full rounded-xl overflow-hidden bg-[#0c0c0e] border border-[#22222a]">
          <div className="relative aspect-video w-full flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              src={rawUrl}
              loop={isLooping}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => {
                if (!videoRef.current) return;
                setDuration(videoRef.current.duration);
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                  playPromise
                    .then(() => setIsPlaying(true))
                    .catch((err) => {
                      if (err.name !== "AbortError") {
                        console.debug("Autoplay prevented:", err);
                      }
                      setIsPlaying(false);
                    });
                }
              }}
              onClick={togglePlay}
              className="w-full h-full object-contain cursor-pointer"
            />
            {!isPlaying && (
              <button
                type="button"
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play size={28} className="ml-1 fill-black" />
              </button>
            )}
          </div>

          <PlayerControlsBar
            isPlaying={isPlaying}
            isMuted={isMuted}
            volume={volume}
            progress={progress}
            currentTime={videoRef.current?.currentTime || 0}
            duration={duration}
            isLooping={isLooping}
            playbackRate={playbackRate}
            onTogglePlay={togglePlay}
            onSkip={handleSkip}
            onToggleMute={() => {
              if (!videoRef.current) return;
              videoRef.current.muted = !isMuted;
              setIsMuted(!isMuted);
            }}
            onVolumeChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              if (videoRef.current) {
                videoRef.current.volume = val;
                videoRef.current.muted = val === 0;
                setIsMuted(val === 0);
              }
            }}
            onScrub={handleScrub}
            onToggleLoop={() => setIsLooping(!isLooping)}
            onRateChange={(rate) => setPlaybackRate(rate)}
            onFullscreen={() => VideoPlayerController.requestFullscreen(videoRef.current)}
          />
        </div>

        <PlayerInfoPanel rawUrl={rawUrl} />
      </main>
    </div>
  );
}

export default function CinemaPlayerClient(props: CinemaPlayerClientProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
      </div>
    }>
      <CinemaPlayerContent {...props} />
    </Suspense>
  );
}
