import { createFileRoute, Link } from "@tanstack/react-router";
import { ModuleGate } from "@/components/module-gate";
import {
  useFechamentos,
  formatCompetencia,
  formatBRL,
  FECH_STATUS_LABEL,
  type FechamentoStatus,
} from "@/features/fechamentos/fechamentos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CalendarDays, Plus } from "lucide-react";

export const Route = createFileRoute("/app/fechamentos/")({
  head: () => ({ meta: [{ title: "Fechamentos · MasterOS" }] }),
  component: () => (
    <ModuleGate code="diarias">
      <FechamentosPage />
    </ModuleGate>
  ),
});

const STATUS_VARIANT: Record<FechamentoStatus, "default" | "secondary" | "destructive" | "outline"> = {
  aberto: "secondary",
  fechado: "default",
  cancelado: "outline",
};

function FechamentosPage() {
  const q = useFechamentos();
  const rows = q.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Diárias · Fechamentos</h1>
          <p className="text-sm text-muted-foreground">
            Cobrança mensal de diárias por animal ativo.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/fechamentos/gerar">
            <Plus className="mr-2 h-4 w-4" /> Gerar fechamento
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card shadow-prestige">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Competência</TableHead>
              <TableHead className="text-right">Diária padrão</TableHead>
              <TableHead className="text-right">Dias</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>
            )}
            {!q.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhum fechamento gerado ainda.</p>
                  <Button asChild size="sm" className="mt-4">
                    <Link to="/app/fechamentos/gerar">Gerar primeiro fechamento</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {rows.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{formatCompetencia(f.competencia)}</TableCell>
                <TableCell className="text-right font-mono">{formatBRL(f.valor_diaria_default)}</TableCell>
                <TableCell className="text-right font-mono">{f.dias_no_mes}</TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[f.status]}>{FECH_STATUS_LABEL[f.status]}</Badge></TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/app/fechamentos/$id" params={{ id: f.id }}>Abrir</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
