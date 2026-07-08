import { NextResponse } from "next/server";
import { requireAuth, getServiceSupabase, verifyStudioOwnership, AuthError } from "@/lib/auth/requireAuth";

export async function POST(req: Request) {
  try {
    const { user, supabase: userSupa } = await requireAuth(req);
    const body = await req.json();
    const { studioId } = body;

    if (!studioId) {
      return NextResponse.json({ error: "studioId is required" }, { status: 400 });
    }

    await verifyStudioOwnership(userSupa, studioId, user.id);

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const adminSupa = getServiceSupabase(token);

    // 1. Reset any running/queued nodes to idle
    await adminSupa
      .from("nodes")
      .update({ status: "idle" })
      .eq("studio_id", studioId)
      .in("status", ["running", "queued"]);

    // 2. Clear stuck jobs
    await adminSupa
      .from("jobs")
      .update({ status: "error", error: "Reset by user" })
      .eq("studio_id", studioId)
      .in("status", ["pending", "running", "polling"]);

    return NextResponse.json({ success: true, message: "Studio status reset successfully" });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[Engine Reset API Error]", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
