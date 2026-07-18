import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";

export default async function Home() {
  return (
    <Suspense fallback={<div className="bg-zinc-950 text-white min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}
