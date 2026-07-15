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

export interface StudioCapabilities {
  canView: boolean;
  canEditCanvas: boolean;
  canRun: boolean;
  canManageSharing: boolean;
  canDelete: boolean;
}

export interface StudioAccessResult {
  role: 'owner' | 'editor' | 'viewer';
  accessSource: 'owner' | 'collaborator' | 'shared_link';
  capabilities: StudioCapabilities;
  studio: {
    id: string;
    name?: string;
    video_duration?: number;
    niche?: string | null;
    sharing_visibility?: string;
    share_token?: string;
  };
}

/**
 * Centralized Access Resolver with Deterministic Precedence:
 * owner > editor collaborator > viewer collaborator > shared_link viewer
 */
export async function resolveStudioAccess(
  supabase: SupabaseClient,
  studioId: string,
  userId: string,
  userEmail?: string
): Promise<StudioAccessResult> {
  // 1. Fetch basic studio metadata (using service role or current client)
  const serviceSupabase = getServiceSupabase();
  const { data: studio, error: studioErr } = await serviceSupabase
    .from("studios")
    .select("id, user_id, name, video_duration, niche, sharing_visibility, share_token")
    .eq("id", studioId)
    .single();

  if (studioErr || !studio) {
    throw new AuthError("Studio not found or access denied", 403);
  }

  // 1. Precedence Level 1: Owner
  if (studio.user_id === userId) {
    return {
      role: 'owner',
      accessSource: 'owner',
      capabilities: {
        canView: true,
        canEditCanvas: true,
        canRun: true,
        canManageSharing: true,
        canDelete: true,
      },
      studio,
    };
  }

  // 2. Precedence Level 2 & 3: Permanent Invited Collaborator (Editor or Viewer)
  const collabQuery = serviceSupabase
    .from("studio_collaborators")
    .select("role")
    .eq("studio_id", studioId);

  if (userEmail) {
    collabQuery.or(`user_id.eq.${userId},user_email.eq.${userEmail}`);
  } else {
    collabQuery.eq("user_id", userId);
  }

  const { data: collabs } = await collabQuery;
  if (collabs && collabs.length > 0) {
    // If user has both editor and viewer rows somehow, editor wins (highest role wins)
    const isEditor = collabs.some((c) => c.role === 'editor');
    if (isEditor) {
      return {
        role: 'editor',
        accessSource: 'collaborator',
        capabilities: {
          canView: true,
          canEditCanvas: true,
          canRun: true,
          canManageSharing: false,
          canDelete: false,
        },
        studio,
      };
    } else {
      return {
        role: 'viewer',
        accessSource: 'collaborator',
        capabilities: {
          canView: true,
          canEditCanvas: false,
          canRun: false,
          canManageSharing: false,
          canDelete: false,
        },
        studio,
      };
    }
  }

  // 3. Precedence Level 4: Ephemeral Shared Link Viewer (if snapshot matches and link_view active)
  if (studio.sharing_visibility === 'link_view' && studio.share_token) {
    const { data: grant } = await serviceSupabase
      .from("studio_shared_access_grants")
      .select("granted_token_snapshot")
      .eq("studio_id", studioId)
      .eq("user_id", userId)
      .maybeSingle();

    if (grant && grant.granted_token_snapshot === studio.share_token) {
      return {
        role: 'viewer',
        accessSource: 'shared_link',
        capabilities: {
          canView: true,
          canEditCanvas: false,
          canRun: false,
          canManageSharing: false,
          canDelete: false,
        },
        studio,
      };
    }
  }

  // 4. Access Denied
  throw new AuthError("You do not have permission to access this studio", 403);
}
