"use client";

import { Film, LogOut, Settings, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export function DashboardHeader() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getProfileName = () => {
    return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "User";
  };

  const getProfilePicture = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6">
      <div className="flex items-center gap-2 text-indigo-400">
        <Film size={20} />
        <span className="font-semibold text-zinc-100">AI Film Studio</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {user && (
          <div className="flex items-center gap-2.5 sm:mr-2 pl-2 sm:pl-4 border-l border-zinc-800">
            {getProfilePicture() ? (
              <img
                src={getProfilePicture()}
                alt="Profile"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-zinc-700 shadow-sm"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 text-zinc-400 shadow-sm">
                <UserIcon size={14} />
              </div>
            )}
            <span className="text-sm font-medium text-zinc-300 hidden sm:block">
              {getProfileName()}
            </span>
          </div>
        )}
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
