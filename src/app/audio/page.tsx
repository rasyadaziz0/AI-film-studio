import React from "react";
import { Metadata } from "next";
import AudioPlayerClient from "./AudioPlayerClient";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolved = await searchParams;
  const title = typeof resolved.title === "string" ? resolved.title : "AI Studio Voiceover Output";

  return {
    title: `${title} | AI Film Studio Audio Player`,
    description: "Generated autonomously via Alibaba Cloud Qwen3-TTS / CosyVoice & persisted on Cloud Distributed Storage Network.",
    openGraph: {
      title: `${title} | AI Film Studio Audio`,
      description: "Listen to AI Generated Voiceover from Alibaba Cloud Qwen3-TTS / CosyVoice",
      type: "music.song",
    },
    twitter: {
      card: "summary",
      title: `${title} | AI Film Studio Audio`,
      description: "Listen to AI Generated Voiceover from Alibaba Cloud Qwen3-TTS / CosyVoice",
    }
  };
}

export default async function AudioPlayerPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const initialUrl = typeof resolved.url === "string" ? resolved.url : "";
  const initialTitle = typeof resolved.title === "string" ? resolved.title : "AI Studio Voiceover Output";

  return <AudioPlayerClient initialUrl={initialUrl} initialTitle={initialTitle} />;
}
