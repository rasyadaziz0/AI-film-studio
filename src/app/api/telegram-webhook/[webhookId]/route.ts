import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ webhookId: string }> }
) {
  try {
    const { webhookId } = await context.params;
    
    // We proxy this to the actual VPS backend.
    // We must preserve the body and the secret token header.
    const body = await req.text();
    
    const headers: Record<string, string> = {
      "Content-Type": req.headers.get("content-type") || "application/json",
    };
    
    const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
    if (secretToken) {
      headers["x-telegram-bot-api-secret-token"] = secretToken;
    }

    // Proxy destination
    const targetUrl = `https://api.acadlabs.fun/v1/telegram/webhook/${webhookId}`;

    const res = await fetch(targetUrl, {
      method: "POST",
      headers,
      body,
    });

    const responseText = await res.text();

    return new NextResponse(responseText, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "text/plain",
      },
    });
  } catch (error: any) {
    console.error("[Telegram Webhook Proxy Error]", error);
    return NextResponse.json({ 
      error: error.message,
      cause: error.cause ? String(error.cause) : undefined,
      stack: error.stack
    }, { status: 500 });
  }
}
