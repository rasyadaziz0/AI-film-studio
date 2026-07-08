import { Modal } from "@/components/ui/Modal";

interface TemplateInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateString?: string | null;
}

export function TemplateInfoModal({ isOpen, onClose, templateString }: TemplateInfoModalProps) {
  const template = templateString || "basic-none";
  const [wajib, tambahan] = template.split("-");

  const isCustom = template === "custom" || !wajib;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Template Flow Information"
      className="w-[600px] max-w-none"
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
        <p className="text-sm text-zinc-300">
          Studio ini menggunakan sistem node-based untuk menyusun alur kerja AI. Berikut adalah panduan alur untuk template yang sedang digunakan:
        </p>

        <div className="space-y-3">
          {isCustom ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <h4 className="text-sm font-bold text-white mb-1">Custom Template</h4>
              <p className="text-xs text-zinc-500 mt-1">Alur kerja ini telah dimodifikasi atau disusun secara manual oleh pengguna.</p>
            </div>
          ) : (
            <>
              {wajib === "basic" && (
                <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
                  <h4 className="text-sm font-bold text-indigo-400 mb-1">Basic Template</h4>
                  <p className="text-xs text-zinc-300">Producer ➔ Writer ➔ Video Gen</p>
                  <p className="text-xs text-zinc-500 mt-1">Alur paling sederhana. Ide diubah menjadi naskah, lalu naskah langsung dirender menjadi video.</p>
                </div>
              )}

              {wajib === "precise" && (
                <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
                  <h4 className="text-sm font-bold text-indigo-400 mb-1">Precise Template</h4>
                  <p className="text-xs text-zinc-300">Producer ➔ Writer ➔ Reviewer ➔ Video Gen</p>
                  <p className="text-xs text-zinc-500 mt-1">Sama seperti basic, tetapi naskah dari Writer akan dicek dan diverifikasi oleh Reviewer sebelum masuk ke Video Gen agar kualitasnya terjamin.</p>
                </div>
              )}

              {wajib === "advance" && (
                <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
                  <h4 className="text-sm font-bold text-indigo-400 mb-1">Advance Template</h4>
                  <p className="text-xs text-zinc-300">Producer ➔ Rev1 ➔ Writer ➔ Rev2 ➔ Video Gen</p>
                  <p className="text-xs text-zinc-500 mt-1">Alur profesional dengan dua lapis review. Ide direview sebelum menjadi naskah, dan naskah direview kembali sebelum menjadi video.</p>
                </div>
              )}

              {tambahan === "storytelling" && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 mt-3">
                  <h4 className="text-sm font-bold text-emerald-400 mb-1">Add-on: Storytelling (TTS)</h4>
                  <p className="text-xs text-zinc-300">Writer ➔ TTS ➔ Video Gen</p>
                  <p className="text-xs text-zinc-500 mt-1">Menambahkan suara narasi. Naskah dari Writer akan dikirim ke node TTS untuk diubah menjadi suara (Voice Over), lalu digabung di Video Gen.</p>
                </div>
              )}

              {tambahan === "character_centric" && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 mt-3">
                  <h4 className="text-sm font-bold text-emerald-400 mb-1">Add-on: Character Centric (Actor)</h4>
                  <p className="text-xs text-zinc-300">Actor ➔ Writer & Video Gen</p>
                  <p className="text-xs text-zinc-500 mt-1">Menambahkan fokus karakter. Profil karakter dikirim ke Writer untuk ditulis di naskah, dan dikirim ke Video Gen sebagai referensi visual.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-4">
          <button onClick={onClose} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            Mengerti
          </button>
        </div>
      </div>
    </Modal>
  );
}
