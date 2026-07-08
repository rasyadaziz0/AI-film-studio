import { Modal } from "@/components/ui/Modal";

interface DeleteStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  studioName: string;
  onConfirm: () => void;
}

export function DeleteStudioModal({ isOpen, onClose, studioName, onConfirm }: DeleteStudioModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Studio"
      className="w-[400px] max-w-none"
    >
      <div className="space-y-4">
        <p className="text-sm text-zinc-300">
          Are you sure you want to delete <strong className="text-white">"{studioName}"</strong>? This action cannot be undone and you will lose all data in this studio.
        </p>

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white">
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Delete Studio
          </button>
        </div>
      </div>
    </Modal>
  );
}
