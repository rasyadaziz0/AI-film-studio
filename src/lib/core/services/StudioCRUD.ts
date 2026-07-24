import { StudioState, Studio } from "@/store/types";
import { WajibTemplate, TambahanTemplate, generateTemplateNodesAndEdges } from "../templates";
import { supabase } from "@/lib/supabase";

export class StudioCRUD {
  constructor(
    private set: (partial: Partial<StudioState> | ((state: StudioState) => Partial<StudioState>)) => void,
    private get: () => StudioState,
    private loadStudioFn: (studioId: string) => Promise<void>
  ) { }

  public async fetchStudios() {

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[StudioCRUD] No authenticated user found.");
      return;
    }

    let { data: studios, error } = await supabase
      .from("studios")
      .select("id, user_id, name, niche, mode, video_duration, template, default_model, telegram_mode, telegram_chat_id, sharing_visibility, share_token, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === '42P17') {
        console.error("[StudioCRUD] ⚠️ INFINITE RECURSION RLS (Error 42P17) terdeteksi pada tabel studios! Silakan jalankan script fase_c_collaboration.sql terbaru yang menggunakan SECURITY DEFINER di Supabase SQL Editor Anda.");
        return;
      }
      if (error.code === 'PGRST204' || error.message?.includes('sharing_visibility')) {
        console.warn("[StudioCRUD] Kolom kolaborator belum ada di schema cache. Menggunakan fallback query dasar. Silakan jalankan fase_c_collaboration.sql di Supabase.");
        const res = await supabase
          .from("studios")
          .select("id, user_id, name, niche, mode, video_duration, template, default_model, telegram_mode, telegram_chat_id, created_at, updated_at")
          .order("created_at", { ascending: false });
        studios = res.data ? res.data.map((s: any) => ({ ...s, sharing_visibility: 'private', share_token: null })) : null;
        error = res.error;
      }
    }

    if (error) {
      console.error("[StudioCRUD] Error fetching studios:", error.message || JSON.stringify(error));
      return;
    }

    // Query permanent collaborations for this user
    const { data: collabs } = await supabase
      .from("studio_collaborators")
      .select("studio_id, role")
      .or(`user_id.eq.${user.id},user_email.eq.${user.email || ""}`);

    const collabMap = new Map<string, string>();
    if (collabs) {
      collabs.forEach(c => collabMap.set(c.studio_id, c.role));
    }

    const rawStudios = studios || [];
    const safeStudios = rawStudios
      .map((s: any) => {
        const rawModel = s.default_model || "qwen-plus";
        const model = rawModel.split("###")[0] || "qwen-plus";
        const lang = rawModel.includes("###") ? rawModel.split("###")[1] : "English";

        let accessSource: 'owner' | 'collaborator' | 'shared_link' = 'owner';
        let role: 'owner' | 'editor' | 'viewer' = 'owner';

        if (s.user_id === user.id) {
          accessSource = 'owner';
          role = 'owner';
        } else if (collabMap.has(s.id)) {
          accessSource = 'collaborator';
          role = (collabMap.get(s.id) as any) || 'viewer';
        } else {
          accessSource = 'shared_link';
          role = 'viewer';
        }

        return {
          ...s,
          default_model: model,
          language: lang,
          accessSource,
          role,
        };
      })
      // Filter out ephemeral shared_link sessions so they are never persisted to the dashboard list
      .filter((s: any) => s.accessSource !== 'shared_link');

    this.set({ studios: safeStudios });

    // If no studios exist, create a default one
    if (!safeStudios || safeStudios.length === 0) {

      await this.createStudio("My First Studio", "basic", "none");
    } else if (!this.get().activeStudioId) {

      await this.loadStudioFn(safeStudios[0].id);
    }
  }

  public async createStudio(name: string, wajib: WajibTemplate = "basic", tambahan: TambahanTemplate = "none") {

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: studio, error } = await supabase
      .from("studios")
      .insert({ name, user_id: user.id, template: `${wajib}-${tambahan}`, default_model: "qwen-plus###English" })
      .select()
      .single();

    if (error) {
      console.error("[StudioCRUD] Error creating studio:", error);
      return;
    }

    // Generate template nodes and edges
    const { nodes, edges } = generateTemplateNodesAndEdges(wajib, tambahan);

    // Save nodes and edges if there are any
    if (nodes.length > 0) {
      const validStatuses = ["idle", "running", "done", "error"];
      const nodesToInsert = nodes.map((n) => ({
        id: n.id,
        studio_id: studio.id,
        type: n.data.type,
        label: n.data.label,
        position_x: n.position.x,
        position_y: n.position.y,
        status: validStatuses.includes(n.data.status as string) ? n.data.status : "idle",
      }));
      const { error: nodeError } = await supabase.from("nodes").insert(nodesToInsert);
      if (nodeError) console.error("[StudioCRUD] Error inserting nodes:", nodeError);
    }

    if (edges.length > 0) {
      const edgesToInsert = edges.map((e) => ({
        id: e.id,
        studio_id: studio.id,
        source_node_id: e.source,
        target_node_id: e.target,
        source_handle: e.sourceHandle,
        target_handle: e.targetHandle,
      }));
      const { error: edgeError } = await supabase.from("edges").insert(edgesToInsert);
      if (edgeError) console.error("[StudioCRUD] Error inserting edges:", edgeError);
    }

    const formattedStudio = { ...studio, default_model: "qwen-plus", language: "English" };
    this.set({ studios: [formattedStudio, ...this.get().studios] });
    await this.loadStudioFn(studio.id);
  }

  public async updateStudio(updates: Partial<Studio>, id?: string) {
    const targetId = id || this.get().activeStudioId;
    if (!targetId) return;

    const { studios } = this.get();
    const currentStudio = studios.find(s => s.id === targetId);

    const dbUpdates: Record<string, any> = { ...updates };
    delete dbUpdates.language;

    if (updates.language !== undefined || updates.default_model !== undefined) {
      const model = updates.default_model !== undefined ? updates.default_model : (currentStudio?.default_model || "qwen-plus");
      const lang = updates.language !== undefined ? updates.language : (currentStudio?.language || "English");
      dbUpdates.default_model = `${model}###${lang}`;
    }

    const { error } = await supabase
      .from("studios")
      .update(dbUpdates)
      .eq("id", targetId);

    if (error) {
      console.error("[StudioCRUD] Failed to update studio:", error);
      return;
    }

    // Update locally
    this.set({
      studios: studios.map(s => s.id === targetId ? { ...s, ...updates } : s)
    });
  }

  public async deleteStudio(studioId: string) {
    const { error } = await supabase
      .from("studios")
      .delete()
      .eq("id", studioId);

    if (error) {
      console.error("[StudioCRUD] Failed to delete studio:", error);
      return;
    }

    const { studios, activeStudioId } = this.get();
    const newStudios = studios.filter(s => s.id !== studioId);

    this.set({ studios: newStudios });

    if (activeStudioId === studioId) {
      this.set({
        activeStudioId: null,
        nodes: [],
        edges: []
      });
    }
  }
}
