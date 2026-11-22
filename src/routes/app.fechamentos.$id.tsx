import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useFechamento,
  useFechamentoItens,
  useMarcarItemPago,
  useReabrirItem,
  useFecharFechamento,
  useReabrirFechamento,
  formatCompetencia,
  formatBRL,
  FECH_STATUS_LABEL,
  ITEM_STATUS_LABEL,
  type FechamentoItemStatus,
} from "@/features/fechamentos/fechamentos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Lock, MoreHorizontal, Unlock, Wallet } from "lucide-react";

export const Route = createFileRoute("/app/fechamentos/$id")({
  head: () => ({ meta: [{ title: "Fechamento · MasterOS" }] }),
  component: () => (
    <ModuleGate code="diarias">
      <FechamentoDetail />
    </ModuleGate>
  ),
});

const ITEM_VARIANT: Record<FechamentoItemStatus, "default" | "secondary" | "destructive" | "outline"> = {
  aberto: "secondary",
  pago: "default",
  cancelado: "outline",
};

function FechamentoDetail() {
  const { id } = useParams({ from: "/app/fechamentos/$id" });
  const fq = useFechamento(id);
  const iq = useFechamentoItens(id);
  const marcar = useMarcarItemPago();
  const reabrir = useReabrirItem();
  const fechar = useFecharFechamento();
  const reabrirFech = useReabrirFechamento();

  const [propFilter, setPropFilter] = useState<string>("todos");

  const items = iq.data ?? [];

  const proprietarios = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of items) {
      const key = it.proprietario_id ?? "sem";
      const label = it.proprietario?.nome ?? "Sem proprietário";
      map.set(key, label);
    }
    return Array.from(map.entries());
  }, [items]);

  const filtered = items.filter(
    (i) => propFilter === "todos" || (i.proprietario_id ?? "sem") === propFilter,
  );

  const totals = useMemo(() => {
    let total = 0, pago = 0, aberto = 0;
    for (const i of filtered) {
      total += Number(i.subtotal);
      if (i.status === "pago") pago += Number(i.valor_pago ?? i.subtotal);
      else if (i.status === "aberto") aberto += Number(i.subtotal);
    }
    return { total, pago, aberto };
  }, [filtered]);

  if (fq.isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!fq.data) return <p className="text-sm text-muted-foreground">Fechamento não encontrado.</p>;

  const f = fq.data;
  const isFechado = f.status === "fechado";

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/app/fechamentos"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl">Fechamento · {formatCompetencia(f.competencia)}</h1>
            <p className="text-sm text-muted-foreground">
              Diária padrão {formatBRL(f.valor_diaria_default)} · {f.dias_no_mes} dias no mês ·{" "}
              <Badge variant={isFechado ? "default" : "secondary"} className="ml-1">{FECH_STATUS_LABEL[f.status]}</Badge>
            </p>
          </div>
          <div className="flex gap-2">
            {!isFechado ? (
              <Button
                variant="outline"
                onClick={() => fechar.mutate(f.id, { onSuccess: () => toast.success("Fechamento fechado") })}
              >
                <Lock className="mr-2 h-4 w-4" /> Fechar
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => reabrirFech.mutate(f.id, { onSuccess: () => toast.success("Fechamento reaberto") })}
              >
                <Unlock className="mr-2 h-4 w-4" /> Reabrir
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={formatBRL(totals.total)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Recebido" value={formatBRL(totals.pago)} tone="ok" />
        <StatCard label="Em aberto" value={formatBRL(totals.aberto)} tone="warn" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={propFilter} onValueChange={setPropFilter}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Proprietário" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os proprietários</SelectItem>
            {proprietarios.map(([k, l]) => (
              <SelectItem key={k} value={k}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card shadow-prestige">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Animal</TableHead>
              <TableHead>Proprietário</TableHead>
              <TableHead className="text-right">Dias</TableHead>
              <TableHead className="text-right">Diária</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {iq.isLoading && (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>
            )}
            {!iq.isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Nenhum item.</TableCell></TableRow>
            )}
            {filtered.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-medium">{it.animal?.nome ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{it.proprietario?.nome ?? "—"}</TableCell>
                <TableCell className="text-right font-mono">{it.dias}</TableCell>
                <TableCell className="text-right font-mono">{formatBRL(it.valor_dia)}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatBRL(it.status === "pago" ? it.valor_pago ?? it.subtotal : it.subtotal)}
                </TableCell>
                <TableCell><Badge variant={ITEM_VARIANT[it.status]}>{ITEM_STATUS_LABEL[it.status]}</Badge></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {it.status !== "pago" && (
                        <DropdownMenuItem
                          onClick={() => marcar.mutate({ id: it.id }, { onSuccess: () => toast.success("Marcado como pago") })}
                        >
                          Marcar como pago
                        </DropdownMenuItem>
                      )}
                      {it.status === "pago" && (
                        <DropdownMenuItem
                          onClick={() => reabrir.mutate(it.id, { onSuccess: () => toast.success("Reaberto") })}
                        >
                          Reabrir
                        </DropdownMenuItem>
                      )}
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
