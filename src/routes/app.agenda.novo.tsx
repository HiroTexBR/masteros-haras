import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ModuleGate } from "@/components/module-gate";
import { EventoForm } from "@/features/agenda/evento-form";
import { useCreateEvento } from "@/features/agenda/agenda";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/agenda/novo")({
  head: () => ({ meta: [{ title: "Novo evento · MasterOS" }] }),
  component: () => (
    <ModuleGate code="agenda">
      <NovoEventoPage />
    </ModuleGate>
  ),
});

function NovoEventoPage() {
  const navigate = useNavigate();
  const create = useCreateEvento();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/app/agenda"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <h1 className="font-display text-3xl">Novo evento</h1>
      </div>

      <div className="rounded-lg border bg-card p-5 shadow-prestige">
        <EventoForm
          submitting={create.isPending}
          submitLabel="Criar evento"
          onCancel={() => navigate({ to: "/app/agenda" })}
          onSubmit={(v) =>
            create.mutate(v, {
              onSuccess: () => {
                toast.success("Evento criado");
                navigate({ to: "/app/agenda" });
              },
              onError: (err) => toast.error(err instanceof Error ? err.message : "Erro ao criar"),
            })
          }
        />
      </div>
    </div>
  );
}
