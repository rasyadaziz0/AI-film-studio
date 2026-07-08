import { NextResponse } from "next/server";
import { requireAuth, checkKillSwitch, AuthError } from "@/lib/auth/requireAuth";
import { imageGenRateLimiter } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    // 1. Kill switch (fail-closed)
    checkKillSwitch();

    // 2. Auth
    const { user } = await requireAuth(request);

    // 3. Rate limit per user
    const { success } = await imageGenRateLimiter.limit(user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Terlalu banyak request gambar. Tunggu beberapa menit." },
        { status: 429 }
      );
    }

    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const { DashScopeMedia } = await import("@/lib/ai/providers/DashScopeMedia");
    const imageUrl = await DashScopeMedia.generateImage(prompt);

    // Upload to R2 for permanent storage
    let finalUrl = imageUrl;
    try {
      const { CloudflareR2 } = await import("@/lib/cloud/CloudflareR2");
      const res = await CloudflareR2.uploadMedia(imageUrl, "actor-image");
      finalUrl = res.url;
    } catch (e) {
      console.warn("[generate-image] R2 upload fallback:", e);
    }

    return NextResponse.json({ url: finalUrl });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[generate-image] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
