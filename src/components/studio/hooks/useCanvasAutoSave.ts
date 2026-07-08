import { useEffect, useRef, useState } from "react";
import { useStudioStore } from "@/store/useStudioStore";

export function useCanvasAutoSave(studioId: string) {
  const { nodes, edges, loadStudio, saveStudio } = useStudioStore();
  const [isSaving, setIsSaving] = useState(false);
  const hasLoaded = useRef(false);
  const isSavingRef = useRef(false);

  // Load the specific studio on mount
  useEffect(() => {
    if (studioId) {
      loadStudio(studioId).then(() => {
        setTimeout(() => {
          hasLoaded.current = true;
        }, 500); // Delay to avoid immediate save
      });
    }
  }, [studioId, loadStudio]);

  // Auto-save effect (Debounced)
  useEffect(() => {
    if (!hasLoaded.current) return;

    // Do not auto-save from frontend while the server engine is actively running or queued!
    const isAnyRunning = nodes.some(n => n.data.status === "running" || n.data.status === "queued");
    if (isAnyRunning) return;

    setIsSaving(true);
    const timeoutId = setTimeout(async () => {
      if (isSavingRef.current) return; // Prevent concurrent saves
      isSavingRef.current = true;
      
      await saveStudio();
      
      isSavingRef.current = false;
      setIsSaving(false);
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, saveStudio]);

  return { isSaving, hasLoaded };
}
