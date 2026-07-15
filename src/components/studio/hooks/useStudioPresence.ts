import { useEffect, useState } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { supabase } from "@/lib/supabase";

export interface PresenceUser {
  userId: string;
  email: string;
  role: "owner" | "editor" | "viewer";
  color: string;
  onlineAt: string;
}

const COLORS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ef4444", // red
  "#14b8a6", // teal
];

function getUserColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
}

export function useStudioPresence(studioId: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const { role } = useStudioStore();

  useEffect(() => {
    if (!studioId) return;

    let isSubscribed = true;
    let channel: any = null;

    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isSubscribed) return;

      const userEmail = user.email || user.id;
      const userColor = getUserColor(userEmail);

      channel = supabase.channel(`presence_studios_${studioId}`, {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          if (!isSubscribed) return;
          const state = channel.presenceState();
          const usersList: PresenceUser[] = [];
          
          Object.values(state).forEach((presences: any) => {
            if (Array.isArray(presences) && presences.length > 0) {
              const p = presences[0];
              usersList.push({
                userId: p.userId,
                email: p.email,
                role: p.role || "viewer",
                color: p.color || "#6366f1",
                onlineAt: p.onlineAt,
              });
            }
          });

          setOnlineUsers(usersList);
        })
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED" && isSubscribed) {
            await channel.track({
              userId: user.id,
              email: userEmail,
              role: useStudioStore.getState().role || "viewer",
              color: userColor,
              onlineAt: new Date().toISOString(),
            });
          }
        });
    };

    setupPresence();

    const handleBeforeUnload = () => {
      if (channel) {
        try {
          channel.untrack();
        } catch (e) {
          console.error("[Presence] Error untracking beforeunload:", e);
        }
      }
      supabase.removeAllChannels();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      isSubscribed = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      }
      if (channel) {
        try {
          channel.untrack();
        } catch (e) {
          console.error("[Presence] Error untracking on cleanup:", e);
        }
        supabase.removeChannel(channel);
      }
    };
  }, [studioId, role]);

  return { onlineUsers };
}
