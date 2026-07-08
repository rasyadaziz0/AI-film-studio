import React from "react";
import { Metadata } from "next";
import ImageViewerClient from "./ImageViewerClient";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolved = await searchParams;
  const title = typeof resolved.title === "string" ? resolved.title : "AI Studio Image Output";
  const url = typeof resolved.url === "string" ? resolved.url : "";

  return {
    title: `${title} | AI Film Studio Image Viewer`,
    description: "Generated autonomously via Alibaba Cloud Model Studio & persisted on Cloud Distributed Storage Network.",
    openGraph: {
      title: `${title} | AI Film Studio`,
      description: "View AI Generated Image from Alibaba Cloud Qwen-Image",
      type: "article",
      images: url ? [url] : []
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | AI Film Studio`,
      description: "View AI Generated Image from Alibaba Cloud Qwen-Image",
      images: url ? [url] : []
    }
  };
}

export default async function ImageViewerPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const initialUrl = typeof resolved.url === "string" ? resolved.url : "";
  const initialTitle = typeof resolved.title === "string" ? resolved.title : "AI Studio Image Output";

  return <ImageViewerClient initialUrl={initialUrl} initialTitle={initialTitle} />;
}
