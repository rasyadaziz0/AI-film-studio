import React from "react";
import {
  Clapperboard,
  PenTool,
  Mic,
  Search,
  Video,
  Headphones,
  Send,
  Cloud,
  Keyboard,
  CheckCircle2,
  ExternalLink,
  Play,
  Sparkles,
  Upload,
} from "lucide-react";
import { BaseNodePresenter, NodeColors } from "./BaseNodePresenter";
import { useStudioStore } from "@/store/useStudioStore";

export class InputPresenter extends BaseNodePresenter {
  public getIcon() { return Keyboard; }
  public getColors(): NodeColors {
    return { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", ring: "ring-amber-500/50" };
  }
  public canHaveInputs() { return false; }
  public hasAIProviderSettings() { return false; }

  public renderBody(): React.ReactNode {
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-[#aaaaaa]">Prompt Manual</label>
        <textarea
          disabled={!this.store?.capabilities?.canEditCanvas}
          className="nodrag w-full h-16 rounded-[6px] bg-black/40 border border-zinc-700/50 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Type video idea here..."
          value={this.data.config?.prompt || ""}
          onChange={(e) => this.updateConfig({ prompt: e.target.value })}
        />
      </div>
    );
  }
}

export class ProducerPresenter extends BaseNodePresenter {
  public getIcon() { return Clapperboard; }
  public getColors(): NodeColors {
    return { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", ring: "ring-purple-500/50" };
  }
}

export class WriterPresenter extends BaseNodePresenter {
  public getIcon() { return PenTool; }
  public getColors(): NodeColors {
    return { color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30", ring: "ring-pink-500/50" };
  }
}

export class ActorPresenter extends BaseNodePresenter {
  public getIcon() { return Mic; }
  public getColors(): NodeColors {
    return { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", ring: "ring-blue-500/50" };
  }

  public renderBody(expanded: boolean, setExpanded: (val: boolean) => void): React.ReactNode {
    const imageUrl = this.data.output_url || this.data.config?.uploaded_image_url;
    const actorPrompt = this.data.config?.actor_prompt || "";

    const handleGenerateActor = async () => {
      if (!actorPrompt.trim()) return;
      this.store.updateNodeData(this.id, { status: "running" });
      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_BASE_URL === '/backend' ? 'https://api.acadlabs.fun' : process.env.NEXT_PUBLIC_API_BASE_URL) || 'https://api.acadlabs.fun';
        const { supabase } = await import("@/lib/supabase");
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${apiUrl}/v1/ai/generate-image`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ prompt: actorPrompt, studioId: this.store.activeStudioId || this.data.studio_id }),
        });
        const data = await res.json();
        if (data.url) {
          this.store.updateNodeData(this.id, { 
            output_url: data.url, 
            status: "done",
            config: { ...this.data.config, uploaded_image_url: data.url }
          });
        } else {
          this.store.updateNodeData(this.id, { status: "error" });
        }
      } catch {
        this.store.updateNodeData(this.id, { status: "error" });
      }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      this.store.updateNodeData(this.id, { status: "running" });
      try {
        // Get presigned upload URL from ECS
        const apiUrl = (process.env.NEXT_PUBLIC_API_BASE_URL === '/backend' ? 'https://api.acadlabs.fun' : process.env.NEXT_PUBLIC_API_BASE_URL) || 'https://api.acadlabs.fun';
        const { supabase } = await import("@/lib/supabase");
        const { data: { session } } = await supabase.auth.getSession();
        const studioId = this.store.activeStudioId || this.data.studio_id;

        const presignRes = await fetch(`${apiUrl}/v1/ai/upload-actor/presign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ 
            studioId,
            filename: file.name, 
            contentType: file.type,
          }),
        });
        const presignData = await presignRes.json();

        if (!presignData.uploadUrl) {
          throw new Error("Failed to get upload URL");
        }

        // Upload directly to OSS using presigned URL
        await fetch(presignData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        // Segera simpan ke DB secara langsung agar tidak di-overwrite oleh sinkronisasi otomatis (pollStatus)
        const updatedData = { 
          output_url: presignData.publicUrl, 
          status: "done",
          config: { ...this.data.config, uploaded_image_url: presignData.publicUrl }
        };
        await supabase.from("nodes").update(updatedData).eq("id", this.id);

        // Setelah DB aman, update UI lokal
        this.store.updateNodeData(this.id, updatedData);
      } catch {
        this.store.updateNodeData(this.id, { status: "error" });
      }
    };

