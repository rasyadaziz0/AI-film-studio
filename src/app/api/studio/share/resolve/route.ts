import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getServiceSupabase } from "@/lib/auth/requireAuth";

/**
 * POST /api/studio/share/resolve
 * Resolves a share_token and grants ephemeral access to the authenticated user via UPSERT.
 */
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth(req);
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "share_token is required" }, { status: 400 });
    }

    const authHeader = req.headers.get("Authorization");
    const userJwt = authHeader?.replace(/^Bearer\s+/i, "") || undefined;
    const serviceSupabase = getServiceSupabase(userJwt);

    // 1. Try resolving via SECURITY DEFINER RPC (bypasses all RLS hurdles safely inside Postgres)
    const { data: rpcResult, error: rpcErr } = await serviceSupabase.rpc("resolve_and_grant_share_token", {
      p_token: token,
      p_user_email: user.email || null,
    });

    if (!rpcErr && rpcResult && typeof rpcResult === "object") {
      if (!rpcResult.success) {
        return NextResponse.json({ error: rpcResult.error || "Tautan tidak valid, kedaluwarsa, atau tidak aktif." }, { status: 404 });
      }
      return NextResponse.json({ success: true, studioId: rpcResult.studioId, role: rpcResult.role });
    }

    // 2. Fallback query (if RPC migration not executed yet or during transition)
    const { data: studio, error: studioErr } = await serviceSupabase
      .from("studios")
      .select("id, user_id, sharing_visibility, share_token")
      .eq("share_token", token)
      .eq("sharing_visibility", "link_view")
      .single();

    if (studioErr || !studio) {
      return NextResponse.json({ error: "Tautan tidak valid, kedaluwarsa, atau tidak aktif. (Pastikan Anda sudah menjalankan fase_c_collaboration.sql terbaru di Supabase)" }, { status: 404 });
    }

    if (studio.user_id === user.id) {
      return NextResponse.json({ success: true, studioId: studio.id, role: "owner" });
    }

    const { data: collab } = await serviceSupabase
      .from("studio_collaborators")
      .select("role")
      .eq("studio_id", studio.id)
      .or(`user_id.eq.${user.id},user_email.eq.${user.email || ""}`)
      .maybeSingle();

    if (collab) {
      return NextResponse.json({ success: true, studioId: studio.id, role: collab.role });
    }

    const now = new Date().toISOString();
    const { error: upsertErr } = await serviceSupabase
      .from("studio_shared_access_grants")
      .upsert(
        {
          studio_id: studio.id,
          user_id: user.id,
          user_email: user.email || null,
          granted_token_snapshot: studio.share_token,
          updated_at: now,
        },
        { onConflict: "studio_id, user_id" }
      );

    if (upsertErr) {
      console.error("[ShareResolve] Upsert failed:", upsertErr);
      return NextResponse.json({ error: "Gagal mencatatkan akses sementara. Silakan jalankan script fase_c_collaboration.sql terbaru di Supabase." }, { status: 500 });
    }

    return NextResponse.json({ success: true, studioId: studio.id, role: "viewer" });
  } catch (err: any) {
    console.error("[ShareResolve] Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: err.statusCode || 500 }
    );
  }
}
