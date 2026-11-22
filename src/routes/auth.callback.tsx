import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/db/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    // supabase-js handles the hash automatically with detectSessionInUrl.
    // Wait for the session to be persisted, then navigate.
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      navigate({ to: data.session ? "/app" : "/auth", replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Autenticando…
    </div>
  );
}
