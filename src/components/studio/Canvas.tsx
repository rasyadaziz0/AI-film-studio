"use client";

import { useRef, useState, useMemo } from "react";
import { Lock } from "lucide-react";
import {
  ReactFlow,
  Controls,
  Background,
  NodeTypes,
  MiniMap,
  ReactFlowProvider,
  SelectionMode
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import AgentNode from "./nodes/AgentNode";
import DeletableEdge from "./edges/DeletableEdge";
import { useStudioStore } from "@/store/useStudioStore";
import BottomToolbar from "./layout/BottomToolbar";
import { TemplateInfoModal } from "./layout/TemplateInfoModal";
import TopControls from "./layout/TopControls";

// Custom Hooks for Canvas Logic
import { useCanvasAutoSave } from "./hooks/useCanvasAutoSave";
import { useCanvasRealtime } from "./hooks/useCanvasRealtime";
import { useCanvasDragDrop } from "./hooks/useCanvasDragDrop";
import { useStudioPresence } from "./hooks/useStudioPresence";

const nodeTypes: NodeTypes = {
  input: AgentNode,
  producer: AgentNode,
  writer: AgentNode,
  actor: AgentNode,
  reviewer: AgentNode,
  tts: AgentNode,
  video: AgentNode,
  telegram: AgentNode,
  cloud: AgentNode,
  telegram_trigger: AgentNode,
};

const edgeTypes = {
  default: DeletableEdge,
};

const defaultEdgeOptions = { type: 'default' };

function FlowCanvas({ studioId }: { studioId: string }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, toolMode, capabilities } = useStudioStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Apply Custom Hooks to offload logic
  const { isSaving } = useCanvasAutoSave(studioId);
  useCanvasRealtime(studioId);
  const { onDragOver, onDrop, onNodeDragStart } = useCanvasDragDrop(reactFlowInstance, reactFlowWrapper);
  const { onlineUsers } = useStudioPresence(studioId);

  const activeStudio = useStudioStore((state) => state.studios.find(s => s.id === studioId));

  const nodeTypesMemo = useMemo<NodeTypes>(() => ({
    input: AgentNode,
    producer: AgentNode,
    writer: AgentNode,
    actor: AgentNode,
    reviewer: AgentNode,
    tts: AgentNode,
    video: AgentNode,
    telegram: AgentNode,
    cloud: AgentNode,
    telegram_trigger: AgentNode,
  }), []);

  const edgeTypesMemo = useMemo(() => ({
    default: DeletableEdge,
  }), []);

  const defaultEdgeOptions = useMemo(() => ({ type: 'default' }), []);

  return (
    <div className="flex h-full w-full flex-col bg-[#1e1e1e] overflow-hidden relative">
      <TopControls isSaving={isSaving} setIsInfoModalOpen={setIsInfoModalOpen} />

      {/* Spectator Mode Banner */}
      {!capabilities.canEditCanvas && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-amber-500/30 bg-zinc-900/95 px-4 py-1.5 text-xs font-medium text-amber-300 shadow-xl backdrop-blur-md animate-fade-in pointer-events-auto">
          <Lock size={14} className="text-amber-400 shrink-0" />
          <span>Spectator Mode (View Only) — Anda melihat workflow secara live dan tidak dapat mengubah node.</span>
        </div>
      )}

      {/* Presence Avatars */}
      {onlineUsers.length > 0 && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-full px-3 py-1.5 shadow-lg backdrop-blur-md">
          <div className="flex -space-x-2 overflow-hidden">
            {onlineUsers.slice(0, 5).map((u, i) => (
              <div
                key={`${u.userId}-${i}`}
                style={{ backgroundColor: u.color }}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-zinc-900"
                title={`${u.email} (${u.role.toUpperCase()})`}
              >
                {u.email.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-[11px] font-medium text-zinc-400">
            {onlineUsers.length} Online
          </span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypesMemo}
            edgeTypes={edgeTypesMemo}
            defaultEdgeOptions={defaultEdgeOptions}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={(connection) => connection.source !== connection.target}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeDragStart={onNodeDragStart}
            nodesDraggable={capabilities.canEditCanvas}
            nodesConnectable={capabilities.canEditCanvas}
            elementsSelectable={true}
            panOnDrag={toolMode === "hand" ? [0, 1, 2] : [1, 2]} 
            selectionOnDrag={toolMode === "pointer"}
            panOnScroll={true} 
            zoomOnScroll={false} 
            selectionMode={SelectionMode.Partial}
            panActivationKeyCode="Space" 
            fitView
            className="bg-[#1e1e1e]"
            minZoom={0.1}
            maxZoom={2}
          >
            <Controls showInteractive={false} className="fill-white" />
            <Background color="#333333" gap={16} size={1} />
            <MiniMap 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'input': return '#9ca3af';
                  case 'producer': return '#a855f7';
                  case 'writer': return '#10b981';
                  case 'actor': return '#3b82f6';
                  case 'reviewer': return '#f97316';
                  case 'tts': return '#eab308';
                  case 'video': return '#f43f5e';
                  case 'telegram': return '#06b6d4';
                  case 'telegram_trigger': return '#14b8a6';
                  default: return '#52525b';
                }
              }}
              maskColor="#1e1e1e80" 
              className="bg-[#2c2c2c]"
            />
          </ReactFlow>
          {capabilities.canEditCanvas && <BottomToolbar />}
        </div>
      </div>

      <TemplateInfoModal 
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        templateString={activeStudio?.template}
      />
    </div>
  );
}

export default function Canvas({ studioId }: { studioId: string }) {
  return (
    <ReactFlowProvider>
      <FlowCanvas studioId={studioId} />
    </ReactFlowProvider>
  );
}

