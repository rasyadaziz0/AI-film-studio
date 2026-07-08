import { NextResponse } from "next/server";
import { requireAuth, checkKillSwitch, AuthError } from "@/lib/auth/requireAuth";
import { textGenRateLimiter } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    // 1. Kill switch (fail-closed)
    checkKillSwitch();

    // 2. Auth
    const { user } = await requireAuth(req);

    // 3. Rate limit per user
    const { success } = await textGenRateLimiter.limit(user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Terlalu banyak request. Mohon tunggu beberapa menit." },
        { status: 429 }
      );
    }

    const { systemPrompt, userPrompt, model } = await req.json();

    if (!userPrompt) {
      return NextResponse.json(
        { error: "User prompt is required" },
        { status: 400 }
      );
    }

    // 4. Generate — provider is always Qwen (server-enforced)
    const { ProviderFactory } = await import("@/lib/ai/providers/ProviderFactory");
    const aiProvider = ProviderFactory.create("qwen");
    const result = await aiProvider.generate(systemPrompt || "", userPrompt, model);

    return NextResponse.json({ result });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[AI Generate Error]", error);
    const msg = error instanceof Error ? error.message : "Failed to generate";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
