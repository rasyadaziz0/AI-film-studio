import { Trash2, Edit2, Users } from "lucide-react";
import { Studio } from "@/store/types";
import { useStudioPresence } from "@/components/studio/hooks/useStudioPresence";

interface StudioCardProps {
  studio: Studio;
  onClick: () => void;
  onRename: (e: React.MouseEvent, id: string, currentName: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export function StudioCard({ studio, onClick, onRename, onDelete }: StudioCardProps) {
  const isShared = studio.sharing_visibility === 'link_view' || (studio.accessSource && studio.accessSource !== 'owner');
  const { onlineUsers } = useStudioPresence(isShared ? studio.id : "");

  const templateText = studio.template 
    ? studio.template.toUpperCase().replace("_", " ") 
    : "CUSTOM";
  const dateStr = studio.created_at ? new Date(studio.created_at).toLocaleDateString() : "";
  
  const isOwner = studio.accessSource === 'owner' || !studio.accessSource;

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
            {isOwner && (
              <>
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
              </>
            )}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-zinc-200 line-clamp-2">{studio.name}</h3>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex flex-col gap-1">
          <div className="text-xs text-zinc-500">
            {dateStr && <span>{dateStr}</span>}
          </div>
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex -space-x-1.5 overflow-hidden">
                {onlineUsers.slice(0, 3).map((u, i) => (
                  <div
                    key={`${u.userId}-${i}`}
                    style={{ backgroundColor: u.color }}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ring-1 ring-zinc-900"
                    title={`${u.email} (${u.role})`}
                  >
                    {u.email.substring(0, 1).toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-medium text-emerald-400 animate-pulse">
                {onlineUsers.length} Online
              </span>
            </div>
          )}
        </div>
        
        {!isOwner && (
          <div className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-1 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
            <Users size={12} />
            <span className="capitalize">{studio.role || 'Collaborator'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
