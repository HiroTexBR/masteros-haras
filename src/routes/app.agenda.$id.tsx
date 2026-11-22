import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ModuleGate } from "@/components/module-gate";
import { EventoForm } from "@/features/agenda/evento-form";
import { useUpdateEvento, useDeleteEvento, type Evento } from "@/features/agenda/agenda";
import { supabase } from "@/integrations/db/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/agenda/$id")({
  head: () => ({ meta: [{ title: "Evento · MasterOS" }] }),
  component: () => (
    <ModuleGate code="agenda">
      <EventoDetailPage />
    </ModuleGate>
  ),
});

function EventoDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const update = useUpdateEvento();
  const del = useDeleteEvento();

  const q = useQuery({
    queryKey: ["evento", id],
    queryFn: async (): Promise<Evento | null> => {
      const { data, error } = await supabase.from("eventos").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data as Evento) ?? null;
    },
  });

  if (q.isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  if (!q.data) return <div className="text-muted-foreground">Evento não encontrado.</div>;

  const e = q.data;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link to="/app/agenda"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
          </Button>
          <h1 className="font-display text-3xl">Editar evento</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            del.mutate(id, {
              onSuccess: () => {
                toast.success("Excluído");
                navigate({ to: "/app/agenda" });
              },
              onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
            })
          }
        >
          <Trash2 className="mr-1 h-4 w-4" /> Excluir
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-5 shadow-prestige">
        <EventoForm
          initial={e}
          submitting={update.isPending}
          submitLabel="Salvar alterações"
          onCancel={() => navigate({ to: "/app/agenda" })}
          onSubmit={(v) =>
            update.mutate(
              { id, input: v },
              {
                onSuccess: () => {
                  toast.success("Atualizado");
                  navigate({ to: "/app/agenda" });
                },
                onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
              },
            )
          }
        />
      </div>
    </div>
  );
}
