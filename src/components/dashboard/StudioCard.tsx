import { Trash2, Edit2 } from "lucide-react";
import { Studio } from "@/store/types";

interface StudioCardProps {
  studio: Studio;
  onClick: () => void;
  onRename: (e: React.MouseEvent, id: string, currentName: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export function StudioCard({ studio, onClick, onRename, onDelete }: StudioCardProps) {
  const templateText = studio.template 
    ? studio.template.toUpperCase().replace("_", " ") 
    : "CUSTOM";
  const dateStr = studio.created_at ? new Date(studio.created_at).toLocaleDateString() : "";

  return (
    <div
      onClick={onClick}
      className="group relative flex h-48 cursor-pointer flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-indigo-500/50 hover:bg-zinc-800 hover:shadow-lg hover:shadow-indigo-500/10"
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-indigo-400 transition-colors">
            {templateText}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => onRename(e, studio.id, studio.name)}
              className="text-zinc-600 hover:text-indigo-400 transition-colors"
              title="Rename Studio"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={(e) => onDelete(e, studio.id)}
              className="text-zinc-600 hover:text-red-400 transition-colors"
              title="Delete Studio"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-zinc-200 line-clamp-2">{studio.name}</h3>
      </div>
      
      <div className="text-xs text-zinc-500">
        {dateStr && <span>{dateStr}</span>}
      </div>
    </div>
  );
}
