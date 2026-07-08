"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Film, Plus } from "lucide-react";
import { useStudioStore } from "@/store/useStudioStore";
import { WajibTemplate, TambahanTemplate } from "@/lib/core/templates";
import { supabase } from "@/lib/supabase";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StudioCard } from "@/components/dashboard/StudioCard";
import { CreateStudioModal } from "@/components/dashboard/CreateStudioModal";
import { RenameStudioModal } from "@/components/dashboard/RenameStudioModal";
import { DeleteStudioModal } from "@/components/dashboard/DeleteStudioModal";

export default function DashboardPage() {
  const { studios, fetchStudios, loadStudio, createStudio, deleteStudio, updateStudio } = useStudioStore();
  const router = useRouter();
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Rename Modal State
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [studioToRename, setStudioToRename] = useState<{id: string, name: string} | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studioToDelete, setStudioToDelete] = useState<{id: string, name: string} | null>(null);

  const handleCreateStudio = (name: string, wajib: WajibTemplate, tambahan: TambahanTemplate) => {
    createStudio(name, wajib, tambahan);
    setIsModalOpen(false);
  };

  const handleOpenStudio = (id: string) => {
    router.push(`/studio/${id}`);
  };

  const handleDeleteStudioClick = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setStudioToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteStudio = async () => {
    if (studioToDelete) {
      await deleteStudio(studioToDelete.id);
    }
    setIsDeleteModalOpen(false);
    setStudioToDelete(null);
  };

  const handleRenameStudioClick = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    setStudioToRename({ id, name: currentName });
    setIsRenameModalOpen(true);
  };

  const submitRename = async (newName: string) => {
    if (studioToRename && newName && newName.trim() !== "" && newName !== studioToRename.name) {
      await updateStudio({ name: newName.trim() }, studioToRename.id);
    }
    setIsRenameModalOpen(false);
    setStudioToRename(null);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
      } else {
        setIsLoadingAuth(false);
        fetchStudios();
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

  if (isLoadingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 font-sans text-zinc-100">
        <div className="flex flex-col items-center gap-4">
          <Film className="h-8 w-8 animate-pulse text-indigo-500" />
          <div className="text-sm font-medium text-zinc-400 animate-pulse">Loading Workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100">
      <DashboardHeader />

      <main className="mx-auto max-w-6xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Your studios</h1>
          <p className="mt-2 text-zinc-400">Create a new studio to start building your AI video.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* Create New Studio Card */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 text-zinc-400 transition-all hover:border-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 mb-3">
              <Plus size={20} />
            </div>
            <span className="font-medium text-sm">New Studio</span>
          </button>

          {/* Existing Studios */}
          {studios.map((studio) => (
            <StudioCard 
              key={studio.id}
              studio={studio}
              onClick={() => handleOpenStudio(studio.id)}
              onRename={handleRenameStudioClick}
              onDelete={(e) => handleDeleteStudioClick(e, studio.id, studio.name)}
            />
          ))}
        </div>
      </main>

      <CreateStudioModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateStudio}
      />

      <RenameStudioModal 
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        currentName={studioToRename?.name || ""}
        onSave={submitRename}
      />

      <DeleteStudioModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        studioName={studioToDelete?.name || ""}
        onConfirm={confirmDeleteStudio}
      />
    </div>
  );
}
