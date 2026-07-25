"use client";

import { Suspense, useEffect } from "react";
import AuthForm from "@/components/auth/AuthForm";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function LoginContent() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  return <AuthForm />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-zinc-950 text-white min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
