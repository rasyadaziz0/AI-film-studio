import React from "react";
import { ExternalLink, Maximize2 } from "lucide-react";
import { AgentType, NodeStatus } from "../AgentNode";

export interface NodeColors {
  color: string;
  bg: string;
  border: string;
  ring: string;
}

export abstract class BaseNodePresenter {
  constructor(
    public id: string,
    public data: {
      label: string;
      type: AgentType;
      status: NodeStatus;
      output?: string;
      output_url?: string;
      provider?: string;
      model?: string;
      config?: any;
      studio_id?: string;
    },
    public store: any
  ) { }

  public getLabel(): string {
    return this.data.label || this.data.type;
  }

  public getType(): AgentType {
    return this.data.type;
  }

  public getStatus(): string {
    return this.data.status;
  }

  public isRunning(): boolean {
    return this.data.status === "running";
  }

  public isQueued(): boolean {
    return this.data.status === "queued";
  }

  public isDone(): boolean {
    return this.data.status === "done";
  }

  public isError(): boolean {
    return this.data.status === "error";
  }

  public abstract getIcon(): any;
  public abstract getColors(): NodeColors;

  public getBorderStyle(): string {
    if (this.isRunning()) {
      return "border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_18px_rgba(251,191,36,0.5)]";
    }
    if (this.isQueued()) {
      return "border-indigo-500/80 ring-1 ring-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.3)] animate-pulse";
    }
    if (this.isDone()) {
      return "border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.25)]";
    }
    if (this.isError()) {
      return "border-red-500 ring-1 ring-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.3)]";
    }
    return "border-[#444444] hover:border-[#8c8c8c]";
  }

  // OOP Polymorphic behavior capabilities
  public canHaveInputs(): boolean {
    return true;
  }

  public canHaveOutputs(): boolean {
    return true;
  }

  public hasAIProviderSettings(): boolean {
    return true;
  }

  public hasRunButton(): boolean {
    return true;
  }

  // Action delegations
  public handleRun(): void {
    this.store.runNode(this.id);
  }

  public handleDelete(): void {
    this.store.deleteNode(this.id);
  }

  public handleChangeType(newType: AgentType): void {
    this.store.changeNodeType(this.id, newType);
  }

  public updateConfig(newConfig: Record<string, any>): void {
    this.store.updateNodeData(this.id, { config: { ...this.data.config, ...newConfig } });
  }

  // Helper to get intelligent media title from Producer concept, Input node, or Niche
  public getMediaTitle(): string {
    try {
      if (!this.store || !this.store.nodes || !Array.isArray(this.store.nodes)) {
        return this.data.label || "AI Studio Output";
      }

      const studioNodes = this.store.nodes.filter((n: any) => (n.data as any)?.studio_id === this.data.studio_id || n.id === this.id);
      
      // 1. Check Producer node output for title or concept
      const producerNode = studioNodes.find((n: any) => n.type === "producer" || (n.data as any)?.type === "producer");
      if (producerNode?.data?.output) {
        try {
          const parsed = JSON.parse(producerNode.data.output);
          if (parsed.title && typeof parsed.title === "string" && parsed.title.trim()) {
            return parsed.title.trim();
          }
          if (parsed.concept && typeof parsed.concept === "string" && parsed.concept.trim()) {
            const cleanConcept = parsed.concept.split(/[\.\n]/)[0].trim();
            if (cleanConcept) return cleanConcept.length > 65 ? cleanConcept.slice(0, 62) + "..." : cleanConcept;
          }
        } catch {
          // not json
        }
      }

      // 2. Check Input node user_input or output
      const inputNode = studioNodes.find((n: any) => n.type === "input" || (n.data as any)?.type === "input");
      const rawInput = inputNode?.data?.user_input || inputNode?.data?.output;
      if (rawInput && typeof rawInput === "string" && rawInput.trim()) {
        const cleanInput = rawInput.split(/[\.\n]/)[0].trim();
        if (cleanInput) return cleanInput.length > 65 ? cleanInput.slice(0, 62) + "..." : cleanInput;
      }

      // 3. Check Studio niche
      if (this.store.studios && Array.isArray(this.store.studios)) {
        const studio = this.store.studios.find((s: any) => s.id === this.data.studio_id);
        if (studio?.niche && studio.niche.trim()) {
          const cleanNiche = studio.niche.split(/[\.\n]/)[0].trim();
          if (cleanNiche) return cleanNiche.length > 65 ? cleanNiche.slice(0, 62) + "..." : cleanNiche;
        }
      }
    } catch {
      // ignore
    }

    return this.data.label || "AI Studio Output";
  }

