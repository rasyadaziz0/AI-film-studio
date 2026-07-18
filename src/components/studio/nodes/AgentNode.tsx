import { Handle, Position } from "@xyflow/react";
import { Play, Loader2, GripHorizontal, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { useStudioStore } from "@/store/useStudioStore";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NodePresenterFactory } from "./oop/NodePresenterFactory";
import { AIModelConfigurator } from "./oop/AIModelConfigurator";

import { AgentType, NodeStatus } from "@/lib/engine/types";
export type { AgentType, NodeStatus };

interface AgentNodeProps {
  id: string;
  data: {
    label: string;
    type: AgentType;
    status: NodeStatus;
    output?: string;
    output_url?: string;
    provider?: string;
    model?: string;
    config?: any;
    studio_id?: string;
  };
}

export default function AgentNode({ id, data }: AgentNodeProps) {
  const store = useStudioStore();
  const [expanded, setExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Instantiate OOP Presenter
  const presenter = NodePresenterFactory.create(id, data, store);
  const Icon = presenter.getIcon();
  const colors = presenter.getColors();

  return (
    <div className={`group relative w-[310px] rounded-lg bg-[#2c2c2c] shadow-md transition-all duration-300 border ${presenter.getBorderStyle()}`}>
      
      {/* Node Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#444444]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon size={14} className={colors.color} strokeWidth={2} />
          <Select 
            value={data.type} 
            disabled={!store?.capabilities?.canEditCanvas}
            onValueChange={(val) => presenter.handleChangeType(val as AgentType)}
          >
            <SelectTrigger className="h-auto p-0 bg-transparent border-0 shadow-none text-[11px] font-bold tracking-wide text-[#e0e0e0] hover:text-white transition-colors focus:ring-0 [&>svg]:opacity-0 group-hover:[&>svg]:opacity-50 [&>svg]:ml-1 [&>svg]:h-3 [&>svg]:w-3 disabled:opacity-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2c2c2c] border-[#444444] text-[#e0e0e0] rounded-md shadow-lg text-[11px]">
              {(["input", "telegram_trigger", "producer", "writer", "actor", "reviewer", "tts", "video", "telegram", "cloud"] as AgentType[]).map((typeKey) => {
                const tempPresenter = NodePresenterFactory.create("temp", { type: typeKey, label: typeKey, status: "idle" }, null);
                const TempIcon = tempPresenter.getIcon();
                return (
                  <SelectItem key={typeKey} value={typeKey} className="focus:bg-[#18a0fb] focus:text-white cursor-pointer">
                    <div className="flex items-center gap-2 capitalize">
                      <TempIcon size={12} className={tempPresenter.getColors().color} />
                      {typeKey}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {presenter.isRunning() && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[8.5px] font-bold tracking-wider uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm animate-pulse whitespace-nowrap">
              <Loader2 className="animate-spin shrink-0" size={10} />
              {(() => {
                if (data.type === "reviewer" && data.config?.current_retry) return `Revisi ${data.config.current_retry}/2`;
                switch (data.type) {
                  case "video": return "Render Video (~2m)...";
                  case "producer": return "Konsep...";
                  case "writer": return "Menulis Naskah...";
                  case "reviewer": return "Me-review...";
                  case "actor": return "Desain Karakter...";
                  case "tts": return "Merekam Suara...";
                  case "telegram_trigger": return "Menunggu Prompt...";
                  case "telegram": return "Mengirim...";
                  case "cloud": return "Upload...";
                  default: return "Running...";
                }
              })()}
            </span>
          )}
          {presenter.isQueued() && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm animate-pulse whitespace-nowrap">
              <Loader2 className="animate-spin shrink-0" size={10} />
              Antre...
            </span>
          )}
          {presenter.isDone() && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm whitespace-nowrap">
              <CheckCircle2 className="shrink-0" size={10} />
              Success
            </span>
          )}
          {presenter.isError() && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm whitespace-nowrap">
              <AlertCircle className="shrink-0" size={10} />
              Error
            </span>
          )}
          <div className="h-3 w-px bg-[#444444] shrink-0"></div>
          {store?.capabilities?.canEditCanvas && (
            <button 
              onClick={() => presenter.handleDelete()}
              className="text-[#8c8c8c] hover:text-[#f24e1e] transition-colors cursor-pointer shrink-0"
              title="Delete Node"
            >
              <Trash2 size={12} />
            </button>
          )}
          {store?.capabilities?.canEditCanvas && (
            <GripHorizontal className="text-[#8c8c8c] hover:text-[#e0e0e0] drag-handle cursor-grab active:cursor-grabbing transition-colors shrink-0" size={12} />
          )}
        </div>
      </div>

      {/* Node Content */}
      <div className="p-3 space-y-2.5">
        {/* Polymorphic Body Rendering via Presenter */}
        {presenter.renderBody(expanded, setExpanded)}

        {/* Advanced Settings Toggle */}
        {presenter.hasAIProviderSettings() && store?.capabilities?.canEditCanvas && (
          <>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-[10px] font-medium text-[#8c8c8c] hover:text-[#e0e0e0] transition-colors self-start flex items-center gap-1"
            >
              {showSettings ? "Hide Settings" : "Show Settings"}
            </button>
            {showSettings && <AIModelConfigurator presenter={presenter} />}
          </>
        )}

        {/* Run Button */}
        {store?.capabilities?.canRun && (
          <button
            onClick={() => presenter.handleRun()}
            disabled={presenter.isRunning()}
            className={`mt-1 flex w-full items-center justify-center gap-1.5 rounded-[4px] py-1.5 text-[11px] font-bold transition-all ${
              presenter.isRunning()
                ? "bg-[#1e1e1e] text-[#8c8c8c] cursor-not-allowed border border-[#444444]"
                : "bg-[#18a0fb] text-white hover:bg-[#0d8be8] border border-transparent"
            }`}
          >
            {presenter.isRunning() ? <Loader2 className="animate-spin" size={12} /> : <Play size={12} fill="currentColor" />}
            {presenter.isRunning() ? "Running..." : "Run"}
          </button>
        )}
      </div>

      {/* Handles (Perimeter Connection Ports) */}
      {presenter.canHaveInputs() && (
        <>
          <Handle id="target-top" type="target" position={Position.Top} className="w-2.5 h-2.5 -mt-[5px] rounded-full border border-[#444444] bg-[#2c2c2c] hover:bg-[#18a0fb] hover:border-[#18a0fb]" />
          <Handle id="target-bottom" type="target" position={Position.Bottom} className="w-2.5 h-2.5 -mb-[5px] rounded-full border border-[#444444] bg-[#2c2c2c] hover:bg-[#18a0fb] hover:border-[#18a0fb]" />
          <Handle id="target-left" type="target" position={Position.Left} className="w-2.5 h-2.5 -ml-[5px] rounded-full border border-[#444444] bg-[#2c2c2c] hover:bg-[#18a0fb] hover:border-[#18a0fb]" />
          <Handle id="target-right" type="target" position={Position.Right} className="w-2.5 h-2.5 -mr-[5px] rounded-full border border-[#444444] bg-[#2c2c2c] hover:bg-[#18a0fb] hover:border-[#18a0fb]" />
        </>
      )}

      {presenter.canHaveOutputs() && (
        <>
          <Handle id="source-top" type="source" position={Position.Top} className={`w-2.5 h-2.5 -mt-[5px] rounded-full border hover:bg-[#18a0fb] hover:border-[#18a0fb] ${presenter.isDone() ? 'bg-[#18a0fb] border-[#18a0fb]' : 'bg-[#2c2c2c] border-[#444444]'}`} />
          <Handle id="source-bottom" type="source" position={Position.Bottom} className={`w-2.5 h-2.5 -mb-[5px] rounded-full border hover:bg-[#18a0fb] hover:border-[#18a0fb] ${presenter.isDone() ? 'bg-[#18a0fb] border-[#18a0fb]' : 'bg-[#2c2c2c] border-[#444444]'}`} />
          <Handle id="source-left" type="source" position={Position.Left} className={`w-2.5 h-2.5 -ml-[5px] rounded-full border hover:bg-[#18a0fb] hover:border-[#18a0fb] ${presenter.isDone() ? 'bg-[#18a0fb] border-[#18a0fb]' : 'bg-[#2c2c2c] border-[#444444]'}`} />
          <Handle id="source-right" type="source" position={Position.Right} className={`w-2.5 h-2.5 -mr-[5px] rounded-full border hover:bg-[#18a0fb] hover:border-[#18a0fb] ${presenter.isDone() ? 'bg-[#18a0fb] border-[#18a0fb]' : 'bg-[#2c2c2c] border-[#444444]'}`} />
        </>
      )}
    </div>
  );
}
