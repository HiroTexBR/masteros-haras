import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ModuleGate } from "@/components/module-gate";
import { ProprietarioForm } from "@/features/proprietarios/proprietario-form";
import {
  useProprietario, useUpdateProprietario, useDeleteProprietario,
  useAnimaisDoProprietario, TIPO_LABEL,
} from "@/features/proprietarios/proprietarios";
import { ESPECIE_LABEL } from "@/features/animais/animais";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PawPrint, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/proprietarios/$id")({
  head: () => ({ meta: [{ title: "Proprietário · MasterOS" }] }),
  component: () => (
    <ModuleGate code="proprietarios">
      <ProprietarioDetail />
    </ModuleGate>
  ),
});

function ProprietarioDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const q = useProprietario(id);
  const animais = useAnimaisDoProprietario(id);
  const update = useUpdateProprietario();
  const del = useDeleteProprietario();

  if (q.isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  if (!q.data) return <div className="text-muted-foreground">Proprietário não encontrado.</div>;
  const p = q.data;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link to="/app/proprietarios"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
          </Button>
          <h1 className="font-display text-3xl">{p.nome}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{TIPO_LABEL[p.tipo]}</Badge>
            {p.documento && <span className="font-mono">{p.documento}</span>}
          </div>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() =>
            del.mutate(id, {
              onSuccess: () => { toast.success("Excluído"); navigate({ to: "/app/proprietarios" }); },
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
          <ProprietarioForm
            initial={p}
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

      <section className="space-y-3">
        <h2 className="font-display text-xl">Animais vinculados</h2>
        <div className="rounded-lg border bg-card shadow-prestige">
          {animais.isLoading && (
            <div className="p-6 text-center text-sm text-muted-foreground">Carregando…</div>
          )}
          {!animais.isLoading && (animais.data?.length ?? 0) === 0 && (
            <div className="p-6 text-center">
              <PawPrint className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhum animal vinculado a este proprietário ainda.
              </p>
            </div>
          )}
          <ul className="divide-y">
            {animais.data?.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <Link to="/app/animais/$id" params={{ id: a.id }} className="font-medium hover:underline">
                    {a.nome}
                  </Link>
                  {a.apelido && <span className="ml-2 text-xs text-muted-foreground">({a.apelido})</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {ESPECIE_LABEL[a.especie as keyof typeof ESPECIE_LABEL]}
                  {a.categoria ? ` · ${a.categoria}` : ""}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
