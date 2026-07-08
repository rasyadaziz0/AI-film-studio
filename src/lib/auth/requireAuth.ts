import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Extracts and verifies the JWT from the Authorization header.
 * Returns the authenticated user and a Supabase client scoped to that user (RLS active).
 */
export async function requireAuth(req: Request): Promise<{ user: User; supabase: SupabaseClient }> {
  const authHeader = req.headers.get("Authorization");
  const match = authHeader?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new AuthError("Invalid or missing Authorization header", 401);
  }
  const token = match[1];

  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!;
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new AuthError("Unauthorized: invalid or expired token", 401);
  }

  return { user, supabase };
}

/**
 * Creates a Supabase client with the service role key (bypasses RLS).
 * Only use for internal/engine operations, NEVER for user-facing queries.
 */
export function getServiceSupabase(userToken?: string): SupabaseClient {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!;
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    return createClient(url, serviceKey);
  }
  if (userToken) {
    return createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    });
  }
  return createClient(url, anonKey);
}

/**
 * Kill switch — fail-closed. If AI_GENERATION_ENABLED is not explicitly "true", all generation is blocked.
 */
export function checkKillSwitch(): void {
  if (process.env.AI_GENERATION_ENABLED !== "true") {
    throw new AuthError("AI generation is temporarily disabled by admin.", 503);
  }
}

/**
 * Verifies that the authenticated user owns the given studio.
 * Uses the user's own Supabase client (RLS active) + explicit user_id check.
 */
export async function verifyStudioOwnership(
  supabase: SupabaseClient,
  studioId: string,
  userId: string
): Promise<{ id: string; video_duration: number; niche: string | null }> {
  const { data: studio, error } = await supabase
    .from("studios")
    .select("id, video_duration, niche")
    .eq("id", studioId)
    .eq("user_id", userId)
    .single();

  if (error || !studio) {
    throw new AuthError("Studio not found or you do not have access", 403);
  }

  return studio;
}
