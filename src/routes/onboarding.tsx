import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/db/client";
import { modulesCatalogQueryOptions } from "@/hooks/use-modules";
import { useCreateOrganization, useOrgs } from "@/hooks/use-orgs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({ meta: [{ title: "Bem-vindo · MasterOS" }] }),
  beforeLoad: async ({ context }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
    await context.queryClient.ensureQueryData(modulesCatalogQueryOptions);
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando…</div>}>
        <OnboardingForm />
      </Suspense>
    </div>
  );
}

function OnboardingForm() {
  const navigate = useNavigate();
  const catalog = useSuspenseQuery(modulesCatalogQueryOptions).data;
  const orgs = useOrgs();
  const create = useCreateOrganization();
  const [name, setName] = useState("");
  const [vertical, setVertical] = useState<string>("");

  // Se já tem org, manda pro /app
  if (orgs.data && orgs.data.length > 0) {
    navigate({ to: "/app" });
    return null;
  }

  const canSubmit = name.trim().length > 1 && vertical && !create.isPending;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Bem-vindo ao MasterOS</CardTitle>
        <CardDescription>
          Vamos criar sua primeira organização. Você pode criar mais depois.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da organização</Label>
          <Input
            id="name"
            placeholder="Ex.: Haras São João"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Vertical</Label>
          <Select value={vertical} onValueChange={setVertical}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha o tipo de negócio" />
            </SelectTrigger>
            <SelectContent>
              {catalog.verticals.map((v) => (
                <SelectItem key={v.code} value={v.code}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {vertical && (
            <p className="text-xs text-muted-foreground">
              {catalog.verticals.find((v) => v.code === vertical)?.description}
            </p>
          )}
        </div>

        <Button
          className="w-full"
          disabled={!canSubmit}
          onClick={() => {
            create.mutate(
              { name: name.trim(), vertical },
              {
                onSuccess: () => {
                  toast.success("Organização criada!");
                  navigate({ to: "/app" });
                },
                onError: (err) => toast.error(err.message),
              },
            );
          }}
        >
          {create.isPending ? "Criando…" : "Criar organização"}
        </Button>
      </CardContent>
    </Card>
  );
}
