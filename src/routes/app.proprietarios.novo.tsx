import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ModuleGate } from "@/components/module-gate";
import { ProprietarioForm } from "@/features/proprietarios/proprietario-form";
import { useCreateProprietario } from "@/features/proprietarios/proprietarios";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/proprietarios/novo")({
  head: () => ({ meta: [{ title: "Novo proprietário · MasterOS" }] }),
  component: () => (
    <ModuleGate code="proprietarios">
      <NovoProprietarioPage />
    </ModuleGate>
  ),
});

function NovoProprietarioPage() {
  const navigate = useNavigate();
  const create = useCreateProprietario();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/app/proprietarios"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <h1 className="font-display text-3xl">Novo proprietário</h1>
      </div>
      <div className="rounded-lg border bg-card p-5 shadow-prestige">
        <ProprietarioForm
          submitting={create.isPending}
          submitLabel="Cadastrar"
          onCancel={() => navigate({ to: "/app/proprietarios" })}
          onSubmit={(v) =>
            create.mutate(v, {
              onSuccess: (p) => {
                toast.success("Cadastrado");
                navigate({ to: "/app/proprietarios/$id", params: { id: p.id } });
              },
              onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
            })
          }
        />
      </div>
    </div>
  );
}
