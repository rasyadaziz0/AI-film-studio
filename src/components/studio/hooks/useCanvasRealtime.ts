import { useEffect } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { supabase } from "@/lib/supabase";

export function useCanvasRealtime(studioId: string) {
  useEffect(() => {
    if (!studioId) return;
    
    let isSubscribed = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;

    const setupRealtime = () => {
      const channelId = `nodes_${studioId}_${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(channelId)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "nodes",
            filter: `studio_id=eq.${studioId}`
          },
          (payload) => {
            if (isSubscribed) {
              console.log("[Realtime] Node updated in DB:", payload);
              useStudioStore.getState().pollStatus();
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    // Fallback polling interval every 1.5s to guarantee live UI updates even if websocket drops or replica identity isn't enabled
    const pollingInterval = setInterval(() => {
      if (isSubscribed) {
        useStudioStore.getState().pollStatus();
      }
    }, 1500);

    return () => {
      isSubscribed = false;
      clearInterval(pollingInterval);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [studioId]);
}
