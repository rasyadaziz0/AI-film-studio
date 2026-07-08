import AuthForm from "@/components/auth/AuthForm";

export default async function Home() {
  // Try to get server session to redirect early if logged in.
  // Note: @supabase/supabase-js doesn't auto-handle cookies in app router by default.
  // For V1 simple setup, we rely on client-side protection or basic checks.
  // To keep it simple, we render AuthForm. The client side will redirect if session exists.
  
  return <AuthForm />;
}
