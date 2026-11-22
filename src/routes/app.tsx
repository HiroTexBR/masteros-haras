import { createFileRoute, Outlet, useRouter, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { modulesCatalogQueryOptions } from "@/hooks/use-modules";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/db/client";
import { UserMenu } from "@/components/user-menu";

export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
    const { data: orgs, error } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);
    if (!error && (!orgs || orgs.length === 0)) {
      throw redirect({ to: "/onboarding" });
    }
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(modulesCatalogQueryOptions),
  component: AppLayout,
  errorComponent: AppError,
  notFoundComponent: AppNotFound,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <Suspense fallback={<SidebarSkeleton />}>
        <AppSidebar />
      </Suspense>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger />
          <div className="flex-1" />
          <UserMenu />
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  );
}

function SidebarSkeleton() {
  return (
    <div className="w-64 border-r p-4 space-y-3">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
    </div>
  );
}

function AppError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="p-8">
      <h2 className="text-lg font-semibold">Erro carregando módulos</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <button
        onClick={() => {
          router.invalidate();
          reset();
        }}
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function AppNotFound() {
  return <div className="p-8">Página não encontrada.</div>;
}
