import { StudioState } from "@/store/types";
import { Node, Edge } from "@xyflow/react";
import { supabase } from "@/lib/supabase";

export class StudioSync {
  constructor(
    private set: (partial: Partial<StudioState> | ((state: StudioState) => Partial<StudioState>)) => void,
    private get: () => StudioState
  ) {}

  public async loadStudio(studioId: string) {
    console.log(`[StudioSync] Loading studio ${studioId}...`);

    const [nodesRes, edgesRes] = await Promise.all([
      // Client-side: uses anon key + RLS (no sensitive columns exposed)
      // Using wildcard until DB schema is fully migrated to match AGENTS.md
      supabase.from("nodes").select("*").eq("studio_id", studioId),
      supabase.from("edges").select("*").eq("studio_id", studioId),
    ]);

    if (nodesRes.error) {
      console.error("[StudioSync] Error loading nodes:", nodesRes.error);
      return;
    }
    if (edgesRes.error) {
      console.error("[StudioSync] Error loading edges:", edgesRes.error);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loadedNodes: Node[] = (nodesRes.data || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      position: { x: n.position_x, y: n.position_y },
      data: {
        label: n.label,
        type: n.type,
        status: n.status || "idle",
        output: n.output,
        output_url: n.output_url,
        config: n.config || {},
        role_prompt: n.role_prompt,
        user_input: n.user_input,
        provider: n.provider,
        model: n.model
      },
      dragHandle: ".drag-handle",
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loadedEdges: Edge[] = (edgesRes.data || []).map((e: any) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      sourceHandle: e.source_handle || undefined,
      targetHandle: e.target_handle || undefined,
      type: "default",
      animated: true,
      markerEnd: { type: "arrowclosed" },
    }));

    console.log(`[StudioSync] Loaded ${loadedNodes.length} nodes and ${loadedEdges.length} edges`);

    // Resolve deterministic access precedence when loading studio on client
    const { data: { user } } = await supabase.auth.getUser();
    let role: 'owner' | 'editor' | 'viewer' = 'owner';
    let accessSource: 'owner' | 'collaborator' | 'shared_link' = 'owner';
    let capabilities = {
      canView: true,
      canEditCanvas: true,
      canRun: true,
      canManageSharing: true,
      canDelete: true,
    };

    if (user) {
      const { data: studioData } = await supabase.from("studios").select("user_id, sharing_visibility, share_token").eq("id", studioId).single();
      if (studioData) {
        if (studioData.user_id === user.id) {
          role = 'owner';
          accessSource = 'owner';
        } else {
          const { data: collab } = await supabase.from("studio_collaborators").select("role").eq("studio_id", studioId).or(`user_id.eq.${user.id},user_email.eq.${user.email || ""}`).maybeSingle();
          if (collab) {
            const isEditor = collab.role === 'editor';
            role = isEditor ? 'editor' : 'viewer';
            accessSource = 'collaborator';
            capabilities = { canView: true, canEditCanvas: isEditor, canRun: isEditor, canManageSharing: false, canDelete: false };
          } else {
            role = 'viewer';
            accessSource = 'shared_link';
            capabilities = { canView: true, canEditCanvas: false, canRun: false, canManageSharing: false, canDelete: false };
          }
        }
      }
    }

    this.set({
      activeStudioId: studioId,
      nodes: loadedNodes,
      edges: loadedEdges,
      role,
      accessSource,
      capabilities,
    });
  }

