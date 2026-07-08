import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/requireAuth";

/**
 * Allowlisted hostnames for proxy download.
 * Only these domains are permitted — prevents SSRF to internal/cloud metadata.
 */
const ALLOWED_HOSTNAMES = new Set([
  // Cloudflare R2 public bucket
  "pub-5c1348173da449309e6eaf4e2e0140e4.r2.dev",
  // DashScope media output (Singapore region)
  "dashscope-result-sg.oss-ap-southeast-1.aliyuncs.com",
  // DashScope compatible mode
  "dashscope-intl.aliyuncs.com",
]);

/**
 * Checks if a hostname is a private/loopback/metadata address.
 */
function isPrivateHostname(hostname: string): boolean {
  // Block metadata endpoints, loopback, link-local, private ranges
  const blocked = [
    /^localhost$/i,
    /^127\.\d+\.\d+\.\d+$/,
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^169\.254\.\d+\.\d+$/,    // AWS metadata, link-local
    /^0\.0\.0\.0$/,
    /^\[::1?\]$/,               // IPv6 loopback
    /^metadata\.google\.internal$/i,
  ];
  return blocked.some((re) => re.test(hostname));
}

export async function GET(req: NextRequest) {
  try {
    // 1. Auth — only logged-in users can use this proxy
    await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const filename = searchParams.get("filename") || `export_${Date.now()}.mp4`;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // 2. Parse and validate the target URL
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // 3. Force HTTPS only
    if (parsed.protocol !== "https:") {
      return NextResponse.json({ error: "Only HTTPS URLs are allowed" }, { status: 403 });
    }

    // 4. Block private/internal hostnames
    if (isPrivateHostname(parsed.hostname)) {
      return NextResponse.json({ error: "Access to internal addresses is forbidden" }, { status: 403 });
    }

    // 5. Exact hostname match against allowlist
    if (!ALLOWED_HOSTNAMES.has(parsed.hostname)) {
      return NextResponse.json(
        { error: `Domain not allowed: ${parsed.hostname}` },
        { status: 403 }
      );
    }

    // 6. Fetch with redirect: "manual" to prevent redirect-based SSRF
    const response = await fetch(url, {
      redirect: "manual",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AI-Studio-Downloader",
      },
    });

    // If the server tried to redirect, block it
    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json(
        { error: "Redirects are not allowed for security reasons" },
        { status: 403 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch from CDN: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const body = response.body;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[ProxyDownload] Error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
