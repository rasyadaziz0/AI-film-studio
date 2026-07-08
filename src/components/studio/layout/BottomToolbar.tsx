import { AgentType } from "@/components/studio/nodes/AgentNode";
import { Clapperboard, PenTool, Mic, Search, Video, MousePointer2, Hand, Keyboard, Headphones, Send, Cloud } from "lucide-react";
import { useStudioStore } from "@/store/useStudioStore";
import { useReactFlow } from "@xyflow/react";
import { GlassBar } from "@/components/ui/LiquidGlass";

const AGENT_TYPES: { type: AgentType; label: string; icon: any; color: string; hoverBg: string }[] = [
  { type: "input", label: "Input", icon: Keyboard, color: "text-gray-400", hoverBg: "hover:bg-gray-500/20" },
  { type: "producer", label: "Producer", icon: Clapperboard, color: "text-purple-400", hoverBg: "hover:bg-purple-500/20" },
  { type: "writer", label: "Writer", icon: PenTool, color: "text-emerald-400", hoverBg: "hover:bg-emerald-500/20" },
  { type: "actor", label: "Actor", icon: Mic, color: "text-blue-400", hoverBg: "hover:bg-blue-500/20" },
  { type: "reviewer", label: "Reviewer", icon: Search, color: "text-orange-400", hoverBg: "hover:bg-orange-500/20" },
  { type: "tts", label: "TTS", icon: Headphones, color: "text-yellow-400", hoverBg: "hover:bg-yellow-500/20" },
  { type: "video", label: "Video Gen", icon: Video, color: "text-red-400", hoverBg: "hover:bg-red-500/20" },
  { type: "telegram", label: "Telegram", icon: Send, color: "text-cyan-400", hoverBg: "hover:bg-cyan-500/20" },
  { type: "cloud", label: "Cloud (R2)", icon: Cloud, color: "text-sky-400", hoverBg: "hover:bg-sky-500/20" },
];

export default function BottomToolbar() {
  const { addNode, toolMode, setToolMode } = useStudioStore();
  const reactFlowInstance = useReactFlow();

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleAddClick = (type: AgentType) => {
    // Add to the center of the current view
    if (reactFlowInstance) {
      const { x, y, zoom } = reactFlowInstance.getViewport();
      // Calculate center of screen relative to flow canvas
      const centerX = (-x + window.innerWidth / 2) / zoom;
      const centerY = (-y + window.innerHeight / 2) / zoom;
      addNode(type, { x: centerX, y: centerY });
    } else {
      addNode(type, { x: 200, y: 200 }); // Fallback
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-max">
      <GlassBar className="pointer-events-auto px-4 py-3 shadow-lg w-max">
        <div className="flex items-center gap-6 h-full">

          {/* Pointer vs Hand Tools */}
          <div className="flex items-center gap-1 pr-6 border-r border-white/20">
            <button
              onClick={() => setToolMode("pointer")}
              className={`p-1.5 rounded-full transition-colors ${toolMode === 'pointer' ? 'bg-[#18a0fb] text-white' : 'text-[#8c8c8c] hover:text-[#e0e0e0] hover:bg-[#383838]'}`}
              title="Move / Select (V)"
            >
              <MousePointer2 size={16} />
            </button>
            <button
              onClick={() => setToolMode("hand")}
              className={`p-1.5 rounded-full transition-colors ${toolMode === 'hand' ? 'bg-[#18a0fb] text-white' : 'text-[#8c8c8c] hover:text-[#e0e0e0] hover:bg-[#383838]'}`}
              title="Hand Tool (H)"
            >
              <Hand size={16} />
            </button>
          </div>

          {/* Agent Node Draggables */}
          <div className="flex items-center gap-4 pl-2">
            {AGENT_TYPES.map((agent) => {
              const Icon = agent.icon;
              return (
                <div
                  key={agent.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, agent.type)}
                  onClick={() => handleAddClick(agent.type)}
                  className={`flex flex-col items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-[#383838] cursor-grab active:cursor-grabbing transition-colors group`}
                  title={`Add ${agent.label}`}
                >
                  <Icon size={16} className={`${agent.color} group-hover:brightness-125 transition-all`} />
                </div>
              );
            })}
          </div>
        </div>

      </GlassBar>
    </div>
  );
}
