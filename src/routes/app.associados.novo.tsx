import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ModuleGate } from "@/components/module-gate";
import { AssociadoForm } from "@/features/associados/associado-form";
import { useCreateAssociado } from "@/features/associados/associados";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/associados/novo")({
  head: () => ({ meta: [{ title: "Novo associado · MasterOS" }] }),
  component: () => (
    <ModuleGate code="associacao">
      <NovoAssociadoPage />
    </ModuleGate>
  ),
});

function NovoAssociadoPage() {
  const navigate = useNavigate();
  const create = useCreateAssociado();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link to="/app/associados"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <h1 className="font-display text-3xl mt-2">Novo associado</h1>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-prestige">
        <AssociadoForm
          submitting={create.isPending}
          onCancel={() => navigate({ to: "/app/associados" })}
          submitLabel="Cadastrar associado"
          onSubmit={(v) =>
            create.mutate(v, {
              onSuccess: (row) => {
                toast.success("Associado cadastrado");
                navigate({ to: "/app/associados/$id", params: { id: row.id } });
              },
              onError: (err) => toast.error(err.message),
            })
          }
        />
      </div>
    </div>
  );
}
