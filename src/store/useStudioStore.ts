import { create } from "zustand";
import { StudioState } from "./types";
import { CanvasController } from "@/lib/core/CanvasController";
import { StudioRepository } from "@/lib/core/StudioRepository";
import { toast } from "@/lib/utils/toast";

export const useStudioStore = create<StudioState>((set, get) => {
  // Instantiate the OOP classes, passing Zustand's set and get
  const canvasController = new CanvasController(set, get);
  const studioRepository = new StudioRepository(set, get);

  return {
    // --- Initial State ---
    nodes: [],
    edges: [],
    toolMode: "pointer",
    studios: [],
    activeStudioId: null,
    capabilities: {
      canView: true,
      canEditCanvas: true,
      canRun: true,
      canManageSharing: true,
      canDelete: true,
    },
    role: 'owner',
    accessSource: 'owner',
    setAccessCapabilities: (role, accessSource, capabilities) => set({ role, accessSource, capabilities }),
    history: { past: [], future: [] },

    // --- History Methods ---
    saveHistory: () => {
      const { nodes, edges, history } = get();
      // Only keep the last 50 states to prevent memory bloat
      const newPast = [...history.past, { nodes: [...nodes], edges: [...edges] }].slice(-50);
      set({ history: { past: newPast, future: [] } });
    },
    undo: () => {
      const { nodes, edges, history } = get();
      if (history.past.length === 0) return;
      
      const previous = history.past[history.past.length - 1];
      const newPast = history.past.slice(0, -1);
      
      set({
        nodes: previous.nodes,
        edges: previous.edges,
        history: { past: newPast, future: [{ nodes, edges }, ...history.future] }
      });
    },
    redo: () => {
      const { nodes, edges, history } = get();
      if (history.future.length === 0) return;
      
      const next = history.future[0];
      const newFuture = history.future.slice(1);
      
      set({
        nodes: next.nodes,
        edges: next.edges,
        history: { past: [...history.past, { nodes, edges }], future: newFuture }
      });
    },

    // --- Tool Mode ---
    setToolMode: (mode) => set({ toolMode: mode }),

    // --- Canvas Controller Proxies ---
    onNodesChange: canvasController.onNodesChange.bind(canvasController),
    onEdgesChange: canvasController.onEdgesChange.bind(canvasController),
    onConnect: canvasController.onConnect.bind(canvasController),
    addNode: canvasController.addNode.bind(canvasController),
    updateNodeData: canvasController.updateNodeData.bind(canvasController),
    updateNodeStatus: canvasController.updateNodeStatus.bind(canvasController),
    changeNodeType: canvasController.changeNodeType.bind(canvasController),
    deleteNode: canvasController.deleteNode.bind(canvasController),

    // --- Pipeline Engine Proxies ---
    runNode: async (nodeId) => {
      if (!get().capabilities.canRun) {
        toast.error("Akses Ditolak", "Mode View-Only tidak mengizinkan eksekusi agen AI.");
        return;
      }
      const { activeStudioId, saveStudio, nodes } = get();
      if (!activeStudioId || !nodeId) return;

      await saveStudio();

      // Mark ONLY this node as queued in UI instantly
      set({
        nodes: nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: "queued" } } : n)
      });

      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch(`${apiUrl}/v1/jobs`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ studioId: activeStudioId, idempotencyKey, targetNodeId: nodeId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Failed to run node:", errData.error || "Unknown error");
        set({
          nodes: get().nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: "error" } } : n)
        });
      }
    },
    runPipeline: async () => {
      if (!get().capabilities.canRun) {
        toast.error("Akses Ditolak", "Mode View-Only tidak mengizinkan eksekusi pipeline AI.");
        return;
      }
      const { activeStudioId, saveStudio } = get();
      if (!activeStudioId) return;

      // Force save first to ensure DB is up to date before engine runs
      await saveStudio();

      // Get user session for Auth
      const { supabase } = await import("@/lib/supabase");
      // Mark nodes as queued in UI instantly
      set({
        nodes: get().nodes.map(n => n.type === "input" ? n : { ...n, data: { ...n.data, status: "queued" } })
      });

      const { data: { session } } = await supabase.auth.getSession();

      // Trigger server-side engine with idempotency key to prevent double-click
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch(`${apiUrl}/v1/jobs`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ studioId: activeStudioId, idempotencyKey }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = errData.error || "Failed to start pipeline engine";
        console.error("Failed to start pipeline engine:", errorMsg);
        if (typeof window !== "undefined") {
          toast.error("Gagal Menjalankan Pipeline", errorMsg);
        }
      } else {
        if (typeof window !== "undefined") {
          toast.success("Pipeline Started", "Tim agen AI sedang mengeksekusi pipeline Anda di server.");
        }
        // Start robust active polling loop for live UI feedback (n8n-style progress)
        let pollTicks = 0;
        const pollInterval = setInterval(async () => {
          pollTicks++;
          await get().pollStatus();
          
          // Only check stop condition after at least 4 ticks (approx 4 seconds)
          if (pollTicks > 3) {
            const anyRunning = get().nodes.some(n => n.data.status === "running" || n.data.status === "queued");
            if (!anyRunning) {
              clearInterval(pollInterval);
            }
          }
        }, 1000);
        
        setTimeout(() => clearInterval(pollInterval), 900000); // safety cap at 15 mins
      }
    },

    // --- Studio Repository Proxies ---
    fetchStudios: studioRepository.fetchStudios.bind(studioRepository),
    createStudio: studioRepository.createStudio.bind(studioRepository),
    loadStudio: studioRepository.loadStudio.bind(studioRepository),
    saveStudio: studioRepository.saveStudio.bind(studioRepository),
    updateStudio: studioRepository.updateStudio.bind(studioRepository),
    deleteStudio: studioRepository.deleteStudio.bind(studioRepository),
    pollStatus: studioRepository.pollStatus.bind(studioRepository),
  };
});