    return (
      <div className="space-y-2">
        {/* Actor Prompt */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-medium text-[#8c8c8c]">Character Prompt (optional)</label>
            {this.store?.capabilities?.canEditCanvas && (
              <label className="flex items-center gap-1 text-[9px] text-[#18a0fb] hover:text-[#0d8be8] transition-colors cursor-pointer font-medium">
                <Upload size={9} />
                Upload Photo
                <input type="file" accept="image/*" className="hidden" disabled={!this.store?.capabilities?.canEditCanvas} onChange={handleUpload} />
              </label>
            )}
          </div>
          <textarea
            disabled={!this.store?.capabilities?.canEditCanvas}
            className="nodrag w-full h-12 rounded-[6px] bg-black/40 border border-zinc-700/50 p-2 text-[10px] text-zinc-100 placeholder-zinc-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder='e.g. "Time-traveling detective with a trench coat..."'
            value={actorPrompt}
            onChange={(e) => this.updateConfig({ actor_prompt: e.target.value })}
          />
        </div>

        {/* Standard output */}
        {this.renderStandardOutput(expanded, setExpanded)}
      </div>
    );
  }
}

export class ReviewerPresenter extends BaseNodePresenter {
  public getIcon() { return Search; }
  public getColors(): NodeColors {
    return { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", ring: "ring-orange-500/50" };
  }
}

export class TTSPresenter extends BaseNodePresenter {
  public getIcon() { return Headphones; }
  public getColors(): NodeColors {
    return { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", ring: "ring-yellow-500/50" };
  }
}

export class VideoPresenter extends BaseNodePresenter {
  public getIcon() { return Video; }
  public getColors(): NodeColors {
    return { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", ring: "ring-red-500/50" };
  }

  public renderBody(expanded: boolean, setExpanded: (val: boolean) => void): React.ReactNode {
    const url = this.data.output_url;
    return (
      <div className="space-y-2">
        {this.renderInstructions()}
        {url && (
          <div className="space-y-1.5 pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(`/player?url=${encodeURIComponent(url)}&title=${encodeURIComponent(this.getMediaTitle())}`, "_blank");
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[6px] bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white text-[11px] font-bold shadow-md shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
            >
              <ExternalLink size={13} />
              🎬 Play in Cinema Player
            </button>
          </div>
        )}
        {!url && this.renderStandardOutput(expanded, setExpanded)}
      </div>
    );
  }
}

export class TelegramPresenter extends BaseNodePresenter {
  public getIcon() { return Send; }
  public getColors(): NodeColors {
    return { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", ring: "ring-cyan-500/50" };
  }
  public hasAIProviderSettings() { return false; }

  public renderBody(): React.ReactNode {
    return (
      <div className="rounded-[6px] bg-cyan-500/10 border border-cyan-500/30 p-2.5 space-y-1 shadow-inner shadow-cyan-500/5">
        <p className="text-[10px] text-cyan-400 font-medium">Telegram Node</p>
        <p className="text-[9px] text-[#8c8c8c]">
          Receives output from the previous node and sends it to the Telegram chat registered in Settings.
        </p>
      </div>
    );
  }
}

export class TelegramTriggerPresenter extends BaseNodePresenter {
  public getIcon() { return Sparkles; }
  public getColors(): NodeColors {
    return { color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/30", ring: "ring-teal-500/50" };
  }
  public canHaveInputs() { return false; }
  public hasAIProviderSettings() { return false; }

  public renderBody(): React.ReactNode {
    return (
      <div className="rounded-[6px] bg-teal-500/10 border border-teal-500/30 p-2.5 space-y-1 shadow-inner shadow-teal-500/5">
        <p className="text-[10px] text-teal-400 font-medium">Telegram Trigger</p>
        <p className="text-[9px] text-[#8c8c8c]">
          Waits for a prompt to be sent via your Telegram Bot (full_telegram mode).
        </p>
      </div>
    );
  }
}

export class CloudPresenter extends BaseNodePresenter {
  public getIcon() { return Cloud; }
  public getColors(): NodeColors {
    return { color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30", ring: "ring-sky-500/50" };
  }
  public hasAIProviderSettings() { return false; }

  public renderBody(): React.ReactNode {
    const url = this.data.output_url || (this.data.output?.match(/https?:\/\/[^\s]+/)?.[0] || this.data.output);
    if (!url) return null;

    const isMedia = url.match(/\.(mp4|webm|mp3|ogg|mov)$/i) || url.includes(".r2.dev");

    return (
      <div className="space-y-1.5 pt-1">
        <label className="text-[10px] font-medium text-sky-400 flex items-center gap-1">
          <CheckCircle2 size={11} /> Media Saved in Cloud R2
        </label>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isMedia) {
              window.open(`/player?url=${encodeURIComponent(url)}&title=${encodeURIComponent(this.getMediaTitle())}`, "_blank");
            } else {
              window.open(url, "_blank");
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-[6px] bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-[11px] font-bold shadow-md shadow-sky-500/20 hover:shadow-sky-500/40 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
        >
          <ExternalLink size={13} />
          {isMedia ? "🎬 Play in Cinema Player" : "Open Media Link"}
        </button>
      </div>
    );
  }
}
