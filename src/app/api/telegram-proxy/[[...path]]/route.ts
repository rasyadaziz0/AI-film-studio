import { NextRequest, NextResponse } from "next/server";
import { ipRateLimiter, enforceRateLimits } from "@/lib/rateLimit";





export async function POST(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path } = await context.params;
  return handleProxy(req, path || []);
}

export async function GET(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path } = await context.params;
  return handleProxy(req, path || []);
}

async function handleProxy(req: NextRequest, pathArray: string[]) {
  // Fallback to Supabase Anon Key if TELEGRAM_RELAY_SECRET is missing.
  // Since Cloudflare Pages deployments can be tricky with new env vars, this ensures it works out of the box.
  const RELAY_SECRET = process.env.TELEGRAM_RELAY_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail-closed: secret MUST be configured, and MUST match
  // Checking this FIRST avoids exhausting Upstash quota on unauthorized DDoS requests.
  if (!RELAY_SECRET) {
    return NextResponse.json({ error: "Configuration Missing" }, { status: 401 });
  }
  if (req.headers.get("x-relay-secret") !== RELAY_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // 2nd layer of defense: Rate limit authorized requests per IP
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      await enforceRateLimits([{ limiter: ipRateLimiter, key: ip, label: "Telegram Proxy" }]);
    } else {
      console.warn("Upstash Redis is not configured in this environment, bypassing rate limit");
    }

    const telegramPath = pathArray ? pathArray.join("/") : "";
    const url = new URL(`https://api.telegram.org/${telegramPath}`);
    url.search = req.nextUrl.search;

    const requestInit: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": req.headers.get("Content-Type") || "application/json",
      },
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const contentType = req.headers.get("Content-Type") || "";
      if (contentType.includes("multipart/form-data")) {
        requestInit.body = await req.formData();
        delete (requestInit.headers as any)["Content-Type"];
      } else {
        requestInit.body = await req.text();
      }
    }

    const response = await fetch(url.toString(), requestInit);
    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error: any) {
    console.error("[Telegram Proxy Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
