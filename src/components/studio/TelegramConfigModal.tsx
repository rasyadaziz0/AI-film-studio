import { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import { useStudioStore } from "@/store/useStudioStore";

interface TelegramConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TelegramConfigModal({ isOpen, onClose }: TelegramConfigModalProps) {
  const { studios, activeStudioId, updateStudio } = useStudioStore();
  const activeStudio = studios.find(s => s.id === activeStudioId);

  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [telegramMode, setTelegramMode] = useState<"none" | "output_only" | "full_telegram">("none");
  const [isSaving, setIsSaving] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<{ webhookUrl?: string; webhookSecret?: string } | null>(null);

  // Load existing data when modal opens or active studio changes
  useEffect(() => {
    if (activeStudio && isOpen) {
      setBotToken(activeStudio.telegram_bot_token || "");
      setChatId(activeStudio.telegram_chat_id || "");
      setTelegramMode(activeStudio.telegram_mode || "none");
    }
  }, [activeStudio, isOpen]);

  if (!isOpen || !activeStudio) return null;

  const handleSave = async () => {
    if (!activeStudioId) return;
    setIsSaving(true);

    try {
      // Save secrets via ECS API (encrypted server-side)
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

      const res = await fetch(`${apiUrl}/v1/studios/secrets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          studioId: activeStudioId,
          botToken: botToken || undefined,
          chatId,
          telegramMode,
        }),
      });

      const result = await res.json();
      if (result.webhookUrl) {
        setWebhookInfo({ webhookUrl: result.webhookUrl, webhookSecret: result.webhookSecret });
      }

      // Update non-secret studio fields locally
      updateStudio({
        telegram_chat_id: chatId,
        telegram_mode: telegramMode,
      });
    } catch (err) {
      console.error("[TelegramConfig] Save failed:", err);
    } finally {
      setIsSaving(false);
    }

    // Auto-inject Telegram node when mode is enabled and none exists on canvas
    if (telegramMode !== "none") {
      const { nodes, edges, addNode, onConnect } = useStudioStore.getState();
      const hasTelegramNode = nodes.some((n) => n.type === "telegram");

      if (!hasTelegramNode) {
        // Find the rightmost/lowest node to place Telegram after it
        let maxX = 0;
        let maxY = 200;
        let lastNodeId: string | null = null;

        // Find terminal nodes (nodes with no outgoing edges)
        const nodesWithOutgoing = new Set(edges.map((e) => e.source));
        const terminalNodes = nodes.filter((n) => !nodesWithOutgoing.has(n.id));

        if (terminalNodes.length > 0) {
          // Pick the terminal node with highest x position
          const best = terminalNodes.reduce((a, b) =>
            (a.position?.x ?? 0) >= (b.position?.x ?? 0) ? a : b
          );
          maxX = (best.position?.x ?? 0) + 350;
          maxY = best.position?.y ?? 200;
          lastNodeId = best.id;
        } else if (nodes.length > 0) {
          // Fallback: rightmost node
          const rightmost = nodes.reduce((a, b) =>
            (a.position?.x ?? 0) >= (b.position?.x ?? 0) ? a : b
          );
          maxX = (rightmost.position?.x ?? 0) + 350;
          maxY = rightmost.position?.y ?? 200;
          lastNodeId = rightmost.id;
        }

        // Add the node
        addNode("telegram" as any, { x: maxX, y: maxY });

        // Connect from last node to the new Telegram node
        const updatedNodes = useStudioStore.getState().nodes;
        const telegramNode = updatedNodes.find((n) => n.type === "telegram");
        if (lastNodeId && telegramNode) {
          onConnect({
            source: lastNodeId,
            target: telegramNode.id,
            sourceHandle: null,
            targetHandle: null,
          });
        }
      }
    }

    if (!webhookInfo) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[500px] rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Send className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Telegram Integration</h2>
            <p className="text-xs text-zinc-400">Hubungkan studio ini dengan Bot Telegram.</p>
          </div>
          <button onClick={onClose} className="ml-auto text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Bot Token */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Bot Token (dari BotFather)</label>
            <input 
              type="password" 
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
            />
            <p className="text-[11px] text-zinc-500">Token disimpan rahasia. Jangan bagikan token ini.</p>
          </div>

          {/* Chat ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Allowed Chat ID</label>
            <input 
              type="text" 
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              placeholder="-1001234567890"
            />
            <p className="text-[11px] text-zinc-500">Hanya melayani request atau kirim ke Chat ID ini untuk proteksi biaya.</p>
          </div>

          {/* Mode */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Telegram Mode</label>
            <div className="flex flex-col gap-2">
              <label className={`flex items-center gap-3 rounded-lg border ${telegramMode === "none" ? "border-zinc-500 bg-zinc-800" : "border-zinc-800 bg-zinc-950/50"} p-3 cursor-pointer hover:border-zinc-700 transition-colors`}>
                <input type="radio" name="telegram_mode" value="none" checked={telegramMode === "none"} onChange={() => setTelegramMode("none")} className="hidden" />
                <span className="text-sm font-medium text-white">None (Disabled)</span>
              </label>
              
              <label className={`flex items-start gap-3 rounded-lg border ${telegramMode === "output_only" ? "border-blue-500 bg-blue-500/10" : "border-zinc-800 bg-zinc-950/50"} p-3 cursor-pointer hover:border-zinc-700 transition-colors`}>
                <input type="radio" name="telegram_mode" value="output_only" checked={telegramMode === "output_only"} onChange={() => setTelegramMode("output_only")} className="mt-0.5 hidden" />
                <div>
                  <div className="text-sm font-medium text-white">Output Only</div>
                  <div className="text-xs text-zinc-400">Trigger dari Web, hasil video otomatis terkirim ke Telegram.</div>
                </div>
              </label>
              
              <label className={`flex items-start gap-3 rounded-lg border ${telegramMode === "full_telegram" ? "border-blue-500 bg-blue-500/10" : "border-zinc-800 bg-zinc-950/50"} p-3 cursor-pointer hover:border-zinc-700 transition-colors`}>
                <input type="radio" name="telegram_mode" value="full_telegram" checked={telegramMode === "full_telegram"} onChange={() => setTelegramMode("full_telegram")} className="mt-0.5 hidden" />
                <div>
                  <div className="text-sm font-medium text-white">Full Telegram (Bot)</div>
                  <div className="text-xs text-zinc-400">Kirim prompt dari Telegram -&gt; Studio render di background -&gt; Kirim hasil balik ke Telegram.</div>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors">Cancel</button>
            <button onClick={handleSave} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