  public async saveStudio() {
    const { activeStudioId, nodes, edges, capabilities } = this.get();
    if (!capabilities.canEditCanvas) {
      console.warn("[StudioSync] Cannot save: View-Only mode active.");
      return false;
    }
    if (!activeStudioId) {
      console.warn("[StudioSync] Cannot save: No active studio.");
      return false;
    }

    console.log(`[StudioSync] Saving studio ${activeStudioId}...`);
    
    // 1. Fetch existing IDs
    const [{ data: existingNodes }, { data: existingEdges }] = await Promise.all([
      supabase.from("nodes").select("id").eq("studio_id", activeStudioId),
      supabase.from("edges").select("id").eq("studio_id", activeStudioId)
    ]);

    // 2. Determine what to delete
    const nodesToDelete = (existingNodes || []).filter(en => !nodes.some(n => n.id === en.id)).map(n => n.id);
    const edgesToDelete = (existingEdges || []).filter(ee => !edges.some(e => e.id === ee.id)).map(e => e.id);

    // 3. Delete removed edges first (to avoid FK errors), then nodes
    if (edgesToDelete.length > 0) {
      await supabase.from("edges").delete().in("id", edgesToDelete);
    }
    if (nodesToDelete.length > 0) {
      await supabase.from("nodes").delete().in("id", nodesToDelete);
    }

    // 4. Upsert nodes
    if (nodes.length > 0) {
      const validStatuses = ["idle", "running", "done", "error"];
      const nodesToUpsert = nodes.map((n) => ({
        id: n.id,
        studio_id: activeStudioId,
        type: n.type === "video_generator" ? "video" : n.type,
        label: n.data.label,
        position_x: n.position.x,
        position_y: n.position.y,
        status: validStatuses.includes(n.data.status as string) ? n.data.status : "idle",
        output: n.data.output,
        output_url: n.data.output_url,
        model: n.data.model,
        config: n.data.config || {},
      }));
      
      const { error: nodeError } = await supabase.from("nodes").upsert(nodesToUpsert);
      if (nodeError) console.error("[StudioSync] Failed to upsert nodes:", nodeError);
    }

    // 5. Upsert edges
    if (edges.length > 0) {
      const edgesToUpsert = edges.map((e) => ({
        id: e.id,
        studio_id: activeStudioId,
        source_node_id: e.source,
        target_node_id: e.target,
        source_handle: e.sourceHandle,
        target_handle: e.targetHandle,
      }));
      const { error: edgeError } = await supabase.from("edges").upsert(edgesToUpsert);
      if (edgeError) console.error("[StudioSync] Failed to upsert edges:", edgeError);
    }

    console.log("[StudioSync] Studio saved successfully via upsert!");
  }

  public async pollStatus() {
    const { activeStudioId, nodes, capabilities } = this.get();
    if (!activeStudioId) return;
    
    const { data: dbNodes, error } = await supabase
      .from("nodes")
      .select("id, type, label, position_x, position_y, output, output_url, status, config")
      .eq("studio_id", activeStudioId);

    if (error || !dbNodes) return;

    // For Spectator / View-Only mode, we sync everything including position moves, added/deleted nodes & edges!
    if (!capabilities.canEditCanvas) {
      let structureChanged = dbNodes.length !== nodes.length || dbNodes.some(dbn => {
        const n = nodes.find(existing => existing.id === dbn.id);
        return !n || n.position.x !== dbn.position_x || n.position.y !== dbn.position_y || dbn.status !== n.data?.status || dbn.output !== n.data?.output || dbn.output_url !== n.data?.output_url;
      });

      if (structureChanged) {
        const mappedNodes = dbNodes.map(dbn => {
          const existing = nodes.find(n => n.id === dbn.id);
          return {
            id: dbn.id,
            type: dbn.type === "video" ? "video_generator" : dbn.type,
            position: { x: dbn.position_x || 0, y: dbn.position_y || 0 },
            data: {
              label: dbn.label || dbn.type,
              status: dbn.status || "idle",
              output: dbn.output || "",
              output_url: dbn.output_url || "",
              config: existing?.data?.config || dbn.config || {},
            }
          };
        });

        // Also fetch edges for viewers so line connections stay synced if owner added/removed edges
        const { data: dbEdges } = await supabase.from("edges").select("*").eq("studio_id", activeStudioId);
        const mappedEdges = (dbEdges || []).map(dbe => ({
          id: dbe.id,
          source: dbe.source_node_id,
          target: dbe.target_node_id,
          sourceHandle: dbe.source_handle || undefined,
          targetHandle: dbe.target_handle || undefined,
          type: "default",
        }));

        this.set({ nodes: mappedNodes as any, edges: mappedEdges });
        return;
      }
    }

    // For Editor mode (when user is typing or editing), only sync status and output to avoid interrupting typing or dragging
    let changed = false;
    const newNodes = nodes.map(n => {
      const dbNode = dbNodes.find(dbn => dbn.id === n.id);
      if (dbNode && (
        dbNode.status !== n.data.status || 
        dbNode.output !== n.data.output || 
        dbNode.output_url !== n.data.output_url
      )) {
        changed = true;
        return {
          ...n,
          data: {
            ...n.data,
            status: dbNode.status,
            output: dbNode.output,
            output_url: dbNode.output_url
            // Do NOT overwrite config here, as it causes textareas to reset while typing
          }
        };
      }
      return n;
    });

    if (changed) {
      this.set({ nodes: newNodes });
    }
  }
}
