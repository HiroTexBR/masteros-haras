import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useGerarFechamento,
  currentCompetencia,
  formatCompetencia,
} from "@/features/fechamentos/fechamentos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/app/fechamentos/gerar")({
  head: () => ({ meta: [{ title: "Gerar fechamento · MasterOS" }] }),
  component: () => (
    <ModuleGate code="diarias">
      <GerarFechamentoPage />
    </ModuleGate>
  ),
});

function competenciaOptions(): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 3);
  for (let i = 0; i < 6; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

function GerarFechamentoPage() {
  const navigate = useNavigate();
  const comps = useMemo(competenciaOptions, []);
  const [competencia, setCompetencia] = useState(currentCompetencia());
  const [valor, setValor] = useState("50.00");
  const gerar = useGerarFechamento();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(valor.replace(",", "."));
    if (!Number.isFinite(v) || v < 0) { toast.error("Valor inválido"); return; }
    gerar.mutate(
      { competencia, valorDefault: v },
      {
        onSuccess: (count) => {
          toast.success(`${count} item${count === 1 ? "" : "s"} gerado${count === 1 ? "" : "s"}`);
          navigate({ to: "/app/fechamentos" });
        },
        onError: (err: unknown) => {
          toast.error(err instanceof Error ? err.message : "Erro ao gerar");
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/app/fechamentos"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <h1 className="font-display text-3xl">Gerar fechamento</h1>
        <p className="text-sm text-muted-foreground">
          Cria um item para cada animal <span className="font-medium">ativo</span> no mês escolhido.
          A diária de cada animal (quando definida) prevalece sobre o valor padrão.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5 rounded-lg border bg-card p-5 shadow-prestige">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Competência</Label>
            <Select value={competencia} onValueChange={setCompetencia}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {comps.map((c) => <SelectItem key={c} value={c}>{formatCompetencia(c)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="valor">Diária padrão (R$)</Label>
            <Input id="valor" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="50,00" />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/app/fechamentos">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={gerar.isPending}>
            {gerar.isPending ? "Gerando…" : "Gerar fechamento"}
          </Button>
        </div>
      </form>
    </div>
  );
}
