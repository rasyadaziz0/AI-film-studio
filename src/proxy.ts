import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Allowed origins for CORS.
 * In production, NEXT_PUBLIC_APP_URL should be set to the Vercel deployment URL.
 * Preview deployments are matched dynamically via the .vercel.app suffix.
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Primary production origin
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) origins.push(appUrl);

  // Always allow localhost in development
  origins.push("http://localhost:3000");

  return origins;
}

function isAllowedOrigin(origin: string | null): string | null {
  if (!origin) return null;

  const allowed = getAllowedOrigins();

  // Exact match
  if (allowed.includes(origin)) return origin;

  // Allow Vercel preview deployments (*.vercel.app)
  try {
    const url = new URL(origin);
    if (url.hostname.endsWith(".vercel.app")) return origin;
  } catch {
    // Invalid origin URL — reject
  }

  return null;
}

/**
 * Next.js 16 Edge Proxy (formerly middleware.ts)
 * Located inside src/ directory alongside app/ and lib/.
 * Handles CORS with dynamic origin matching + Vary: Origin.
 */
export function proxy(request: NextRequest) {
  const requestOrigin = request.headers.get("Origin");
  const matchedOrigin = isAllowedOrigin(requestOrigin);

  // Handle preflight OPTIONS requests for CORS
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (matchedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", matchedOrigin);
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
      response.headers.set("Access-Control-Max-Age", "86400");
      response.headers.set("Vary", "Origin");
    }
    return response;
  }

  // Continue request processing
  const response = NextResponse.next();

  // Attach CORS headers to API responses (dynamic origin echo + Vary)
  if (request.nextUrl.pathname.startsWith("/api/") && matchedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", matchedOrigin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    response.headers.set("Vary", "Origin");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all API routes and player streaming paths
     */
    "/api/:path*",
    "/player/:path*",
  ],
};
