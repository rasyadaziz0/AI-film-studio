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

    const { prompt, studioId } = await request.json();
    if (!prompt || !studioId) {
      return NextResponse.json({ error: "Prompt and studioId are required" }, { status: 400 });
    }

    // 4. Atomic Budget Reservation (RPC)
    // 0.05 USD per image
    // 5.0 USD daily limit
    const { getServiceSupabase } = await import("@/lib/auth/requireAuth");
    const supabase = getServiceSupabase();
    const { data: rpcResult, error: reserveErr } = await supabase.rpc("reserve_image_spend", {
      p_user_id: user.id,
      p_studio_id: studioId,
      p_cost: 0.05,
      p_daily_limit: 5.0
    });

    if (reserveErr) {
      console.error("[generate-image] RPC Error:", reserveErr);
      return NextResponse.json({ error: "Failed to verify daily limit" }, { status: 500 });
    }
    
    const budgetStatus = rpcResult as any;
    if (budgetStatus?.error) {
      return NextResponse.json({ error: budgetStatus.error }, { status: budgetStatus.error === "daily_budget_exceeded" ? 429 : 403 });
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
