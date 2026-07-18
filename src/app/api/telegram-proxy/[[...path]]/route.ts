import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path } = await context.params;
  return handleProxy(req, path || []);
}

export async function GET(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path } = await context.params;
  return handleProxy(req, path || []);
}

async function handleProxy(req: NextRequest, pathArray: string[]) {
  try {
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
      requestInit.body = await req.text();
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
