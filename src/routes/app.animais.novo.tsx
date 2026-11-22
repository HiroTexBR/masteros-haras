import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ModuleGate } from "@/components/module-gate";
import { AnimalForm } from "@/features/animais/animal-form";
import { useCreateAnimal } from "@/features/animais/animais";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/animais/novo")({
  head: () => ({ meta: [{ title: "Novo animal · MasterOS" }] }),
  component: () => (
    <ModuleGate code="animais">
      <NovoAnimalPage />
    </ModuleGate>
  ),
});

function NovoAnimalPage() {
  const navigate = useNavigate();
  const create = useCreateAnimal();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/app/animais"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <h1 className="font-display text-3xl">Novo animal</h1>
      </div>
      <div className="rounded-lg border bg-card p-5 shadow-prestige">
        <AnimalForm
          submitting={create.isPending}
          submitLabel="Cadastrar animal"
          onCancel={() => navigate({ to: "/app/animais" })}
          onSubmit={(v) =>
            create.mutate(v, {
              onSuccess: (a) => {
                toast.success("Animal cadastrado");
                navigate({ to: "/app/animais/$id", params: { id: a.id } });
              },
              onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
            })
          }
        />
      </div>
    </div>
  );
}
