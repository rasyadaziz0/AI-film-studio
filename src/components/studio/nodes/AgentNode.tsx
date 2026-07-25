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
    <div 
      tabIndex={0}
      role="group"
      aria-label={`${presenter.getLabel()} Node. Status: ${presenter.getStatus()}`}
      className={`group relative w-[310px] rounded-xl bg-zinc-900/80 backdrop-blur-md shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${presenter.getBorderStyle()}`}
    >

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
            <SelectContent
              portal={false}
              alignItemWithTrigger={false}
              side="bottom"
              align="start"
              sideOffset={4}
              className="bg-[#1e1e1e] border-[#333333] text-[#d4d4d4] rounded-lg shadow-xl text-[12px] p-1 nodrag nopan min-w-[170px]"
            >
              {(["input", "telegram_trigger", "producer", "writer", "actor", "reviewer", "tts", "video", "telegram", "cloud"] as AgentType[]).map((typeKey) => {
                const tempPresenter = NodePresenterFactory.create("temp", { type: typeKey, label: typeKey, status: "idle" }, null);
                const TempIcon = tempPresenter.getIcon();
                return (
                  <SelectItem
                    key={typeKey}
                    value={typeKey}
                    className="focus:bg-[#2a2a2a] focus:text-white cursor-pointer rounded-md py-2 pl-3 pr-8 my-0.5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 capitalize font-medium">
                      <TempIcon size={14} className={tempPresenter.getColors().color} />
                      {typeKey.replace(/_/g, " ")}
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
                if (data.type === "reviewer" && data.config?.current_retry) return `Revision ${data.config.current_retry}/2`;
                switch (data.type) {
                  case "video": return "Rendering Video (~2m)...";
                  case "producer": return "Concepting...";
                  case "writer": return "Writing Script...";
                  case "reviewer": return "Reviewing...";
                  case "actor": return "Designing Character...";
                  case "tts": return "Recording Voice...";
                  case "telegram_trigger": return "Waiting for Prompt...";
                  case "telegram": return "Sending...";
                  case "cloud": return "Uploading...";
                  default: return "Running...";
                }
              })()}
            </span>
          )}
          {presenter.isQueued() && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm animate-pulse whitespace-nowrap">
              <Loader2 className="animate-spin shrink-0" size={10} />
              Queued...
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
            className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-[6px] py-2 text-[11px] font-bold tracking-wide transition-all transform ${presenter.isRunning()
                ? "bg-zinc-800/80 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:from-blue-400 hover:to-indigo-500 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:scale-95 border border-transparent"
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