  // Base output rendering used by standard AI nodes
  public renderStandardOutput(expanded: boolean, setExpanded: (val: boolean) => void): React.ReactNode {
    if (!this.data.output && !this.data.output_url) return null;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-medium text-[#e0e0e0]">Output</label>
          {this.data.output && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[#8c8c8c] hover:text-[#e0e0e0] transition-colors"
              title="Toggle Full Text"
            >
              <Maximize2 size={10} />
            </button>
          )}
        </div>
        {this.data.output && (
          <div
            className={`rounded-[4px] bg-[#1e1e1e] p-2 text-[10px] text-[#e0e0e0] border border-[#444444] ${expanded ? "max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-[#444444]" : "line-clamp-3"
              }`}
          >
            {this.data.output}
          </div>
        )}
        {(() => {
          if (!this.data.output_url) return null;

          const urlWithoutQuery = this.data.output_url.split('?')[0].trim();
          const isAudio = urlWithoutQuery.match(/\.(mp3|ogg|wav|aac|flac)$/i) || this.data.type === "tts" || this.data.output_url.includes("audio");
          const isVideo = (urlWithoutQuery.match(/\.(mp4|webm|mov)$/i) || this.data.type === "video" || this.data.output_url.includes("video")) && !isAudio;
          const isImage = (urlWithoutQuery.match(/\.(png|jpe?g|gif|webp)$/i) || this.data.type === "actor" || this.data.output_url.includes("image")) && !isVideo && !isAudio;

          const titleParam = encodeURIComponent(this.getMediaTitle());
          const urlParam = encodeURIComponent(this.data.output_url);

          let playerHref = this.data.output_url; // Default fallback
          if (isAudio) {
            playerHref = `/audio?url=${urlParam}&title=${titleParam}`;
          } else if (isVideo) {
            playerHref = `/player?url=${urlParam}&title=${titleParam}`;
          } else if (isImage) {
            playerHref = `/viewer?url=${urlParam}&title=${titleParam}`;
          }
          return (
            <div className="space-y-1.5 mt-1.5">
              {isImage && (
                <div className="relative rounded overflow-hidden border border-[#333333] bg-[#111118]">
                  <img
                    src={this.data.output_url}
                    alt="Node Output Preview"
                    className="w-full h-28 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.img-error-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'img-error-fallback flex flex-col items-center justify-center p-3 text-center bg-[#151520] text-[#a0a0b0] text-[9px] gap-1 border border-amber-500/30 rounded';
                        fallback.innerHTML = `<span class="text-amber-400 font-semibold">⚠️ Foto lama tidak dapat dimuat</span><span>Klik tombol <b class="text-blue-400">Run</b> atau <b class="text-blue-400">Upload Foto</b> untuk memuat ulang gambar.</span>`;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                  {this.data.type === "actor" && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[8px] text-emerald-400 font-bold">
                      ✓ Karakter Aktif
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(playerHref, "_blank");
                }}
                className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-[4px] border font-medium transition-all shadow-sm cursor-pointer text-[10px] ${
                  isAudio
                    ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border-amber-500/30 text-amber-300"
                    : "bg-gradient-to-r from-sky-500/20 to-purple-500/20 hover:from-sky-500/30 hover:to-purple-500/30 border-sky-500/30 text-sky-300"
                }`}
              >
                <ExternalLink size={11} />
                {isAudio ? "🎧 Putar di Audio Studio" : isVideo ? "🎬 Putar di Cinema Player" : isImage ? "🖼️ Buka Gambar Fullscreen" : "Buka File Output"}
              </button>
            </div>
          );
        })()}
      </div>
    );
  }

  // Render instructions block
  public renderInstructions(): React.ReactNode {
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-[#8c8c8c]">Instructions</label>
        <div className="rounded-[4px] bg-[#1a1a1a] p-2 text-[10px] text-[#aaaaaa] border border-[#2a2a2a] line-clamp-2">
          {this.data.config?.customRolePrompt || "Default AI instructions for this node type."}
        </div>
      </div>
    );
  }

  // Polymorphic core method: Subclasses override this to render custom UI inside the node
  public renderBody(expanded: boolean, setExpanded: (val: boolean) => void): React.ReactNode {
    return (
      <>
        {this.renderInstructions()}
        {this.renderStandardOutput(expanded, setExpanded)}
      </>
    );
  }
}
