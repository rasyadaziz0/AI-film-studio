"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, ShieldAlert } from "lucide-react";

export default function ShareResolvePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Redirect to login preserving destination
        router.push(`/?redirect=/studio/share/${params.token}`);
        return;
      }

      try {
        const response = await fetch("/api/studio/share/resolve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token: params.token }),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || "Tautan tidak valid atau telah dicabut.");
          return;
        }

        router.push(`/studio/${data.studioId}`);
      } catch (err: any) {
        setError("Gagal memverifikasi tautan kolaborasi.");
      }
    };

    if (params?.token) {
      resolveToken();
    }
  }, [params?.token, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212] p-4 text-white font-sans">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center shadow-2xl backdrop-blur-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <ShieldAlert size={26} />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-white">Akses Ditolak</h2>
          <p className="mb-6 text-sm text-zinc-400">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-xl bg-zinc-800 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Kembali ke Dasbor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#121212] p-4 text-white font-sans">
      <Loader2 size={36} className="mb-4 animate-spin text-indigo-500" />
      <p className="text-sm font-medium text-zinc-400">Memverifikasi tautan kolaborasi studio...</p>
    </div>
  );
}
