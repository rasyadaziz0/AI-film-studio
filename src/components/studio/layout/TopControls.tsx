import { Info, Loader2, CheckCircle2, Undo2, Redo2 } from "lucide-react";
import { useCanvasShortcuts } from "../hooks/useCanvasShortcuts";
import { useStudioStore } from "@/store/useStudioStore";

interface TopControlsProps {
  isSaving: boolean;
  setIsInfoModalOpen: (open: boolean) => void;
}

export default function TopControls({ isSaving, setIsInfoModalOpen }: TopControlsProps) {
  const { canUndo, canRedo, undo, redo } = useCanvasShortcuts();
  const { capabilities } = useStudioStore();

  return (
    <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
      <button
        onClick={() => setIsInfoModalOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#444444] bg-[#2c2c2c] text-[#8c8c8c] hover:text-white hover:bg-[#18a0fb] hover:border-[#18a0fb] transition-colors shadow-lg"
        title="Template Flow Info"
      >
        <Info size={18} />
      </button>
      <div className="flex h-10 items-center gap-2 rounded-xl border border-[#444444] bg-[#2c2c2c] px-4 text-sm font-medium text-[#8c8c8c] shadow-lg transition-all">
        {isSaving ? (
          <Loader2 size={16} className="animate-spin text-[#18a0fb]" />
        ) : (
          <CheckCircle2 size={16} className="text-emerald-500" />
        )}
        {isSaving ? "Saving..." : "Saved"}
      </div>

      {/* Undo / Redo */}
      {capabilities.canEditCanvas && (
        <div className="flex h-10 items-center rounded-xl border border-[#444444] bg-[#2c2c2c] shadow-lg overflow-hidden ml-2">
          <button
            onClick={() => undo()}
            disabled={!canUndo}
            className={`flex items-center justify-center h-full px-3 transition-colors ${
              canUndo
                ? "text-[#e0e0e0] hover:bg-[#383838] hover:text-white"
                : "text-[#555555] cursor-not-allowed"
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <div className="w-px h-6 bg-[#444444]"></div>
          <button
            onClick={() => redo()}
            disabled={!canRedo}
            className={`flex items-center justify-center h-full px-3 transition-colors ${
              canRedo
                ? "text-[#e0e0e0] hover:bg-[#383838] hover:text-white"
                : "text-[#555555] cursor-not-allowed"
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
