import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Allowed origins for CORS.
 * In production, NEXT_PUBLIC_APP_URL should be set to the deployment URL.
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) origins.push(appUrl);
  origins.push("http://localhost:3000");
  return origins;
}

export function isAllowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) return origin;
  try {
    const url = new URL(origin);
    if (url.hostname.endsWith(".vercel.app") || url.hostname.endsWith(".pages.dev")) return origin;
  } catch {
    // Invalid origin URL
  }
  return null;
}
