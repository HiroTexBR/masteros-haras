import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ModuleGate } from "@/components/module-gate";
import { AnimalForm } from "@/features/animais/animal-form";
import { AnimalDocumentos } from "@/features/animais/animal-documentos";
import {
  useAnimal, useUpdateAnimal, useDeleteAnimal,
  ESPECIE_LABEL, STATUS_LABEL,
} from "@/features/animais/animais";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/animais/$id")({
  head: () => ({ meta: [{ title: "Animal · MasterOS" }] }),
  component: () => (
    <ModuleGate code="animais">
      <AnimalDetailPage />
    </ModuleGate>
  ),
});

function AnimalDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const q = useAnimal(id);
  const update = useUpdateAnimal();
  const del = useDeleteAnimal();

  if (q.isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  if (!q.data) return <div className="text-muted-foreground">Animal não encontrado.</div>;
  const a = q.data;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link to="/app/animais"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
          </Button>
          <h1 className="font-display text-3xl">{a.nome}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{ESPECIE_LABEL[a.especie]}</Badge>
            <Badge>{STATUS_LABEL[a.status]}</Badge>
            {a.raca && <span>· {a.raca}</span>}
            {a.registro && <span>· Reg. {a.registro}</span>}
          </div>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() =>
            del.mutate(id, {
              onSuccess: () => { toast.success("Excluído"); navigate({ to: "/app/animais" }); },
              onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
            })
          }
        >
          <Trash2 className="mr-1 h-4 w-4" /> Excluir
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Dados</h2>
        <div className="rounded-lg border bg-card p-5 shadow-prestige">
          <AnimalForm
            initial={a}
            submitting={update.isPending}
            submitLabel="Salvar alterações"
            onSubmit={(v) =>
              update.mutate(
                { id, input: v },
                {
                  onSuccess: () => toast.success("Atualizado"),
                  onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
                },
              )
            }
          />
        </div>
      </section>

      <section>
        <AnimalDocumentos animalId={id} />
      </section>
    </div>
  );
}
