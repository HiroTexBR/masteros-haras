import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useLancamentos, useMarcarLancamentoPago, useDeleteLancamento,
  currentCompetencia, formatCompetencia, formatBRL,
  STATUS_LABEL, TIPO_LABEL,
  type LancamentoTipo, type LancamentoStatus,
} from "@/features/financeiro/financeiro";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowDownRight, ArrowUpRight, MoreHorizontal, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/financeiro/")({
  head: () => ({ meta: [{ title: "Financeiro · MasterOS" }] }),
  component: () => (
    <ModuleGate code="financeiro">
      <FinanceiroPage />
    </ModuleGate>
  ),
});

function last12Comps(): string[] {
  const out: string[] = [];
  const d = new Date(); d.setDate(1);
  for (let i = 0; i < 12; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

function FinanceiroPage() {
  const [comp, setComp] = useState(currentCompetencia());
  const [tipo, setTipo] = useState<LancamentoTipo | "todos">("todos");
  const [status, setStatus] = useState<LancamentoStatus | "todos">("todos");
  const comps = useMemo(last12Comps, []);
  const q = useLancamentos({ competencia: comp, tipo, status });
  const rows = q.data ?? [];
  const marcarPago = useMarcarLancamentoPago();
  const del = useDeleteLancamento();

  const totais = useMemo(() => {
    let receitas = 0, despesas = 0, pagos = 0, previstos = 0;
    for (const r of rows) {
      const v = Number(r.valor);
      if (r.status === "cancelado") continue;
      if (r.tipo === "receita") receitas += v; else despesas += v;
      if (r.status === "pago") pagos += r.tipo === "receita" ? v : -v;
      else previstos += r.tipo === "receita" ? v : -v;
    }
    return { receitas, despesas, saldoPago: pagos, saldoPrevisto: pagos + previstos };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Receitas e despesas · {formatCompetencia(comp)}
          </p>
        </div>
        <Button asChild>
          <Link to="/app/financeiro/novo"><Plus className="mr-2 h-4 w-4" /> Novo lançamento</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Receitas" value={formatBRL(totais.receitas)} tone="ok" icon={<ArrowUpRight className="h-4 w-4" />} />
        <StatCard label="Despesas" value={formatBRL(totais.despesas)} tone="bad" icon={<ArrowDownRight className="h-4 w-4" />} />
        <StatCard label="Saldo pago" value={formatBRL(totais.saldoPago)} />
        <StatCard label="Saldo previsto" value={formatBRL(totais.saldoPrevisto)} tone="warn" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={comp} onValueChange={setComp}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {comps.map((c) => <SelectItem key={c} value={c}>{formatCompetencia(c)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tipo} onValueChange={(v) => setTipo(v as LancamentoTipo | "todos")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="receita">Receitas</SelectItem>
            <SelectItem value="despesa">Despesas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as LancamentoStatus | "todos")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card shadow-prestige">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>
            )}
            {!q.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <Wallet className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhum lançamento neste mês.</p>
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="font-medium">{r.descricao}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.categoria ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={r.tipo === "receita" ? "default" : "destructive"}>
                    {TIPO_LABEL[r.tipo]}
                  </Badge>
                </TableCell>
                <TableCell className={`text-right font-mono ${r.tipo === "receita" ? "text-emerald-600" : "text-destructive"}`}>
                  {r.tipo === "receita" ? "+" : "−"} {formatBRL(r.valor)}
                </TableCell>
                <TableCell>
                  <Badge variant={r.status === "pago" ? "default" : r.status === "cancelado" ? "outline" : "secondary"}>
                    {STATUS_LABEL[r.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {r.status !== "pago" && (
                        <DropdownMenuItem onClick={() => marcarPago.mutate(r.id, { onSuccess: () => toast.success("Marcado como pago") })}>
                          Marcar como {r.tipo === "receita" ? "recebido" : "pago"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          if (!confirm("Excluir lançamento?")) return;
                          del.mutate(r.id, { onSuccess: () => toast.success("Excluído") });
                        }}
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: string; icon?: React.ReactNode; tone?: "ok" | "warn" | "bad" }) {
  const toneCls =
    tone === "ok" ? "text-emerald-600" :
    tone === "warn" ? "text-amber-600" :
    tone === "bad" ? "text-destructive" : "";
  return (
    <div className="rounded-lg border bg-card p-4 shadow-prestige">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className={`mt-1 font-display text-2xl ${toneCls}`}>{value}</div>
    </div>
  );
}
