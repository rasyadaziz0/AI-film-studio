import { Film, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function DashboardHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6">
      <div className="flex items-center gap-2 text-indigo-400">
        <Film size={20} />
        <span className="font-semibold text-zinc-100">AI Film Studio</span>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200" title="Settings">
          <Settings size={18} />
        </button>
        <button
          onClick={handleLogout}
          className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
