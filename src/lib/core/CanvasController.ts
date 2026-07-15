import { Node, Edge, Connection, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import { AgentType, NodeStatus } from "@/components/studio/nodes/AgentNode";
import { StudioState } from "@/store/types";

export class CanvasController {
  constructor(
    private set: (partial: Partial<StudioState> | ((state: StudioState) => Partial<StudioState>)) => void,
    private get: () => StudioState
  ) { }

  public onNodesChange(changes: NodeChange[]) {
    if (!this.get().capabilities.canEditCanvas) return;
    const hasRemoval = changes.some((c) => c.type === "remove");
    if (hasRemoval) this.get().saveHistory();

    this.set({
      nodes: applyNodeChanges(changes, this.get().nodes),
    });
  }

  public onEdgesChange(changes: EdgeChange[]) {
    if (!this.get().capabilities.canEditCanvas) return;
    const hasRemoval = changes.some((c) => c.type === "remove");
    if (hasRemoval) this.get().saveHistory();

    this.set({
      edges: applyEdgeChanges(changes, this.get().edges),
    });
  }

  public onConnect(connection: Connection) {
    if (!this.get().capabilities.canEditCanvas) return;
    this.get().saveHistory();
    const newEdge: Edge = {
      ...connection,
      id: uuidv4(),
      type: "default",
      animated: true,
      markerEnd: { type: "arrowclosed" },
    };
    this.set({
      edges: addEdge(newEdge, this.get().edges),
    });
  }

  public addNode(type: AgentType, position: { x: number; y: number }) {
    if (!this.get().capabilities.canEditCanvas) return;
    this.get().saveHistory();
    const newNode: Node = {
      id: uuidv4(),
      type,
      position,
      data: { label: `New ${type}`, type, status: "idle", output: "" },
      dragHandle: ".drag-handle",
    };
    this.set({ nodes: [...this.get().nodes, newNode] });
  }

  public updateNodeData(nodeId: string, data: Record<string, unknown>) {
    if (!this.get().capabilities.canEditCanvas) return;
    // Note: If we save history on every keystroke of the label textarea, it bloats history.
    // For now, we skip saving history on text typing to avoid input lag and history bloat.
    this.set({
      nodes: this.get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    });
  }

  public updateNodeStatus(nodeId: string, status: NodeStatus) {
    // Don't save history for status updates (engine running)
    this.set({
      nodes: this.get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, status } } : node
      ),
    });
  }

  public changeNodeType(nodeId: string, newType: AgentType) {
    if (!this.get().capabilities.canEditCanvas) return;
    this.get().saveHistory();
    this.set({
      nodes: this.get().nodes.map((node) =>
        node.id === nodeId
          ? {
            ...node,
            type: newType,
            data: {
              ...node.data,
              type: newType,
              label: `New ${newType}`,
              status: "idle",
              output: "",
            },
          }
          : node
      ),
    });
  }

  public deleteNode(nodeId: string) {
    if (!this.get().capabilities.canEditCanvas) return;
    this.get().saveHistory();
    this.set({
      nodes: this.get().nodes.filter((node) => node.id !== nodeId),
      edges: this.get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    });
  }
}

