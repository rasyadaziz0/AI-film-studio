"use client";

import React from "react";
import { clientDirectDownload } from "@/lib/utils/download";

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  playbackRate: number;
  isLoading: boolean;
  isDownloading: boolean;
  error: string | null;
}

/**
 * OOP Controller managing audio element synchronization, rate, loop, volume, seek, and download.
 */
export class AudioPlaybackController {
  private audioRef: React.RefObject<HTMLAudioElement | null>;
  private state: AudioPlaybackState;
  private setState: React.Dispatch<React.SetStateAction<AudioPlaybackState>>;

  constructor(
    audioRef: React.RefObject<HTMLAudioElement | null>,
    state: AudioPlaybackState,
    setState: React.Dispatch<React.SetStateAction<AudioPlaybackState>>
  ) {
    this.audioRef = audioRef;
    this.state = state;
    this.setState = setState;
  }

  public syncEffects(): void {
    if (!this.audioRef.current) return;
    this.audioRef.current.volume = this.state.isMuted ? 0 : this.state.volume;
    this.audioRef.current.loop = this.state.isLooping;
    this.audioRef.current.playbackRate = this.state.playbackRate;
  }

  public togglePlay(): void {
    const el = this.audioRef.current;
    if (!el) return;
    if (el.paused) {
      const p = el.play();
      if (p !== undefined) {
        p.catch((err) => {
          if (err.name !== "AbortError") {
            this.setState((s) => ({ ...s, error: "Gagal memutar audio. Pastikan format didukung atau jaringan stabil." }));
          }
        });
      }
    } else {
      el.pause();
    }
  }

  public seek(newTime: number): void {
    if (!this.audioRef.current) return;
    this.audioRef.current.currentTime = newTime;
    this.setState((s) => ({ ...s, currentTime: newTime }));
  }

  public setVolume(newVol: number): void {
    this.setState((s) => ({
      ...s,
      volume: newVol,
      isMuted: newVol > 0 && s.isMuted ? false : s.isMuted,
    }));
  }

  public toggleMute(): void {
    this.setState((s) => ({ ...s, isMuted: !s.isMuted }));
  }

  public toggleLoop(): void {
    this.setState((s) => ({ ...s, isLooping: !s.isLooping }));
  }

  public cycleSpeed(): void {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(this.state.playbackRate) + 1) % speeds.length;
    this.setState((s) => ({ ...s, playbackRate: speeds[nextIdx] }));
  }

  public async download(url: string, filenamePrefix = "AI_Voiceover"): Promise<void> {
    if (!url || this.state.isDownloading) return;
    this.setState((s) => ({ ...s, isDownloading: true }));
    try {
      await clientDirectDownload(url, `${filenamePrefix}_${Date.now()}.mp3`);
    } finally {
      this.setState((s) => ({ ...s, isDownloading: false }));
    }
  }

  public static formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}
