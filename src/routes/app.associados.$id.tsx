import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ModuleGate } from "@/components/module-gate";
import { AssociadoForm } from "@/features/associados/associado-form";
import {
  useAssociado,
  useUpdateAssociado,
  useDeleteAssociado,
  CATEGORIA_LABEL,
  STATUS_LABEL,
} from "@/features/associados/associados";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/app/associados/$id")({
  head: () => ({ meta: [{ title: "Associado · MasterOS" }] }),
  component: () => (
    <ModuleGate code="associacao">
      <AssociadoDetailPage />
    </ModuleGate>
  ),
});

function AssociadoDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const q = useAssociado(id);
  const update = useUpdateAssociado();
  const del = useDeleteAssociado();

  if (q.isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  if (!q.data) return <div className="text-muted-foreground">Associado não encontrado.</div>;

  const a = q.data;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link to="/app/associados"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl">{a.nome}</h1>
            <p className="text-sm text-muted-foreground">
              Nº {a.numero ? String(a.numero).padStart(4, "0") : "—"} · {CATEGORIA_LABEL[a.categoria]}
            </p>
          </div>
          <Badge>{STATUS_LABEL[a.status]}</Badge>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-prestige">
        <AssociadoForm
          initial={a}
          submitting={update.isPending}
          submitLabel="Salvar alterações"
          onSubmit={(v) =>
            update.mutate(
              { id: a.id, input: v },
              {
                onSuccess: () => toast.success("Alterações salvas"),
                onError: (err) => toast.error(err.message),
              },
            )
          }
        />
      </div>

      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Zona de perigo</p>
            <p className="text-xs text-muted-foreground">
              Remove o associado da listagem. A operação pode ser revertida pelo suporte.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir associado?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação remove {a.nome} da listagem. Você pode restaurar via suporte.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    del.mutate(a.id, {
                      onSuccess: () => {
                        toast.success("Associado excluído");
                        navigate({ to: "/app/associados" });
                      },
                      onError: (err) => toast.error(err.message),
                    })
                  }
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
