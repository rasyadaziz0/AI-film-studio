import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";

interface RenameStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (newName: string) => void;
}

export function RenameStudioModal({ isOpen, onClose, currentName, onSave }: RenameStudioModalProps) {
  const [newStudioName, setNewStudioName] = useState(currentName);

  // Sync state when opened with a new name
  useEffect(() => {
    if (isOpen) {
      setNewStudioName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSubmit = () => {
    onSave(newStudioName);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rename Studio"
      className="w-[400px] max-w-none"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">New Studio Name</label>
          <input 
            type="text" 
            value={newStudioName}
            onChange={(e) => setNewStudioName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white">Cancel</button>
          <button onClick={handleSubmit} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Save</button>
        </div>
      </div>
    </Modal>
  );
}
