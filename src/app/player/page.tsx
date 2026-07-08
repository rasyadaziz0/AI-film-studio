import React from "react";
import { Metadata } from "next";
import CinemaPlayerClient from "./CinemaPlayerClient";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolved = await searchParams;
  const title = typeof resolved.title === "string" ? resolved.title : "AI Studio Video Production";
  const url = typeof resolved.url === "string" ? resolved.url : "";

  return {
    title: `${title} | AI Film Studio Cinema Player`,
    description: "Rendered autonomously via Alibaba Cloud Model Studio & persisted on Cloud Distributed Storage Network.",
    openGraph: {
      title: `${title} | AI Film Studio`,
      description: "Watch AI Generated Video from Alibaba Cloud Wan 2.7",
      type: "video.other",
      videos: url ? [url] : []
    },
    twitter: {
      card: "player",
      title: `${title} | AI Film Studio`,
      description: "Watch AI Generated Video from Alibaba Cloud Wan 2.7"
    }
  };
}

export default async function CinemaPlayerPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const initialUrl = typeof resolved.url === "string" ? resolved.url : "";
  const initialTitle = typeof resolved.title === "string" ? resolved.title : "AI Studio Video Production";

  return <CinemaPlayerClient initialUrl={initialUrl} initialTitle={initialTitle} />;
}
