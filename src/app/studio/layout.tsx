"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Film, Play, Save, Send, ArrowLeft, Loader2, Square } from "lucide-react";
import { useStudioStore } from "@/store/useStudioStore";
import TelegramConfigModal from "@/components/studio/TelegramConfigModal";
import { supabase } from "@/lib/supabase";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { studios, activeStudioId, loadStudio, createStudio, updateStudio, nodes } = useStudioStore();
  const activeStudio = studios.find(s => s.id === activeStudioId);
  const isPipelineRunning = nodes.some(n => n.data.status === "running" || n.data.status === "queued");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
      } else {
        setIsLoadingAuth(false);
      }
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/");
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Sync active studio with URL parameter
  useEffect(() => {
    if (params?.id) {
      if (studios.length === 0) {
        useStudioStore.getState().fetchStudios().then(() => {
          useStudioStore.getState().loadStudio(params.id as string);
        });
      } else if (activeStudioId !== params.id) {
        useStudioStore.getState().loadStudio(params.id as string);
      }
    }
  }, [params?.id, activeStudioId, studios.length]);

  if (isLoadingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 font-sans text-zinc-100">
        <div className="flex flex-col items-center gap-4">
          <Film className="h-8 w-8 animate-pulse text-indigo-500" />
          <div className="text-sm font-medium text-zinc-400 animate-pulse">Loading Studio Workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-zinc-950 font-sans text-zinc-100 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="h-5 w-px bg-zinc-700"></div>
          <div className="flex items-center gap-2 text-indigo-400">
            <Film size={20} />
            <span className="font-semibold text-zinc-100 hidden sm:inline-block">AI Film Studio</span>
          </div>

          <nav className="flex items-center gap-1">
            {studios.map((studio) => (
              <button
                key={studio.id}
                onClick={() => router.push(`/studio/${studio.id}`)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeStudioId === studio.id
                    ? "bg-zinc-800 text-zinc-200"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
                }`}
              >
                {activeStudioId === studio.id && (
                  <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                )}
                {studio.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              if (!activeStudioId) return;
              await useStudioStore.getState().saveStudio();
            }}
            disabled={!activeStudioId}
            className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white border border-zinc-700 disabled:opacity-50"
          >
            <Save size={14} />
            Save
          </button>
          
          <button
            onClick={() => useStudioStore.getState().runPipeline()}
            disabled={isPipelineRunning}
            className={`flex items-center gap-2 rounded-lg px-5 py-1.5 text-sm font-medium text-white transition-all shadow-sm ${
              isPipelineRunning 
                ? "bg-amber-600/90 cursor-not-allowed border border-amber-500/80 animate-pulse shadow-amber-900/40" 
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/20"
            }`}
          >
            {isPipelineRunning ? (
              <>
                <Loader2 size={14} className="animate-spin shrink-0" />
                Pipeline Berjalan...
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" />
                Run Pipeline
              </>
            )}
          </button>

          {isPipelineRunning && (
            <button
              onClick={async () => {
                if (!activeStudioId) return;
                const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
                const { data: { session } } = await supabase.auth.getSession();
                await fetch(`${apiUrl}/v1/jobs/reset`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token || ""}`,
                  },
                  body: JSON.stringify({ studioId: activeStudioId }),
                });
                await useStudioStore.getState().pollStatus();
              }}
              title="Berhentikan atau Reset status pipeline yang menyangkut"
              className="flex items-center gap-1.5 rounded-lg bg-red-600/90 hover:bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow-sm"
            >
              <Square size={12} fill="currentColor" />
              Stop / Reset
            </button>
          )}

          <div className="h-5 w-px bg-zinc-700 mx-2 hidden sm:block"></div>

          <button 
            onClick={() => setIsTelegramModalOpen(true)}
            className="rounded-md p-2 text-blue-400 transition-colors hover:bg-zinc-800 hover:text-blue-300"
            title="Telegram Settings"
          >
            <Send size={18} />
          </button>
        </div>
      </header>

      {/* Secondary Header: Niche & Duration */}
      {activeStudio && (
        <div className="flex h-12 shrink-0 items-center gap-4 border-b border-zinc-800 bg-zinc-900/90 px-4 shadow-sm z-10">
          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Niche / Topik</span>
            <input
              type="text"
              placeholder="e.g. T-Rex pecinta kalkulus (mematikan mode manual)"
              value={activeStudio.niche || ""}
              onChange={(e) => updateStudio({ niche: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="w-px h-6 bg-zinc-800"></div>
          <div className="flex-[0.7] flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Judul Video</span>
            <input
              type="text"
              placeholder="Auto-generated atau ketik sendiri..."
              value={activeStudio.name || ""}
              onChange={(e) => updateStudio({ name: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="w-px h-6 bg-zinc-800"></div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Durasi</span>
            <select
              value={activeStudio.video_duration || 5}
              onChange={(e) => updateStudio({ video_duration: parseInt(e.target.value) })}
              className="bg-zinc-950 text-sm font-medium text-zinc-200 rounded-md px-3 py-1.5 outline-none focus:border-indigo-500 border border-zinc-800 cursor-pointer transition-colors"
            >
              <option value={5}>5 Detik</option>
              <option value={15}>15 Detik</option>
              <option value={30}>30 Detik</option>
            </select>
          </div>
          <div className="w-px h-6 bg-zinc-800"></div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Bahasa</span>
            <select
              value={activeStudio.language || "English"}
              onChange={(e) => updateStudio({ language: e.target.value })}
              className="bg-zinc-950 text-sm font-medium text-zinc-200 rounded-md px-3 py-1.5 outline-none focus:border-indigo-500 border border-zinc-800 cursor-pointer transition-colors"
            >
              <option value="English">English (EN)</option>
              <option value="Bahasa Indonesia">Indonesia (ID)</option>
              <option value="Japanese">Japanese (JA)</option>
              <option value="Mandarin Chinese">Mandarin (ZH)</option>
              <option value="Spanish">Spanish (ES)</option>
              <option value="French">French (FR)</option>
              <option value="Korean">Korean (KO)</option>
              <option value="Arabic">Arabic (AR)</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 overflow-hidden bg-zinc-950">
        {children}
      </main>



      {/* Telegram Config Modal */}
      <TelegramConfigModal 
        isOpen={isTelegramModalOpen} 
        onClose={() => setIsTelegramModalOpen(false)} 
      />
    </div>
  );
}
