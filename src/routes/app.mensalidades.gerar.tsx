import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useGerarMensalidades,
  currentCompetencia,
  formatCompetencia,
} from "@/features/mensalidades/mensalidades";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/app/mensalidades/gerar")({
  head: () => ({ meta: [{ title: "Gerar mensalidades · MasterOS" }] }),
  component: () => (
    <ModuleGate code="mensalidades">
      <GerarMensalidadesPage />
    </ModuleGate>
  ),
});

function nextMonthCompetencias(): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 2);
  for (let i = 0; i < 6; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

function GerarMensalidadesPage() {
  const navigate = useNavigate();
  const comps = useMemo(nextMonthCompetencias, []);
  const [competencia, setCompetencia] = useState(currentCompetencia());
  const [valor, setValor] = useState("100.00");
  const [dia, setDia] = useState("10");
  const gerar = useGerarMensalidades();

  const vencimento = useMemo(() => {
    const [y, m] = competencia.split("-");
    const d = String(Math.max(1, Math.min(28, Number(dia) || 10))).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [competencia, dia]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(valor.replace(",", "."));
    if (!Number.isFinite(v) || v < 0) {
      toast.error("Valor inválido");
      return;
    }
    gerar.mutate(
      { competencia, vencimento, valor: v },
      {
        onSuccess: (count) => {
          toast.success(`${count} mensalidade${count === 1 ? "" : "s"} gerada${count === 1 ? "" : "s"}`);
          navigate({ to: "/app/mensalidades" });
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Erro ao gerar";
          toast.error(msg);
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/app/mensalidades"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <h1 className="font-display text-3xl">Gerar mensalidades</h1>
        <p className="text-sm text-muted-foreground">
          Cria uma cobrança para cada associado <span className="font-medium">ativo</span> na competência escolhida.
          Duplicatas do mesmo mês são ignoradas.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5 rounded-lg border bg-card p-5 shadow-prestige">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Competência</Label>
            <Select value={competencia} onValueChange={setCompetencia}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {comps.map((c) => (
                  <SelectItem key={c} value={c}>{formatCompetencia(c)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dia">Dia do vencimento</Label>
            <Input
              id="dia" type="number" min={1} max={28}
              value={dia} onChange={(e) => setDia(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Vence em {new Date(vencimento + "T00:00:00").toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor" inputMode="decimal"
              value={valor} onChange={(e) => setValor(e.target.value)}
              placeholder="100,00"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/app/mensalidades">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={gerar.isPending}>
            {gerar.isPending ? "Gerando…" : "Gerar mensalidades"}
          </Button>
        </div>
      </form>
    </div>
  );
}
