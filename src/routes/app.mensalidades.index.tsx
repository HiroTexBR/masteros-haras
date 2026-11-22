import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useMensalidadesResumo,
  useMarcarPaga,
  useReabrirMensalidade,
  useCancelarMensalidade,
  currentCompetencia,
  formatCompetencia,
  formatBRL,
  STATUS_LABEL,
  type MensalidadeStatus,
} from "@/features/mensalidades/mensalidades";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditCard, MoreHorizontal, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/mensalidades/")({
  head: () => ({ meta: [{ title: "Mensalidades · MasterOS" }] }),
  component: () => (
    <ModuleGate code="mensalidades">
      <MensalidadesPage />
    </ModuleGate>
  ),
});

const STATUS_VARIANT: Record<MensalidadeStatus, "default" | "secondary" | "destructive" | "outline"> = {
  aberta: "secondary",
  paga: "default",
  atrasada: "destructive",
  cancelada: "outline",
};

// gera últimas 12 competências (incluindo mês atual)
function last12Competencias(): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < 12; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

function MensalidadesPage() {
  const [competencia, setCompetencia] = useState<string>(currentCompetencia());
  const [status, setStatus] = useState<MensalidadeStatus | "todos">("todos");
  const comps = useMemo(last12Competencias, []);
  const q = useMensalidadesResumo(competencia);
  const rows = (q.data ?? []).filter((r) => status === "todos" || r.status === status);

  const marcarPaga = useMarcarPaga();
  const reabrir = useReabrirMensalidade();
  const cancelar = useCancelarMensalidade();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Mensalidades</h1>
          <p className="text-sm text-muted-foreground">
            Cobranças mensais · {formatCompetencia(competencia)}
          </p>
        </div>
        <Button asChild>
          <Link to="/app/mensalidades/gerar">
            <Plus className="mr-2 h-4 w-4" /> Gerar mensalidades
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Total no mês" value={formatBRL(q.total)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Recebido" value={formatBRL(q.pago)} tone="ok" icon={<CreditCard className="h-4 w-4" />} />
        <StatCard label="Em aberto" value={String(q.abertas)} tone="warn" />
        <StatCard label="Atrasadas" value={String(q.atrasadas)} tone="bad" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={competencia} onValueChange={setCompetencia}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {comps.map((c) => (
              <SelectItem key={c} value={c}>{formatCompetencia(c)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as MensalidadeStatus | "todos")}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, l]) => (
              <SelectItem key={k} value={k}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card shadow-prestige">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Nº</TableHead>
              <TableHead>Associado</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando…</TableCell></TableRow>
            )}
            {!q.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <Wallet className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhuma mensalidade neste mês.</p>
                  <Button asChild size="sm" className="mt-4">
                    <Link to="/app/mensalidades/gerar">Gerar para {formatCompetencia(competencia)}</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {m.associado?.numero ? String(m.associado.numero).padStart(4, "0") : "—"}
                </TableCell>
                <TableCell className="font-medium">
                  {m.associado?.nome ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(m.vencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatBRL(m.status === "paga" ? m.valor_pago ?? m.valor : m.valor)}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[m.status]}>{STATUS_LABEL[m.status]}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {m.status !== "paga" && (
                        <DropdownMenuItem
                          onClick={() =>
                            marcarPaga.mutate(
                              { id: m.id },
                              { onSuccess: () => toast.success("Marcada como paga") },
                            )
                          }
                        >
                          Marcar como paga
                        </DropdownMenuItem>
                      )}
                      {m.status === "paga" && (
                        <DropdownMenuItem
                          onClick={() =>
                            reabrir.mutate(m.id, { onSuccess: () => toast.success("Reaberta") })
                          }
                        >
                          Reabrir
                        </DropdownMenuItem>
                      )}
                      {m.status !== "cancelada" && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            cancelar.mutate(m.id, { onSuccess: () => toast.success("Cancelada") })
                          }
                        >
                          Cancelar
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

function StatCard({
  label, value, icon, tone,
}: { label: string; value: string; icon?: React.ReactNode; tone?: "ok" | "warn" | "bad" }) {
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
