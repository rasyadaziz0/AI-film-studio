"use client";

import { useRef, useState, useMemo } from "react";
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
};

const edgeTypes = {
  default: DeletableEdge,
};

const defaultEdgeOptions = { type: 'default' };

function FlowCanvas({ studioId }: { studioId: string }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, toolMode } = useStudioStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Apply Custom Hooks to offload logic
  const { isSaving } = useCanvasAutoSave(studioId);
  useCanvasRealtime(studioId);
  const { onDragOver, onDrop, onNodeDragStart } = useCanvasDragDrop(reactFlowInstance, reactFlowWrapper);

  const activeStudio = useStudioStore((state) => state.studios.find(s => s.id === studioId));
  
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);

  return (
    <div className="flex h-full w-full flex-col bg-[#1e1e1e] overflow-hidden relative">
      <TopControls isSaving={isSaving} setIsInfoModalOpen={setIsInfoModalOpen} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={memoizedNodeTypes}
            edgeTypes={memoizedEdgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={(connection) => connection.source !== connection.target}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeDragStart={onNodeDragStart}
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
                  default: return '#52525b';
                }
              }}
              maskColor="#1e1e1e80" 
              className="bg-[#2c2c2c]"
            />
          </ReactFlow>
          <BottomToolbar />
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
