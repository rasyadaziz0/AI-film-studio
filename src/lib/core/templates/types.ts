import { Node, Edge } from "@xyflow/react";
import { AgentType } from "@/components/studio/nodes/AgentNode";

export type WajibTemplate = "basic" | "precise" | "advance";
export type TambahanTemplate = "none" | "storytelling" | "character_centric";

export interface TemplateData {
  nodes: Node[];
  edges: Edge[];
}

export interface TemplateContext {
  addNode: (type: AgentType, x: number, y: number, label?: string) => Node;
  addEdge: (source: string, target: string, sourceHandle?: string, targetHandle?: string) => void;
  SPY: number;
}

export interface WajibTemplateResult {
  producerNode: Node;
  writerNode: Node;
  videoGenNode: Node;
}
