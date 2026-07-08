import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { WajibTemplate, TambahanTemplate } from "@/lib/core/templates";

interface CreateStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, wajib: WajibTemplate, tambahan: TambahanTemplate) => void;
}

export function CreateStudioModal({ isOpen, onClose, onCreate }: CreateStudioModalProps) {
  const [studioName, setStudioName] = useState("Untitled Studio");
  const [wajibSelection, setWajibSelection] = useState<WajibTemplate>("basic");
  const [tambahanSelection, setTambahanSelection] = useState<TambahanTemplate>("none");

  const handleSubmit = () => {
    onCreate(studioName, wajibSelection, tambahanSelection);
    // Reset state after creation
    setStudioName("Untitled Studio");
    setWajibSelection("basic");
    setTambahanSelection("none");
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Create New Studio"
      className="w-[450px] max-w-none"
    >
      <div className="space-y-4">
        {/* Studio Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Studio Name</label>
          <input 
            type="text" 
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            placeholder="e.g. My Awesome Film"
          />
        </div>

        {/* Wajib Template */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Wajib (Required)</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 cursor-pointer hover:border-zinc-700 transition-colors">
              <input type="radio" name="wajib" value="basic" checked={wajibSelection === "basic"} onChange={() => setWajibSelection("basic")} className="mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white">Basic</div>
                <div className="text-xs text-zinc-500">Producer → Writer → Video Gen</div>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 cursor-pointer hover:border-zinc-700 transition-colors">
              <input type="radio" name="wajib" value="precise" checked={wajibSelection === "precise"} onChange={() => setWajibSelection("precise")} className="mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white">Precise</div>
                <div className="text-xs text-zinc-500">Producer → Writer → Reviewer → Video Gen</div>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 cursor-pointer hover:border-zinc-700 transition-colors">
              <input type="radio" name="wajib" value="advance" checked={wajibSelection === "advance"} onChange={() => setWajibSelection("advance")} className="mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white">Advance</div>
                <div className="text-xs text-zinc-500">Producer → Rev → Writer → Rev → Video Gen</div>
              </div>
            </label>
          </div>
        </div>

        {/* Tambahan Template */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tambahan (Optional Add-on)</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 cursor-pointer hover:border-zinc-700 transition-colors">
              <input type="radio" name="tambahan" value="none" checked={tambahanSelection === "none"} onChange={() => setTambahanSelection("none")} />
              <span className="text-sm font-medium text-white">None</span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 cursor-pointer hover:border-zinc-700 transition-colors">
              <input type="radio" name="tambahan" value="storytelling" checked={tambahanSelection === "storytelling"} onChange={() => setTambahanSelection("storytelling")} className="mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white">Storytelling (TTS)</div>
                <div className="text-xs text-zinc-500">Adds Voice-over via TTS</div>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 cursor-pointer hover:border-zinc-700 transition-colors">
              <input type="radio" name="tambahan" value="character_centric" checked={tambahanSelection === "character_centric"} onChange={() => setTambahanSelection("character_centric")} className="mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white">Character-centric (Actor)</div>
                <div className="text-xs text-zinc-500">Adds Actor node for Character concepts</div>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white">Cancel</button>
          <button onClick={handleSubmit} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Create Studio</button>
        </div>
      </div>
    </Modal>
  );
}
