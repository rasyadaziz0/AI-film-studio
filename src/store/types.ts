import { Edge, Node, OnNodesChange, OnEdgesChange, OnConnect } from "@xyflow/react";
import { AgentType, NodeStatus } from "@/components/studio/nodes/AgentNode";
import { WajibTemplate, TambahanTemplate } from "@/lib/core/templates";

export type Studio = {
  id: string;
  name: string;
  niche?: string | null;
  video_duration?: number;
  language?: string;
  default_model?: string;
  user_id?: string;
  template?: string;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
  telegram_webhook_secret?: string | null;
  telegram_mode?: "none" | "output_only" | "full_telegram";
  created_at?: string;
  updated_at?: string;
};

export type StudioState = {
  // Canvas State
  nodes: Node[];
  edges: Edge[];
  toolMode: "pointer" | "hand";
  
  // History State
  history: {
    past: { nodes: Node[]; edges: Edge[] }[];
    future: { nodes: Node[]; edges: Edge[] }[];
  };

  // Methods for Canvas
  setToolMode: (mode: "pointer" | "hand") => void;
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
  
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (type: AgentType, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  updateNodeStatus: (nodeId: string, status: NodeStatus) => void;
  changeNodeType: (nodeId: string, newType: AgentType) => void;
  deleteNode: (nodeId: string) => void;

  // Pipeline Execution
  runNode: (nodeId: string) => Promise<void>;
  runPipeline: () => Promise<void>;

  // Persistence
  studios: Studio[];
  activeStudioId: string | null;
  fetchStudios: () => Promise<void>;
  loadStudio: (studioId: string) => Promise<void>;
  saveStudio: () => Promise<void>;
  createStudio: (name: string, wajib?: WajibTemplate, tambahan?: TambahanTemplate) => Promise<void>;
  updateStudio: (updates: Partial<Studio>, id?: string) => Promise<void>;
  deleteStudio: (studioId: string) => Promise<void>;
  pollStatus: () => Promise<void>;
};
