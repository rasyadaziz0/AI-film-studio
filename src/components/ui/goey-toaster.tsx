"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import GooeyToaster with ssr disabled to prevent Next.js SSR class component errors
const DynamicToaster = dynamic(
  () => import("goey-toast").then((mod) => mod.GooeyToaster),
  { ssr: false }
);

export function GoeyToasterProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <DynamicToaster position="top-center" theme="dark" closeOnEscape={true} />;
}
